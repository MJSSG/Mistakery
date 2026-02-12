<template>
  <div class="review-feedback">
    <div class="feedback-header">
      <h3 class="title">复习反馈</h3>
      <p class="subtitle">选择你的答题情况，帮助我们优化复习计划</p>
    </div>

    <!-- 结果选择 -->
    <div class="result-section">
      <div class="section-title">答题结果</div>
      <div class="result-buttons">
        <button
          v-for="result in results"
          :key="result.value"
          class="result-btn"
          :class="{ 'is-selected': selectedResult === result.value }"
          @click="selectResult(result.value)"
        >
          <div class="btn-icon" :style="{ background: result.color }">
            <component :is="result.icon" />
          </div>
          <span class="btn-label">{{ result.label }}</span>
        </button>
      </div>
    </div>

    <!-- 难度选择（仅当答对时显示） -->
    <div v-if="showDifficulty" class="difficulty-section">
      <div class="section-title">题目难度</div>
      <div class="difficulty-buttons">
        <button
          v-for="diff in difficulties"
          :key="diff.value"
          class="difficulty-btn"
          :class="{ 'is-selected': selectedDifficulty === diff.value }"
          @click="selectDifficulty(diff.value)"
        >
          <el-icon><component :is="diff.icon" /></el-icon>
          <span>{{ diff.label }}</span>
        </button>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <el-button
        size="small"
        :icon="Clock"
        :disabled="!canSubmit"
        @click="setTimeSpent"
      >
        记录用时
      </el-button>

      <el-button
        size="small"
        :icon="Edit"
        :disabled="!canSubmit"
        @click="addNote"
      >
        添加笔记
      </el-button>
    </div>

    <!-- 箱子变化预览 -->
    <div v-if="showPreview" class="box-preview">
      <div class="preview-title">箱子变化</div>
      <div class="preview-content">
        <div class="box-change">
          <div class="box from" :class="`box-${fromBox}`">
            第 {{ fromBox }} 箱
          </div>
          <el-icon><Right /></el-icon>
          <div class="box to" :class="`box-${toBox}`">
            第 {{ toBox }} 箱
          </div>
        </div>

        <div class="next-review">
          <el-icon><Calendar /></el-icon>
          <span>下次复习: {{ nextReviewDate }}</span>
        </div>
      </div>
    </div>

    <!-- 提交按钮 -->
    <div class="feedback-actions">
      <el-button size="large" @click="$emit('cancel')">取消</el-button>
      <el-button
        type="primary"
        size="large"
        :disabled="!canSubmit"
        :loading="submitting"
        @click="handleSubmit"
      >
        确认提交
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Check,
  Close,
  WarningFilled,
  QuestionFilled,
  CircleCheckFilled,
  CircleCloseFilled,
  Clock,
  Edit,
  Right,
  Calendar,
} from '@element-plus/icons-vue';
import type { ReviewResult, ReviewDifficulty } from '@/types/review';

interface Props {
  currentBox: number;
  submitting?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  submit: [data: {
    result: ReviewResult;
    difficulty?: ReviewDifficulty;
    timeSpent?: number;
    note?: string;
  }];
  cancel: [];
}>();

// 选择状态
const selectedResult = ref<ReviewResult | null>(null);
const selectedDifficulty = ref<ReviewDifficulty | null>(null);

// 结果选项
const results = [
  {
    value: 'correct' as ReviewResult,
    label: '正确',
    icon: Check,
    color: '#67c23a',
  },
  {
    value: 'partially' as ReviewResult,
    label: '部分正确',
    icon: WarningFilled,
    color: '#e6a23c',
  },
  {
    value: 'incorrect' as ReviewResult,
    label: '错误',
    icon: Close,
    color: '#f56c6c',
  },
  {
    value: 'forgotten' as ReviewResult,
    label: '忘记了',
    icon: QuestionFilled,
    color: '#909399',
  },
];

// 难度选项
const difficulties = [
  { value: 'easy' as ReviewDifficulty, label: '简单', icon: CircleCheckFilled },
  { value: 'medium' as ReviewDifficulty, label: '中等', icon: '' },
  { value: 'hard' as ReviewDifficulty, label: '困难', icon: CircleCloseFilled },
  { value: 'again' as ReviewDifficulty, label: '需重学', icon: '' },
];

/**
 * 是否可以提交
 */
const canSubmit = computed(() => {
  return selectedResult.value !== null;
});

/**
 * 是否显示难度选择
 */
const showDifficulty = computed(() => {
  return selectedResult.value === 'correct' || selectedResult.value === 'partially';
});

/**
 * 是否显示预览
 */
const showPreview = computed(() => {
  return selectedResult.value !== null;
});

/**
 * 箱子变化预览
 */
const fromBox = computed(() => props.currentBox);

const toBox = computed(() => {
  if (!selectedResult.value) return props.currentBox;

  // 简化的 Leitner 算法预览
  switch (selectedResult.value) {
    case 'correct':
      return Math.min(props.currentBox + 1, 5);
    case 'partially':
      return Math.max(props.currentBox - 1, 1);
    case 'incorrect':
    case 'forgotten':
      return 1;
    default:
      return props.currentBox;
  }
});

const nextReviewDate = computed(() => {
  const intervals = [1, 3, 7, 14, 30];
  const days = intervals[toBox.value - 1] || 1;

  const date = new Date();
  date.setDate(date.getDate() + days);

  if (days === 1) {
    return '明天';
  } else if (days <= 7) {
    return `${days}天后`;
  } else if (days <= 30) {
    return `${Math.floor(days / 7)}周后`;
  }
  return `${Math.floor(days / 30)}月后`;
});

const submitting = computed(() => props.submitting);

/**
 * 选择结果
 */
function selectResult(result: ReviewResult) {
  selectedResult.value = result;
  if (!showDifficulty.value) {
    selectedDifficulty.value = null;
  }
}

/**
 * 选择难度
 */
function selectDifficulty(difficulty: ReviewDifficulty) {
  selectedDifficulty.value = difficulty;
}

/**
 * 记录用时（简化版）
 */
function setTimeSpent() {
  // TODO: 实现用时记录
  console.log('Set time spent');
}

/**
 * 添加笔记
 */
function addNote() {
  // TODO: 实现笔记添加
  console.log('Add note');
}

/**
 * 提交反馈
 */
function handleSubmit() {
  if (!canSubmit.value) return;

  emit('submit', {
    result: selectedResult.value!,
    difficulty: selectedDifficulty.value || undefined,
  });

  // 重置选择
  selectedResult.value = null;
  selectedDifficulty.value = null;
}
</script>

<style scoped lang="scss">
.review-feedback {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
}

.feedback-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs);
}

.subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.result-section,
.difficulty-section {
  margin-bottom: var(--spacing-lg);
}

.section-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.result-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.result-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--color-white);
    border-color: var(--primary-color);
  }

  &.is-selected {
    background: var(--primary-color-light);
    border-color: var(--primary-color);
  }
}

.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-white);
  border-radius: var(--border-radius-md);
  font-size: 20px;
}

.btn-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.difficulty-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.difficulty-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-bg-light);
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--color-white);
    border-color: var(--primary-color);
  }

  &.is-selected {
    background: var(--primary-color-light);
    border-color: var(--primary-color);
  }

  span {
    font-size: var(--font-size-xs);
  }
}

.quick-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.box-preview {
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.preview-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.preview-content {
  .box-change {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-md);
  }

  .box {
    padding: var(--spacing-xs) var(--spacing-md);
    border-radius: var(--border-radius-md);
    font-weight: var(--font-weight-medium);

    &.box-1 { background: #f56c6c; color: white; }
    &.box-2 { background: #e6a23c; color: white; }
    &.box-3 { background: #409eff; color: white; }
    &.box-4 { background: #67c23a; color: white; }
    &.box-5 { background: #909399; color: white; }
  }

  .next-review {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}

.feedback-actions {
  display: flex;
  gap: var(--spacing-md);
}

.feedback-actions .el-button {
  flex: 1;
}
</style>
