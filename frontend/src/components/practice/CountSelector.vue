<template>
  <div class="count-selector">
    <div class="count-display">
      <span class="count-value">{{ modelValue }}</span>
      <span class="count-unit">题</span>
    </div>

    <div class="count-controls">
      <button
        class="control-btn preset-btn"
        :class="{ active: modelValue === preset }"
        v-for="preset in presets"
        :key="preset"
        @click="selectPreset(preset)"
      >
        {{ preset }}
      </button>

      <button
        class="control-btn"
        :disabled="modelValue <= min"
        @click="decrease"
      >
        <el-icon><Minus /></el-icon>
      </button>

      <button
        class="control-btn"
        :disabled="modelValue >= max || (available !== null && modelValue >= available)"
        @click="increase"
      >
        <el-icon><Plus /></el-icon>
      </button>
    </div>

    <el-slider
      :model-value="modelValue"
      :min="min"
      :max="available !== null ? Math.min(max, available) : max"
      :step="step"
      show-stops
      @change="handleChange"
    />

    <div v-if="available !== null" class="count-info">
      <el-icon><InfoFilled /></el-icon>
      可选 {{ available }} 题
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Minus, Plus, InfoFilled } from '@element-plus/icons-vue';

interface Props {
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  available?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  min: 1,
  max: 100,
  step: 5,
  available: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const presets = computed(() => {
  const basePresets = [10, 20, 30];
  if (props.available !== null && props.available < 30) {
    return basePresets.filter(p => p <= props.available!);
  }
  return basePresets;
});

const selectPreset = (preset: number) => {
  const value = Math.min(preset, props.max);
  const finalValue = props.available !== null ? Math.min(value, props.available) : value;
  emit('update:modelValue', finalValue);
};

const decrease = () => {
  const newValue = Math.max(props.modelValue - props.step, props.min);
  emit('update:modelValue', newValue);
};

const increase = () => {
  const upperLimit = props.available !== null ? Math.min(props.max, props.available) : props.max;
  const newValue = Math.min(props.modelValue + props.step, upperLimit);
  emit('update:modelValue', newValue);
};

const handleChange = (value: number) => {
  emit('update:modelValue', value);
};
</script>

<style scoped lang="scss">
.count-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-lg);
}

.count-display {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  justify-content: center;
}

.count-value {
  font-size: 48px;
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  line-height: 1;
}

.count-unit {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
}

.count-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.control-btn {
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  background: var(--color-white);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.preset-btn {
    width: auto;
    min-width: 50px;
    padding: 0 var(--spacing-md);
    font-weight: var(--font-weight-medium);

    &.active {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--color-white);
    }
  }
}

.count-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);

  .el-icon {
    color: var(--info-color);
  }
}

:deep(.el-slider) {
  .el-slider__runway {
    background: var(--color-border);
  }

  .el-slider__bar {
    background: var(--primary-color);
  }

  .el-slider__button {
    border-color: var(--primary-color);
  }
}
</style>
