import { ref, computed } from 'vue';
import { api } from '@/services/api';
import type {
  ReviewStatistics,
  ReviewScheduleResponse,
  DueReviewsResponse,
  ReviewSessionResponse,
  ReviewResultResponse,
  ReviewHistoryResponse,
  LeitnerBox,
} from '@/types/review';

/**
 * 复习系统 Composable
 * 管理错题复习的完整流程
 */
export function useReview() {
  // 状态
  const loading = ref(false);
  const statistics = ref<ReviewStatistics | null>(null);
  const schedule = ref<ReviewScheduleResponse | null>(null);
  const dueReviews = ref<DueReviewsResponse | null>(null);
  const currentSession = ref<ReviewSessionResponse | null>(null);
  const history = ref<ReviewHistoryResponse | null>(null);
  const boxes = ref<LeitnerBox[]>([]);

  // 错误处理
  const error = ref<string | null>(null);

  // 当前复习进度
  const currentProgress = computed(() => {
    if (!currentSession.value) return null;
    return {
      current: currentSession.value.currentIndex + 1,
      total: currentSession.value.totalCount,
      percentage: Math.round(
        ((currentSession.value.currentIndex + 1) / currentSession.value.totalCount) * 100,
      ),
    };
  });

  // 当前复习题目
  const currentQuestion = computed(() => {
    if (!currentSession.value) return null;
    return currentSession.value.items[currentSession.value.currentIndex];
  });

  // 是否有下一题
  const hasNext = computed(() => {
    if (!currentSession.value) return false;
    return currentSession.value.currentIndex < currentSession.value.totalCount - 1;
  });

  // 是否是最后一题
  const isLast = computed(() => {
    if (!currentSession.value) return false;
    return currentSession.value.currentIndex === currentSession.value.totalCount - 1;
  });

  /**
   * 获取复习统计
   */
  async function fetchStatistics() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/review/statistics');
      statistics.value = response.data;
    } catch (err: any) {
      error.value = err.message || '获取统计失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取复习计划
   */
  async function fetchSchedule(days: number = 7, subjectId?: string) {
    loading.value = true;
    error.value = null;
    try {
      const params: any = { days };
      if (subjectId) params.subjectId = subjectId;
      const response = await api.get('/review/schedule', { params });
      schedule.value = response.data;
    } catch (err: any) {
      error.value = err.message || '获取计划失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取待复习错题
   */
  async function fetchDueReviews(options: {
    limit?: number;
    subjectId?: string;
    box?: number;
  } = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/review/due', { params: options });
      dueReviews.value = response.data;
    } catch (err: any) {
      error.value = err.message || '获取待复习错题失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 开始复习会话
   */
  async function startSession(options: {
    count?: number;
    subjectId?: string;
    includeNew?: boolean;
  } = {}) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/review/session/start', options);
      currentSession.value = response.data;
      return response.data;
    } catch (err: any) {
      error.value = err.message || '开始复习失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 提交复习结果
   */
  async function submitResult(
    reviewId: string,
    result: 'correct' | 'incorrect' | 'partially' | 'forgotten',
    options?: {
      difficulty?: 'easy' | 'medium' | 'hard' | 'again';
      timeSpent?: number;
      note?: string;
    },
  ) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post(`/review/${reviewId}/submit`, {
        result,
        ...options,
      });
      return response.data as ReviewResultResponse;
    } catch (err: any) {
      error.value = err.message || '提交结果失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 跳过当前复习
   */
  async function skipReview(reviewId: string) {
    loading.value = true;
    error.value = null;
    try {
      await api.put(`/review/${reviewId}/skip`);
    } catch (err: any) {
      error.value = err.message || '跳过失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 删除复习记录
   */
  async function removeReview(reviewId: string) {
    loading.value = true;
    error.value = null;
    try {
      await api.delete(`/review/${reviewId}`);
    } catch (err: any) {
      error.value = err.message || '删除失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取复习历史
   */
  async function fetchHistory(page: number = 1, limit: number = 20) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/review/history', {
        params: { page, limit },
      });
      history.value = response.data;
    } catch (err: any) {
      error.value = err.message || '获取历史失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取 Leitner 箱子配置
   */
  async function fetchBoxes() {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.get('/review/boxes');
      boxes.value = response.data;
    } catch (err: any) {
      error.value = err.message || '获取箱子配置失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 添加到复习队列
   */
  async function addToReview(mistakeId: string, initialStage?: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/review/add', {
        mistakeId,
        initialStage,
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || '添加失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 批量添加到复习队列
   */
  async function batchAddToReview(mistakeIds: string[], initialStage?: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await api.post('/review/add-batch', {
        mistakeIds,
        initialStage,
      });
      return response.data;
    } catch (err: any) {
      error.value = err.message || '批量添加失败';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 下一题
   */
  function nextQuestion() {
    if (!currentSession.value) return;
    if (hasNext.value) {
      currentSession.value.currentIndex++;
    }
  }

  /**
   * 上一题
   */
  function previousQuestion() {
    if (!currentSession.value) return;
    if (currentSession.value.currentIndex > 0) {
      currentSession.value.currentIndex--;
    }
  }

  /**
   * 跳转到指定题目
   */
  function goToQuestion(index: number) {
    if (!currentSession.value) return;
    if (index >= 0 && index < currentSession.value.totalCount) {
      currentSession.value.currentIndex = index;
    }
  }

  /**
   * 重置会话
   */
  function resetSession() {
    currentSession.value = null;
  }

  return {
    // 状态
    loading,
    statistics,
    schedule,
    dueReviews,
    currentSession,
    history,
    boxes,
    error,

    // 计算属性
    currentProgress,
    currentQuestion,
    hasNext,
    isLast,

    // 方法
    fetchStatistics,
    fetchSchedule,
    fetchDueReviews,
    startSession,
    submitResult,
    skipReview,
    removeReview,
    fetchHistory,
    fetchBoxes,
    addToReview,
    batchAddToReview,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    resetSession,
  };
}
