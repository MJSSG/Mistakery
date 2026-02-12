<template>
  <div class="review-view">
      <!-- 页面头部 -->
      <div class="view-header">
        <div class="header-left">
          <h1 class="view-title">复习系统</h1>
          <el-tag v-if="statistics" type="info">
            待复习 {{ statistics.pendingReviews }} 题
          </el-tag>
        </div>
        <div class="header-actions">
          <el-button :icon="Plus" @click="goToMistakeBook">
            添加错题
          </el-button>
          <el-button type="primary" :icon="VideoPlay" @click="handleStartReview" :disabled="!hasDueReviews">
            开始复习
          </el-button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon" style="background: var(--primary-color-light)">
            <el-icon :size="24" color="var(--primary-color)">
              <Clock />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">待复习</div>
            <div class="stat-value">{{ statistics?.pendingReviews || 0 }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: var(--success-color-light)">
            <el-icon :size="24" color="var(--success-color)">
              <Select />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">今日完成</div>
            <div class="stat-value">{{ statistics?.todayReviews.total || 0 }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: var(--warning-color-light)">
            <el-icon :size="24" color="var(--warning-color)">
              <TrendCharts />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">正确率</div>
            <div class="stat-value">{{ statistics?.correctRate || 0 }}%</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: var(--info-color-light)">
            <el-icon :size="24" color="var(--info-color)">
              <Calendar />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">本月复习</div>
            <div class="stat-value">{{ statistics?.monthReviews.total || 0 }}</div>
          </div>
        </div>
      </div>

      <!-- Leitner 箱子 -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Leitner 箱子</h2>
          <el-button text @click="fetchBoxes">刷新</el-button>
        </div>
        <LeitnerBox
          :boxes="boxes"
          :box-distribution="statistics?.boxDistribution || []"
          @select="handleSelectBox"
        />
      </div>

      <!-- 下次复习时间 -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">下次复习</h2>
        </div>
        <NextReviewDate
          v-if="nextReviewDate"
          :next-review-date="nextReviewDate"
          :box="nextReviewBox"
          :interval-days="nextReviewInterval"
        />
        <AppEmpty v-else description="暂无待复习计划" />
      </div>

      <!-- 复习计划 -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">复习计划</h2>
          <el-select v-model="scheduleDays" @change="fetchSchedule">
            <el-option :value="7" label="未来 7 天" />
            <el-option :value="14" label="未来 14 天" />
            <el-option :value="30" label="未来 30 天" />
          </el-select>
        </div>
        <div class="schedule-list">
          <div
            v-for="item in schedule?.schedule || []"
            :key="item.date.toISOString()"
            class="schedule-item"
          >
            <div class="schedule-date">
              <div class="date-day">{{ formatDate(item.date) }}</div>
              <div class="date-label">{{ getDateLabel(item.date) }}</div>
            </div>
            <div class="schedule-count">
              <span class="count">{{ item.dueCount }}</span>
              <span class="label">题</span>
            </div>
            <div class="schedule-bars">
              <div
                v-for="box in item.boxDistribution"
                :key="box.box"
                class="bar"
                :class="`box-${box.box}`"
                :style="{ width: `${(box.count / item.dueCount) * 100}%` }"
                :title="`第${box.box}箱: ${box.count}题`"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 待复习错题列表 -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">待复习错题</h2>
          <el-button v-if="dueReviews?.items.length" text @click="handleStartReview">
            查看全部 ({{ dueReviews?.total || 0 }})
          </el-button>
        </div>
        <AppLoading v-if="loading" />
        <AppEmpty
          v-else-if="!dueReviews?.items.length"
          description="暂无待复习错题"
          :action-text="'去错题本添加'"
          :action-handler="goToMistakeBook"
        />
        <div v-else class="mistake-list">
          <div
            v-for="item in displayedReviews"
            :key="item.reviewId"
            class="mistake-item"
            @click="handleStartReview"
          >
            <div class="item-header">
              <el-tag size="small">第 {{ item.currentBox }} 箱</el-tag>
              <span class="item-count">复习 {{ item.reviewCount }} 次</span>
            </div>
            <div class="item-content">{{ item.question }}</div>
            <div class="item-footer">
              <span class="item-subject">{{ item.subject }}</span>
              <span v-if="item.lastReviewedAt" class="item-date">
                {{ formatDate(item.lastReviewedAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Plus,
  VideoPlay,
  Clock,
  Select,
  TrendCharts,
  Calendar,
} from '@element-plus/icons-vue';
import AppLoading from '@/components/common/AppLoading.vue';
import AppEmpty from '@/components/common/AppEmpty.vue';
import LeitnerBox from '@/components/review/LeitnerBox.vue';
import NextReviewDate from '@/components/review/NextReviewDate.vue';
import { useReview } from '@/composables/useReview';
import type { LeitnerBox as LeitnerBoxType } from '@/types/review';

const router = useRouter();

const {
  loading,
  statistics,
  schedule,
  dueReviews,
  boxes,
  fetchStatistics,
  fetchSchedule,
  fetchDueReviews,
  fetchBoxes,
  startSession,
} = useReview();

// 状态
const scheduleDays = ref(7);
const selectedBox = ref<number | undefined>(undefined);

/**
 * 是否有待复习错题
 */
const hasDueReviews = computed(() => {
  return (dueReviews.value?.total || 0) > 0;
});

/**
 * 下次复习时间
 */
const nextReviewDate = computed(() => {
  if (!dueReviews.value?.items.length) return undefined;
  const reviews = [...dueReviews.value.items].sort((a, b) => {
    const dateA = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0;
    const dateB = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0;
    return dateA - dateB;
  });
  return reviews[0]?.lastReviewedAt;
});

const nextReviewBox = computed(() => {
  if (!dueReviews.value?.items.length) return undefined;
  const reviews = [...dueReviews.value.items].sort((a, b) => {
    const dateA = a.lastReviewedAt ? new Date(a.lastReviewedAt).getTime() : 0;
    const dateB = b.lastReviewedAt ? new Date(b.lastReviewedAt).getTime() : 0;
    return dateA - dateB;
  });
  return reviews[0]?.currentBox;
});

const nextReviewInterval = computed(() => {
  if (!nextReviewBox.value) return undefined;
  const box = boxes.value.find((b) => b.box === nextReviewBox.value);
  return box?.intervalDays;
});

/**
 * 显示的错题列表（最多5条）
 */
const displayedReviews = computed(() => {
  return dueReviews.value?.items.slice(0, 5) || [];
});

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return '今天';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return '昨天';
  }
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 获取日期标签
 */
function getDateLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return '今天';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '明天';
  }
  const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return `${days}天后`;
}

/**
 * 开始复习
 */
async function handleStartReview() {
  await router.push('/review/session');
}

/**
 * 选择箱子
 */
function handleSelectBox(box: number) {
  selectedBox.value = box;
  fetchDueReviews({ box });
}

/**
 * 去错题本
 */
function goToMistakeBook() {
  router.push('/mistake');
}

/**
 * 刷新数据
 */
async function refresh() {
  await Promise.all([
    fetchStatistics(),
    fetchSchedule(scheduleDays.value),
    fetchDueReviews({ limit: 5 }),
    fetchBoxes(),
  ]);
}

onMounted(async () => {
  await refresh();
});
</script>

<style scoped lang="scss">
.review-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.view-title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-md);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.section {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

.schedule-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.schedule-date {
  min-width: 80px;
}

.date-day {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.date-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.schedule-count {
  display: flex;
  align-items: baseline;
  min-width: 60px;

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

.schedule-bars {
  flex: 1;
  display: flex;
  height: 8px;
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  background: var(--color-bg);

  .bar {
    height: 100%;
    transition: width 0.3s;

    &.box-1 { background: #f56c6c; }
    &.box-2 { background: #e6a23c; }
    &.box-3 { background: #409eff; }
    &.box-4 { background: #67c23a; }
    &.box-5 { background: #909399; }
  }
}

.mistake-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.mistake-item {
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.item-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.item-content {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  line-height: var(--line-height-normal);
  margin-bottom: var(--spacing-xs);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}
</style>
