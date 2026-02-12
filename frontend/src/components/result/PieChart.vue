<template>
  <div class="pie-chart">
    <div class="chart-header">
      <span class="chart-title">{{ title }}</span>
      <span v-if="showTotal" class="chart-total">总计: {{ total }}</span>
    </div>
    <div ref="chartRef" class="chart-container" :style="{ height: `${height}px` }">
      <div v-if="data.length === 0" class="chart-empty">
        <el-empty description="暂无数据" :image-size="80" />
      </div>
    </div>
    <div v-if="showLegend && data.length > 0" class="chart-legend">
      <div
        v-for="(item, index) in data"
        :key="index"
        class="legend-item"
        @click="toggleSeries(index)"
      >
        <span class="legend-color" :style="{ backgroundColor: getColor(index) }"></span>
        <span class="legend-label">{{ item.name }}</span>
        <span class="legend-value">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import * as echarts from 'echarts';
import { use } from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface DataItem {
  name: string;
  value: number;
  color?: string;
}

interface Props {
  title?: string;
  data: DataItem[];
  height?: number;
  showTotal?: boolean;
  showLegend?: boolean;
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: '掌握情况',
  height: 300,
  showTotal: true,
  showLegend: true,
  innerRadius: 0,
  outerRadius: 75,
});

const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

const defaultColors = [
  'var(--primary-color)',
  'var(--success-color)',
  'var(--warning-color)',
  'var(--danger-color)',
  'var(--info-color)',
];

const total = computed(() => {
  return props.data.reduce((acc, item) => acc + item.value, 0);
});

const getColor = (index: number): string => {
  return props.data[index]?.color || props.colors?.[index] || defaultColors[index % defaultColors.length];
};

const initChart = () => {
  if (!chartRef.value) return;

  chartInstance = echarts.init(chartRef.value);
  updateChart();
};

const updateChart = () => {
  if (!chartInstance) return;

  if (props.data.length === 0) {
    chartInstance.clear();
    return;
  }

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      show: false,
    },
    series: [
      {
        type: 'pie',
        radius: [`${props.innerRadius}%`, `${props.outerRadius}%`],
        center: ['50%', '50%'],
        data: props.data.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: getColor(index),
            borderRadius: 4,
          },
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
          },
          scale: true,
          scaleSize: 10,
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          color: 'var(--color-text-primary)',
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 20,
          lineStyle: {
            color: 'var(--color-text-secondary)',
          },
        },
        animationType: 'expansion',
        animationEasing: 'elasticOut',
      },
    ],
  };

  chartInstance.setOption(option);
};

const toggleSeries = (index: number) => {
  if (!chartInstance) return;
  const option = chartInstance.getOption() as any;
  const selected = option.series[0].data.map((_: any, i: number) => i === index ? !option.series[0].selected : option.series[0].selected);
  chartInstance.dispatchAction({
    type: 'pieToggleSelect',
    seriesIndex: 0,
    dataIndex: index,
  });
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
</script>

<style scoped lang="scss">
.pie-chart {
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

.chart-total {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.chart-container {
  width: 100%;
  position: relative;
}

.chart-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  text-align: center;
}

.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-light);
  }
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.legend-value {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}
</style>
