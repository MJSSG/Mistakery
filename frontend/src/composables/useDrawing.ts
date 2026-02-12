import { ref, computed, onMounted, onUnmounted } from 'vue';

export interface DrawingOptions {
  color?: string;
  lineWidth?: number;
  mode?: 'draw' | 'erase';
  opacity?: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: DrawingPoint[];
  color: string;
  lineWidth: number;
  mode: 'draw' | 'erase';
  opacity: number;
}

export const useDrawing = (canvasRef: Ref<HTMLCanvasElement | null>, options: DrawingOptions = {}) => {
  const ctx = ref<CanvasRenderingContext2D | null>(null);
  const isDrawing = ref(false);
  const currentPath = ref<DrawingPoint[]>([]);

  // 画笔设置
  const color = ref(options.color || '#ff6e00');
  const lineWidth = ref(options.lineWidth || 3);
  const mode = ref<'draw' | 'erase'>(options.mode || 'draw');
  const opacity = ref(options.opacity ?? 1);

  // 历史记录
  const history = ref<DrawingPath[]>([]);
  const historyIndex = ref(-1);

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  // 获取画布尺寸
  const getCanvasSize = () => {
    if (!canvasRef.value) return { width: 0, height: 0 };
    const rect = canvasRef.value.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

  // 初始化画布
  const initCanvas = () => {
    if (!canvasRef.value) return;

    const canvas = canvasRef.value;
    ctx.value = canvas.getContext('2d');

    if (!ctx.value) return;

    // 设置画布实际尺寸
    const { width, height } = getCanvasSize();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.value.scale(dpr, dpr);

    // 设置默认样式
    ctx.value.lineCap = 'round';
    ctx.value.lineJoin = 'round';

    // 恢复历史记录
    redraw();
  };

  // 获取鼠标/触摸位置
  const getPosition = (event: MouseEvent | TouchEvent): DrawingPoint => {
    if (!canvasRef.value) return { x: 0, y: 0 };

    const rect = canvasRef.value.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // 开始绘制
  const startDrawing = (event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    isDrawing.value = true;
    currentPath.value = [getPosition(event)];
  };

  // 绘制
  const draw = (event: MouseEvent | TouchEvent) => {
    if (!isDrawing.value || !ctx.value) return;
    event.preventDefault();

    const point = getPosition(event);
    currentPath.value.push(point);

    const points = currentPath.value;
    if (points.length < 2) return;

    ctx.value.beginPath();
    ctx.value.strokeStyle = mode.value === 'erase' ? '#ffffff' : color.value;
    ctx.value.lineWidth = mode.value === 'erase' ? lineWidth.value * 3 : lineWidth.value;
    ctx.value.globalAlpha = opacity.value;

    const prev = points[points.length - 2];
    ctx.value.moveTo(prev.x, prev.y);
    ctx.value.lineTo(point.x, point.y);
    ctx.value.stroke();
  };

  // 结束绘制
  const stopDrawing = () => {
    if (!isDrawing.value) return;
    isDrawing.value = false;

    // 保存当前路径到历史记录
    if (currentPath.value.length > 1) {
      // 删除当前位置之后的历史记录（如果有）
      history.value = history.value.slice(0, historyIndex.value + 1);

      // 添加新路径
      history.value.push({
        points: [...currentPath.value],
        color: color.value,
        lineWidth: lineWidth.value,
        mode: mode.value,
        opacity: opacity.value
      });

      historyIndex.value = history.value.length - 1;
    }

    currentPath.value = [];
  };

  // 重绘所有路径
  const redraw = () => {
    if (!ctx.value) return;

    const { width, height } = getCanvasSize();
    ctx.value.clearRect(0, 0, width, height);

    history.value.forEach((path) => {
      if (path.points.length < 2) return;

      ctx.value!.beginStroke();
      ctx.value!.strokeStyle = path.mode === 'erase' ? '#ffffff' : path.color;
      ctx.value!.lineWidth = path.mode === 'erase' ? path.lineWidth * 3 : path.lineWidth;
      ctx.value!.globalAlpha = path.opacity;

      ctx.value!.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.value!.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.value!.stroke();
    });

    ctx.value.globalAlpha = 1;
  };

  // 撤销
  const undo = () => {
    if (!canUndo.value) return;
    historyIndex.value--;
    redraw();
  };

  // 重做
  const redo = () => {
    if (!canRedo.value) return;
    historyIndex.value++;
    redraw();
  };

  // 清空画布
  const clear = () => {
    history.value = [];
    historyIndex.value = -1;
    if (ctx.value) {
      const { width, height } = getCanvasSize();
      ctx.value.clearRect(0, 0, width, height);
    }
  };

  // 导出为图片
  const exportImage = (format: 'png' | 'jpeg' = 'png'): string | null => {
    if (!canvasRef.value) return null;
    return canvasRef.value.toDataURL(`image/${format}`);
  };

  // 下载图片
  const downloadImage = (filename: string = 'drawing.png') => {
    const dataUrl = exportImage();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  // 设置颜色
  const setColor = (newColor: string) => {
    color.value = newColor;
  };

  // 设置线宽
  const setLineWidth = (newWidth: number) => {
    lineWidth.value = Math.max(1, Math.min(20, newWidth));
  };

  // 设置模式
  const setMode = (newMode: 'draw' | 'erase') => {
    mode.value = newMode;
  };

  // 设置透明度
  const setOpacity = (newOpacity: number) => {
    opacity.value = Math.max(0.1, Math.min(1, newOpacity));
  };

  // 事件监听
  const attachListeners = () => {
    if (!canvasRef.value) return;

    const canvas = canvasRef.value;

    // 鼠标事件
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    // 触摸事件
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchcancel', stopDrawing);

    // 右键禁用
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  };

  // 移除事件监听
  const detachListeners = () => {
    if (!canvasRef.value) return;

    const canvas = canvasRef.value;
    canvas.removeEventListener('mousedown', startDrawing);
    canvas.removeEventListener('mousemove', draw);
    canvas.removeEventListener('mouseup', stopDrawing);
    canvas.removeEventListener('mouseleave', stopDrawing);
    canvas.removeEventListener('touchstart', startDrawing);
    canvas.removeEventListener('touchmove', draw);
    canvas.removeEventListener('touchend', stopDrawing);
    canvas.removeEventListener('touchcancel', stopDrawing);
  };

  // 监听窗口大小变化
  let resizeObserver: ResizeObserver | null = null;
  const observeResize = () => {
    if (!canvasRef.value) return;

    resizeObserver = new ResizeObserver(() => {
      const { width, height } = getCanvasSize();
      if (canvasRef.value) {
        const dpr = window.devicePixelRatio || 1;
        canvasRef.value.width = width * dpr;
        canvasRef.value.height = height * dpr;
        canvasRef.value.style.width = `${width}px`;
        canvasRef.value.style.height = `${height}px`;

        if (ctx.value) {
          ctx.value.scale(dpr, dpr);
          ctx.value.lineCap = 'round';
          ctx.value.lineJoin = 'round';
          redraw();
        }
      }
    });

    resizeObserver.observe(canvasRef.value);
  };

  onMounted(() => {
    setTimeout(() => {
      initCanvas();
      attachListeners();
      observeResize();
    }, 100);
  });

  onUnmounted(() => {
    detachListeners();
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
  });

  return {
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
  };
};
