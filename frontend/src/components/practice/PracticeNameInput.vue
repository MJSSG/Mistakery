<template>
  <div class="practice-name-input">
    <el-input
      :model-value="modelValue"
      placeholder="为本次练习命名，方便后续查看"
      :maxlength="maxLength"
      :show-word-limit="true"
      clearable
      @input="handleInput"
      @blur="handleBlur"
    >
      <template #prefix>
        <el-icon><EditPen /></el-icon>
      </template>
    </el-input>

    <div v-if="showSuggestions && suggestions.length > 0" class="name-suggestions">
      <div class="suggestions-label">建议名称：</div>
      <div class="suggestions-list">
        <span
          v-for="(suggestion, index) in suggestions"
          :key="index"
          class="suggestion-item"
          @click="selectSuggestion(suggestion)"
        >
          {{ suggestion }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { EditPen } from '@element-plus/icons-vue';

interface Props {
  modelValue: string;
  maxLength?: number;
  subjectName?: string;
  questionCount?: number;
  showSuggestions?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxLength: 50,
  showSuggestions: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const suggestions = computed(() => {
  if (!props.subjectName || !props.questionCount) return [];

  const date = new Date();
  const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
  const timeStr = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

  return [
    `${dateStr} ${props.subjectName}练习`,
    `${dateStr} ${timeStr} ${props.questionCount}题练习`,
    `${props.subjectName} ${props.questionCount}题强化训练`,
    `${dateStr} 错题复习`,
  ];
});

const handleInput = (value: string) => {
  emit('update:modelValue', value);
};

const handleBlur = () => {
  // 如果为空，使用第一个建议
  if (!props.modelValue && suggestions.value.length > 0) {
    emit('update:modelValue', suggestions.value[0]);
  }
};

const selectSuggestion = (suggestion: string) => {
  emit('update:modelValue', suggestion);
};
</script>

<style scoped lang="scss">
.practice-name-input {
  width: 100%;
}

.name-suggestions {
  margin-top: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
}

.suggestions-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.suggestion-item {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--primary-color);
  background: var(--color-white);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--primary-color);
    color: var(--color-white);
  }
}

:deep(.el-input__wrapper) {
  .el-input__inner {
    font-size: var(--font-size-base);
  }
}
</style>
