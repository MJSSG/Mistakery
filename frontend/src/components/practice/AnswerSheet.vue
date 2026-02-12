<template>
  <el-dialog
    v-model="visible"
    title="答题卡"
    :width="600"
    :close-on-click-modal="false"
    class="answer-sheet-dialog"
    @close="handleClose"
  >
    <div class="answer-sheet-content">
      <!-- 统计信息 -->
      <div class="answer-stats">
        <div class="stat-item stat-answered">
          <span class="stat-value">{{ answeredCount }}</span>
          <span class="stat-label">已答</span>
        </div>
        <div class="stat-item stat-unanswered">
          <span class="stat-value">{{ unansweredCount }}</span>
          <span class="stat-label">未答</span>
        </div>
        <div class="stat-item stat-marked">
          <span class="stat-value">{{ markedCount }}</span>
          <span class="stat-label">标记</span>
        </div>
      </div>

      <!-- 答题网格 -->
      <div class="answer-grid">
        <div
          v-for="(question, index) in questions"
          :key="question.id"
          class="grid-item"
          :class="{
            'item-current': index === currentIndex,
            'item-answered': isAnswered(question.id),
            'item-marked': isMarked(question.id),
            'item-correct': showResult && isCorrect(question.id),
            'item-wrong': showResult && isAnswered(question.id) && !isCorrect(question.id),
          }"
          @click="handleGoToQuestion(index)"
        >
          <span class="item-number">{{ index + 1 }}</span>
          <span v-if="isMarked(question.id)" class="item-mark">★</span>
        </div>
      </div>

      <!-- 图例 -->
      <div class="answer-legend">
        <div class="legend-item">
          <span class="legend-dot legend-current"></span>
          <span class="legend-text">当前</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot legend-answered"></span>
          <span class="legend-text">已答</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot legend-unanswered"></span>
          <span class="legend-text">未答</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot legend-marked"></span>
          <span class="legend-text">标记</span>
        </div>
        <div v-if="showResult" class="legend-item">
          <span class="legend-dot legend-correct"></span>
          <span class="legend-text">正确</span>
        </div>
        <div v-if="showResult" class="legend-item">
          <span class="legend-dot legend-wrong"></span>
          <span class="legend-text">错误</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleSubmit">
          交卷
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { QuestionInfo } from '@/api/practice';

interface Props {
  questions: QuestionInfo[];
  currentIndex: number;
  answers: Map<string, string>;
  marked: Set<string>;
  results?: Map<string, boolean>; // 答题结果
  showResult?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showResult: false,
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'goToQuestion', index: number): void;
  (e: 'submit'): void;
}>();

const visible = defineModel<boolean>('visible', { default: false });

const answeredCount = computed(() => props.answers.size);

const unansweredCount = computed(() => {
  return props.questions.length - answeredCount.value;
});

const markedCount = computed(() => props.marked.size);

const isAnswered = (questionId: string) => {
  return props.answers.has(questionId);
};

const isMarked = (questionId: string) => {
  return props.marked.has(questionId);
};

const isCorrect = (questionId: string) => {
  return props.results?.get(questionId) === true;
};

const handleGoToQuestion = (index: number) => {
  emit('goToQuestion', index);
};

const handleClose = () => {
  visible.value = false;
};

const handleSubmit = () => {
  emit('submit');
  handleClose();
};

// 暴露方法
defineExpose({
  open: () => {
    visible.value = true;
  },
  close: () => {
    visible.value = false;
  },
});
</script>

<style scoped lang="scss">
.answer-sheet-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
}

.answer-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-lg);
  background: var(--color-bg-light);

  .stat-value {
    font-size: var(--font-size-xxl);
    font-weight: var(--font-weight-bold);
  }

  .stat-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  &.stat-answered .stat-value {
    color: var(--success-color);
  }

  &.stat-unanswered .stat-value {
    color: var(--warning-color);
  }

  &.stat-marked .stat-value {
    color: var(--danger-color);
  }
}

.answer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: var(--spacing-sm);
}

.grid-item {
  position: relative;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  user-select: none;

  &:hover:not(.item-current) {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
  }

  &.item-current {
    border-color: var(--primary-color);
    background: var(--primary-color);
    color: var(--color-white);
    transform: scale(1.1);
    box-shadow: var(--shadow-md);
    z-index: 1;
  }

  &.item-answered {
    border-color: var(--success-color);
    background: var(--color-success-light);
    color: var(--success-color);
  }

  &.item-marked {
    border-color: var(--warning-color);
    background: var(--color-warning-light);
    color: var(--warning-color);
  }

  &.item-correct {
    border-color: var(--success-color);
    background: var(--success-color);
    color: var(--color-white);
  }

  &.item-wrong {
    border-color: var(--danger-color);
    background: var(--danger-color);
    color: var(--color-white);
  }

  .item-number {
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-base);
  }

  .item-mark {
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 10px;
    color: var(--warning-color);
  }
}

.answer-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  justify-content: center;
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: var(--border-radius-sm);
  border: 2px solid;

  &.legend-current {
    background: var(--primary-color);
    border-color: var(--primary-color);
  }

  &.legend-answered {
    background: var(--color-success-light);
    border-color: var(--success-color);
  }

  &.legend-unanswered {
    background: var(--color-white);
    border-color: var(--color-border);
  }

  &.legend-marked {
    background: var(--color-warning-light);
    border-color: var(--warning-color);
  }

  &.legend-correct {
    background: var(--success-color);
    border-color: var(--success-color);
  }

  &.legend-wrong {
    background: var(--danger-color);
    border-color: var(--danger-color);
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
}

:deep(.el-dialog__header) {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}

:deep(.el-dialog__body) {
  padding: var(--spacing-xl);
}

:deep(.el-dialog__footer) {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-top: 1px solid var(--color-border);
}

@media (max-width: $breakpoint-sm) {
  .answer-sheet-content {
    padding: var(--spacing-sm);
  }

  .answer-grid {
    grid-template-columns: repeat(8, 1fr);
    gap: var(--spacing-xs);
  }

  .grid-item {
    font-size: var(--font-size-sm);
  }

  .answer-legend {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
