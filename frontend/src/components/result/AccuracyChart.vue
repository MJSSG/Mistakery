<template>
  <div class="accuracy-chart">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
      <span v-if="showAverage" class="chart-average">平均: {{ averageAccuracy }}%</span>
    </div>
    <div ref="chartRef" class="chart-container" :style="{ height: `${height}px` }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as echarts from 'echarts';
import { use } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, MarkLineComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([BarChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, CanvasRenderer]);

interface DataPoint {
  name: string;
  correct: number;
  total: number;
  accuracy: number;
}

interface Props {
  title?: string;
  data: DataPoint[];
  height?: number;
  showAverage?: boolean;
  color?: string;
  averageLine?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: '正确率分析',
  height: 300,
  showAverage: true,
  color: 'var(--primary-color)',
});

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

const averageAccuracy = computed(() => {
  if (props.data.length === 0) return 0;
  const sum = props.data.reduce((acc, item) => acc + item.accuracy, 0);
  return (sum / props.data.length).toFixed(1);
});

const initChart = () => {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  if (!chartInstance) return;

  const categories = props.data.map(item => item.name);
  const accuracies = props.data.map(item => item.accuracy);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0];
        const data = props.data[param.dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${data.name}</div>
            <div>正确率: ${data.accuracy}%</div>
            <div>正确: ${data.correct} / ${data.total}</div>
          </div>
        `;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: {
        lineStyle: {
          color: 'var(--color-border)',
        },
      },
      axisLabel: {
        color: 'var(--color-text-secondary)',
        rotate: 30,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: {
        lineStyle: {
          color: 'var(--color-border)',
        },
      },
      axisLabel: {
        color: 'var(--color-text-secondary)',
        formatter: '{value}%',
      },
      splitLine: {
        lineStyle: {
          color: 'var(--color-border-light)',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '正确率',
        type: 'bar',
        data: accuracies,
        itemStyle: {
          color: (params: any) => {
            const accuracy = accuracies[params.dataIndex];
            if (accuracy < 60) return 'var(--danger-color)';
            if (accuracy < 80) return 'var(--warning-color)';
            return props.color;
          },
          borderRadius: [4, 4, 0, 0],
        },
        markLine: props.averageLine !== undefined || props.showAverage ? {
          data: [
            {
              type: 'average',
              name: '平均线',
              value: props.averageLine !== undefined ? props.averageLine : parseFloat(averageAccuracy.value),
              label: {
                formatter: '平均: {c}%',
              },
            },
          ],
          lineStyle: {
            color: 'var(--info-color)',
            type: 'dashed',
          },
          symbol: 'none',
        } : undefined,
        animationDelay: (idx: number) => idx * 100,
      },
    ],
    animationEasing: 'elasticOut',
  };

  chartInstance.setOption(option);
};

const resizeChart = () => {
  chartInstance?.resize();
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', resizeChart);
});

onUnmounted(() => {
  chartInstance?.dispose();
  window.removeEventListener('resize', resizeChart);
});

watch(
  () => props.data,
  () => updateChart(),
  { deep: true },
);

watch(
  () => props.averageLine,
  () => updateChart(),
);
</script>

<style scoped lang="scss">
.accuracy-chart {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.chart-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.chart-average {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.chart-container {
  width: 100%;
}
</style>
