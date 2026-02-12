import { ref, computed, onUnmounted } from 'vue';

export interface TimerOptions {
  initialTime?: number; // 初始时间（秒）
  autoStart?: boolean; // 是否自动开始
  onPause?: () => void; // 暂停回调
  onResume?: () => void; // 恢复回调
  onComplete?: () => void; // 完成回调
  onTick?: (remaining: number) => void; // 每秒回调
}

export function useTimer(options: TimerOptions = {}) {
  const {
    initialTime = 0,
    autoStart = false,
    onPause,
    onResume,
    onComplete,
    onTick,
  } = options;

  // 剩余时间（秒）
  const remaining = ref(initialTime);
  // 是否正在运行
  const isRunning = ref(false);
  // 是否已暂停
  const isPaused = ref(false);
  // 是否已完成
  const isCompleted = ref(false);

  let intervalId: number | null = null;
  let startTime: number | null = null;
  let pausedTime = 0; // 暂停时累积的时间

  // 格式化时间为 HH:MM:SS
  const formattedTime = computed(() => {
    const hours = Math.floor(remaining.value / 3600);
    const minutes = Math.floor((remaining.value % 3600) / 60);
    const seconds = remaining.value % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  });

  // 获取百分比（用于进度条）
  const percentage = computed(() => {
    if (initialTime === 0) return 100;
    return (remaining.value / initialTime) * 100;
  });

  // 是否即将结束（剩余10%或1分钟）
  const isNearEnd = computed(() => {
    if (initialTime === 0) return false;
    return remaining.value <= 60 || percentage.value <= 10;
  });

  // 启动计时器
  const start = () => {
    if (isRunning.value || isCompleted.value) return;

    isRunning.value = true;
    isPaused.value = false;
    startTime = Date.now();

    onResume?.();

    intervalId = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime!) / 1000);
      const newRemaining = initialTime - elapsed - pausedTime;

      if (newRemaining <= 0) {
        remaining.value = 0;
        complete();
      } else {
        remaining.value = newRemaining;
        onTick?.(remaining.value);
      }
    }, 1000);
  };

  // 暂停计时器
  const pause = () => {
    if (!isRunning.value || isPaused.value) return;

    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    isPaused.value = true;
    pausedTime += Math.floor((Date.now() - startTime!) / 1000);
    startTime = null;

    onPause?.();
  };

  // 恢复计时器
  const resume = () => {
    if (!isPaused.value) return;
    start();
  };

  // 停止计时器
  const stop = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }

    isRunning.value = false;
    isPaused.value = false;
    startTime = null;
  };

  // 完成计时器
  const complete = () => {
    stop();
    isCompleted.value = true;
    onComplete?.();
  };

  // 重置计时器
  const reset = (newTime?: number) => {
    stop();
    remaining.value = newTime ?? initialTime;
    isCompleted.value = false;
    isPaused.value = false;
    pausedTime = 0;
    startTime = null;
  };

  // 添加时间（秒）
  const addTime = (seconds: number) => {
    remaining.value += seconds;
  };

  // 设置时间
  const setTime = (seconds: number) => {
    const wasRunning = isRunning.value;
    stop();
    remaining.value = seconds;
    if (wasRunning) {
      start();
    }
  };

  // 清理
  onUnmounted(() => {
    stop();
  });

  return {
    // 状态
    remaining,
    formattedTime,
    isRunning,
    isPaused,
    isCompleted,
    percentage,
    isNearEnd,

    // 方法
    start,
    pause,
    resume,
    stop,
    reset,
    complete,
    addTime,
    setTime,
  };
}
