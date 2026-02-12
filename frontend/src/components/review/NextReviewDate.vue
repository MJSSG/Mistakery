<template>
  <div class="next-review-date">
    <div class="date-header">
      <el-icon><Calendar /></el-icon>
      <span class="title">下次复习</span>
    </div>

    <div v-if="nextReviewDate" class="date-content">
      <div class="date-main" :class="dateClass">
        <div class="date-day">{{ formatDay(nextReviewDate) }}</div>
        <div class="date-month">{{ formatMonth(nextReviewDate) }}</div>
        <div class="date-time">{{ formatTime(nextReviewDate) }}</div>
      </div>

      <div class="date-info">
        <div class="info-item">
          <span class="label">距离下次:</span>
          <span class="value" :class="urgencyClass">{{ timeUntilReview }}</span>
        </div>

        <div v-if="box" class="info-item">
          <span class="label">当前箱子:</span>
          <span class="value">第 {{ box }} 箱</span>
        </div>

        <div v-if="intervalDays" class="info-item">
          <span class="label">间隔:</span>
          <span class="value">{{ intervalDays }} 天</span>
        </div>
      </div>

      <div v-if="isOverdue" class="overdue-badge">
        <el-tag type="danger" size="small">已逾期</el-tag>
      </div>

      <div v-else-if="isToday" class="today-badge">
        <el-tag type="warning" size="small">今天</el-tag>
      </div>

      <div v-else-if="isTomorrow" class="tomorrow-badge">
        <el-tag type="info" size="small">明天</el-tag>
      </div>
    </div>

    <div v-else class="date-empty">
      <el-empty description="暂无待复习" :image-size="60" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Calendar } from '@element-plus/icons-vue';

interface Props {
  nextReviewDate?: Date;
  box?: number;
  intervalDays?: number;
}

const props = withDefaults(defineProps<Props>(), {
  nextReviewDate: undefined,
  box: undefined,
  intervalDays: undefined,
});

/**
 * 是否逾期
 */
const isOverdue = computed(() => {
  if (!props.nextReviewDate) return false;
  return new Date() > props.nextReviewDate;
});

/**
 * 是否今天
 */
const isToday = computed(() => {
  if (!props.nextReviewDate) return false;
  const today = new Date();
  const date = new Date(props.nextReviewDate);
  return (
    today.getFullYear() === date.getFullYear() &&
    today.getMonth() === date.getMonth() &&
    today.getDate() === date.getDate()
  );
});

/**
 * 是否明天
 */
const isTomorrow = computed(() => {
  if (!props.nextReviewDate) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = new Date(props.nextReviewDate);
  return (
    tomorrow.getFullYear() === date.getFullYear() &&
    tomorrow.getMonth() === date.getMonth() &&
    tomorrow.getDate() === date.getDate()
  );
});

/**
 * 日期样式类
 */
const dateClass = computed(() => {
  if (isOverdue.value) return 'is-overdue';
  if (isToday.value) return 'is-today';
  if (isTomorrow.value) return 'is-tomorrow';
  return '';
});

/**
 * 紧急程度样式
 */
const urgencyClass = computed(() => {
  if (isOverdue.value) return 'is-urgent';
  if (isToday.value) return 'is-soon';
  if (isTomorrow.value) return 'is-normal';
  return '';
});

/**
 * 距离下次复习的时间
 */
const timeUntilReview = computed(() => {
  if (!props.nextReviewDate) return '';

  const now = new Date();
  const diff = props.nextReviewDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 7) {
    return `${Math.floor(days / 7)} 周后`;
  } else if (days > 0) {
    return `${days} 天后`;
  } else if (hours > 0) {
    return `${hours} 小时后`;
  } else if (diff > 0) {
    return '即将开始';
  } else {
    const overdueHours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
    if (overdueHours > 24) {
      return `逾期 ${Math.floor(overdueHours / 24)} 天`;
    }
    return `逾期 ${overdueHours} 小时`;
  }
});

/**
 * 格式化日期 - 日
 */
function formatDay(date: Date): string {
  return new Date(date).getDate().toString();
}

/**
 * 格式化日期 - 月
 */
function formatMonth(date: Date): string {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months[new Date(date).getMonth()];
}

/**
 * 格式化时间
 */
function formatTime(date: Date): string {
  const d = new Date(date);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}
</script>

<style scoped lang="scss">
.next-review-date {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
}

.date-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.title {
  font-weight: var(--font-weight-medium);
}

.date-content {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.date-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  min-width: 80px;

  &.is-overdue {
    background: var(--danger-color-light);
    color: var(--danger-color);
  }

  &.is-today {
    background: var(--warning-color-light);
    color: var(--warning-color);
  }

  &.is-tomorrow {
    background: var(--info-color-light);
    color: var(--info-color);
  }
}

.date-day {
  font-size: 32px;
  font-weight: var(--font-weight-bold);
  line-height: 1;
}

.date-month {
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

.date-time {
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-xs);
  opacity: 0.8;
}

.date-info {
  flex: 1;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;

  .label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .value {
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);

    &.is-urgent {
      color: var(--danger-color);
    }

    &.is-soon {
      color: var(--warning-color);
    }

    &.is-normal {
      color: var(--info-color);
    }
  }
}

.overdue-badge,
.today-badge,
.tomorrow-badge {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
}

.date-empty {
  padding: var(--spacing-md) 0;
}
</style>
