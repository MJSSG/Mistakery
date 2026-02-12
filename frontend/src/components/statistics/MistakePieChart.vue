<template>
  <div ref="chartRef" class="mistake-chart" v-loading="loading"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';

interface SubjectStat {
  subject: string;
  count: number;
  accuracy: number;
}

interface OverviewData {
  subjectStats?: SubjectStat[];
  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
}

interface Props {
  data: OverviewData;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  data: () => ({}),
});

const chartRef = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;

/**
 * 初始化图表
 */
function initChart() {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);
  updateChart();

  // 响应式调整
  window.addEventListener('resize', handleResize);
}

/**
 * 更新图表
 */
function updateChart() {
  if (!chartInstance) return;

  // 从 subjectStats 中提取数据，如果没有则使用默认数据
  const subjectStats = props.data.subjectStats || [];
  const chartData = subjectStats.length > 0
    ? subjectStats.map((s: SubjectStat) => ({
        name: s.subject,
        value: s.count,
      }))
    : [
        { name: '数学', value: 35 },
        { name: '物理', value: 28 },
        { name: '化学', value: 22 },
        { name: '生物', value: 15 },
      ];

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const total = params.data.value;
        const percent = params.percent;
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
            <div>题数：${total} 题</div>
            <div>占比：${percent}%</div>
          </div>
        `;
      },
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        color: '#6b7280',
      },
    },
    series: [
      {
        name: '错题分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold',
            color: '#303133',
          },
        },
        labelLine: {
          show: false,
        },
        data: chartData,
      },
    ],
    color: [
      '#409eff', // 蓝
      '#67c23a', // 绿
      '#e6a23c', // 橙
      '#f56c6c', // 红
      '#909399', // 灰
      '#a0cfff', // 浅蓝
      '#b3e19d', // 浅绿
      '#f3d19e', // 浅橙
    ],
  };

  chartInstance.setOption(option);
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  chartInstance?.resize();
}

/**
 * 销毁图表
 */
function disposeChart() {
  window.removeEventListener('resize', handleResize);
  chartInstance?.dispose();
  chartInstance = null;
}

// 监听数据变化
watch(() => props.data, () => {
  nextTick(() => {
    updateChart();
  });
}, { deep: true });

onMounted(() => {
  nextTick(() => {
    initChart();
  });
});

onUnmounted(() => {
  disposeChart();
});
</script>

<style scoped lang="scss">
.mistake-chart {
  width: 100%;
  height: 320px;
}
</style>
