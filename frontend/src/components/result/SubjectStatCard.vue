<template>
  <div class="subject-stat-card">
    <div class="card-header">
      <el-icon :size="24" :color="color">
        <component :is="icon" />
      </el-icon>
      <div class="header-info">
        <div class="subject-name">{{ subject.name }}</div>
        <div class="subject-count">共 {{ subject.total }} 题</div>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          link
          @click="$emit('review', subject.id)"
        >
          查看详情
        </el-button>
      </div>
    </div>

    <div class="card-stats">
      <div class="stat-item">
        <div class="stat-label">正确率</div>
        <div class="stat-value" :class="accuracyClass">
          {{ subject.accuracy }}%
        </div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-label">正确</div>
        <div class="stat-value stat-value-green">
          {{ subject.correct }}
        </div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-label">错误</div>
        <div class="stat-value stat-value-red">
          {{ subject.incorrect }}
        </div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-label">耗时</div>
        <div class="stat-value">
          {{ formatTime(subject.totalTime) }}
        </div>
      </div>
    </div>

    <div class="card-progress">
      <ProgressBar
        :label="`进度: ${subject.completed}/${subject.total}`"
        :value="subject.completed"
        :total="subject.total"
        :color="color"
      />
    </div>

    <div v-if="showDetails" class="card-details">
      <div class="detail-row">
        <span class="detail-label">平均用时</span>
        <span class="detail-value">{{ Math.round(subject.totalTime / subject.total) }} 秒/题</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">掌握等级</span>
        <StatusTag :level="masteryLevel" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  TrendCharts,
  DataAnalysis,
  Document,
  Collection,
  Calendar,
} from '@element-plus/icons-vue';
import ProgressBar from './ProgressBar.vue';
import StatusTag from './StatusTag.vue';

export interface SubjectData {
  id: string;
  name: string;
  total: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  completed: number;
  totalTime: number;
  type?: 'math' | 'english' | 'chinese' | 'science' | 'history' | 'geography' | 'other';
}

interface Props {
  subject: SubjectData;
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
});

defineEmits<{
  review: [subjectId: string];
}>();

const iconMap = {
  math: DataAnalysis,
  english: Document,
  chinese: Document,
  science: TrendCharts,
  history: Calendar,
  geography: Collection,
  other: Document,
};

const colorMap = {
  math: '#409EFF',
  english: '#67C23A',
  chinese: '#E6A23C',
  science: '#F56C6C',
  history: '#909399',
  geography: '#67C23A',
  other: '#909399',
};

const icon = computed(() => {
  const type = props.subject.type || 'other';
  return iconMap[type];
});

const color = computed(() => {
  const type = props.subject.type || 'other';
  return colorMap[type];
});

const accuracyClass = computed(() => {
  if (props.subject.accuracy >= 80) return 'stat-value-green';
  if (props.subject.accuracy >= 60) return 'stat-value-blue';
  return 'stat-value-red';
});

const masteryLevel = computed(() => {
  if (props.subject.accuracy >= 90) return 'mastered';
  if (props.subject.accuracy >= 70) return 'proficient';
  if (props.subject.accuracy >= 50) return 'learning';
  return 'struggling';
});

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}分${seconds % 60}秒`;
};
</script>

<style scoped lang="scss">
.subject-stat-card {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  border: 1px solid var(--color-border);

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.header-info {
  flex: 1;
}

.subject-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.subject-count {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  margin-bottom: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
  border-bottom: 1px solid var(--color-border-light);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);

  &.stat-value-green {
    color: var(--success-color);
  }

  &.stat-value-red {
    color: var(--danger-color);
  }

  &.stat-value-blue {
    color: var(--info-color);
  }
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--color-border-light);
}

.card-progress {
  margin-bottom: var(--spacing-sm);
}

.card-details {
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-light);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) 0;

  &:not(:last-child) {
    margin-bottom: var(--spacing-xs);
  }
}

.detail-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.detail-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}
</style>
