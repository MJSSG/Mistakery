<template>
  <div class="review-session">
      <!-- 会话头部 -->
      <div class="session-header">
        <el-button :icon="ArrowLeft" @click="handleBack">返回</el-button>
        <div class="header-info">
          <h1 class="session-title">错题复习</h1>
          <div v-if="session" class="session-meta">
            <span class="meta-item">
              <el-icon><Document /></el-icon>
              总计 {{ session.totalCount }} 题
            </span>
            <span class="meta-item">
              <el-icon><Clock /></el-icon>
              {{ formatTime(elapsedTime) }}
            </span>
          </div>
        </div>
      </div>

      <!-- 加载状态 -->
      <AppLoading v-if="loading && !session" />

      <!-- 准备开始 -->
      <div v-else-if="!session" class="session-start">
        <el-empty description="暂无待复习的错题">
          <template #image>
            <el-icon :size="80" color="var(--color-text-secondary)">
              <Finished />
            </el-icon>
          </template>
          <el-button type="primary" @click="goToMistakeBook">
            去错题本添加
          </el-button>
        </el-empty>
      </div>

      <!-- 复习进行中 -->
      <div v-else class="session-content">
        <!-- 进度条 -->
        <ReviewProgress
          :current="progress.current"
          :total="progress.total"
          :percentage="progress.percentage"
          :elapsed-time="elapsedTime"
          :show-time="true"
          @jump="goToQuestion"
        />

        <!-- 题目卡片 -->
        <div class="question-card">
          <div class="question-header">
            <el-tag :type="getQuestionTypeColor()" size="small">
              {{ getQuestionTypeLabel() }}
            </el-tag>
            <el-tag size="small">第 {{ currentQuestion?.currentBox }} 箱</el-tag>
          </div>

          <div class="question-content">
            <h2 class="question-text">{{ currentQuestion?.question }}</h2>
          </div>

          <!-- 答案选项 -->
          <div v-if="options" class="question-options">
            <div
              v-for="(option, index) in options"
              :key="index"
              class="option-item"
              :class="{ 'is-selected': selectedAnswer === index }"
              @click="selectAnswer(index)"
            >
              <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
              <span class="option-text">{{ option }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="session-actions">
          <el-button
            size="large"
            :disabled="progress.current === 1"
            @click="previousQuestion"
          >
            <el-icon><ArrowLeft /></el-icon>
            上一题
          </el-button>

          <el-button
            v-if="!showFeedback"
            type="primary"
            size="large"
            :disabled="!hasAnswer"
            @click="showFeedback = true"
          >
            提交答案
            <el-icon><ArrowRight /></el-icon>
          </el-button>

          <el-button
            v-else
            type="primary"
            size="large"
            @click="handleSubmit"
          >
            确认反馈
          </el-button>

          <el-button
            size="large"
            :disabled="!hasNext"
            @click="nextQuestion"
          >
            下一题
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>

        <!-- 反馈面板 -->
        <el-dialog
          v-model="showFeedback"
          title="复习反馈"
          width="500px"
          :close-on-click-modal="false"
          :close-on-press-escape="false"
        >
          <ReviewFeedback
            :current-box="currentQuestion?.currentBox || 1"
            :submitting="submitting"
            @submit="handleFeedbackSubmit"
            @cancel="showFeedback = false"
          />
        </el-dialog>

        <!-- 完成对话框 -->
        <el-dialog
          v-model="showComplete"
          title="复习完成"
          width="500px"
          :close-on-click-modal="false"
          :show-close="false"
        >
          <div class="complete-content">
            <div class="complete-icon">
              <el-icon :size="60" color="#67c23a">
                <CircleCheckFilled />
              </el-icon>
            </div>
            <h3>恭喜完成本次复习！</h3>

            <div class="complete-stats">
              <div class="stat-item">
                <div class="stat-value">{{ completedCount }}</div>
                <div class="stat-label">复习题数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ correctCount }}</div>
                <div class="stat-label">正确数量</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ accuracy }}%</div>
                <div class="stat-label">正确率</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ formatTime(elapsedTime) }}</div>
                <div class="stat-label">用时</div>
              </div>
            </div>

            <div class="complete-actions">
              <el-button @click="handleReturn">返回列表</el-button>
              <el-button type="primary" @click="handleStartNew">继续复习</el-button>
            </div>
          </div>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeft,
  ArrowRight,
  Document,
  Clock,
  Finished,
  CircleCheckFilled,
} from '@element-plus/icons-vue';
import AppLoading from '@/components/common/AppLoading.vue';
import ReviewProgress from '@/components/review/ReviewProgress.vue';
import ReviewFeedback from '@/components/review/ReviewFeedback.vue';
import { useReview } from '@/composables/useReview';
import { ElMessage } from 'element-plus';
import type { ReviewSessionItem } from '@/types/review';

const router = useRouter();
const {
  loading,
  currentSession,
  startSession,
  submitResult,
  nextQuestion,
  previousQuestion,
  goToQuestion,
  resetSession,
} = useReview();

// Alias for template compatibility
const session = computed(() => currentSession.value);

// 状态
const elapsedTime = ref(0);
const selectedAnswer = ref<number | null>(null);
const showFeedback = ref(false);
const showComplete = ref(false);
const submitting = ref(false);
const timerInterval = ref<number | null>(null);

// 统计
const completedCount = ref(0);
const correctCount = ref(0);

// 当前题目
const currentQuestion = computed<ReviewSessionItem | null>(() => {
  if (!currentSession.value) return null;
  return currentSession.value.items[currentSession.value.currentIndex];
});

// 进度
const progress = computed(() => {
  if (!currentSession.value) return { current: 0, total: 0, percentage: 0 };
  return {
    current: currentSession.value.currentIndex + 1,
    total: currentSession.value.totalCount,
    percentage: Math.round(
      ((currentSession.value.currentIndex + 1) / currentSession.value.totalCount) * 100,
    ),
  };
});

// 是否有下一题
const hasNext = computed(() => {
  if (!currentSession.value) return false;
  return currentSession.value.currentIndex < currentSession.value.totalCount - 1;
});

// 是否已选择答案
const hasAnswer = computed(() => selectedAnswer.value !== null);

// 选项
const options = computed(() => {
  if (!currentQuestion.value?.options) return null;
  return currentQuestion.value.options.split('\n').filter((o) => o.trim());
});

// 正确率
const accuracy = computed(() => {
  if (completedCount.value === 0) return 0;
  return Math.round((correctCount.value / completedCount.value) * 100);
});

/**
 * 格式化时间
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 获取题目类型颜色
 */
function getQuestionTypeColor(): string {
  // TODO: 从题目获取类型
  return 'primary';
}

/**
 * 获取题目类型标签
 */
function getQuestionTypeLabel(): string {
  // TODO: 从题目获取类型
  return '选择题';
}

/**
 * 选择答案
 */
function selectAnswer(index: number) {
  selectedAnswer.value = index;
}

/**
 * 处理反馈提交
 */
async function handleFeedbackSubmit(data: any) {
  if (!currentQuestion.value) return;

  submitting.value = true;

  try {
    await submitResult(currentQuestion.value.reviewId, data.result, {
      difficulty: data.difficulty,
    });

    // 更新统计
    completedCount.value++;
    if (data.result === 'correct') {
      correctCount.value++;
    }

    showFeedback.value = false;
    selectedAnswer.value = null;

    // 检查是否完成
    if (!hasNext.value) {
      showComplete.value = true;
    } else {
      // 自动跳到下一题
      nextQuestion();
    }

    ElMessage.success('反馈已记录');
  } catch (err: any) {
    ElMessage.error(err.message || '提交失败');
  } finally {
    submitting.value = false;
  }
}

/**
 * 提交答案（显示反馈面板）
 */
function handleSubmit() {
  // 答案已选择，显示反馈面板
  showFeedback.value = true;
}

/**
 * 返回
 */
function handleBack() {
  if (elapsedTime.value > 10) {
    // 已复习一段时间，确认退出
    router.back();
  } else {
    router.push('/review');
  }
}

/**
 * 返回列表
 */
function handleReturn() {
  showComplete.value = false;
  resetSession();
  router.push('/review');
}

/**
 * 开始新的复习
 */
async function handleStartNew() {
  showComplete.value = false;
  completedCount.value = 0;
  correctCount.value = 0;
  elapsedTime.value = 0;
  await startSession();
}

/**
 * 去错题本
 */
function goToMistakeBook() {
  router.push('/mistake');
}

/**
 * 启动计时器
 */
function startTimer() {
  timerInterval.value = window.setInterval(() => {
    elapsedTime.value++;
  }, 1000);
}

/**
 * 停止计时器
 */
function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }
}

onMounted(async () => {
  await startSession();
  startTimer();
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped lang="scss">
.review-session {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.session-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.header-info {
  flex: 1;
}

.session-title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--spacing-xs);
}

.session-meta {
  display: flex;
  gap: var(--spacing-lg);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.session-start {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xxl) 0;
}

.session-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.question-card {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
}

.question-header {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.question-content {
  margin-bottom: var(--spacing-lg);
}

.question-text {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  color: var(--color-text-primary);
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.option-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border: 2px solid transparent;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--color-white);
    border-color: var(--primary-color);
  }

  &.is-selected {
    background: var(--primary-color-light);
    border-color: var(--primary-color);
  }
}

.option-label {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
}

.option-text {
  flex: 1;
  color: var(--color-text-primary);
}

.session-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

.complete-content {
  text-align: center;
}

.complete-icon {
  margin-bottom: var(--spacing-md);
}

.complete-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xl);
  margin: var(--spacing-xl) 0;
}

.stat-item {
  .stat-value {
    font-size: var(--font-size-xxl);
    font-weight: var(--font-weight-bold);
    color: var(--primary-color);
  }

  .stat-label {
    margin-top: var(--spacing-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}

.complete-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}
</style>
