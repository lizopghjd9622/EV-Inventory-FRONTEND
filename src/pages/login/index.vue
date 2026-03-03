<template>
  <view class="login-page">
    <view class="login-page__header">
      <text class="login-page__title">登录</text>
    </view>

    <view class="login-page__form">
      <!-- 手机号 -->
      <BaseInput
        v-model="phone"
        placeholder="请输入手机号"
        type="number"
        :error="phoneError"
        error-text="请输入正确的手机号"
        data-testid="phone-input"
      />

      <!-- 密码 -->
      <BaseInput
        v-model="password"
        placeholder="请输入密码"
        type="password"
        class="login-page__field"
        data-testid="password-input"
      />

      <!-- 验证码（错误次数 ≥ 3 时展示） -->
      <CaptchaBlock
        :visible="showCaptcha"
        :image-url="captchaImageUrl"
        data-testid="captcha-block"
        @refresh="handleRefreshCaptcha"
        @update:value="captchaValue = $event"
      />

      <!-- 错误提示 -->
      <text v-if="errorMessage" class="login-page__error" data-testid="error-msg">
        {{ errorMessage }}
      </text>

      <!-- 登录按钮 -->
      <BaseButton
        label="登录"
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
    uni.reLaunch({ url: '/pages/home/index' })
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

    authStore.setToken(res.token)
    uni.reLaunch({ url: '/pages/home/index' })
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
  background-color: var(--color-bg, #f5f7fa);
  padding: 120rpx 48rpx 48rpx;

  &__header {
    margin-bottom: 64rpx;
    text-align: center;
  }

  &__title {
    font-size: 48rpx;
    font-weight: 700;
    color: var(--color-text-primary, #303133);
  }

  &__field {
    margin-top: 24rpx;
  }

  &__error {
    display: block;
    margin-top: 16rpx;
    font-size: 24rpx;
    color: var(--color-danger, #f56c6c);
  }

  &__submit {
    margin-top: 48rpx;
  }
}
</style>
