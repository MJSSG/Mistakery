<template>
  <div class="drawing-canvas" :class="{ 'is-enabled': enabled }">
    <canvas
      ref="canvasRef"
      class="canvas-layer"
      @pointerdown.passive="handlePointerDown"
      @pointermove.passive="handlePointerMove"
      @pointerup.passive="handlePointerUp"
      @pointerleave.passive="handlePointerUp"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useDrawing, type DrawingOptions } from '@/composables/useDrawing';

interface Props {
  modelValue?: string; // base64 图片数据
  enabled?: boolean;
  options?: DrawingOptions;
  backgroundColor?: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'draw-start'): void;
  (e: 'draw-end'): void;
  (e: 'clear'): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  enabled: true,
  options: () => ({}),
  backgroundColor: 'transparent',
});

const emit = defineEmits<Emits>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

const {
  isDrawing,
  color,
  lineWidth,
  mode,
  opacity,
  canUndo,
  canRedo,
  undo,
  redo,
  clear,
  exportImage,
  downloadImage,
  setColor,
  setLineWidth,
  setMode,
  setOpacity,
  initCanvas,
} = useDrawing(canvasRef, props.options);

// 初始化
onMounted(() => {
  // 应用初始选项
  if (props.options.color) {
    setColor(props.options.color);
  }
  if (props.options.lineWidth) {
    setLineWidth(props.options.lineWidth);
  }
  if (props.options.mode) {
    setMode(props.options.mode);
  }
  if (props.options.opacity !== undefined) {
    setOpacity(props.options.opacity);
  }
});

// 监听图片数据变化
watch(() => props.modelValue, (newValue) => {
  if (newValue && canvasRef.value && !isDrawing.value) {
    const ctx = canvasRef.value.getContext('2d');
    if (ctx) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = newValue;
    }
  }
}, { immediate: true });

// 监听背景色变化
watch(() => props.backgroundColor, () => {
  if (canvasRef.value) {
    canvasRef.value.style.backgroundColor = props.backgroundColor;
  }
}, { immediate: true });

// 指针事件处理
const handlePointerDown = (e: PointerEvent) => {
  if (!props.enabled) return;
  e.preventDefault();
  emit('draw-start');
};

const handlePointerMove = (e: PointerEvent) => {
  if (!props.enabled) return;
  e.preventDefault();
};

const handlePointerUp = () => {
  if (!props.enabled) return;
  emit('draw-end');
  // 导出当前画布内容
  const imageData = exportImage();
  if (imageData) {
    emit('update:modelValue', imageData);
  }
};

// 对外暴露方法
defineExpose({
  undo,
  redo,
  clear,
  exportImage,
  downloadImage,
  setColor,
  setLineWidth,
  setMode,
  setOpacity,
  initCanvas,
  canUndo,
  canRedo,
  isDrawing,
  color,
  lineWidth,
  mode,
  opacity,
});
</script>

<style scoped lang="scss">
.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;

  &.is-enabled {
    pointer-events: auto;
  }
}

.canvas-layer {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}
</style>
