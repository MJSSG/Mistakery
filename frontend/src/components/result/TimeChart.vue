<template>
  <div class="time-chart">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
      <span v-if="showAverage" class="chart-average">平均: {{ averageTime }}秒</span>
    </div>
    <div ref="chartRef" class="chart-container" :style="{ height: `${height}px` }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as echarts from 'echarts';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, MarkPointComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([LineChart, GridComponent, TooltipComponent, LegendComponent, MarkPointComponent, CanvasRenderer]);

interface DataPoint {
  name: string;
  time: number;
  isCorrect?: boolean;
}

interface Props {
  title?: string;
  data: DataPoint[];
  height?: number;
  showAverage?: boolean;
  color?: string;
  benchmarkTime?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: '答题时间分布',
  height: 300,
  showAverage: true,
  color: 'var(--primary-color)',
});

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

const averageTime = computed(() => {
  if (props.data.length === 0) return 0;
  const sum = props.data.reduce((acc, item) => acc + item.time, 0);
  return Math.round(sum / props.data.length);
});

const initChart = () => {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  if (!chartInstance) return;

  const categories = props.data.map((item, index) => `Q${index + 1}`);
  const times = props.data.map(item => item.time);
  const isCorrect = props.data.map(item => item.isCorrect !== false);

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const param = params[0];
        const data = props.data[param.dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${data.name || `题目 ${param.dataIndex + 1}`}</div>
            <div>用时: ${data.time}秒</div>
            <div>状态: ${data.isCorrect === false ? '错误' : '正确'}</div>
          </div>
        `;
      },
    },
    legend: {
      show: false,
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
      },
    },
    yAxis: {
      type: 'value',
      name: '秒',
      axisLine: {
        lineStyle: {
          color: 'var(--color-border)',
        },
      },
      axisLabel: {
        color: 'var(--color-text-secondary)',
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
        name: '用时',
        type: 'line',
        data: times,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: (params: any) => {
            if (!isCorrect[params.dataIndex]) return 'var(--danger-color)';
            return props.color;
          },
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${props.color}40` },
              { offset: 1, color: `${props.color}05` },
            ],
          },
        },
        markLine: props.benchmarkTime !== undefined ? {
          data: [
            {
              yAxis: props.benchmarkTime,
              name: '基准线',
              label: {
                formatter: '基准: {c}秒',
              },
            },
          ],
          lineStyle: {
            color: 'var(--warning-color)',
            type: 'dashed',
          },
          symbol: 'none',
        } : undefined,
        markPoint: {
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' },
          ],
          label: {
            formatter: '{c}秒',
          },
          itemStyle: {
            color: 'var(--warning-color)',
          },
        },
        animationDuration: 2000,
      },
    ],
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
  () => props.benchmarkTime,
  () => updateChart(),
);
</script>

<style scoped lang="scss">
.time-chart {
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
