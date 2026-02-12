<template>
  <div class="statistics-view">
    <div class="statistics-header">
      <h1 class="page-title">学习统计</h1>
      <TimeRangeSelector v-model="timeRange" @change="loadStatistics" />
    </div>

    <!-- 今日统计卡片 -->
    <OverviewCards :loading="loadingOverview" :data="overviewData" />

    <!-- 图表区域 -->
    <div class="charts-grid">
      <el-card class="chart-card" v-loading="loadingTrends">
        <template #header>
          <div class="card-header">
            <span>学习时长趋势</span>
            <el-select v-model="trendInterval" size="small" style="width: 120px">
              <el-option label="按天" :value="1" />
              <el-option label="按周" :value="7" />
              <el-option label="按月" :value="30" />
            </el-select>
          </div>
        </template>
        <TrendLineChart :data="trendsData" :loading="loadingTrends" />
      </el-card>

      <el-card class="chart-card" v-loading="loadingSubjects">
        <template #header>
          <div class="card-header">
            <span>科目掌握度</span>
          </div>
        </template>
        <SubjectBarChart :data="subjectData" :loading="loadingSubjects" />
      </el-card>
    </div>

    <div class="charts-grid">
      <el-card class="chart-card" v-loading="loadingOverview">
        <template #header>
          <div class="card-header">
            <span>错题分布</span>
          </div>
        </template>
        <MistakePieChart :data="overviewData" :loading="loadingOverview" />
      </el-card>

      <el-card class="chart-card advice-card" v-loading="loadingAdvice">
        <template #header>
          <div class="card-header">
            <el-icon><Bell /></el-icon>
            <span>学习建议</span>
          </div>
        </template>
        <StudyAdvice :data="adviceData" :loading="loadingAdvice" />
      </el-card>
    </div>

    <!-- 详细数据表格 -->
    <el-card class="detail-card">
      <template #header>
        <div class="card-header">
          <span>详细记录</span>
          <div class="header-actions">
            <el-button size="small" @click="handleExportExcel">
              <el-icon><Download /></el-icon>
              导出 Excel
            </el-button>
            <el-button size="small" @click="handleExportPdf">
              <el-icon><Document /></el-icon>
              导出 PDF
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="detailRecords"
        v-loading="loadingDetail"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="科目" width="100" />
        <el-table-column prop="questionsCount" label="题数" width="80" align="center" />
        <el-table-column prop="correctCount" label="正确" width="80" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.correctCount > 0 ? '#67c23a' : '' }">
              {{ row.correctCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="wrongCount" label="错误" width="80" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.wrongCount > 0 ? '#f56c6c' : '' }">
              {{ row.wrongCount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="accuracy" label="正确率" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getAccuracyTagType(row.accuracy)"
              size="small"
            >
              {{ row.accuracy }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timeSpent" label="用时" width="100" align="center">
          <template #default="{ row }">
            {{ formatDuration(row.timeSpent) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="viewDetail(row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="detailPage"
          v-model:page-size="detailPageSize"
          :total="detailTotal"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadDetailRecords"
          @size-change="loadDetailRecords"
        />
      </div>
    </el-card>

    <!-- 导出对话框 -->
    <ExportDialog
      v-model="showExportDialog"
      :type="exportType"
      @confirm="handleExportConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Bell, Download, Document } from '@element-plus/icons-vue';
import { api } from '@/services/api';
import TimeRangeSelector from '@/components/statistics/TimeRangeSelector.vue';
import OverviewCards from '@/components/statistics/OverviewCards.vue';
import TrendLineChart from '@/components/statistics/TrendLineChart.vue';
import SubjectBarChart from '@/components/statistics/SubjectBarChart.vue';
import MistakePieChart from '@/components/statistics/MistakePieChart.vue';
import StudyAdvice from '@/components/statistics/StudyAdvice.vue';
import ExportDialog from '@/components/statistics/ExportDialog.vue';

const router = useRouter();

// 时间范围
const timeRange = ref<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');

// 统计数据
const loadingOverview = ref(false);
const overviewData = ref<any>({});

const loadingTrends = ref(false);
const trendInterval = ref(7);
const trendsData = ref<any[]>([]);

const loadingSubjects = ref(false);
const subjectData = ref<any[]>([]);

const loadingAdvice = ref(false);
const adviceData = ref<any[]>([]);

// 详细记录
const loadingDetail = ref(false);
const detailRecords = ref<any[]>([]);
const detailPage = ref(1);
const detailPageSize = ref(20);
const detailTotal = ref(0);

// 导出
const showExportDialog = ref(false);
const exportType = ref<'pdf' | 'excel'>('excel');

/**
 * 加载统计数据
 */
async function loadStatistics() {
  loadOverview();
  loadTrends();
  loadSubjectStats();
  loadAdvice();
  loadDetailRecords();
}

/**
 * 加载概览数据
 */
async function loadOverview() {
  loadingOverview.value = true;

  try {
    const response = await api.get('/analytics/overview', {
      params: { timeRange: timeRange.value.toUpperCase() },
    });
    overviewData.value = response.data;
  } catch (err: any) {
    if (err.response?.status !== 404) {
      ElMessage.error('加载概览数据失败');
    }
    // 使用模拟数据
    overviewData.value = {
      totalQuestions: 156,
      correctCount: 128,
      wrongCount: 28,
      accuracy: 82,
      totalTime: 12450, // 秒
      studyDays: 45,
      avgDailyTime: 277, // 秒
      subjectStats: [
        { subject: '数学', count: 45, accuracy: 78 },
        { subject: '物理', count: 38, accuracy: 85 },
        { subject: '化学', count: 42, accuracy: 88 },
        { subject: '生物', count: 31, accuracy: 77 },
      ],
    };
  } finally {
    loadingOverview.value = false;
  }
}

/**
 * 加载趋势数据
 */
async function loadTrends() {
  loadingTrends.value = true;

  try {
    const response = await api.get('/analytics/trends', {
      params: {
        timeRange: timeRange.value.toUpperCase(),
        intervalDays: trendInterval.value,
      },
    });
    trendsData.value = response.data;
  } catch (err: any) {
    if (err.response?.status !== 404) {
      ElMessage.error('加载趋势数据失败');
    }
    // 使用模拟数据
    const days = timeRange.value === 'week' ? 7 : timeRange.value === 'month' ? 30 : 90;
    trendsData.value = Array.from({ length: Math.ceil(days / trendInterval.value) }, (_, i) => ({
      date: new Date(Date.now() - (days - i * trendInterval.value) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      studyTime: Math.floor(Math.random() * 3600) + 600,
      questionsCount: Math.floor(Math.random() * 30) + 5,
      accuracy: Math.floor(Math.random() * 30) + 70,
    }));
  } finally {
    loadingTrends.value = false;
  }
}

/**
 * 加载科目统计
 */
async function loadSubjectStats() {
  loadingSubjects.value = true;

  try {
    const response = await api.get('/analytics/subjects', {
      params: { timeRange: timeRange.value.toUpperCase() },
    });
    subjectData.value = response.data;
  } catch (err: any) {
    if (err.response?.status !== 404) {
      ElMessage.error('加载科目统计失败');
    }
    // 使用模拟数据
    subjectData.value = [
      { subject: '数学', total: 45, mastered: 35, accuracy: 78, avgTime: 180 },
      { subject: '物理', total: 38, mastered: 32, accuracy: 85, avgTime: 210 },
      { subject: '化学', total: 42, mastered: 37, accuracy: 88, avgTime: 165 },
      { subject: '生物', total: 31, mastered: 24, accuracy: 77, avgTime: 195 },
    ];
  } finally {
    loadingSubjects.value = false;
  }
}

/**
 * 加载学习建议
 */
async function loadAdvice() {
  loadingAdvice.value = true;

  try {
    const response = await api.get('/analytics/advice', {
      params: { timeRange: timeRange.value.toUpperCase() },
    });
    adviceData.value = response.data;
  } catch (err: any) {
    if (err.response?.status !== 404) {
      ElMessage.error('加载学习建议失败');
    }
    // 使用模拟数据
    adviceData.value = [
      { type: 'warning', title: '物理需加强', message: '最近一周物理正确率下降，建议复习力学相关知识点' },
      { type: 'success', title: '化学进步明显', message: '化学正确率提升15%，继续保持' },
      { type: 'info', title: '学习时长建议', message: '建议每日学习时间保持在2小时以上' },
      { type: 'warning', title: '复习提醒', message: '有12道错题需要复习，请及时复习' },
    ];
  } finally {
    loadingAdvice.value = false;
  }
}

/**
 * 加载详细记录
 */
async function loadDetailRecords() {
  loadingDetail.value = true;

  try {
    const response = await api.get('/analytics/detail', {
      params: {
        timeRange: timeRange.value.toUpperCase(),
        page: detailPage.value,
        limit: detailPageSize.value,
      },
    });
    detailRecords.value = response.data.records || [];
    detailTotal.value = response.data.total || 0;
  } catch (err: any) {
    if (err.response?.status !== 404) {
      ElMessage.error('加载详细记录失败');
    }
    // 使用模拟数据
    detailRecords.value = Array.from({ length: detailPageSize.value }, (_, i) => ({
      id: `detail-${i}`,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      subject: ['数学', '物理', '化学', '生物'][Math.floor(Math.random() * 4)],
      questionsCount: Math.floor(Math.random() * 20) + 5,
      correctCount: Math.floor(Math.random() * 15) + 3,
      wrongCount: Math.floor(Math.random() * 5),
      accuracy: Math.floor(Math.random() * 30) + 70,
      timeSpent: Math.floor(Math.random() * 1800) + 300,
    }));
    detailTotal.value = 100;
  } finally {
    loadingDetail.value = false;
  }
}

/**
 * 格式化日期
 */
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

/**
 * 格式化时长
 */
function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}秒`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  }
}

/**
 * 获取正确率标签类型
 */
function getAccuracyTagType(accuracy: number) {
  if (accuracy >= 80) return 'success';
  if (accuracy >= 60) return 'warning';
  return 'danger';
}

/**
 * 查看详情
 */
function viewDetail(row: any) {
  // 跳转到详情页面
  router.push(`/practice/record/${row.id}`);
}

/**
 * 导出 Excel
 */
function handleExportExcel() {
  exportType.value = 'excel';
  showExportDialog.value = true;
}

/**
 * 导出 PDF
 */
function handleExportPdf() {
  exportType.value = 'pdf';
  showExportDialog.value = true;
}

/**
 * 确认导出
 */
async function handleExportConfirm(options: any) {
  showExportDialog.value = false;

  try {
    const endpoint = exportType.value === 'excel' ? '/export/excel' : '/export/pdf';
    const response = await api.post(endpoint, {
      timeRange: timeRange.value,
      ...options,
    }, {
      responseType: exportType.value === 'excel' ? 'blob' : 'blob',
    });

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `mistakery-${exportType.value}-${new Date().toISOString().split('T')[0]}.${exportType.value === 'excel' ? 'xlsx' : 'pdf'}`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    ElMessage.success(`导出${exportType.value === 'excel' ? 'Excel' : 'PDF'}成功`);
  } catch (err: any) {
    ElMessage.error(`导出失败：${err.response?.data?.message || '未知错误'}`);
  }
}

// 监听趋势间隔变化
watch(trendInterval, () => {
  loadTrends();
});

// 初始化
onMounted(() => {
  loadStatistics();
});
</script>

<style scoped lang="scss">
.statistics-view {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.statistics-header {
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

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.chart-card {
  min-height: 400px;

  :deep(.el-card__body) {
    min-height: 320px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: var(--font-weight-medium);

  .el-icon {
    color: var(--warning-color);
  }
}

.advice-card {
  :deep(.el-card__body) {
    padding: 0;
  }
}

.detail-card {
  .header-actions {
    display: flex;
    gap: var(--spacing-sm);
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-lg);
}

@media (max-width: $breakpoint-lg) {
  .statistics-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
