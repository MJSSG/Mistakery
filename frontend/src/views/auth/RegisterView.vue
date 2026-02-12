<template>
  <div class="register-view">
    <div class="login-container">
      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-logo">
          <h1 class="brand-title">Mistakery</h1>
        </div>
        <p class="brand-slogan">错题追踪 · 智能复习 · 学习优化</p>
        <div class="brand-features">
          <div class="feature-item">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>智能错题录入</span>
          </div>
          <div class="feature-item">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>Leitner 复习算法</span>
          </div>
          <div class="feature-item">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>学习数据分析</span>
          </div>
        </div>
      </div>

      <!-- 右侧注册表单 -->
      <div class="form-section">
        <div class="form-card">
          <div class="form-header">
            <h2 class="form-title">创建账号</h2>
            <p class="form-subtitle">加入 Mistakery，开启高效学习之旅</p>
          </div>

          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-position="top"
            class="register-form"
            @submit.prevent="handleSubmit"
          >
            <el-form-item prop="username" label="用户名">
              <el-input
                v-model="formData.username"
                size="large"
                placeholder="3-20个字符，支持字母、数字、下划线"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>

            <el-form-item prop="email" label="邮箱">
              <el-input
                v-model="formData.email"
                size="large"
                placeholder="用于找回密码和接收通知"
                :prefix-icon="Message"
                clearable
              />
            </el-form-item>

            <el-form-item prop="nickname" label="昵称（可选）">
              <el-input
                v-model="formData.nickname"
                size="large"
                placeholder="显示名称"
                :prefix-icon="UserFilled"
                clearable
              />
            </el-form-item>

            <el-form-item prop="password" label="密码">
              <el-input
                v-model="formData.password"
                type="password"
                size="large"
                placeholder="至少6个字符"
                :prefix-icon="Lock"
                show-password
                clearable
              />
            </el-form-item>

            <el-form-item prop="confirmPassword" label="确认密码">
              <el-input
                v-model="formData.confirmPassword"
                type="password"
                size="large"
                placeholder="再次输入密码"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handleSubmit"
              />
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="formData.agreeTerms">
                我已阅读并同意
                <el-link type="primary" @click="showTermsDialog = true">用户协议</el-link>
                和
                <el-link type="primary" @click="showPrivacyDialog = true">隐私政策</el-link>
              </el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                :disabled="!formData.agreeTerms"
                class="submit-button"
                @click="handleSubmit"
              >
                注册
              </el-button>
            </el-form-item>

            <div class="form-divider">
              <span>或</span>
            </div>

            <div class="social-login">
              <el-button size="large" class="social-button">
                <el-icon><ChatLineRound /></el-icon>
                微信注册
              </el-button>
            </div>
          </el-form>

          <div class="form-footer">
            <span class="footer-text">已有账号？</span>
            <router-link to="/login" class="link">立即登录</router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户协议对话框 -->
    <el-dialog v-model="showTermsDialog" title="用户协议" width="600px">
      <div class="terms-content">
        <p>欢迎使用 Mistakery！</p>
        <p>在使用本服务前，请仔细阅读并同意以下条款：</p>
        <ul>
          <li>用户应提供真实准确的注册信息</li>
          <li>用户对账号下的所有活动负责</li>
          <li>禁止发布违法、违规内容</li>
          <li>本服务保留对违规账号的处理权利</li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="showTermsDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 隐私政策对话框 -->
    <el-dialog v-model="showPrivacyDialog" title="隐私政策" width="600px">
      <div class="terms-content">
        <p>我们重视您的隐私保护。</p>
        <p><strong>信息收集：</strong>我们收集您提供的信息（如用户名、邮箱）和使用数据。</p>
        <p><strong>信息使用：</strong>用于提供、改进和个性化服务。</p>
        <p><strong>信息保护：</strong>我们采取安全措施保护您的信息。</p>
      </div>
      <template #footer>
        <el-button @click="showPrivacyDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, Message, UserFilled, CircleCheckFilled, ChatLineRound } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const route = useRoute();
const { register } = useAuth();

// 表单
const formRef = ref<FormInstance>();
const formData = reactive({
  username: '',
  email: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
});

// 对话框状态
const showTermsDialog = ref(false);
const showPrivacyDialog = ref(false);

// 确认密码验证
const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

// 用户名验证
const validateUsername = (_rule: any, value: string, callback: any) => {
  const reg = /^[a-zA-Z0-9_]{3,20}$/;
  if (!reg.test(value)) {
    callback(new Error('用户名只能包含字母、数字、下划线，3-20个字符'));
  } else {
    callback();
  }
};

// 表单验证规则
const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { validator: validateUsername, trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      min: 6,
      max: 20,
      message: '密码长度在 6 到 20 个字符',
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
  agreeTerms: [
    {
      type: 'enum',
      enum: [true],
      message: '请阅读并同意用户协议和隐私政策',
      trigger: 'change',
    },
  ],
};

// 状态
const loading = ref(false);

// 重定向参数
const redirect = ref(route.query.redirect as string || '/');

/**
 * 处理注册提交
 */
async function handleSubmit() {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  try {
    await register({
      username: formData.username,
      email: formData.email,
      nickname: formData.nickname || formData.username,
      password: formData.password,
    });

    ElMessage.success('注册成功！正在跳转...');

    // 延迟跳转，显示成功消息
    setTimeout(() => {
      router.replace(redirect.value);
    }, 1000);
  } catch (err: any) {
    if (err.response?.data?.message) {
      ElMessage.error(err.response.data.message);
    } else {
      ElMessage.error('注册失败，请稍后重试');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.register-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color-light) 0%, var(--color-bg) 100%);
  padding: var(--spacing-lg);
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xxl);
  max-width: 1000px;
  width: 100%;
}

.brand-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xxl);
}

.brand-logo {
  margin-bottom: var(--spacing-xl);
}

.brand-title {
  font-size: 48px;
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  margin: 0 0 var(--spacing-sm);
}

.brand-slogan {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xl);
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);

  .el-icon {
    color: var(--success-color);
  }
}

.form-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-card {
  background: var(--color-white);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-xxl);
  width: 100%;
  max-width: 420px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.form-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.form-title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);
}

.form-subtitle {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin: 0;
}

.register-form {
  .el-form-item {
    margin-bottom: var(--spacing-lg);
  }
}

.submit-button {
  width: 100%;
}

.form-divider {
  display: flex;
  align-items: center;
  margin: var(--spacing-lg) 0;
  color: var(--color-text-secondary);

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }

  span {
    padding: 0 var(--spacing-md);
    font-size: var(--font-size-sm);
  }
}

.social-login {
  .social-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    border: 1px solid var(--color-border);
  }
}

.form-footer {
  text-align: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.footer-text {
  color: var(--color-text-secondary);
  margin-right: var(--spacing-xs);
}

.link {
  color: var(--primary-color);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.terms-content {
  line-height: 1.8;
  color: var(--color-text-secondary);

  ul {
    padding-left: 20px;
    margin-top: var(--spacing-sm);
  }

  li {
    margin-bottom: var(--spacing-xs);
  }
}

@media (max-width: $breakpoint-lg) {
  .login-container {
    grid-template-columns: 1fr;
  }

  .brand-section {
    display: none;
  }
}
</style>
