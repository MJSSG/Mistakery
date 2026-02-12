<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(val) => emit('update:visible', val)"
    title="笔记"
    :width="600"
    :close-on-click-modal="false"
    class="note-editor-dialog"
    @close="handleClose"
  >
    <div class="note-editor-content">
      <!-- 笔记编辑器 -->
      <el-input
        v-model="content"
        type="textarea"
        :rows="8"
        placeholder="在这里写下你的笔记..."
        show-word-limit
        :maxlength="maxNoteLength"
        class="note-textarea"
        resize="vertical"
      />

      <!-- 工具栏 -->
      <div class="note-toolbar">
        <div class="toolbar-left">
          <span class="word-count">{{ content.length }} / {{ maxNoteLength }}</span>
        </div>
        <div class="toolbar-right">
          <el-button
            :icon="DocumentCopy"
            size="small"
            @click="handleCopy"
          >
            复制
          </el-button>
          <el-button
            :icon="Delete"
            size="small"
            type="danger"
            @click="handleClear"
            :disabled="!content"
          >
            清空
          </el-button>
        </div>
      </div>

      <!-- 历史记录 -->
      <div v-if="history.length > 0" class="note-history">
        <div class="history-header">
          <span class="history-title">历史笔记</span>
          <el-button
            :icon="Delete"
            link
            type="danger"
            size="small"
            @click="handleClearHistory"
          >
            清除历史
          </el-button>
        </div>
        <div class="history-list">
          <div
            v-for="(note, index) in history"
            :key="index"
            class="history-item"
            @click="handleRestoreHistory(index)"
          >
            <div class="history-content">{{ note }}</div>
            <div class="history-time">{{ formatTime(index) }}</div>
          </div>
        </div>
      </div>

      <!-- 快捷提示 -->
      <div class="note-tips">
        <el-icon class="tip-icon"><InfoFilled /></el-icon>
        <span class="tip-text">笔记会自动保存，快捷键 Ctrl+M 打开/关闭</span>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { DocumentCopy, Delete, InfoFilled } from '@element-plus/icons-vue';

interface Props {
  modelValue: string;
  visible: boolean;
  maxNoteLength?: number;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'update:visible', value: boolean): void;
  (e: 'save', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  visible: false,
  maxNoteLength: 500,
});

const emit = defineEmits<Emits>();

const content = ref(props.modelValue);
const history = ref<string[]>([]);
const autoSaveTimer = ref<number | null>(null);

// 自动保存间隔（毫秒）
const AUTO_SAVE_DELAY = 2000;

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  content.value = newValue;
});

// 监听内容变化，自动保存历史
watch(content, () => {
  scheduleAutoSave();
});

// 自动保存
const scheduleAutoSave = () => {
  if (autoSaveTimer.value !== null) {
    clearTimeout(autoSaveTimer.value);
  }

  autoSaveTimer.value = window.setTimeout(() => {
    saveToHistory();
  }, AUTO_SAVE_DELAY);
};

// 保存到历史记录
const saveToHistory = () => {
  if (!content.value.trim()) return;

  // 避免重复
  const lastNote = history.value[0];
  if (lastNote === content.value) return;

  // 添加到历史记录开头
  history.value.unshift(content.value);

  // 限制历史记录数量
  if (history.value.length > 10) {
    history.value = history.value.slice(0, 10);
  }
};

// 关闭
const handleClose = () => {
  emit('update:visible', false);
};

// 保存
const handleSave = () => {
  emit('update:modelValue', content.value);
  emit('save', content.value);
  emit('update:visible', false);
  ElMessage.success('笔记已保存');
};

// 复制
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(content.value);
    ElMessage.success('已复制到剪贴板');
  } catch (error) {
    ElMessage.error('复制失败');
  }
};

// 清空
const handleClear = () => {
  content.value = '';
};

// 恢复历史记录
const handleRestoreHistory = (index: number) => {
  content.value = history.value[index];
  ElMessage.success('已恢复历史笔记');
};

// 清除历史
const handleClearHistory = () => {
  history.value = [];
  ElMessage.success('历史记录已清除');
};

// 格式化时间
const formatTime = (index: number) => {
  // 简化的时间显示
  const times = ['最近', '5分钟前', '10分钟前', '15分钟前', '20分钟前', '30分钟前', '1小时前', '2小时前', '3小时前', '更早'];
  return times[index] || '更早';
};

// 清理定时器
onBeforeUnmount(() => {
  if (autoSaveTimer.value !== null) {
    clearTimeout(autoSaveTimer.value);
  }
});
</script>

<style scoped lang="scss">
.note-editor-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.note-textarea {
  :deep(.el-textarea__inner) {
    font-size: var(--font-size-base);
    line-height: 1.6;
    resize: vertical;
  }
}

.note-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.word-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.toolbar-right {
  display: flex;
  gap: var(--spacing-xs);
}

.note-history {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.history-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.history-item {
  padding: var(--spacing-sm);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-hover);
    transform: translateX(4px);
  }
}

.history-content {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.note-tips {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-info-light);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: var(--info-color);
}

.tip-icon {
  flex-shrink: 0;
}
</style>
