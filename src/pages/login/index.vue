<template>
  <view class="login-page">
    <!-- 顶部品牌区 -->
    <view class="login-page__hero">
      <view class="login-page__logo">
        <text class="login-page__logo-icon">⚡</text>
      </view>
      <text class="login-page__app-name">EV 库存</text>
      <text class="login-page__subtitle">智能语音录单系统</text>
    </view>

    <!-- 表单卡片 -->
    <view class="login-page__card">
      <text class="login-page__card-title">欢迎登录</text>

      <view class="login-page__input-group">
        <text class="login-page__input-label">手机号</text>
        <BaseInput
          v-model="phone"
          placeholder="请输入手机号"
          type="number"
          :error="phoneError"
          error-text="请输入正确的手机号"
          data-testid="phone-input"
        />
      </view>

      <view class="login-page__input-group">
        <text class="login-page__input-label">密码</text>
        <BaseInput
          v-model="password"
          placeholder="请输入密码"
          type="password"
          data-testid="password-input"
        />
      </view>

      <CaptchaBlock
        :visible="showCaptcha"
        :image-url="captchaImageUrl"
        data-testid="captcha-block"
        @refresh="handleRefreshCaptcha"
        @update:value="captchaValue = $event"
      />

      <view v-if="errorMessage" class="login-page__error-bar" data-testid="error-msg">
        <text class="login-page__error-icon">!</text>
        <text class="login-page__error-text">{{ errorMessage }}</text>
      </view>

      <BaseButton
        label="登 录"
        :loading="loading"
        type="primary"
        class="login-page__submit"
        data-testid="login-btn"
        @click="handleLogin"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/services/auth'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import CaptchaBlock from '@/components/business/CaptchaBlock.vue'

/** 手机号正则：1 开头 11 位数字 */
const PHONE_REG = /^1[3-9]\d{9}$/

/** 错误次数超过此阈值后展示验证码 */
const CAPTCHA_ERROR_THRESHOLD = 3

// ---------- Store ----------
const authStore = useAuthStore()

// ---------- State ----------
const phone = ref('')
const password = ref('')
const captchaValue = ref('')
const captchaImageUrl = ref('')
const loading = ref(false)
const errorCount = ref(0)
const errorMessage = ref('')

// ---------- Computed ----------
const phoneError = computed(() => phone.value.length > 0 && !PHONE_REG.test(phone.value))
const showCaptcha = computed(() => errorCount.value >= CAPTCHA_ERROR_THRESHOLD)

// ---------- Lifecycle ----------
onMounted(() => {
  if (authStore.isLoggedIn) {
    uni.redirectTo({ url: '/pages/dashboard/index' })
  }
})

// ---------- Handlers ----------
function handleRefreshCaptcha() {
  // 刷新验证码：追加时间戳防缓存
  captchaImageUrl.value = `/auth/captcha?t=${Date.now()}`
}

async function handleLogin() {
  // 校验手机号格式
  if (!PHONE_REG.test(phone.value)) {
    errorMessage.value = '请输入正确的手机号'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const res = await login({
      phone: phone.value,
      password: password.value,
      captcha: showCaptcha.value ? captchaValue.value : undefined,
    })

    authStore.setToken(res.access_token)
    uni.redirectTo({ url: '/pages/dashboard/index' })
  } catch (err: unknown) {
    const error = err as { statusCode?: number; data?: { detail?: string } }
    errorCount.value += 1

    if (error?.statusCode === 401) {
      errorMessage.value = '手机号或密码错误'
    } else if (error?.data?.detail?.includes('验证码')) {
      errorMessage.value = '验证码错误'
      handleRefreshCaptcha()
    } else {
      errorMessage.value = '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f0f4ff;

  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100rpx 48rpx 80rpx;
    background: linear-gradient(145deg, #1a7aff 0%, #0050cc 100%);
  }

  &__logo {
    width: 120rpx;
    height: 120rpx;
    border-radius: 32rpx;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.15);
  }

  &__logo-icon {
    font-size: 60rpx;
  }

  &__app-name {
    font-size: 52rpx;
    font-weight: 800;
    color: #fff;
    letter-spacing: 4rpx;
  }

  &__subtitle {
    margin-top: 12rpx;
    font-size: 26rpx;
    color: rgba(255, 255, 255, 0.75);
    letter-spacing: 2rpx;
  }

  &__card {
    flex: 1;
    background: #fff;
    border-radius: 48rpx 48rpx 0 0;
    margin-top: -40rpx;
    padding: 64rpx 48rpx 80rpx;
    box-shadow: 0 -4rpx 40rpx rgba(0, 0, 0, 0.06);
  }

  &__card-title {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 48rpx;
  }

  &__input-group {
    margin-bottom: 32rpx;
  }

  &__input-label {
    display: block;
    font-size: 26rpx;
    font-weight: 600;
    color: #555;
    margin-bottom: 12rpx;
    letter-spacing: 1rpx;
  }

  &__error-bar {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 20rpx 24rpx;
    background: #fff2f0;
    border: 2rpx solid #ffccc7;
    border-radius: 16rpx;
    margin-top: 8rpx;
    margin-bottom: 16rpx;
  }

  &__error-icon {
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    background: #ff4d4f;
    color: #fff;
    font-size: 22rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    line-height: 36rpx;
    flex-shrink: 0;
  }

  &__error-text {
    font-size: 26rpx;
    color: #cf1322;
  }

  &__submit {
    margin-top: 48rpx;
    width: 100%;
  }
}
</style>
