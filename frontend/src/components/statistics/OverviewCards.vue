<template>
  <div class="overview-cards" v-loading="loading">
    <div class="stat-card">
      <div class="stat-icon" style="background: #ecf5ff; color: #409eff">
        <el-icon><Document /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ data.totalQuestions || 0 }}</div>
        <div class="stat-label">总题数</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon" style="background: #f0f9ff; color: #67c23a">
        <el-icon><CircleCheckFilled /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ data.correctCount || 0 }}</div>
        <div class="stat-label">答对题数</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon" style="background: #fef0f0; color: #f56c6c">
        <el-icon><CircleCloseFilled /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ data.wrongCount || 0 }}</div>
        <div class="stat-label">答错题数</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon" style="background: #f4f4f5; color: #909399">
        <el-icon><TrendCharts /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ data.accuracy || 0 }}%</div>
        <div class="stat-label">正确率</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon" style="background: #fdf6ec; color: #e6a23c">
        <el-icon><Clock /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ formatTime(data.totalTime || 0) }}</div>
        <div class="stat-label">总用时</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon" style="background: #f0f9ff; color: #409eff">
        <el-icon><Calendar /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ data.studyDays || 0 }}</div>
        <div class="stat-label">学习天数</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon" style="background: #f4f4f5; color: #606266">
        <el-icon><Timer /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ formatTime(data.avgDailyTime || 0) }}</div>
        <div class="stat-label">日均学习</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon" style="background: #ecf5ff; color: #a0cfff">
        <el-icon><Star /></el-icon>
      </div>
      <div class="stat-content">
        <div class="stat-value">{{ calculateEfficiency() }}</div>
        <div class="stat-label">学习效率</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Document,
  CircleCheckFilled,
  CircleCloseFilled,
  TrendCharts,
  Clock,
  Calendar,
  Timer,
  Star,
} from '@element-plus/icons-vue';

interface Props {
  loading?: boolean;
  data: {
    totalQuestions?: number;
    correctCount?: number;
    wrongCount?: number;
    accuracy?: number;
    totalTime?: number;
    studyDays?: number;
    avgDailyTime?: number;
  };
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  data: () => ({}),
});

/**
 * 格式化时间（秒 -> 可读格式）
 */
function formatTime(seconds: number) {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}分`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}时${minutes}分`;
  }
}

/**
 * 计算学习效率（题/小时）
 */
function calculateEfficiency() {
  if (!props.data.totalQuestions || !props.data.totalTime) return '0';
  const hours = props.data.totalTime / 3600;
  if (hours < 1) return Math.round(props.data.totalQuestions / hours * 10) / 10;
  return Math.round(props.data.totalQuestions / hours);
}
</script>

<style scoped lang="scss">
.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

@media (max-width: $breakpoint-lg) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: $breakpoint-sm) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
}
</style>
