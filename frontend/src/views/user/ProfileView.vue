<template>
  <div class="profile-view">
    <div class="profile-container">
      <div class="profile-header">
        <h1 class="page-title">个人中心</h1>
      </div>

      <!-- 头像卡片 -->
      <el-card class="avatar-card">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <el-avatar :size="120" :src="user?.avatarUrl" class="user-avatar">
              <el-icon v-if="!user?.avatarUrl"><UserFilled /></el-icon>
            </el-avatar>
            <el-upload
              class="avatar-upload"
              :action="uploadUrl"
              :headers="uploadHeaders"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :on-success="handleAvatarSuccess"
              :on-error="handleAvatarError"
              accept="image/*"
            >
              <el-button class="upload-btn" circle>
                <el-icon><Camera /></el-icon>
              </el-button>
            </el-upload>
          </div>
          <div class="avatar-tips">
            <p>支持 JPG、PNG 格式，文件大小不超过 2MB</p>
          </div>
        </div>
      </el-card>

      <!-- 个人信息卡片 -->
      <el-card class="info-card">
        <template #header>
          <div class="card-header">
            <el-icon><User /></el-icon>
            <span>基本信息</span>
          </div>
        </template>

        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          label-width="100px"
          class="profile-form"
        >
          <el-form-item label="用户名">
            <el-input v-model="user!.username" disabled />
            <span class="form-tip">用户名不可修改</span>
          </el-form-item>

          <el-form-item label="邮箱">
            <el-input v-model="user!.email" disabled />
            <span class="form-tip">邮箱不可修改</span>
          </el-form-item>

          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="profileForm.nickname"
              placeholder="请输入昵称"
              clearable
            />
          </el-form-item>

          <el-form-item label="目标考试" prop="targetExam">
            <el-select
              v-model="profileForm.targetExam"
              placeholder="请选择目标考试"
              clearable
            >
              <el-option label="高考" value="gaokao" />
              <el-option label="考研" value="kaoyan" />
              <el-option label="公考" value="gongkao" />
              <el-option label="教资" value="jiazi" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="saving"
              @click="handleSaveProfile"
            >
              保存修改
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 学习统计卡片 -->
      <el-card class="stats-card">
        <template #header>
          <div class="card-header">
            <el-icon><TrendCharts /></el-icon>
            <span>学习统计</span>
          </div>
        </template>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalMistakes || 0 }}</div>
            <div class="stat-label">错题总数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.masteredMistakes || 0 }}</div>
            <div class="stat-label">已掌握</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalReviews || 0 }}</div>
            <div class="stat-label">复习次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalPractice || 0 }}</div>
            <div class="stat-label">练习次数</div>
          </div>
        </div>
      </el-card>

      <!-- 账号安全卡片 -->
      <el-card class="security-card">
        <template #header>
          <div class="card-header">
            <el-icon><Lock /></el-icon>
            <span>账号安全</span>
          </div>
        </template>

        <div class="security-items">
          <div class="security-item">
            <div class="item-info">
              <el-icon class="item-icon"><Key /></el-icon>
              <div class="item-content">
                <div class="item-title">登录密码</div>
                <div class="item-desc">定期修改密码，保护账号安全</div>
              </div>
            </div>
            <el-button @click="showPasswordDialog = true">修改密码</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="至少6个字符"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" :loading="changingPassword" @click="handleChangePassword">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  User,
  UserFilled,
  Lock,
  Camera,
  Key,
  TrendCharts,
} from '@element-plus/icons-vue';
import type { FormInstance, FormRules, UploadProps } from 'element-plus';
import { useAuth } from '@/composables/useAuth';

const {
  user,
  fetchProfile,
  updateProfile,
  sendResetEmail,
} = useAuth();

// 上传配置
const uploadUrl = computed(() => `${(import.meta as any).env?.VITE_API_BASE_URL || '/api'}/user/avatar`);
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
}));

// 表单
const profileFormRef = ref<FormInstance>();
const profileForm = reactive({
  nickname: '',
  targetExam: '',
});

const profileRules: FormRules = {
  nickname: [
    { max: 20, message: '昵称最多20个字符', trigger: 'blur' },
  ],
};

// 密码表单
const passwordFormRef = ref<FormInstance>();
const showPasswordDialog = ref(false);
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
};

// 状态
const saving = ref(false);
const changingPassword = ref(false);

// 学习统计（暂时模拟数据）
const stats = reactive({
  totalMistakes: 0,
  masteredMistakes: 0,
  totalReviews: 0,
  totalPractice: 0,
});

/**
 * 初始化
 */
onMounted(async () => {
  try {
    await fetchProfile();
    if (user.value) {
      profileForm.nickname = user.value.nickname || '';
      profileForm.targetExam = user.value.targetExam || '';
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败');
  }
});

/**
 * 头像上传前验证
 */
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isImage = rawFile.type.startsWith('image/');
  const isLt2M = rawFile.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片文件！');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！');
    return false;
  }
  return true;
};

/**
 * 头像上传成功
 */
const handleAvatarSuccess: UploadProps['onSuccess'] = (response) => {
  if (response.data?.avatarUrl) {
    if (user.value) {
      user.value.avatarUrl = response.data.avatarUrl;
    }
    ElMessage.success('头像上传成功');
  }
};

/**
 * 头像上传失败
 */
const handleAvatarError = () => {
  ElMessage.error('头像上传失败，请稍后重试');
};

/**
 * 保存个人信息
 */
async function handleSaveProfile() {
  if (!profileFormRef.value) return;

  const valid = await profileFormRef.value.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;

  try {
    await updateProfile({
      nickname: profileForm.nickname,
      targetExam: profileForm.targetExam,
    });
    ElMessage.success('保存成功');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

/**
 * 重置表单
 */
function handleReset() {
  if (user.value) {
    profileForm.nickname = user.value.nickname || '';
    profileForm.targetExam = user.value.targetExam || '';
  }
}

/**
 * 修改密码
 */
async function handleChangePassword() {
  if (!passwordFormRef.value) return;

  const valid = await passwordFormRef.value.validate().catch(() => false);
  if (!valid) return;

  changingPassword.value = true;

  try {
    // 调用重置密码 API（需要先发送邮件）
    await sendResetEmail(user.value!.email);
    ElMessage.success('密码重置邮件已发送，请查收邮箱');
    showPasswordDialog.value = false;
    passwordFormRef.value.resetFields();
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '发送失败');
  } finally {
    changingPassword.value = false;
  }
}
</script>

<style scoped lang="scss">
.profile-view {
  padding: var(--spacing-xl);
  max-width: 800px;
  margin: 0 auto;
}

.profile-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.avatar-card {
  margin-bottom: var(--spacing-lg);
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg) 0;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: var(--spacing-md);
}

.user-avatar {
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: -8px;

  .upload-btn {
    width: 36px;
    height: 36px;
    background: var(--color-white);
    border: 2px solid var(--color-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    &:hover {
      color: var(--primary-color);
      border-color: var(--primary-color);
    }
  }
}

.avatar-tips {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);

  p {
    margin: 0;
  }
}

.info-card {
  margin-bottom: var(--spacing-lg);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

.profile-form {
  max-width: 500px;

  .form-tip {
    display: block;
    margin-top: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  :deep(.el-form-item__content) {
    flex-direction: column;
    align-items: flex-start;
  }

  :deep(.el-input),
  :deep(.el-select) {
    width: 100%;
  }
}

.stats-card {
  margin-bottom: var(--spacing-lg);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
}

.stat-item {
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-lg);
}

.stat-value {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.security-card {
  margin-bottom: var(--spacing-lg);
}

.security-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.item-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.item-icon {
  font-size: 24px;
  color: var(--primary-color);
}

.item-content {
  display: flex;
  flex-direction: column;
}

.item-title {
  font-weight: var(--font-weight-medium);
  margin-bottom: var(--spacing-xs);
}

.item-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

@media (max-width: $breakpoint-md) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: $breakpoint-sm) {
  .profile-view {
    padding: var(--spacing-md);
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .security-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }
}
</style>
