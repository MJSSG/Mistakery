<template>
  <div class="options-list" :class="`type-${type}`">
    <div
      v-for="(option, index) in parsedOptions"
      :key="index"
      class="option-item"
      :class="{
        'option-selected': isSelected(index),
        'option-correct': showResult && isCorrect(index),
        'option-wrong': showResult && isSelected(index) && !isCorrect(index),
        'option-disabled': disabled,
      }"
      @click="handleSelect(index)"
    >
      <div class="option-indicator">
        <span v-if="!showResult" class="option-letter">{{ getOptionLetter(index) }}</span>
        <el-icon v-else-if="isCorrect(index)" class="correct-icon"><Check /></el-icon>
        <el-icon v-else-if="isSelected(index)" class="wrong-icon"><Close /></el-icon>
        <span v-else class="option-letter">{{ getOptionLetter(index) }}</span>
      </div>

      <div class="option-content">
        <div v-if="option.isImage" class="option-image">
          <el-image
            :src="option.content"
            fit="contain"
            :preview-src-list="[option.content]"
            :hide-on-click-modal="true"
          >
            <template #placeholder>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
            <template #error>
              <div class="image-error">
                <el-icon><PictureFilled /></el-icon>
                <span>加载失败</span>
              </div>
            </template>
          </el-image>
        </div>
        <div v-else class="option-text">{{ option.content }}</div>
      </div>
    </div>

    <!-- 多选提示 -->
    <div v-if="type === 'choice-multi' && !showResult" class="multi-select-hint">
      <el-icon><InfoFilled /></el-icon>
      <span>多选题，请选择所有正确答案</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Check, Close, Picture, PictureFilled, InfoFilled } from '@element-plus/icons-vue';

interface Option {
  content: string;
  isImage: boolean;
}

interface Props {
  type: 'choice' | 'choice-multi' | 'judge';
  options: string; // 选项字符串，每行一个
  modelValue?: string | string[];
  correctAnswer?: string;
  showResult?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showResult: false,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[]): void;
  (e: 'select', index: number): void;
}>();

// 解析选项
const parsedOptions = computed(() => {
  const lines = props.options.split('\n').filter((line) => line.trim());

  return lines.map((line) => {
    // 检查是否为图片URL
    const isImage = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(line.trim());

    // 移除选项前缀（A. B. C. 等）
    let content = line.trim();
    const prefixMatch = content.match(/^([A-Z]|[①②③④⑤⑥⑦⑧⑨⑩]|[\d]+[.、])\s*/);
    if (prefixMatch) {
      content = content.substring(prefixMatch[0].length);
    }

    return { content, isImage };
  });
});

// 判断是否选中
const isSelected = (index: number) => {
  const value = props.modelValue;
  if (props.type === 'choice-multi') {
    return Array.isArray(value) && value.includes(index.toString());
  }
  return value === index.toString();
};

// 判断是否正确答案
const isCorrect = (index: number) => {
  if (!props.correctAnswer || !props.showResult) return false;

  const correctAnswers = props.correctAnswer.split('').filter(c => c.match(/[A-D①②③④]/));

  if (props.type === 'choice-multi') {
    return correctAnswers.some((ans, i) => {
      const correctIndex = ans.charCodeAt(0) - 'A'.charCodeAt(0);
      return correctIndex === index;
    });
  }

  const correctIndex = props.correctAnswer.charCodeAt(0) - 'A'.charCodeAt(0);
  return index === correctIndex;
};

// 获取选项字母
const getOptionLetter = (index: number) => {
  return String.fromCharCode(65 + index); // A, B, C, D, ...
};

// 处理选择
const handleSelect = (index: number) => {
  if (props.disabled || props.showResult) return;

  if (props.type === 'choice-multi') {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const indexStr = index.toString();

    if (current.includes(indexStr)) {
      emit('update:modelValue', current.filter((i) => i !== indexStr));
    } else {
      emit('update:modelValue', [...current, indexStr]);
    }
  } else {
    emit('update:modelValue', index.toString());
  }

  emit('select', index);
};
</script>

<style scoped lang="scss">
.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(.option-disabled) {
    border-color: var(--primary-color);
    background: var(--color-primary-light);
  }

  &.option-selected {
    border-color: var(--primary-color);
    background: var(--color-primary-light);
  }

  &.option-correct {
    border-color: var(--success-color);
    background: var(--color-success-light);
  }

  &.option-wrong {
    border-color: var(--danger-color);
    background: var(--color-danger-light);
  }

  &.option-disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
}

.option-indicator {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-light);
  border-radius: var(--border-radius-full);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);

  .correct-icon {
    color: var(--success-color);
    font-size: var(--font-size-xl);
  }

  .wrong-icon {
    color: var(--danger-color);
    font-size: var(--font-size-xl);
  }
}

.option-selected .option-indicator {
  background: var(--primary-color);
  color: var(--color-white);
}

.option-correct .option-indicator {
  background: var(--success-color);
  color: var(--color-white);
}

.option-content {
  flex: 1;
  min-width: 0;
}

.option-text {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
  word-break: break-word;
}

.option-image {
  :deep(.el-image) {
    max-width: 100%;
    max-height: 200px;
  }

  :deep(.el-image__inner) {
    border-radius: var(--border-radius-md);
  }
}

.image-placeholder,
.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  color: var(--color-text-secondary);

  .el-icon {
    font-size: var(--font-size-xxl);
  }
}

.multi-select-hint {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-info-light);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  color: var(--info-color);

  .el-icon {
    font-size: var(--font-size-base);
  }
}

// 判断题特殊样式
.type-judge {
  .option-item {
    flex-direction: column;
    text-align: center;
    padding: var(--spacing-lg);

    .option-indicator {
      width: 48px;
      height: 48px;
      font-size: var(--font-size-xl);
    }
  }
}
</style>
