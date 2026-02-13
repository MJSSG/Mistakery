<template>
  <div
    class="mistake-card"
    :class="{ 'is-selected': isSelected, 'is-deleted': isDeleted }"
  >
    <div class="card-select">
      <el-checkbox
        :model-value="isSelected"
        @change="$emit('select', mistake.id)"
      />
    </div>

    <div class="card-content" @click="$emit('view', mistake.id)">
      <div class="card-header">
        <div class="header-left">
          <el-tag :type="difficultyType" size="small">{{ difficultyLabel }}</el-tag>
          <el-tag :type="subjectType" size="small">{{ mistake.subject }}</el-tag>
          <el-tag size="small">{{ typeLabel }}</el-tag>
        </div>
        <div class="header-right">
          <StatusTag :level="mistake.reviewStatus || 'new'" size="small" />
          <el-dropdown @command="handleCommand">
            <el-icon class="more-icon">
              <MoreFilled />
            </el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  编辑笔记
                </el-dropdown-item>
                <el-dropdown-item command="practice">
                  <el-icon><Memo /></el-icon>
                  单题练习
                </el-dropdown-item>
                <el-dropdown-item command="export">
                  <el-icon><Download /></el-icon>
                  导出
                </el-dropdown-item>
                <el-dropdown-item divided command="delete">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="card-body">
        <div class="question-content">
          <div class="question-index">{{ mistake.index }}.</div>
          <div class="question-text">{{ mistake.question }}</div>
        </div>

        <div class="answer-section">
          <div class="answer-row">
            <span class="answer-label">我的答案:</span>
            <span class="answer-value incorrect">{{ mistake.myAnswer || '未作答' }}</span>
          </div>
          <div class="answer-row">
            <span class="answer-label">正确答案:</span>
            <span class="answer-value correct">{{ mistake.correctAnswer }}</span>
          </div>
        </div>

        <div v-if="mistake.note" class="note-section">
          <div class="note-header">
            <el-icon><Document /></el-icon>
            <span class="note-title">笔记</span>
          </div>
          <div class="note-content">{{ mistake.note }}</div>
        </div>
      </div>

      <div class="card-footer">
        <div class="footer-stats">
          <div class="stat-item">
            <el-icon><View /></el-icon>
            <span>复习 {{ mistake.reviewCount }} 次</span>
          </div>
        </div>
        <div class="footer-time">
          <el-icon><Clock /></el-icon>
          <span>{{ formatTime(mistake.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  MoreFilled,
  Edit,
  Delete,
  Download,
  Document,
  View,
  Clock,
  Memo,
} from '@element-plus/icons-vue';
import StatusTag from '@/components/result/StatusTag.vue';

export interface MistakeData {
  id: string;
  index: number;
  question: string;
  subject: string;
  questionType: 'single' | 'multiple' | 'boolean' | 'fill' | 'short';
  difficulty: 'easy' | 'medium' | 'hard';
  myAnswer?: string;
  correctAnswer: string;
  reviewCount: number;
  reviewStatus?: 'new' | 'reviewing' | 'reviewed' | 'mastered';
  note?: string;
  createdAt: string;
  subjectColor?: string;
}

interface Props {
  mistake: MistakeData;
  isSelected: boolean;
  isDeleted: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [id: string];
  view: [id: string];
  'edit-note': [id: string];
  'single-practice': [id: string];
  export: [id: string];
  delete: [id: string];
}>();

const difficultyMap = {
  easy: { label: '简单', type: 'success' },
  medium: { label: '中等', type: 'warning' },
  hard: { label: '困难', type: 'danger' },
};

const typeMap = {
  single: '单选题',
  multiple: '多选题',
  boolean: '判断题',
  fill: '填空题',
  short: '简答题',
};

const difficultyLabel = computed(() => difficultyMap[props.mistake.difficulty].label);
const difficultyType = computed(() => difficultyMap[props.mistake.difficulty].type as any);
const typeLabel = computed(() => typeMap[props.mistake.questionType]);

const subjectType = computed(() => {
  const colorMap: Record<string, any> = {
    数学: 'primary',
    英语: 'success',
    语文: 'warning',
    物理: 'danger',
    化学: 'info',
  };
  return colorMap[props.mistake.subject] || 'info';
});

const handleCommand = (command: string) => {
  switch (command) {
    case 'edit':
      emit('edit-note', props.mistake.id);
      break;
    case 'practice':
      emit('single-practice', props.mistake.id);
      break;
    case 'export':
      emit('export', props.mistake.id);
      break;
    case 'delete':
      emit('delete', props.mistake.id);
      break;
  }
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
};
</script>

<style scoped lang="scss">
.mistake-card {
  display: flex;
  gap: var(--spacing-sm);
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);

  &:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--primary-color);
  }

  &.is-selected {
    background: var(--color-bg-light);
    border-color: var(--primary-color);
  }

  &.is-deleted {
    opacity: 0.6;
    background: var(--color-bg-light);
  }
}

.card-select {
  padding-top: var(--spacing-sm);
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  cursor: pointer;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.header-right {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.more-icon {
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: color var(--transition-fast);

  &:hover {
    color: var(--primary-color);
  }
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.question-content {
  display: flex;
  gap: var(--spacing-xs);
  align-items: flex-start;
}

.question-index {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.question-text {
  flex: 1;
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  line-height: 1.6;
}

.answer-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.answer-row {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.answer-label {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.answer-value {
  flex: 1;
  color: var(--color-text-primary);

  &.incorrect {
    color: var(--danger-color);
  }

  &.correct {
    color: var(--success-color);
  }
}

.note-section {
  padding: var(--spacing-sm);
  background: #f0f7ff;
  border-radius: var(--border-radius-md);
  border-left: 3px solid var(--primary-color);
}

.note-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--primary-color);
}

.note-content {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
  line-height: 1.5;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-light);
}

.footer-stats {
  display: flex;
  gap: var(--spacing-md);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.footer-time {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
