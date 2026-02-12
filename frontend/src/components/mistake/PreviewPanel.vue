<template>
  <div class="preview-panel">
    <div class="preview-header">
      <h3 class="preview-title">
        <el-icon><View /></el-icon>
        解析预览
      </h3>
      <el-button type="primary" :icon="Check" @click="handleConfirm" size="small">
        确认录入
      </el-button>
    </div>

    <div class="preview-content">
      <!-- 题目类型标签 -->
      <div class="preview-type">
        <el-tag :type="getTypeColor(parsedData.type)">
          {{ getTypeLabel(parsedData.type) }}
        </el-tag>
        <el-tag v-if="parsedData.difficulty" :type="getDifficultyColor(parsedData.difficulty)">
          {{ getDifficultyLabel(parsedData.difficulty) }}
        </el-tag>
      </div>

      <!-- 题目内容 -->
      <div class="preview-question">
        <div class="preview-label">题目：</div>
        <div class="preview-text">{{ parsedData.question || '未识别到题目内容' }}</div>
      </div>

      <!-- 选项（如果有） -->
      <div v-if="parsedData.options && parsedData.options.length > 0" class="preview-options">
        <div class="preview-label">选项：</div>
        <div class="options-list">
          <div
            v-for="(option, index) in parsedData.options"
            :key="index"
            class="option-item"
            :class="{ 'is-correct': option.isCorrect }"
          >
            <span class="option-label">{{ option.label }}.</span>
            <span class="option-content">{{ option.content }}</span>
            <el-icon v-if="option.isCorrect" class="option-correct"><Check /></el-icon>
          </div>
        </div>
      </div>

      <!-- 答案 -->
      <div class="preview-answer">
        <div class="preview-label">答案：</div>
        <div class="preview-text answer-text">{{ parsedData.answer || '未识别到答案' }}</div>
      </div>

      <!-- 用户答案 -->
      <div v-if="parsedData.userAnswer" class="preview-user-answer">
        <div class="preview-label">我的答案：</div>
        <div
          class="preview-text"
          :class="{ 'is-correct': parsedData.isCorrect, 'is-wrong': !parsedData.isCorrect }"
        >
          {{ parsedData.userAnswer }}
        </div>
      </div>

      <!-- 解析 -->
      <div class="preview-analysis">
        <div class="preview-label">解析：</div>
        <div class="preview-text">{{ parsedData.analysis || '未提供解析' }}</div>
      </div>

      <!-- 知识点 -->
      <div v-if="parsedData.knowledgePoints && parsedData.knowledgePoints.length > 0" class="preview-points">
        <div class="preview-label">知识点：</div>
        <div class="points-list">
          <el-tag
            v-for="(point, index) in parsedData.knowledgePoints"
            :key="index"
            size="small"
            class="point-tag"
          >
            {{ point }}
          </el-tag>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errors.length > 0" class="preview-errors">
        <div class="preview-label error-label">
          <el-icon><Warning /></el-icon>
          需要补充：
        </div>
        <div class="errors-list">
          <div v-for="(error, index) in errors" :key="index" class="error-item">
            • {{ error }}
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑按钮 -->
    <div class="preview-actions">
      <el-button @click="handleEdit" :icon="Edit">
        编辑
      </el-button>
      <el-button @click="handleClear" :icon="Delete">
        清空
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { View, Check, Edit, Delete, Warning } from '@element-plus/icons-vue';

interface Option {
  label: string;
  content: string;
  isCorrect?: boolean;
}

interface ParsedData {
  type?: string;
  difficulty?: string;
  question?: string;
  options?: Option[];
  answer?: string;
  userAnswer?: string;
  isCorrect?: boolean;
  analysis?: string;
  knowledgePoints?: string[];
}

interface Props {
  parsedData: ParsedData;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  confirm: [];
  edit: [];
  clear: [];
}>();

const errors = computed(() => {
  const errs: string[] = [];
  if (!props.parsedData.question) errs.push('题目内容');
  if (!props.parsedData.answer) errs.push('答案');
  if (!props.parsedData.analysis) errs.push('解析');
  return errs;
});

const getTypeLabel = (type?: string) => {
  const labels: Record<string, string> = {
    choice: '选择题',
    'choice-multi': '多选题',
    fill: '填空题',
    judge: '判断题',
    essay: '解答题',
    other: '其他',
  };
  return type ? labels[type] || '未知' : '未识别';
};

const getTypeColor = (type?: string) => {
  const colors: Record<string, string> = {
    choice: 'primary',
    'choice-multi': 'success',
    fill: 'warning',
    judge: 'info',
    essay: 'danger',
  };
  return type ? colors[type] || 'info' : 'info';
};

const getDifficultyLabel = (difficulty?: string) => {
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return difficulty ? labels[difficulty] : '未知';
};

const getDifficultyColor = (difficulty?: string) => {
  const colors: Record<string, string> = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger',
  };
  return difficulty ? colors[difficulty] : 'info';
};

const handleConfirm = () => {
  emit('confirm');
};

const handleEdit = () => {
  emit('edit');
};

const handleClear = () => {
  emit('clear');
};
</script>

<style scoped lang="scss">
.preview-panel {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.preview-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.preview-content {
  padding: var(--spacing-lg);
}

.preview-type {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.preview-question,
.preview-answer,
.preview-user-answer,
.preview-analysis,
.preview-options,
.preview-points {
  margin-bottom: var(--spacing-md);
}

.preview-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.error-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--danger-color);
}

.preview-text {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: var(--line-height-loose);

  &.answer-text {
    color: var(--success-color);
    font-weight: var(--font-weight-medium);
  }

  &.is-correct {
    color: var(--success-color);
  }

  &.is-wrong {
    color: var(--danger-color);
    text-decoration: line-through;
  }
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);

  &.is-correct {
    border-color: var(--success-color);
    background: rgba(82, 196, 26, 0.1);
  }
}

.option-label {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.option-content {
  flex: 1;
}

.option-correct {
  color: var(--success-color);
}

.points-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.point-tag {
  margin: 0;
}

.preview-errors {
  padding: var(--spacing-md);
  background: rgba(245, 34, 45, 0.1);
  border: 1px solid var(--danger-color);
  border-radius: var(--border-radius-md);
}

.errors-list {
  margin-top: var(--spacing-sm);
}

.error-item {
  font-size: var(--font-size-sm);
  color: var(--danger-color);
  line-height: var(--line-height-normal);
}

.preview-actions {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
}
</style>
