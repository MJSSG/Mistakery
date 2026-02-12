<template>
  <div class="simple-calculator">
    <div class="calc-display">{{ display || '0' }}</div>
    <div class="calc-grid">
      <button v-for="btn in buttons" :key="btn" class="calc-btn" :class="getBtnClass(btn)" @click="handleClick(btn)">
        {{ btn }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const display = ref('');
const history = ref<string[]>([]);
const historyIndex = ref(-1);

const buttons = [
  'C', '(', ')', '÷',
  '7', '8', '9', '×',
  '4', '5', '6', '-',
  '1', '2', '3', '+',
  '0', '.', '⌫', '=',
];

const getBtnClass = (btn: string) => {
  if (btn === 'C' || btn === '⌫') return 'calc-btn-danger';
  if (btn === '=') return 'calc-btn-primary';
  if (['+', '-', '×', '÷'].includes(btn)) return 'calc-btn-operator';
  return '';
};

const handleClick = (btn: string) => {
  switch (btn) {
    case 'C':
      display.value = '';
      break;
    case '⌫':
      display.value = display.value.slice(0, -1);
      break;
    case '=':
      calculate();
      break;
    default:
      display.value += btn;
  }
};

const calculate = () => {
  try {
    const expression = display.value
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**');

    // 安全计算
    const result = Function(`"use strict"; return (${expression})`)();

    if (isNaN(result) || !isFinite(result)) {
      display.value = '错误';
    } else {
      // 保存到历史记录
      history.value.push(`${display.value}=${result}`);
      historyIndex.value = history.value.length - 1;

      display.value = String(result);
    }
  } catch (error) {
    display.value = '错误';
  }
};

const clear = () => {
  display.value = '';
};

const getResult = () => {
  calculate();
  return display.value;
};

defineExpose({
  clear,
  getResult,
});
</script>

<style scoped lang="scss">
.simple-calculator {
  background: var(--color-bg-dark);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-md);
}

.calc-display {
  background: var(--color-black);
  color: var(--color-white);
  font-size: 28px;
  font-weight: var(--font-weight-semibold);
  font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
  text-align: right;
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  word-break: break-all;
}

.calc-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-sm);
}

.calc-btn {
  aspect-ratio: 1;
  border: none;
  background: var(--color-bg-light);
  color: var(--color-text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-hover);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &.calc-btn-primary {
    background: var(--primary-color);
    color: var(--color-white);

    &:hover {
      background: var(--primary-color-dark);
    }
  }

  &.calc-btn-operator {
    background: var(--color-info-light);
    color: var(--info-color);
  }

  &.calc-btn-danger {
    background: var(--color-danger-light);
    color: var(--danger-color);
  }
}
</style>
