<template>
  <div class="leitner-box">
    <div class="box-container">
      <div
        v-for="box in boxes"
        :key="box.box"
        class="box-item"
        :class="{
          'is-active': activeBox === box.box,
          'has-due': getDueCount(box.box) > 0,
        }"
        @click="$emit('select', box.box)"
      >
        <div class="box-header">
          <span class="box-number">{{ box.box }}</span>
          <span class="box-label">{{ box.label }}</span>
        </div>

        <div class="box-info">
          <div class="box-interval">
            <el-icon><Clock /></el-icon>
            <span>{{ box.intervalDays }}天</span>
          </div>

          <div class="box-count">
            <span class="count">{{ getBoxCount(box.box) }}</span>
            <span class="label">题</span>
          </div>
        </div>

        <div v-if="getDueCount(box.box) > 0" class="box-due">
          待复习: {{ getDueCount(box.box) }}
        </div>
      </div>
    </div>

    <div class="box-legend">
      <div class="legend-item">
        <div class="legend-dot due"></div>
        <span>有待复习</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot active"></div>
        <span>当前选中</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Clock } from '@element-plus/icons-vue';
import type { LeitnerBox } from '@/types/review';

interface Props {
  boxes: LeitnerBox[];
  boxDistribution?: Array<{
    box: number;
    count: number;
    dueToday: number;
    dueThisWeek: number;
  }>;
  activeBox?: number;
}

const props = withDefaults(defineProps<Props>(), {
  boxDistribution: () => [],
  activeBox: undefined,
});

defineEmits<{
  select: [box: number];
}>();

/**
 * 获取箱子中的题目数量
 */
function getBoxCount(box: number): number {
  const dist = props.boxDistribution.find((d) => d.box === box);
  return dist?.count || 0;
}

/**
 * 获取待复习数量
 */
function getDueCount(box: number): number {
  const dist = props.boxDistribution.find((d) => d.box === box);
  return dist?.dueToday || 0;
}
</script>

<style scoped lang="scss">
.leitner-box {
  .box-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: var(--spacing-md);
  }

  .box-item {
    background: var(--color-white);
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-md);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: var(--primary-color);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &.is-active {
      border-color: var(--primary-color);
      background: var(--primary-color-light);
    }

    &.has-due {
      border-color: var(--warning-color);
    }
  }

  .box-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
  }

  .box-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--primary-color);
    color: var(--color-white);
    border-radius: 50%;
    font-weight: var(--font-weight-bold);
    font-size: var(--font-size-sm);
  }

  .box-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  .box-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xs);
  }

  .box-interval {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
  }

  .box-count {
    display: flex;
    align-items: baseline;
    gap: 2px;

    .count {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--primary-color);
    }

    .label {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
    }
  }

  .box-due {
    margin-top: var(--spacing-sm);
    padding: var(--spacing-xs);
    background: var(--warning-color-light);
    color: var(--warning-color);
    border-radius: var(--border-radius-sm);
    font-size: var(--font-size-xs);
    text-align: center;
  }

  .box-legend {
    display: flex;
    gap: var(--spacing-lg);
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--color-white);
    border-radius: var(--border-radius-md);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;

    &.due {
      background: var(--warning-color);
    }

    &.active {
      background: var(--primary-color);
    }
  }
}
</style>
