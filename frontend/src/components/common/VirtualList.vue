<template>
  <div
    class="virtual-list"
    :style="{ height: `${containerHeight}px` }"
    @scroll="handleScroll"
    ref="containerRef"
  >
    <div
      class="virtual-list-spacer"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        class="virtual-list-content"
        :style="{ transform: `translateY(${offset}px)` }"
      >
        <div
          v-for="item in visibleData"
          :key="getKey(item)"
          class="virtual-list-item"
          :style="{ height: `${itemHeight}px` }"
        >
          <slot :item="item" :index="visibleData.indexOf(item)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { throttle } from '@/utils/performance';

interface Props {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  getKey?: (item: any) => string | number;
  buffer?: number; // 额外渲染的项目数
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 50,
  containerHeight: 400,
  getKey: (item: any) => item.id || item.key,
  buffer: 5,
});

const emit = defineEmits<{
  (e: 'visible-change', data: { start: number; end: number }): void;
}>();

const containerRef = ref<HTMLElement>();

const totalHeight = computed(() => props.items.length * props.itemHeight);

const visibleStart = ref(0);
const visibleEnd = ref(0);
const visibleData = ref<any[]>([]);

const offset = computed(() => visibleStart.value * props.itemHeight);

/**
 * 计算可见范围
 */
function calculateVisibleRange() {
  if (!containerRef.value) return;

  const scrollTop = containerRef.value.scrollTop;
  const containerHeight = props.containerHeight;
  const itemCount = props.items.length;

  // 计算可见的起始和结束索引
  const start = Math.max(0, Math.floor(scrollTop / props.itemHeight) - props.buffer);
  const end = Math.min(
    itemCount,
    Math.ceil((scrollTop + containerHeight) / props.itemHeight) + props.buffer
  );

  visibleStart.value = start;
  visibleEnd.value = end;

  // 更新可见数据
  visibleData.value = props.items.slice(start, end);

  // 触发可见变化事件
  emit('visible-change', { start, end });
}

/**
 * 处理滚动事件（使用节流）
 */
const handleScroll = throttle(() => {
  calculateVisibleRange();
}, 16); // 60fps

/**
 * 滚动到指定索引
 */
function scrollToIndex(index: number) {
  if (!containerRef.value) return;

  const targetScroll = index * props.itemHeight;
  containerRef.value.scrollTo({
    top: targetScroll,
    behavior: 'smooth',
  });
}

/**
 * 获取滚动位置
 */
function getScrollTop(): number {
  return containerRef.value?.scrollTop || 0;
}

/**
 * 暴露方法给父组件
 */
defineExpose({
  scrollToIndex,
  getScrollTop,
});
</script>

<style scoped lang="scss">
.virtual-list {
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

.virtual-list-spacer {
  position: relative;
}

.virtual-list-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.virtual-list-item {
  box-sizing: border-box;
  width: 100%;
}
</style>
