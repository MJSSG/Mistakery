<template>
  <div class="result-answer-sheet">
    <div class="sheet-header">
      <h3 class="sheet-title">答题卡</h3>
      <div class="sheet-actions">
        <el-button type="primary" link @click="scrollToTop">
          回到顶部
        </el-button>
      </div>
    </div>

    <div class="sheet-summary">
      <div class="summary-item">
        <span class="summary-label">已答</span>
        <span class="summary-value">{{ answeredCount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">未答</span>
        <span class="summary-value unanswered">{{ unansweredCount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">正确</span>
        <span class="summary-value correct">{{ correctCount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">错误</span>
        <span class="summary-value incorrect">{{ incorrectCount }}</span>
      </div>
    </div>

    <div class="sheet-legend">
      <div class="legend-item">
        <span class="legend-dot correct"></span>
        <span class="legend-label">正确</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot incorrect"></span>
        <span class="legend-label">错误</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot unanswered"></span>
        <span class="legend-label">未答</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot marked"></span>
        <span class="legend-label">已标记</span>
      </div>
    </div>

    <div class="sheet-content">
      <div
        v-for="(group, subjectIndex) in groupedQuestions"
        :key="subjectIndex"
        class="subject-group"
      >
        <div class="group-header">
          <span class="group-title">{{ group.name }}</span>
          <span class="group-info">共 {{ group.questions.length }} 题</span>
        </div>
        <div class="question-grid">
          <button
            v-for="(question, qIndex) in group.questions"
            :key="question.id"
            class="question-btn"
            :class="getQuestionClass(question)"
            :title="getQuestionTooltip(question)"
            @click="$emit('select-question', question.id)"
          >
            {{ question.index }}
            <span v-if="question.marked" class="mark-icon">
              <el-icon><StarFilled /></el-icon>
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { StarFilled } from '@element-plus/icons-vue';

export interface QuestionResult {
  id: string;
  index: number;
  subject: string;
  isCorrect: boolean | null;
  isAnswered: boolean;
  marked: boolean;
}

interface Props {
  questions: QuestionResult[];
  showSubjectGroup?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showSubjectGroup: true,
});

defineEmits<{
  'select-question': [questionId: string];
}>();

const answeredCount = computed(() => {
  return props.questions.filter(q => q.isAnswered).length;
});

const unansweredCount = computed(() => {
  return props.questions.filter(q => !q.isAnswered).length;
});

const correctCount = computed(() => {
  return props.questions.filter(q => q.isAnswered && q.isCorrect).length;
});

const incorrectCount = computed(() => {
  return props.questions.filter(q => q.isAnswered && q.isCorrect === false).length;
});

const groupedQuestions = computed(() => {
  if (!props.showSubjectGroup) {
    return [{ name: '全部题目', questions: props.questions }];
  }

  const groups: Record<string, QuestionResult[]> = {};
  props.questions.forEach(q => {
    if (!groups[q.subject]) {
      groups[q.subject] = [];
    }
    groups[q.subject].push(q);
  });

  return Object.entries(groups).map(([name, questions]) => ({
    name,
    questions: questions.sort((a, b) => a.index - b.index),
  }));
});

const getQuestionClass = (question: QuestionResult) => {
  const classes: string[] = [];
  if (question.marked) classes.push('marked');
  if (!question.isAnswered) classes.push('unanswered');
  else if (question.isCorrect) classes.push('correct');
  else classes.push('incorrect');
  return classes;
};

const getQuestionTooltip = (question: QuestionResult) => {
  const status = question.marked ? '已标记' : question.isAnswered
    ? (question.isCorrect ? '正确' : '错误')
    : '未作答';
  return `${question.index}. ${question.subject} - ${status}`;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>

<style scoped lang="scss">
.result-answer-sheet {
  position: sticky;
  top: 20px;
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-light);
}

.sheet-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.sheet-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.summary-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.summary-value {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);

  &.correct {
    color: var(--success-color);
  }

  &.incorrect {
    color: var(--danger-color);
  }

  &.unanswered {
    color: var(--warning-color);
  }
}

.sheet-legend {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;

  &.correct {
    background: var(--success-color);
  }

  &.incorrect {
    background: var(--danger-color);
  }

  &.unanswered {
    background: var(--warning-color);
  }

  &.marked {
    background: var(--warning-color);
    border: 2px solid var(--warning-color);
    background-image: linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.3) 50%);
    background-size: 4px 4px;
  }
}

.legend-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.sheet-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.subject-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid var(--color-border-light);
}

.group-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.group-info {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: var(--spacing-xs);
}

.question-btn {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    transform: scale(1.1);
    box-shadow: var(--shadow-sm);
  }

  &.correct {
    background: var(--success-color);
    color: var(--color-white);
    border-color: var(--success-color);
  }

  &.incorrect {
    background: var(--danger-color);
    color: var(--color-white);
    border-color: var(--danger-color);
  }

  &.unanswered {
    background: var(--warning-color);
    color: var(--color-white);
    border-color: var(--warning-color);
  }

  &.marked {
    border: 2px solid var(--warning-color);
  }
}

.mark-icon {
  position: absolute;
  top: -2px;
  right: -2px;
  font-size: 10px;
  color: var(--warning-color);
}
</style>
