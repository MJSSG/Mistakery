<template>
  <div class="question-card" :class="{ 'show-result': showResult }">
    <!-- 题目头部 -->
    <div class="question-header">
      <div class="question-index">第 {{ index + 1 }} 题</div>
      <QuestionTypeTag :type="question.type" />
      <div v-if="question.difficultyLevel" class="question-difficulty" :class="`difficulty-${question.difficultyLevel}`">
        {{ getDifficultyLabel(question.difficultyLevel) }}
      </div>
      <el-button
        v-if="showFavorite"
        :icon="isFavorite ? StarFilled : Star"
        circle
        size="small"
        :class="{ 'is-favorite': isFavorite }"
        @click="toggleFavorite"
      />
    </div>

    <!-- 题目内容 -->
    <div class="question-content">
      <div class="question-text">{{ question.question || question.content }}</div>

      <!-- 选项列表 -->
      <OptionsList
        v-if="hasOptions"
        :type="question.type"
        :options="question.options || ''"
        :model-value="userAnswer"
        :correct-answer="correctAnswer"
        :show-result="showResult"
        :disabled="disabled || showResult"
        @update:model-value="handleAnswer"
      />

      <!-- 填空题输入 -->
      <div v-if="question.type === 'fill' && !showResult" class="fill-input-container">
        <el-input
          :model-value="userAnswer"
          placeholder="请输入答案"
          size="large"
          clearable
          :disabled="disabled"
          @update:model-value="handleAnswer"
        />
      </div>

      <!-- 解答题输入 -->
      <div v-if="question.type === 'essay' && !showResult" class="essay-input-container">
        <el-input
          :model-value="userAnswer"
          type="textarea"
          :rows="6"
          placeholder="请输入你的答案..."
          :disabled="disabled"
          @update:model-value="handleAnswer"
        />
      </div>

      <!-- 答案展示 -->
      <div v-if="showResult" class="answer-display">
        <div class="answer-label">正确答案：</div>
        <div class="answer-value">{{ correctAnswerDisplay }}</div>
      </div>

      <!-- 解析 -->
      <div v-if="showResult && question.analysis" class="analysis-section">
        <div class="analysis-header">
          <el-icon><Document /></el-icon>
          <span>解析</span>
        </div>
        <div class="analysis-content">{{ question.analysis }}</div>
      </div>
    </div>

    <!-- 题目底部 -->
    <div v-if="showActions" class="question-footer">
      <el-button
        v-if="canMark"
        :type="isMarked ? 'warning' : 'default'"
        :icon="isMarked ? 'star-filled' : 'star'"
        @click="toggleMark"
      >
        {{ isMarked ? '已标记' : '标记' }}
      </el-button>

      <el-button
        v-if="showNoteBtn"
        :icon="EditPen"
        @click="showNoteDialog"
      >
        笔记
      </el-button>

      <div v-if="showTimeSpent" class="time-spent">
        <el-icon><Clock /></el-icon>
        <span>用时 {{ formatTime(timeSpent) }}</span>
      </div>
    </div>

    <!-- 结果状态 -->
    <div v-if="showResult" class="result-status" :class="`result-${resultStatus}`">
      <el-icon class="result-icon">
        <component :is="resultIcon" />
      </el-icon>
      <span class="result-text">{{ resultText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Star, StarFilled, EditPen, Clock, Document, Check, Close, InfoFilled } from '@element-plus/icons-vue';
import QuestionTypeTag from './QuestionTypeTag.vue';
import OptionsList from './OptionsList.vue';
import type { QuestionInfo } from '@/api/practice';

interface Props {
  index: number;
  question: QuestionInfo;
  userAnswer?: string;
  correctAnswer?: string;
  showResult?: boolean;
  disabled?: boolean;
  showFavorite?: boolean;
  isFavorite?: boolean;
  canMark?: boolean;
  isMarked?: boolean;
  showActions?: boolean;
  showNoteBtn?: boolean;
  showTimeSpent?: boolean;
  timeSpent?: number;
}

const props = withDefaults(defineProps<Props>(), {
  showResult: false,
  disabled: false,
  showFavorite: false,
  isFavorite: false,
  canMark: false,
  isMarked: false,
  showActions: true,
  showNoteBtn: true,
  showTimeSpent: false,
  timeSpent: 0,
});

const emit = defineEmits<{
  (e: 'update:userAnswer', value: string): void;
  (e: 'toggleFavorite'): void;
  (e: 'toggleMark'): void;
  (e: 'showNote'): void;
}>();

// 是否有选项
const hasOptions = computed(() => {
  return ['choice', 'choice-multi', 'judge'].includes(props.question.type);
});

// 正确答案展示
const correctAnswerDisplay = computed(() => {
  if (!props.correctAnswer) return '-';

  if (props.question.type === 'judge') {
    const judgeMap: Record<string, string> = {
      'true': '正确',
      'false': '错误',
      'T': '正确',
      'F': '错误',
      '√': '正确',
      '×': '错误',
    };
    return judgeMap[props.correctAnswer] || props.correctAnswer;
  }

  if (props.question.type === 'choice-multi') {
    return props.correctAnswer.split('').join('、');
  }

  return props.correctAnswer;
});

// 结果状态
const resultStatus = computed(() => {
  if (!props.showResult || !props.userAnswer) return 'unanswered';
  if (props.isCorrect) return 'correct';
  return 'wrong';
});

const resultIcon = computed(() => {
  switch (resultStatus.value) {
    case 'correct': return Check;
    case 'wrong': return Close;
    default: return InfoFilled;
  }
});

const resultText = computed(() => {
  switch (resultStatus.value) {
    case 'correct': return '回答正确';
    case 'wrong': return '回答错误';
    default: return '未作答';
  }
});

// 是否正确
const isCorrect = computed(() => {
  if (!props.showResult || !props.userAnswer || !props.correctAnswer) return false;

  const user = props.userAnswer.toLowerCase().trim();
  const correct = props.correctAnswer.toLowerCase().trim();

  if (props.question.type === 'judge') {
    const judgeMap: Record<string, string> = {
      '正确': 'true',
      '错误': 'false',
      '对': 'true',
      '错': 'false',
      '√': 'true',
      '×': 'false',
    };
    const normalizedUser = judgeMap[user] || user;
    const normalizedCorrect = judgeMap[correct] || correct;
    return normalizedUser === normalizedCorrect;
  }

  return user === correct;
});

// 获取难度标签
const getDifficultyLabel = (difficulty: string) => {
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return labels[difficulty] || difficulty;
};

// 格式化时间
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes > 0) {
    return `${minutes}分${secs}秒`;
  }
  return `${secs}秒`;
};

const handleAnswer = (value: string) => {
  emit('update:userAnswer', value);
};

const toggleFavorite = () => {
  emit('toggleFavorite');
};

const toggleMark = () => {
  emit('toggleMark');
};

const showNoteDialog = () => {
  emit('showNote');
};
</script>

<style scoped lang="scss">
.question-card {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);

  &.show-result {
    border: 2px solid transparent;

    &.result-correct {
      border-color: var(--success-color);
    }

    &.result-wrong {
      border-color: var(--danger-color);
    }
  }
}

.question-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.question-index {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.question-difficulty {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);

  &.difficulty-easy {
    background: var(--color-success-light);
    color: var(--success-color);
  }

  &.difficulty-medium {
    background: var(--color-warning-light);
    color: var(--warning-color);
  }

  &.difficulty-hard {
    background: var(--color-danger-light);
    color: var(--danger-color);
  }
}

.is-favorite {
  color: var(--warning-color) !important;
}

.question-content {
  margin-bottom: var(--spacing-lg);
}

.question-text {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-lg);
}

.fill-input-container,
.essay-input-container {
  margin-top: var(--spacing-md);
}

.answer-display {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  margin-top: var(--spacing-md);

  .answer-label {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .answer-value {
    color: var(--success-color);
    font-weight: var(--font-weight-semibold);
  }
}

.analysis-section {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-info-light);
  border-radius: var(--border-radius-md);
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--info-color);
}

.analysis-content {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
}

.question-footer {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.time-spent {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-left: auto;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.result-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  margin-top: var(--spacing-md);
  font-weight: var(--font-weight-semibold);

  &.result-correct {
    background: var(--color-success-light);
    color: var(--success-color);
  }

  &.result-wrong {
    background: var(--color-danger-light);
    color: var(--danger-color);
  }

  &.result-unanswered {
    background: var(--color-bg-dark);
    color: var(--color-text-secondary);
  }

  .result-icon {
    font-size: var(--font-size-xl);
  }
}

@media (max-width: $breakpoint-sm) {
  .question-card {
    padding: var(--spacing-md);
  }

  .question-text {
    font-size: var(--font-size-base);
  }

  .question-footer {
    flex-direction: column;
    align-items: stretch;

    .time-spent {
      margin-left: 0;
      text-align: center;
    }
  }
}
</style>
