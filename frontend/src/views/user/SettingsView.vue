<template>
  <div class="settings-view">
    <div class="settings-container">
      <div class="settings-header">
        <h1 class="page-title">设置</h1>
      </div>

      <!-- 外观设置 -->
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <el-icon><Brush /></el-icon>
            <span>外观设置</span>
          </div>
        </template>

        <el-form :model="settingsForm" label-width="120px" class="settings-form">
          <el-form-item label="主题">
            <el-radio-group v-model="settingsForm.theme">
              <el-radio-button value="light">浅色</el-radio-button>
              <el-radio-button value="dark">深色</el-radio-button>
              <el-radio-button value="auto">跟随系统</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="字体大小">
            <el-slider
              v-model="settingsForm.fontSize"
              :min="12"
              :max="20"
              :step="1"
              :marks="fontSizeMarks"
              show-stops
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 练习设置 -->
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <el-icon><Setting /></el-icon>
            <span>练习设置</span>
          </div>
        </template>

        <el-form :model="settingsForm" label-width="120px" class="settings-form">
          <el-form-item label="自动跳转">
            <div class="setting-item">
              <el-switch v-model="settingsForm.autoNext" />
              <span class="setting-desc">答题后自动跳转下一题</span>
            </div>
          </el-form-item>

          <el-form-item label="练习提醒">
            <div class="setting-item">
              <el-switch v-model="settingsForm.notificationsEnabled" />
              <span class="setting-desc">开启练习提醒通知</span>
            </div>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 复习设置 -->
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <el-icon><Clock /></el-icon>
            <span>复习设置</span>
          </div>
        </template>

        <el-form :model="settingsForm" label-width="120px" class="settings-form">
          <el-form-item label="每日复习提醒">
            <div class="setting-item">
              <el-switch v-model="settingsForm.dailyReviewReminder" />
              <span class="setting-desc">每天定时提醒复习</span>
            </div>
          </el-form-item>

          <el-form-item label="提醒时间">
            <el-time-picker
              v-model="reviewTime"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择提醒时间"
            />
          </el-form-item>

          <el-form-item label="每次复习题数">
            <el-input-number
              v-model="settingsForm.reviewBatchSize"
              :min="5"
              :max="50"
              :step="5"
            />
            <span class="setting-desc">每次复习的题目数量</span>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 数据管理 -->
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <el-icon><FolderOpened /></el-icon>
            <span>数据管理</span>
          </div>
        </template>

        <div class="data-actions">
          <div class="data-action-item">
            <div class="action-info">
              <div class="action-title">导出数据</div>
              <div class="action-desc">导出所有错题和学习记录</div>
            </div>
            <el-button @click="handleExportData">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>

          <div class="data-action-item danger">
            <div class="action-info">
              <div class="action-title">清除缓存</div>
              <div class="action-desc">清除本地缓存数据，不会删除账号</div>
            </div>
            <el-button type="warning" @click="handleClearCache">
              <el-icon><Delete /></el-icon>
              清除
            </el-button>
          </div>

          <div class="data-action-item danger">
            <div class="action-info">
              <div class="action-title">注销账号</div>
              <div class="action-desc">永久删除账号和所有数据</div>
            </div>
            <el-button type="danger" @click="showDeleteDialog = true">
              <el-icon><UserFilled /></el-icon>
              注销
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 关于 -->
      <el-card class="settings-card">
        <template #header>
          <div class="card-header">
            <el-icon><InfoFilled /></el-icon>
            <span>关于</span>
          </div>
        </template>

        <div class="about-section">
          <div class="about-item">
            <span class="about-label">应用名称</span>
            <span class="about-value">Mistakery</span>
          </div>
          <div class="about-item">
            <span class="about-label">版本号</span>
            <span class="about-value">v1.0.0</span>
          </div>
          <div class="about-item">
            <span class="about-label">官网</span>
            <el-link type="primary" href="https://mistakery.com" target="_blank">
              mistakery.com
            </el-link>
          </div>
        </div>
      </el-card>

      <!-- 保存按钮 -->
      <div class="settings-actions">
        <el-button type="primary" size="large" :loading="saving" @click="handleSaveSettings">
          保存设置
        </el-button>
        <el-button size="large" @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 注销账号确认对话框 -->
    <el-dialog
      v-model="showDeleteDialog"
      title="注销账号"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: var(--spacing-lg)"
      >
        此操作不可撤销！注销后将永久删除您的账号和所有数据。
      </el-alert>

      <el-form ref="deleteFormRef" :model="deleteForm" :rules="deleteRules" label-position="top">
        <el-form-item label="请输入" prop="confirmText">
          <el-input
            v-model="deleteForm.confirmText"
            :placeholder="`请输入「${deleteConfirmKeyword}」以确认`"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button type="danger" :loading="deleting" @click="handleDeleteAccount">
          确认注销
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Brush,
  Setting,
  Clock,
  FolderOpened,
  Download,
  Delete,
  UserFilled,
  InfoFilled,
} from '@element-plus/icons-vue';
import type { FormInstance, FormRules } from 'element-plus';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { logout, updateSettings } = useAuth();

// 删除账号确认关键词
const deleteConfirmKeyword = '注销账号';

// 表单
const settingsForm = reactive({
  theme: 'auto',
  fontSize: 14,
  autoNext: true,
  notificationsEnabled: true,
  dailyReviewReminder: true,
  reviewTime: '20:00',
  reviewBatchSize: 20,
});

const reviewTime = ref('20:00');

const fontSizeMarks = {
  12: '小',
  14: '默认',
  16: '中',
  18: '大',
  20: '特大',
};

// 删除账号表单
const showDeleteDialog = ref(false);
const deleteFormRef = ref<FormInstance>();
const deleteForm = reactive({
  confirmText: '',
});

const deleteRules: FormRules = {
  confirmText: [
    {
      required: true,
      validator: (_rule, value, callback) => {
        if (value !== deleteConfirmKeyword) {
          callback(new Error(`请输入「${deleteConfirmKeyword}」以确认`));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

// 状态
const saving = ref(false);
const deleting = ref(false);

/**
 * 初始化
 */
onMounted(() => {
  // 从 localStorage 加载设置
  const savedSettings = localStorage.getItem('userSettings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      Object.assign(settingsForm, parsed);
      if (parsed.reviewTime) {
        reviewTime.value = parsed.reviewTime;
      }
    } catch (e) {
      // 忽略解析错误
    }
  }

  // 应用主题
  applyTheme(settingsForm.theme);
  applyFontSize(settingsForm.fontSize);
});

/**
 * 应用主题
 */
function applyTheme(theme: string) {
  const html = document.documentElement;
  html.classList.remove('light', 'dark');

  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.classList.add(prefersDark ? 'dark' : 'light');
  } else {
    html.classList.add(theme);
  }
}

/**
 * 应用字体大小
 */
function applyFontSize(size: number) {
  document.documentElement.style.fontSize = `${size}px`;
}

/**
 * 保存设置
 */
async function handleSaveSettings() {
  saving.value = true;

  try {
    const settingsToSave = {
      ...settingsForm,
      reviewTime: reviewTime.value,
    };

    // 保存到 localStorage
    localStorage.setItem('userSettings', JSON.stringify(settingsToSave));

    // 发送到服务器
    await updateSettings(settingsToSave);

    // 应用设置
    applyTheme(settingsForm.theme);
    applyFontSize(settingsForm.fontSize);

    ElMessage.success('设置保存成功');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

/**
 * 重置设置
 */
function handleReset() {
  ElMessageBox.confirm('确定要重置所有设置为默认值吗？', '重置设置', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    const defaultSettings = {
      theme: 'auto',
      fontSize: 14,
      autoNext: true,
      notificationsEnabled: true,
      dailyReviewReminder: true,
      reviewTime: '20:00',
      reviewBatchSize: 20,
    };

    Object.assign(settingsForm, defaultSettings);
    reviewTime.value = defaultSettings.reviewTime;

    localStorage.removeItem('userSettings');
    applyTheme(defaultSettings.theme);
    applyFontSize(defaultSettings.fontSize);

    ElMessage.success('设置已重置');
  }).catch(() => {});
}

/**
 * 导出数据
 */
async function handleExportData() {
  try {
    ElMessageBox.confirm(
      '将导出您的所有错题和学习记录，数据将以 JSON 格式下载。',
      '导出数据',
      {
        confirmButtonText: '导出',
        cancelButtonText: '取消',
        type: 'info',
      }
    ).then(() => {
      // TODO: 实现数据导出功能
      ElMessage.info('导出功能开发中...');
    }).catch(() => {});
  } catch (e) {
    // 用户取消
  }
}

/**
 * 清除缓存
 */
function handleClearCache() {
  ElMessageBox.confirm(
    '清除后将重新加载数据，但不会删除账号和云端的任何数据。',
    '清除缓存',
    {
      confirmButtonText: '清除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 清除 localStorage 中的缓存数据
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.includes('token') && !key.includes('refreshToken')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    ElMessage.success('缓存已清除');
    setTimeout(() => {
      location.reload();
    }, 500);
  }).catch(() => {});
}

/**
 * 注销账号
 */
async function handleDeleteAccount() {
  if (!deleteFormRef.value) return;

  const valid = await deleteFormRef.value.validate().catch(() => false);
  if (!valid) return;

  deleting.value = true;

  try {
    // TODO: 调用注销账号 API
    // await api.delete('/user/account');

    // 退出登录
    await logout();

    ElMessage.success('账号已注销');
    router.push('/register');
  } catch (err: any) {
    ElMessage.error(err.response?.data?.message || '注销失败');
  } finally {
    deleting.value = false;
    showDeleteDialog.value = false;
  }
}
</script>

<style scoped lang="scss">
.settings-view {
  padding: var(--spacing-xl);
  max-width: 800px;
  margin: 0 auto;
}

.settings-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.settings-card {
  margin-bottom: var(--spacing-lg);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

.settings-form {
  max-width: 500px;

  :deep(.el-slider__marks-text) {
    font-size: var(--font-size-xs);
  }

  .setting-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .setting-desc {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}

.data-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.data-action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);

  &.danger {
    background: #fef2f2;

    .action-title {
      color: var(--danger-color);
    }
  }
}

.action-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.action-title {
  font-weight: var(--font-weight-medium);
}

.action-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.about-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.about-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
}

.about-label {
  color: var(--color-text-secondary);
}

.about-value {
  font-weight: var(--font-weight-medium);
}

.settings-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

@media (max-width: $breakpoint-sm) {
  .settings-view {
    padding: var(--spacing-md);
  }

  .data-action-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);

    .el-button {
      width: 100%;
    }
  }

  .settings-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
