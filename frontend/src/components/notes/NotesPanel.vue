<template>
  <div class="notes-panel" :class="{ 'collapsed': !isVisible }">
    <!-- 折叠按钮 -->
    <div class="notes-toggle" @click="toggle">
      <el-icon :class="{ 'rotated': isVisible }">
        <ArrowLeft />
      </el-icon>
    </div>

    <!-- 内容区域 -->
    <div v-show="isVisible" class="notes-content">
      <div class="notes-header">
        <div class="header-left">
          <el-icon><Edit /></el-icon>
          <span class="header-title">{{ title }}</span>
          <el-badge v-if="notesCount > 0" :value="notesCount" class="notes-badge" />
        </div>
        <div class="header-actions">
          <el-button link @click="showHistory = !showHistory">
            <el-icon><Clock /></el-icon>
            历史
          </el-button>
        </div>
      </div>

      <!-- 笔记编辑区 -->
      <div v-show="!showHistory" class="notes-editor">
        <el-input
          v-model="noteContent"
          type="textarea"
          :rows="editorRows"
          :placeholder="placeholder"
          class="notes-textarea"
          @blur="handleAutoSave"
        />

        <div class="editor-toolbar">
          <div class="toolbar-left">
            <el-button size="small" @click="insertText('【重点】')">
              <el-icon><Star /></el-icon>
              重点
            </el-button>
            <el-button size="small" @click="insertText('【疑问】')">
              <el-icon><QuestionFilled /></el-icon>
              疑问
            </el-button>
            <el-button size="small" @click="insertText('【易错】')">
              <el-icon><WarningFilled /></el-icon>
              易错
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-button
              type="primary"
              size="small"
              :loading="saving"
              @click="handleSave"
            >
              <el-icon><Check /></el-icon>
              保存
            </el-button>
            <el-button
              size="small"
              :disabled="!noteContent"
              @click="handleClear"
            >
              <el-icon><Delete /></el-icon>
              清空
            </el-button>
          </div>
        </div>

        <!-- 自动保存提示 -->
        <div v-if="autoSaving" class="auto-save-hint">
          <el-icon class="is-loading"><Loading /></el-icon>
          正在保存...
        </div>
        <div v-else-if="lastSaved" class="last-saved-hint">
          <el-icon><CircleCheckFilled /></el-icon>
          已保存于 {{ lastSaved }}
        </div>
      </div>

      <!-- 历史记录 -->
      <div v-show="showHistory" class="notes-history">
        <div v-if="historyNotes.length === 0" class="empty-history">
          <el-empty description="暂无历史记录" :image-size="60" />
        </div>
        <div v-else class="history-list">
          <div
            v-for="(note, index) in historyNotes"
            :key="note.id"
            class="history-item"
            @click="selectHistoryNote(note)"
          >
            <div class="history-header">
              <span class="history-time">{{ formatTime(note.updatedAt) }}</span>
              <el-button
                link
                type="danger"
                size="small"
                @click.stop="handleDeleteNote(note.id)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <div class="history-content">{{ note.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ArrowLeft,
  Edit,
  Clock,
  Star,
  QuestionFilled,
  WarningFilled,
  Check,
  Delete,
  Loading,
  CircleCheckFilled,
} from '@element-plus/icons-vue';
import { useNotes, type Note } from '@/composables/useNotes';

interface Props {
  targetType?: Note['targetType'];
  targetId?: string;
  title?: string;
  placeholder?: string;
  editorRows?: number;
  visible?: boolean;
  autoSaveDelay?: number;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', note: Note | null): void;
}

const props = withDefaults(defineProps<Props>(), {
  targetType: 'mistake',
  targetId: '',
  title: '学习笔记',
  placeholder: '记录你的学习心得、解题思路或重点笔记...',
  editorRows: 12,
  visible: true,
  autoSaveDelay: 3000, // 自动保存延迟（毫秒）
});

const emit = defineEmits<Emits>();

const {
  notes,
  loading,
  currentNote,
  fetchNotes,
  saveNote,
  deleteNote,
  clearCurrentNote,
} = useNotes();

// 状态
const isVisible = ref(props.visible);
const showHistory = ref(false);
const noteContent = ref('');
const saving = ref(false);
const autoSaving = ref(false);
const lastSaved = ref('');
const historyNotes = ref<Note[]>([]);

// 自动保存定时器
let autoSaveTimer: NodeJS.Timeout | null = null;

// 计算笔记数量
const notesCount = computed(() => historyNotes.value.length);

/**
 * 切换可见性
 */
function toggle() {
  isVisible.value = !isVisible.value;
  emit('update:visible', isVisible.value);
}

/**
 * 格式化时间
 */
function formatTime(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
  if (minutes < 43200) return `${Math.floor(minutes / 1440)}天前`;
  return date.toLocaleDateString('zh-CN');
}

/**
 * 插入文本
 */
function insertText(text: string) {
  const textarea = document.querySelector('.notes-textarea textarea') as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const content = noteContent.value;

  noteContent.value = content.substring(0, start) + text + ' ' + content.substring(end);

  // 重新设置光标位置
  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = start + text.length + 1;
    textarea.focus();
  }, 0);
}

/**
 * 保存笔记
 */
async function handleSave() {
  if (!props.targetId) {
    ElMessage.warning('未指定目标对象');
    return;
  }

  saving.value = true;

  try {
    const note = await saveNote(props.targetType, props.targetId, noteContent.value);
    if (note) {
      lastSaved.value = formatTime(new Date());
      emit('save', note);
      // 刷新历史记录
      loadHistory();
    }
  } finally {
    saving.value = false;
  }
}

/**
 * 自动保存
 */
async function handleAutoSave() {
  if (!props.targetId || !noteContent.value.trim()) return;

  // 清除之前的定时器
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  autoSaving.value = true;

  // 设置新的定时器
  autoSaveTimer = setTimeout(async () => {
    await handleSave();
    autoSaving.value = false;
  }, props.autoSaveDelay);
}

/**
 * 清空内容
 */
function handleClear() {
  ElMessageBox.confirm('确定要清空笔记内容吗？', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    noteContent.value = '';
    handleAutoSave();
  }).catch(() => {});
}

/**
 * 删除笔记
 */
async function handleDeleteNote(noteId: string) {
  ElMessageBox.confirm('确定要删除这条笔记吗？', '确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    const success = await deleteNote(noteId);
    if (success) {
      loadHistory();
      if (currentNote.value?.id === noteId) {
        noteContent.value = '';
        currentNote.value = null;
      }
    }
  }).catch(() => {});
}

/**
 * 选择历史笔记
 */
function selectHistoryNote(note: Note) {
  noteContent.value = note.content;
  currentNote.value = note;
  showHistory.value = false;
}

/**
 * 加载历史记录
 */
async function loadHistory() {
  if (!props.targetId) return;

  const loadedNotes = await fetchNotes(props.targetType, props.targetId);
  historyNotes.value = loadedNotes;
}

/**
 * 初始化
 */
async function init() {
  if (!props.targetId) return;

  await loadHistory();

  // 如果有当前笔记，加载内容
  if (currentNote.value) {
    noteContent.value = currentNote.value.content;
  }
}

// 监听目标变化
watch(() => [props.targetType, props.targetId], () => {
  clearCurrentNote();
  noteContent.value = '';
  lastSaved.value = '';
  init();
});

// 监听可见性变化
watch(() => props.visible, (value) => {
  isVisible.value = value;
});

// 组件挂载时初始化
onMounted(() => {
  init();
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }
});
</script>

<style scoped lang="scss">
.notes-panel {
  position: relative;
  background: var(--color-white);
  border-left: 1px solid var(--color-border);
  display: flex;
  transition: all 0.3s ease;

  &.collapsed {
    .notes-content {
      display: none;
    }

    .notes-toggle {
      border-radius: 0 8px 8px 0;
    }
  }
}

.notes-toggle {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 80px;
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-left: none;
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 10;

  &:hover {
    background: var(--color-bg-light);
  }

  .el-icon {
    transition: transform 0.3s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.notes-content {
  width: 350px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.header-title {
  font-weight: var(--font-weight-medium);
}

.notes-badge {
  :deep(.el-badge__content) {
    background-color: var(--primary-color);
  }
}

.notes-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
}

.notes-textarea {
  flex: 1;

  :deep(.el-textarea__inner) {
    resize: none;
    border: none;
    padding: 0;
    box-shadow: none;
    font-size: var(--font-size-base);
    line-height: 1.6;
  }
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  margin-top: var(--spacing-md);
}

.toolbar-left {
  display: flex;
  gap: var(--spacing-xs);
}

.toolbar-right {
  display: flex;
  gap: var(--spacing-xs);
}

.auto-save-hint,
.last-saved-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  padding-top: var(--spacing-sm);
}

.auto-save-hint .el-icon {
  color: var(--warning-color);
}

.last-saved-hint .el-icon {
  color: var(--success-color);
}

.notes-history {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.empty-history {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.history-item {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--color-bg-hover);
  }
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.history-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.history-content {
  font-size: var(--font-size-sm);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

@media (max-width: $breakpoint-md) {
  .notes-content {
    width: 300px;
  }
}

@media (max-width: $breakpoint-sm) {
  .notes-content {
    width: 100%;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  }

  .notes-panel.collapsed .notes-toggle {
    display: none;
  }
}
</style>
