<template>
  <div ref="chartRef" class="subject-chart" v-loading="loading"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';

interface SubjectData {
  subject: string;
  total: number;
  mastered: number;
  accuracy: number;
  avgTime: number;
}

interface Props {
  data: SubjectData[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  data: () => [],
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
  if (!chartInstance || !props.data.length) return;

  const subjects = props.data.map((d) => d.subject);
  const masteredData = props.data.map((d) => d.mastered);
  const unmasteredData = props.data.map((d) => d.total - d.mastered);
  const accuracyData = props.data.map((d) => d.accuracy);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const index = params[0].dataIndex;
        const subject = props.data[index];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 8px;">${subject.subject}</div>
            <div>已掌握：${subject.mastered} 题</div>
            <div>未掌握：${subject.total - subject.mastered} 题</div>
            <div>正确率：${subject.accuracy}%</div>
            <div>平均用时：${Math.round(subject.avgTime / 60)} 分钟</div>
          </div>
        `;
      },
    },
    legend: {
      data: ['已掌握', '未掌握', '正确率'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: subjects,
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisLabel: {
        color: '#6b7280',
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '题数',
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        axisLabel: {
          color: '#6b7280',
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
          },
        },
      },
      {
        type: 'value',
        name: '正确率(%)',
        position: 'right',
        min: 0,
        max: 100,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        axisLabel: {
          color: '#6b7280',
          formatter: '{value}%',
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: '已掌握',
        type: 'bar',
        stack: 'total',
        data: masteredData,
        itemStyle: {
          color: '#67c23a',
          borderRadius: [4, 0, 0, 4],
        },
      },
      {
        name: '未掌握',
        type: 'bar',
        stack: 'total',
        data: unmasteredData,
        itemStyle: {
          color: '#f56c6c',
          borderRadius: [0, 4, 4, 0],
        },
      },
      {
        name: '正确率',
        type: 'line',
        yAxisIndex: 1,
        data: accuracyData,
        itemStyle: {
          color: '#409eff',
        },
        lineStyle: {
          width: 3,
        },
        symbol: 'circle',
        symbolSize: 8,
      },
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
.subject-chart {
  width: 100%;
  height: 320px;
}
</style>
