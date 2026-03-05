<template>
  <view class="dashboard-page">
    <!-- 头部 -->
    <view class="dashboard-page__header">
      <view class="dashboard-page__header-logo">
        <text class="dashboard-page__header-logo-icon">⚡</text>
      </view>
      <view class="dashboard-page__header-info">
        <text class="dashboard-page__header-title">老板助手</text>
        <text class="dashboard-page__header-sub">EV 库存智能查询</text>
      </view>
    </view>

    <!-- 对话历史 -->
    <scroll-view
      class="dashboard-page__history"
      scroll-y
      :scroll-top="scrollTop"
      scroll-with-animation
    >
      <!-- 空状态 -->
      <view v-if="messages.length === 0" class="dashboard-page__empty">
        <text class="dashboard-page__empty-icon">💬</text>
        <text class="dashboard-page__empty-title">有什么想查的？</text>
        <view class="dashboard-page__suggestions">
          <view
            v-for="s in suggestions"
            :key="s"
            class="dashboard-page__suggestion-chip"
            @click="applySuggestion(s)"
          >
            <text class="dashboard-page__suggestion-text">{{ s }}</text>
          </view>
        </view>
      </view>

      <!-- 消息列表 -->
      <view v-for="(msg, idx) in messages" :key="idx" class="dashboard-page__msg-group">
        <!-- 用户问题 -->
        <view class="dashboard-page__bubble dashboard-page__bubble--user">
          <text class="dashboard-page__bubble-text">{{ msg.question }}</text>
        </view>
        <!-- 识别文字（语音时展示，内容与问题气泡不同时才展示） -->
        <view v-if="msg.transcribed" class="dashboard-page__transcribed">
          <text class="dashboard-page__transcribed-label">🎙 识别：</text>
          <text class="dashboard-page__transcribed-text">{{ msg.transcribed }}</text>
        </view>
        <!-- 思考中指示 -->
        <view v-if="msg.thinking && !msg.answer" class="dashboard-page__thinking">
          <text class="dashboard-page__thinking-dot">●</text>
          <text class="dashboard-page__thinking-dot">●</text>
          <text class="dashboard-page__thinking-dot">●</text>
          <text class="dashboard-page__thinking-label">思考中…</text>
        </view>
        <!-- 助手回复 -->
        <view v-if="msg.answer" class="dashboard-page__bubble dashboard-page__bubble--assistant">
          <text class="dashboard-page__bubble-text">{{ msg.answer }}</text>
          <text v-if="msg.streaming" class="dashboard-page__cursor">|</text>
        </view>
        <!-- 错误：有回答时不再重复显示错误 -->
        <view v-if="msg.error && !msg.answer" class="dashboard-page__bubble dashboard-page__bubble--error">
          <text class="dashboard-page__bubble-text">⚠ {{ msg.error }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 输入区 -->
    <view class="dashboard-page__input-bar">
      <textarea
        v-model="queryText"
        class="dashboard-page__textarea"
        placeholder="输入问题，例如：今天销售了多少？"
        :maxlength="500"
        :disabled="isStreaming"
        auto-height
        @confirm="handleTextQuery"
      />

      <!-- 语音按钮 -->
      <view
        class="dashboard-page__voice-btn"
        :class="{
          'dashboard-page__voice-btn--recording': isVoiceRecording,
          'dashboard-page__voice-btn--disabled': isStreaming,
        }"
        @touchstart.prevent="handleVoiceStart"
        @touchend.prevent="handleVoiceEnd"
        @touchcancel.prevent="handleVoiceEnd"
        @mousedown.prevent="handleVoiceStart"
        @mouseup.prevent="handleVoiceEnd"
      >
        <text class="dashboard-page__voice-icon">🎙</text>
      </view>

      <!-- 发送 / 停止 按钮 -->
      <view
        class="dashboard-page__send-btn"
        :class="{
          'dashboard-page__send-btn--active': canSend,
          'dashboard-page__send-btn--loading': isStreaming,
        }"
        @click="handleTextQuery"
      >
        <text class="dashboard-page__send-icon">{{ isStreaming ? '⏹' : '➤' }}</text>
      </view>
    </view>

    <!-- 底部导航 -->
    <BottomTabBar active="dashboard" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { requireAuth } from '@/utils/routeGuard'
import { useRecorder } from '@/composables/useRecorder'
import { agentQueryByText, agentQueryByVoice } from '@/services/agent'
import BottomTabBar from '@/components/business/BottomTabBar.vue'

// ---------- Types ----------
interface Message {
  question: string
  transcribed?: string
  thinking: boolean
  answer: string
  error?: string
  streaming: boolean
}

// ---------- State ----------
const queryText = ref('')
const isVoiceRecording = ref(false)
const isStreaming = ref(false)
const messages = ref<Message[]>([])
const scrollTop = ref(0)

const suggestions = [
  '今天卖了多少货？',
  '本月销售总额是多少？',
  '最近进货了什么？',
  '库存还剩多少？',
]

// ---------- Computed ----------
const canSend = computed(() => queryText.value.trim().length > 0 && !isStreaming.value)

// ---------- Lifecycle ----------
onMounted(() => {
  requireAuth()
})

// ---------- Recorder ----------
const { startRecording, stopRecording } = useRecorder({
  onTimeout: () => handleVoiceEnd(),
})

// ---------- Scroll ----------
function scrollToBottom() {
  nextTick(() => {
    scrollTop.value = 999999
  })
}

// ---------- Suggestion ----------
function applySuggestion(text: string) {
  queryText.value = text
  handleTextQuery()
}

// ---------- Text query ----------
function handleTextQuery() {
  const question = queryText.value.trim()
  if (!question || isStreaming.value) return
  queryText.value = ''
  submitQuery(question, 'text')
}

// ---------- Voice query ----------
function handleVoiceStart() {
  if (isStreaming.value) return
  isVoiceRecording.value = true
  startRecording()
}

async function handleVoiceEnd() {
  if (!isVoiceRecording.value) return
  isVoiceRecording.value = false
  const blob = await stopRecording()
  if (!blob || blob.size === 0) return
  submitQuery('🎙 语音提问', 'voice', blob)
}

// ---------- Submit ----------
function submitQuery(question: string, mode: 'text' | 'voice', blob?: Blob) {
  const msg: Message = { question, thinking: true, answer: '', streaming: false }
  messages.value.push(msg)
  const idx = messages.value.length - 1
  isStreaming.value = true
  scrollToBottom()

  const handlers = {
    onTranscribed: (text: string) => {
      // 保留 question 作为语音占位符（🎙 语音提问），识别文字单独展示在下方
      messages.value[idx].transcribed = text
      scrollToBottom()
    },
    onThinking: () => {
      messages.value[idx].thinking = true
    },
    onAnswer: (text: string) => {
      messages.value[idx].thinking = false
      messages.value[idx].answer += text
      messages.value[idx].streaming = true
      scrollToBottom()
    },
    onError: (errMsg: string) => {
      messages.value[idx].thinking = false
      messages.value[idx].error = errMsg
      messages.value[idx].streaming = false
    },
    onDone: () => {
      messages.value[idx].streaming = false
      messages.value[idx].thinking = false
      isStreaming.value = false
    },
  }

  if (mode === 'voice' && blob) {
    agentQueryByVoice(blob, handlers)
  } else {
    agentQueryByText(question, handlers)
  }
}
</script>

<style lang="scss" scoped>
.dashboard-page {
  background: #f0f4ff;
  display: flex;
  flex-direction: column;
  height: 100vh;

  // ----- 头部 -----
  &__header {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 40rpx 40rpx 32rpx;
    background: linear-gradient(135deg, #1a7aff 0%, #0050cc 100%);
    flex-shrink: 0;
  }

  &__header-logo {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    background: rgba(255, 255, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__header-logo-icon {
    font-size: 44rpx;
  }

  &__header-info {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
  }

  &__header-title {
    font-size: 40rpx;
    font-weight: 800;
    color: #fff;
    letter-spacing: 2rpx;
  }

  &__header-sub {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }

  // ----- 历史滚动区 -----
  &__history {
    flex: 1;
    padding: 24rpx 24rpx 0;
    // 底部留出：输入框高度(~120rpx) + tabBar(100rpx) + buffer
    padding-bottom: 240rpx;
    overflow-y: auto;
    box-sizing: border-box;
  }

  // ----- 空状态 -----
  &__empty {
    padding: 60rpx 0 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
  }

  &__empty-icon {
    font-size: 80rpx;
  }

  &__empty-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #555;
  }

  &__suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    justify-content: center;
    margin-top: 12rpx;
    padding: 0 20rpx;
  }

  &__suggestion-chip {
    padding: 14rpx 28rpx;
    border-radius: 100rpx;
    background: #fff;
    border: 2rpx solid #d0dcff;
    box-shadow: 0 2rpx 8rpx rgba(26, 122, 255, 0.08);
  }

  &__suggestion-text {
    font-size: 24rpx;
    color: #1a7aff;
    font-weight: 500;
  }

  // ----- 消息组 -----
  &__msg-group {
    margin-bottom: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  // ----- 气泡 -----
  &__bubble {
    max-width: 88%;
    padding: 24rpx 30rpx;
    border-radius: 24rpx;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;

    &--user {
      align-self: flex-end;
      background: linear-gradient(135deg, #1a7aff 0%, #0050cc 100%);
      border-bottom-right-radius: 6rpx;
    }

    &--assistant {
      align-self: flex-start;
      background: #ffffff;
      border-bottom-left-radius: 6rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
    }

    &--error {
      align-self: flex-start;
      background: #fff2f0;
      border: 2rpx solid #ffccc7;
      border-bottom-left-radius: 6rpx;
    }
  }

  &__bubble-text {
    font-size: 28rpx;
    line-height: 1.65;
    white-space: pre-wrap;
    word-break: break-word;

    .dashboard-page__bubble--user & { color: #fff; }
    .dashboard-page__bubble--assistant & { color: #222; }
    .dashboard-page__bubble--error & { color: #cf1322; }
  }

  // ----- 识别文字 -----
  &__transcribed {
    align-self: flex-end;
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__transcribed-label {
    font-size: 22rpx;
    color: #999;
  }

  &__transcribed-text {
    font-size: 22rpx;
    color: #666;
    font-style: italic;
  }

  // ----- 思考中 -----
  &__thinking {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding: 16rpx 24rpx;
    background: #fff;
    border-radius: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  }

  &__thinking-dot {
    font-size: 18rpx;
    color: #1a7aff;
    animation: blink 1.2s infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }

  &__thinking-label {
    font-size: 24rpx;
    color: #999;
    margin-left: 6rpx;
  }

  // ----- 光标 -----
  &__cursor {
    animation: blink 1s infinite;
    color: #1a7aff;
    font-size: 28rpx;
    margin-left: 2rpx;
  }

  // ----- 输入区 -----
  &__input-bar {
    position: fixed;
    bottom: 100rpx; // 紧贴 tabBar 上方
    left: 0;
    right: 0;
    background: #fff;
    border-top: 1rpx solid #e8e8e8;
    padding: 16rpx 24rpx;
    display: flex;
    align-items: flex-end;
    gap: 16rpx;
    box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
    z-index: 100;
  }

  &__textarea {
    flex: 1;
    font-size: 28rpx;
    color: #333;
    line-height: 1.5;
    padding: 16rpx 20rpx;
    background: #f5f7fb;
    border-radius: 20rpx;
    min-height: 72rpx;
    max-height: 200rpx;
  }

  &__voice-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: #f0f4ff;
    border: 2rpx solid #d0dcff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;

    &--recording {
      background: #fff0f0;
      border-color: #ffccc7;
      transform: scale(1.08);
    }

    &--disabled { opacity: 0.4; }
  }

  &__voice-icon {
    font-size: 32rpx;
  }

  &__send-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: #d0dcff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;

    &--active {
      background: linear-gradient(135deg, #1a7aff 0%, #0050cc 100%);
      box-shadow: 0 4rpx 16rpx rgba(26, 122, 255, 0.35);
    }

    &--loading {
      background: #ff4d4f;
    }
  }

  &__send-icon {
    font-size: 28rpx;
    color: #fff;
    font-weight: 600;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
</style>
