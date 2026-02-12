<template>
  <div class="login-view">
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

      <!-- 右侧登录表单 -->
      <div class="form-section">
        <div class="form-card">
          <div class="form-header">
            <h2 class="form-title">账号登录</h2>
            <p class="form-subtitle">欢迎回来</p>
          </div>

          <el-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            label-position="top"
            class="login-form"
            @submit.prevent="handleSubmit"
          >
            <el-form-item prop="username" label="用户名/邮箱">
              <el-input
                v-model="formData.username"
                size="large"
                placeholder="请输入用户名或邮箱"
                :prefix-icon="User"
                clearable
                @keyup.enter="handleSubmit"
              />
            </el-form-item>

            <el-form-item prop="password" label="密码">
              <el-input
                v-model="formData.password"
                type="password"
                size="large"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                show-password
                clearable
                @keyup.enter="handleSubmit"
              />
            </el-form-item>

            <div class="form-options">
              <el-checkbox v-model="formData.remember">记住我</el-checkbox>
              <el-link type="primary" @click="showForgotDialog = true">忘记密码？</el-link>
            </div>

            <el-button
              type="primary"
              size="large"
              class="submit-button"
              :loading="loading"
              @click="handleSubmit"
            >
              登录
            </el-button>

            <div class="form-divider">
              <span>还没有账号？</span>
            </div>

            <el-button
              size="large"
              class="submit-button"
              @click="$router.push('/register')"
            >
              注册新账号
            </el-button>
          </el-form>

          <div class="form-footer">
            <span class="footer-text">测试账号:</span>
            <el-link type="primary" @click="fillTestAccount">使用测试账号</el-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 忘记密码对话框 -->
    <el-dialog
      v-model="showForgotDialog"
      title="重置密码"
      width="400px"
    >
      <el-form
        ref="forgotFormRef"
        :model="forgotFormData"
        :rules="forgotFormRules"
        label-position="top"
      >
        <el-form-item prop="email" label="邮箱地址">
          <el-input
            v-model="forgotFormData.email"
            placeholder="请输入您的注册邮箱"
            clearable
          />
        </el-form-item>
        <div class="forgot-tips">
          <el-icon><InfoFilled /></el-icon>
          <span>我们将向您的邮箱发送密码重置链接</span>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showForgotDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="forgotLoading"
          @click="handleSendResetEmail"
        >
          发送重置邮件
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Lock, CircleCheckFilled, InfoFilled } from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// 表单
const formRef = ref<FormInstance>();
const formData = reactive({
  username: '',
  password: '',
  remember: false,
});

// 表单验证规则
const formRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名或邮箱', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' },
  ],
};

// 忘记密码
const showForgotDialog = ref(false);
const forgotFormRef = ref<FormInstance>();
const forgotFormData = reactive({
  email: '',
});

const forgotFormRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
};

// 状态
const loading = ref(false);
const forgotLoading = ref(false);

// 检查是否有重定向参数
const redirect = ref(route.query.redirect as string || '/');

/**
 * 填充测试账号
 */
function fillTestAccount() {
  formData.username = 'testuser@example.com';
  formData.password = 'password123';
}

/**
 * 处理登录提交
 */
async function handleSubmit() {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;

  try {
    await authStore.login({
      username: formData.username,
      password: formData.password
    });

    ElMessage.success('登录成功');

    // 跳转到重定向页面或首页
    router.replace(redirect.value);
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '登录失败，请检查用户名和密码');
  } finally {
    loading.value = false;
  }
}

/**
 * 发送重置密码邮件
 */
async function handleSendResetEmail() {
  if (!forgotFormRef.value) return;

  const valid = await forgotFormRef.value.validate().catch(() => false);
  if (!valid) return;

  forgotLoading.value = true;

  try {
    // 模拟发送邮件
    ElMessage.success('重置邮件已发送，请查收邮箱');
    showForgotDialog.value = false;
    forgotFormData.email = '';
  } catch (err: any) {
    ElMessage.error('发送失败');
  } finally {
    forgotLoading.value = false;
  }
}
</script>

<style scoped lang="scss">
.login-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--color-bg) 100%);
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

.login-form {
  .el-form-item {
    margin-bottom: var(--spacing-lg);
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: var(--spacing-lg);
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

.forgot-tips {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--info-color-light);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
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
