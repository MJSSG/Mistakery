<template>
  <div ref="chartRef" class="trend-chart" v-loading="loading"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';

interface Props {
  data: any[];
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

  const dates = props.data.map((d: any) => d.date);
  const studyTimes = props.data.map((d: any) => Math.round(d.studyTime / 60)); // 转换为分钟
  const accuracies = props.data.map((d: any) => d.accuracy);
  const questionCounts = props.data.map((d: any) => d.questionsCount);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['学习时长', '正确率', '题数'],
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
      data: dates,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: '#e5e7eb',
        },
      },
      axisLabel: {
        color: '#6b7280',
        formatter: (value: string) => {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '时长(分钟)/题数',
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
        name: '学习时长',
        type: 'line',
        smooth: true,
        data: studyTimes,
        itemStyle: {
          color: '#409eff',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' },
          ]),
        },
      },
      {
        name: '正确率',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: accuracies,
        itemStyle: {
          color: '#67c23a',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' },
          ]),
        },
      },
      {
        name: '题数',
        type: 'line',
        smooth: true,
        data: questionCounts,
        itemStyle: {
          color: '#e6a23c',
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.05)' },
          ]),
        },
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
.trend-chart {
  width: 100%;
  height: 320px;
}
</style>
