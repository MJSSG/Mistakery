<template>
  <div class="draft-note-panel" :class="{ 'is-expanded': isExpanded }">
    <!-- 切换按钮 -->
    <div class="panel-toggle" @click="togglePanel">
      <el-icon class="toggle-icon" :class="{ 'is-rotated': isExpanded }">
        <ArrowUp />
      </el-icon>
      <span class="toggle-text">{{ isExpanded ? '收起草稿' : '展开草稿' }}</span>
      <el-badge :value="draftCount" :hidden="draftCount === 0" type="danger" />
    </div>

    <!-- 草稿内容 -->
    <div v-if="isExpanded" class="panel-content">
      <!-- 新建草稿 -->
      <div class="draft-new">
        <el-input
          v-model="newDraftTitle"
          placeholder="草稿标题..."
          size="small"
          class="draft-title-input"
          @keyup.enter="createDraft"
        >
          <template #append>
            <el-button :icon="Plus" @click="createDraft" />
          </template>
        </el-input>
      </div>

      <!-- 草稿列表 -->
      <div class="draft-list">
        <div v-if="drafts.length === 0" class="draft-empty">
          <el-icon class="empty-icon"><Document /></el-icon>
          <span class="empty-text">暂无草稿</span>
        </div>

        <div
          v-for="draft in drafts"
          :key="draft.id"
          class="draft-item"
          :class="{ 'is-active': activeDraftId === draft.id }"
          @click="openDraft(draft)"
        >
          <div class="draft-header">
            <span class="draft-title">{{ draft.title }}</span>
            <div class="draft-actions">
              <el-tooltip content="编辑" placement="top">
                <el-button
                  :icon="Edit"
                  size="small"
                  link
                  @click.stop="editDraft(draft)"
                />
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button
                  :icon="Delete"
                  size="small"
                  link
                  type="danger"
                  @click.stop="deleteDraft(draft.id)"
                />
              </el-tooltip>
            </div>
          </div>
          <div class="draft-content">{{ draft.content }}</div>
          <div class="draft-meta">
            <span class="draft-time">{{ formatTime(draft.updatedAt) }}</span>
            <span class="draft-length">{{ draft.content.length }} 字</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="editingDraft?.title || '编辑草稿'"
      width="500px"
      @close="closeEditDialog"
    >
      <el-form>
        <el-form-item label="标题">
          <el-input v-model="editForm.title" placeholder="草稿标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="8"
            placeholder="草稿内容..."
            show-word-limit
            :maxlength="maxDraftLength"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeEditDialog">取消</el-button>
        <el-button type="primary" @click="saveDraft">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowUp, Plus, Edit, Delete, Document } from '@element-plus/icons-vue';

interface Draft {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

interface Props {
  maxDraftLength?: number;
  storageKey?: string;
}

interface Emits {
  (e: 'open', draft: Draft): void;
}

const props = withDefaults(defineProps<Props>(), {
  maxDraftLength: 1000,
  storageKey: 'draft-notes',
});

const emit = defineEmits<Emits>();

const isExpanded = ref(false);
const newDraftTitle = ref('');
const drafts = ref<Draft[]>([]);
const activeDraftId = ref<string | null>(null);

// 编辑对话框
const showEditDialog = ref(false);
const editingDraft = ref<Draft | null>(null);
const editForm = ref({
  title: '',
  content: '',
});

const draftCount = computed(() => drafts.value.length);

// 初始化
onMounted(() => {
  loadDrafts();
});

// 切换面板
const togglePanel = () => {
  isExpanded.value = !isExpanded.value;
};

// 加载草稿
const loadDrafts = () => {
  try {
    const stored = localStorage.getItem(props.storageKey);
    if (stored) {
      drafts.value = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load drafts:', error);
  }
};

// 保存草稿到本地存储
const saveDraftsToStorage = () => {
  try {
    localStorage.setItem(props.storageKey, JSON.stringify(drafts.value));
  } catch (error) {
    console.error('Failed to save drafts:', error);
  }
};

// 创建草稿
const createDraft = () => {
  if (!newDraftTitle.value.trim()) {
    ElMessage.warning('请输入草稿标题');
    return;
  }

  const draft: Draft = {
    id: Date.now().toString(),
    title: newDraftTitle.value.trim(),
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  drafts.value.unshift(draft);
  saveDraftsToStorage();

  newDraftTitle.value = '';
  ElMessage.success('草稿已创建');

  // 自动打开编辑
  editDraft(draft);
};

// 打开草稿
const openDraft = (draft: Draft) => {
  activeDraftId.value = draft.id;
  emit('open', draft);
};

// 编辑草稿
const editDraft = (draft: Draft) => {
  editingDraft.value = draft;
  editForm.value = {
    title: draft.title,
    content: draft.content,
  };
  showEditDialog.value = true;
};

// 关闭编辑对话框
const closeEditDialog = () => {
  showEditDialog.value = false;
  editingDraft.value = null;
  editForm.value = { title: '', content: '' };
};

// 保存编辑
const saveDraft = () => {
  if (!editingDraft.value) return;

  if (!editForm.value.title.trim()) {
    ElMessage.warning('请输入标题');
    return;
  }

  const index = drafts.value.findIndex(d => d.id === editingDraft.value!.id);
  if (index !== -1) {
    drafts.value[index] = {
      ...drafts.value[index],
      title: editForm.value.title.trim(),
      content: editForm.value.content,
      updatedAt: Date.now(),
    };
    saveDraftsToStorage();
    ElMessage.success('草稿已保存');
    closeEditDialog();
  }
};

// 删除草稿
const deleteDraft = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个草稿吗？', '确认删除', {
      type: 'warning',
    });

    drafts.value = drafts.value.filter(d => d.id !== id);
    saveDraftsToStorage();

    if (activeDraftId.value === id) {
      activeDraftId.value = null;
    }

    ElMessage.success('草稿已删除');
  } catch {
    // 取消删除
  }
};

// 格式化时间
const formatTime = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 对外暴露方法
defineExpose({
  addDraft: (title: string, content: string) => {
    const draft: Draft = {
      id: Date.now().toString(),
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    drafts.value.unshift(draft);
    saveDraftsToStorage();
  },
  getDrafts: () => drafts.value,
  clearDrafts: () => {
    drafts.value = [];
    saveDraftsToStorage();
  },
});
</script>

<style scoped lang="scss">
.draft-note-panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.panel-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--primary-color);
  color: var(--color-white);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-fast);
  user-select: none;

  &:hover {
    background: var(--primary-color-dark);
    transform: translateY(-2px);
  }
}

.toggle-icon {
  transition: transform var(--transition-fast);

  &.is-rotated {
    transform: rotate(180deg);
  }
}

.toggle-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.panel-content {
  margin-top: var(--spacing-sm);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.draft-new {
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
}

.draft-title-input {
  width: 100%;
}

.draft-list {
  max-height: 400px;
  overflow-y: auto;
  padding: var(--spacing-sm);
}

.draft-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-sm);
}

.empty-text {
  font-size: var(--font-size-sm);
}

.draft-item {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-xs);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--primary-color);
    background: var(--color-bg-light);
  }

  &.is-active {
    border-color: var(--primary-color);
    background: var(--primary-color-light);
  }
}

.draft-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.draft-title {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.draft-actions {
  display: flex;
  gap: var(--spacing-xs);
}

.draft-content {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.draft-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-disabled);
}
</style>
