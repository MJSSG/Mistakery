import { onMounted, onUnmounted } from 'vue';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
}

type ShortcutMap = Map<string, ShortcutConfig>;

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  enabled: { value: boolean } = { value: true },
) {
  let isEnabled = enabled;

  // 创建快捷键映射
  const shortcutMap: ShortcutMap = new Map();

  shortcuts.forEach((config) => {
    const key = buildShortcutKey(config);
    shortcutMap.set(key, config);
  });

  // 构建快捷键唯一标识
  function buildShortcutKey(config: ShortcutConfig): string {
    const parts: string[] = [];
    if (config.ctrl) parts.push('ctrl');
    if (config.alt) parts.push('alt');
    if (config.shift) parts.push('shift');
    parts.push(config.key.toLowerCase());
    return parts.join('+');
  };

  // 处理键盘事件
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isEnabled.value) return;

    // 忽略在输入框中的按键
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // 如果是 Escape 键，仍然允许
      if (event.key !== 'Escape') {
        return;
      }
    }

    const parts: string[] = [];
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');
    parts.push(event.key.toLowerCase());

    const key = parts.join('+');
    const config = shortcutMap.get(key);

    if (config) {
      event.preventDefault();
      config.handler(event);
    }
  };

  // 启用快捷键
  const enable = () => {
    isEnabled.value = true;
  };

  // 禁用快捷键
  const disable = () => {
    isEnabled.value = false;
  };

  // 获取快捷键列表（用于显示帮助）
  const getShortcutList = () => {
    return Array.from(shortcutMap.values()).map((config) => ({
      key: buildShortcutKey(config),
      description: config.description || '',
    }));
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown);
  });

  return {
    enable,
    disable,
    getShortcutList,
  };
}

// 练习页面专用快捷键组合函数
export function usePracticeShortcuts(options: {
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleAnswerSheet?: () => void;
  onToggleMark?: () => void;
  onToggleFavorite?: () => void;
  onToggleNote?: () => void;
  onToggleDrawing?: () => void;
  onSubmit?: () => void;
  onExit?: () => void;
  onSelectOption?: (index: number) => void;
  enabled?: { value: boolean };
}) {
  const shortcuts: ShortcutConfig[] = [];

  // 方向键 - 上一题/下一题
  if (options.onPrevious) {
    shortcuts.push({
      key: 'ArrowLeft',
      handler: (e) => options.onPrevious?.(),
      description: '上一题',
    });
  }

  if (options.onNext) {
    shortcuts.push({
      key: 'ArrowRight',
      handler: (e) => options.onNext?.(),
      description: '下一题',
    });
  }

  // Alt+C - 答题卡
  if (options.onToggleAnswerSheet) {
    shortcuts.push({
      key: 'c',
      alt: true,
      handler: (e) => options.onToggleAnswerSheet?.(),
      description: '打开答题卡',
    });
  }

  // Alt+M - 标记题目
  if (options.onToggleMark) {
    shortcuts.push({
      key: 'm',
      alt: true,
      handler: (e) => options.onToggleMark?.(),
      description: '标记/取消标记',
    });
  }

  // Alt+F - 收藏题目
  if (options.onToggleFavorite) {
    shortcuts.push({
      key: 'f',
      alt: true,
      handler: (e) => options.onToggleFavorite?.(),
      description: '收藏/取消收藏',
    });
  }

  // Alt+N - 笔记
  if (options.onToggleNote) {
    shortcuts.push({
      key: 'n',
      alt: true,
      handler: (e) => options.onToggleNote?.(),
      description: '打开笔记',
    });
  }

  // Alt+D - 画笔
  if (options.onToggleDrawing) {
    shortcuts.push({
      key: 'd',
      alt: true,
      handler: (e) => options.onToggleDrawing?.(),
      description: '开启/关闭画笔',
    });
  }

  // ESC - 退出全屏
  if (options.onExit) {
    shortcuts.push({
      key: 'Escape',
      handler: (e) => options.onExit?.(),
      description: '退出全屏',
    });
  }

  // 数字键 1-4 - 选择选项
  if (options.onSelectOption) {
    for (let i = 1; i <= 4; i++) {
      shortcuts.push({
        key: String(i),
        handler: (e) => options.onSelectOption?.(i - 1),
        description: `选择选项 ${i}`,
      });
    }
  }

  return useKeyboardShortcuts(shortcuts, options.enabled);
}
