/**
 * 性能优化工具函数
 */

/**
 * 防抖函数 - 在事件被触发 n 毫秒后再执行回调
 * 如果在这 n 毫秒内又被触发，则重新计时
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 节流函数 - 在单位时间内只执行一次回调
 * 如果在单位时间内被触发多次，也只有一次生效
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, delay - (now - lastCall));
    }
  };
}

/**
 * 请求缓存装饰器
 * 用于缓存 API 请求结果，避免重复请求
 */
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
}

const cache = new Map<string, { data: any; expiry: number }>();

export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions = {}
): T {
  const { ttl = 5 * 60 * 1000, key } = options;

  return (async function (...args: any[]) {
    const cacheKey = key || JSON.stringify(args);

    // 检查缓存
    const cached = cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    // 执行原函数
    const result = await fn.apply(this, args);

    // 存入缓存
    cache.set(cacheKey, {
      data: result,
      expiry: Date.now() + ttl,
    });

    return result;
  }) as T;
}

/**
 * 清除缓存
 */
export function clearCache(pattern?: string): void {
  if (pattern) {
    // 按模式清除缓存
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // 清除所有缓存
    cache.clear();
  }
}

/**
 * 图片懒加载指令
 * 使用 Intersection Observer API
 */
export const lazyLoadDirective = {
  mounted(el: HTMLImageElement, binding: any) {
    const loadImage = () => {
      el.src = binding.value;
      el.classList.add('loaded');
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImage();
          observer.unobserve(el);
        }
      });
    }, {
      rootMargin: '50px',
    });

    observer.observe(el);
  },
};

/**
 * 虚拟滚动列表工具
 * 用于处理长列表的性能优化
 */
export class VirtualScroll<T> {
  private containerHeight: number;
  private itemHeight: number;
  private items: T[];
  private scrollTop = 0;
  private visibleStart = 0;
  private visibleEnd = 0;

  constructor(
    containerHeight: number,
    itemHeight: number,
    items: T[]
  ) {
    this.containerHeight = containerHeight;
    this.itemHeight = itemHeight;
    this.items = items;
  }

  /**
   * 更新滚动位置
   */
  updateScroll(scrollTop: number) {
    this.scrollTop = scrollTop;
    this.calculateVisibleRange();
  }

  /**
   * 计算可见范围
   */
  private calculateVisibleRange() {
    this.visibleStart = Math.floor(this.scrollTop / this.itemHeight);
    this.visibleEnd = Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight);
  }

  /**
   * 获取可见数据
   */
  getVisibleData() {
    const start = Math.max(0, this.visibleStart - 5); // 额外加载5个
    const end = Math.min(this.items.length, this.visibleEnd + 5); // 额外加载5个

    return {
      data: this.items.slice(start, end),
      start,
      end,
    };
  }

  /**
   * 更新数据
   */
  updateItems(items: T[]): void {
    this.items = items;
    this.calculateVisibleRange();
  }

  /**
   * 获取总高度
   */
  getTotalHeight(): number {
    return this.items.length * this.itemHeight;
  }

  /**
   * 获取偏移量
   */
  getOffset(): number {
    return this.visibleStart * this.itemHeight;
  }
}

/**
 * 批量请求优化
 * 将多个单独请求合并为一个批量请求
 */
export async function batchRequest<T, R>(
  items: T[],
  requestFn: (batch: T[]) => Promise<R[]>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await requestFn(batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * 优先级请求调度器
 * 确保高优先级请求优先处理
 */
export class PriorityScheduler {
  private queue: Array<{
    fn: () => Promise<any>;
    priority: number;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];

  private running = 0;
  private maxConcurrent = 5;

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * 添加请求到队列
   */
  add<T>(
    fn: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, priority, resolve, reject });
      this.queue.sort((a, b) => b.priority - a.priority);
      this.process();
    });
  }

  /**
   * 处理队列
   */
  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift()!;

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }
}

// 全局请求调度器实例
export const requestScheduler = new PriorityScheduler(5);
