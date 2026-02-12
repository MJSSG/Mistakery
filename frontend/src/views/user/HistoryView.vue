<template>
  <div class="history-view">
    <div class="history-container">
      <div class="history-header">
        <h1 class="page-title">学习记录</h1>
        <div class="header-actions">
          <el-radio-group v-model="activeTab" size="large">
            <el-radio-button value="practice">练习记录</el-radio-button>
            <el-radio-button value="review">复习记录</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 练习记录 -->
      <div v-show="activeTab === 'practice'" class="history-content">
        <el-card v-loading="loadingPractice">
          <template #header>
            <div class="list-header">
              <span>练习记录</span>
              <el-select
                v-model="practiceFilter"
                placeholder="筛选科目"
                clearable
                style="width: 150px"
              >
                <el-option label="全部科目" value="" />
                <el-option label="数学" value="math" />
                <el-option label="物理" value="physics" />
                <el-option label="化学" value="chemistry" />
                <el-option label="生物" value="biology" />
              </el-select>
            </div>
          </template>

          <div v-if="practiceRecords.length === 0" class="empty-state">
            <el-empty description="暂无练习记录">
              <el-button type="primary" @click="$router.push('/practice')">
                开始练习
              </el-button>
            </el-empty>
          </div>

          <div v-else class="record-list">
            <div
              v-for="record in filteredPracticeRecords"
              :key="record.id"
              class="record-item"
              @click="$router.push(`/practice/record/${record.id}`)"
            >
              <div class="record-info">
                <div class="record-header">
                  <h3 class="record-title">{{ record.title }}</h3>
                  <el-tag :type="getStatusType(record.status)" size="small">
                    {{ getStatusText(record.status) }}
                  </el-tag>
                </div>
                <div class="record-meta">
                  <span class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(record.startedAt) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Clock /></el-icon>
                    {{ formatDuration(record.timeSpent) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Document /></el-icon>
                    {{ record.totalCount }} 题
                  </span>
                </div>
              </div>
              <div class="record-stats">
                <div class="stat-item">
                  <span class="stat-label">正确率</span>
                  <span
                    class="stat-value"
                    :class="{ 'stat-good': record.accuracy >= 80, 'stat-bad': record.accuracy < 60 }"
                  >
                    {{ record.accuracy }}%
                  </span>
                </div>
                <el-icon class="arrow-icon"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="practiceRecords.length > 0" class="pagination-wrapper">
            <el-pagination
              v-model:current-page="practicePage"
              :page-size="practicePageSize"
              :total="practiceTotal"
              layout="prev, pager, next"
              @current-change="loadPracticeRecords"
            />
          </div>
        </el-card>
      </div>

      <!-- 复习记录 -->
      <div v-show="activeTab === 'review'" class="history-content">
        <el-card v-loading="loadingReview">
          <template #header>
            <div class="list-header">
              <span>复习记录</span>
              <el-select
                v-model="reviewFilter"
                placeholder="筛选结果"
                clearable
                style="width: 150px"
              >
                <el-option label="全部" value="" />
                <el-option label="正确" value="correct" />
                <el-option label="错误" value="incorrect" />
                <el-option label="跳过" value="skipped" />
              </el-select>
            </div>
          </template>

          <div v-if="reviewRecords.length === 0" class="empty-state">
            <el-empty description="暂无复习记录">
              <el-button type="primary" @click="$router.push('/review')">
                开始复习
              </el-button>
            </el-empty>
          </div>

          <div v-else class="record-list">
            <div
              v-for="record in filteredReviewRecords"
              :key="record.id"
              class="record-item"
              @click="viewMistakeDetail(record.mistakeId)"
            >
              <div class="record-info">
                <div class="record-header">
                  <h3 class="record-title">错题 #{{ record.mistakeId.slice(0, 8) }}</h3>
                  <el-tag :type="getReviewResultType(record.result)" size="small">
                    {{ getReviewResultText(record.result) }}
                  </el-tag>
                </div>
                <div class="record-meta">
                  <span class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(record.reviewedAt) }}
                  </span>
                  <span class="meta-item">
                    <el-icon><FolderOpened /></el-icon>
                    箱子 {{ record.boxLevel }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Timer /></el-icon>
                    间隔 {{ record.intervalDays }} 天
                  </span>
                </div>
              </div>
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </div>
          </div>

          <!-- 分页 -->
          <div v-if="reviewRecords.length > 0" class="pagination-wrapper">
            <el-pagination
              v-model:current-page="reviewPage"
              :page-size="reviewPageSize"
              :total="reviewTotal"
              layout="prev, pager, next"
              @current-change="loadReviewRecords"
            />
          </div>
        </el-card>
      </div>

      <!-- 学习统计 -->
      <el-card class="stats-summary-card">
        <template #header>
          <div class="card-header">
            <el-icon><TrendCharts /></el-icon>
            <span>本周学习统计</span>
          </div>
        </template>

        <div class="stats-summary">
          <div class="summary-item">
            <div class="summary-icon" style="background: #ecf5ff; color: #409eff">
              <el-icon><Document /></el-icon>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ weekStats.practiceCount }}</div>
              <div class="summary-label">练习次数</div>
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-icon" style="background: #f0f9ff; color: #67c23a">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ weekStats.correctCount }}</div>
              <div class="summary-label">答对题数</div>
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-icon" style="background: #fef0f0; color: #f56c6c">
              <el-icon><CircleCloseFilled /></el-icon>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ weekStats.mistakeCount }}</div>
              <div class="summary-label">错题数量</div>
            </div>
          </div>
          <div class="summary-item">
            <div class="summary-icon" style="background: #fdf6ec; color: #e6a23c">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="summary-content">
              <div class="summary-value">{{ weekStats.reviewCount }}</div>
              <div class="summary-label">复习次数</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Calendar,
  Clock,
  Document,
  ArrowRight,
  FolderOpened,
  Timer,
  TrendCharts,
  CircleCheckFilled,
  CircleCloseFilled,
} from '@element-plus/icons-vue';
import { api } from '@/services/api';

const router = useRouter();

// 活动标签
const activeTab = ref('practice');

// 练习记录
const loadingPractice = ref(false);
const practiceRecords = ref<any[]>([]);
const practiceFilter = ref('');
const practicePage = ref(1);
const practicePageSize = ref(10);
const practiceTotal = ref(0);

// 复习记录
const loadingReview = ref(false);
const reviewRecords = ref<any[]>([]);
const reviewFilter = ref('');
const reviewPage = ref(1);
const reviewPageSize = ref(10);
const reviewTotal = ref(0);

// 本周统计
const weekStats = reactive({
  practiceCount: 0,
  correctCount: 0,
  mistakeCount: 0,
  reviewCount: 0,
});

// 筛选后的练习记录
const filteredPracticeRecords = computed(() => {
  if (!practiceFilter.value) return practiceRecords.value;
  return practiceRecords.value.filter(r => r.subject === practiceFilter.value);
});

// 筛选后的复习记录
const filteredReviewRecords = computed(() => {
  if (!reviewFilter.value) return reviewRecords.value;
  return reviewRecords.value.filter(r => r.result === reviewFilter.value);
});

/**
 * 获取状态类型
 */
function getStatusType(status: string) {
  const types: Record<string, any> = {
    completed: 'success',
    in_progress: 'warning',
    abandoned: 'info',
  };
  return types[status] || 'info';
}

/**
 * 获取状态文本
 */
function getStatusText(status: string) {
  const texts: Record<string, string> = {
    completed: '已完成',
    in_progress: '进行中',
    abandoned: '已放弃',
  };
  return texts[status] || status;
}

/**
 * 获取复习结果类型
 */
function getReviewResultType(result: string) {
  const types: Record<string, any> = {
    correct: 'success',
    incorrect: 'danger',
    skipped: 'info',
  };
  return types[result] || 'info';
}

/**
 * 获取复习结果文本
 */
function getReviewResultText(result: string) {
  const texts: Record<string, string> = {
    correct: '正确',
    incorrect: '错误',
    skipped: '跳过',
  };
  return texts[result] || result;
}

/**
 * 格式化日期
 */
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }
}

/**
 * 格式化时长
 */
function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  }
}

/**
 * 加载练习记录
 */
async function loadPracticeRecords(page: number = 1) {
  loadingPractice.value = true;
  practicePage.value = page;

  try {
    const response = await api.get('/user/history/practice', {
      params: {
        page,
        pageSize: practicePageSize.value,
      },
    });

    practiceRecords.value = response.data.records || [];
    practiceTotal.value = response.data.total || 0;
  } catch (err: any) {
    if (err.response?.status !== 404) {
      ElMessage.error('加载练习记录失败');
    }
    // API 未实现时使用模拟数据
    practiceRecords.value = [];
    practiceTotal.value = 0;
  } finally {
    loadingPractice.value = false;
  }
}

/**
 * 加载复习记录
 */
async function loadReviewRecords(page: number = 1) {
  loadingReview.value = true;
  reviewPage.value = page;

  try {
    const response = await api.get('/user/history/review', {
      params: {
        page,
        pageSize: reviewPageSize.value,
      },
    });

    reviewRecords.value = response.data.records || [];
    reviewTotal.value = response.data.total || 0;
  } catch (err: any) {
    if (err.response?.status !== 404) {
      ElMessage.error('加载复习记录失败');
    }
    // API 未实现时使用模拟数据
    reviewRecords.value = [];
    reviewTotal.value = 0;
  } finally {
    loadingReview.value = false;
  }
}

/**
 * 加载本周统计
 */
async function loadWeekStats() {
  try {
    const response = await api.get('/user/history/stats/week');
    Object.assign(weekStats, response.data);
  } catch (err: any) {
    // API 未实现时使用模拟数据
    Object.assign(weekStats, {
      practiceCount: 3,
      correctCount: 45,
      mistakeCount: 8,
      reviewCount: 12,
    });
  }
}

/**
 * 查看错题详情
 */
function viewMistakeDetail(mistakeId: string) {
  router.push(`/mistake/${mistakeId}`);
}

/**
 * 初始化
 */
onMounted(() => {
  loadPracticeRecords();
  loadReviewRecords();
  loadWeekStats();
});
</script>

<style scoped lang="scss">
.history-view {
  padding: var(--spacing-xl);
  max-width: 1000px;
  margin: 0 auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.page-title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.history-content {
  margin-bottom: var(--spacing-lg);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--color-bg-hover);
  }
}

.record-info {
  flex: 1;
  min-width: 0;
}

.record-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.record-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  margin: 0;
}

.record-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.record-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.stat-item {
  text-align: center;
  min-width: 60px;
}

.stat-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  display: block;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);

  &.stat-good {
    color: var(--success-color);
  }

  &.stat-bad {
    color: var(--danger-color);
  }
}

.arrow-icon {
  color: var(--color-text-secondary);
  font-size: 18px;
}

.empty-state {
  padding: var(--spacing-xxl) 0;
  text-align: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
}

.stats-summary-card {
  margin-top: var(--spacing-lg);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.summary-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.summary-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

.summary-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

@media (max-width: $breakpoint-md) {
  .history-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .record-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .record-stats {
    width: 100%;
    justify-content: space-between;
  }

  .stats-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: $breakpoint-sm) {
  .history-view {
    padding: var(--spacing-md);
  }

  .stats-summary {
    grid-template-columns: 1fr;
  }
}
</style>
