<template>
  <div class="practice-view" :class="{ 'is-fullscreen': isFullscreen }">
      <!-- 顶部状态栏 -->
      <div class="practice-header">
        <div class="header-left">
          <el-button :icon="ArrowLeft" @click="handleExit" circle />
          <h1 class="practice-title">{{ examName }}</h1>
        </div>

        <div class="header-center">
          <QuestionProgress
            v-if="showProgress"
            :current-index="currentQuestionIndex"
            :total="questions.length"
            :show-time="true"
            :elapsed-time="elapsedTime"
          />
        </div>

        <div class="header-right">
          <!-- 限时倒计时 -->
          <Timer
            v-if="timeLimit > 0"
            ref="timerRef"
            :initial-time="timeLimit * 60"
            :auto-start="true"
            :show-controls="false"
            @complete="handleTimeUp"
            @tick="handleTimerTick"
          />

          <el-button :icon="FullScreen" @click="toggleFullscreen" circle />
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="practice-content">
        <!-- 题目卡片 -->
        <div class="question-container">
          <AppLoading v-if="loading" />
          <AppEmpty v-else-if="questions.length === 0" description="没有找到题目" />
          <QuestionCard
            v-else
            :index="currentQuestionIndex"
            :question="currentQuestion"
            :user-answer="currentAnswer"
            :show-favorite="true"
            :is-favorite="isQuestionFavorited"
            :show-time-spent="showTimeSpent"
            :time-spent="currentQuestionTimeSpent"
            @update:user-answer="handleAnswer"
            @toggle-favorite="handleToggleFavorite"
            @show-note="handleShowNote"
          />
        </div>

        <!-- 工具栏 -->
        <PracticeToolbar
          :answered-count="answeredCount"
          :is-marked="isQuestionMarked"
          :is-favorited="isQuestionFavorited"
          :has-note="hasQuestionNote"
          :has-drawing="hasDrawing"
          :show-auto-jump="true"
          :auto-jump="autoJump"
          @toggle-answer-sheet="showAnswerSheetModal = true"
          @toggle-mark="handleToggleMark"
          @toggle-favorite="handleToggleFavorite"
          @toggle-note="handleShowNote"
          @toggle-drawing="handleToggleDrawing"
          @toggle-calculator="handleToggleCalculator"
          @auto-jump-change="handleAutoJumpChange"
        />
      </div>

      <!-- 导航按钮 -->
      <div class="practice-navigation">
        <el-button
          size="large"
          :disabled="currentQuestionIndex === 0"
          @click="goToPrevious"
        >
          <el-icon><ArrowLeft /></el-icon>
          上一题
        </el-button>

        <div class="navigation-info">
          <span class="question-number">{{ currentQuestionIndex + 1 }}</span>
          <span class="divider">/</span>
          <span class="total-number">{{ questions.length }}</span>
        </div>

        <el-button
          v-if="currentQuestionIndex < questions.length - 1"
          type="primary"
          size="large"
          @click="goToNext"
        >
          下一题
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button
          v-else
          type="success"
          size="large"
          @click="handleSubmit"
        >
          交卷
          <el-icon><Check /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 画布层 -->
    <DrawingCanvas
      v-model="drawingData"
      ref="drawingCanvasRef"
      :enabled="drawingEnabled"
      :options="drawingOptions"
      @draw-start="onDrawStart"
      @draw-end="onDrawEnd"
      @clear="onDrawClear"
    />

    <!-- 画笔工具栏 -->
    <DrawingToolbar
      v-if="drawingEnabled"
      v-model:mode="drawingOptions.mode"
      v-model:color="drawingOptions.color"
      v-model:lineWidth="drawingOptions.lineWidth"
      v-model:opacity="drawingOptions.opacity"
      :can-undo="drawingCanvasRef?.canUndo ?? false"
      :can-redo="drawingCanvasRef?.canRedo ?? false"
      @undo="drawingCanvasRef?.undo?.()"
      @redo="drawingCanvasRef?.redo?.()"
      @clear="drawingCanvasRef?.clear?.()"
      @save="handleSaveDrawing"
      @close="handleToggleDrawing"
    />

    <!-- 计算器面板 -->
    <div v-if="showCalculator" class="calculator-panel">
      <SimpleCalculator ref="calculatorRef" />
      <el-button
        :icon="Close"
        circle
        size="small"
        class="calculator-close"
        @click="showCalculator = false"
      />
    </div>

    <!-- 草稿面板 -->
    <DraftNotePanel
      ref="draftPanelRef"
      @open="handleOpenDraft"
    />

    <!-- 笔记编辑器 -->
    <NoteEditor
      v-model:visible="showNoteEditor"
      :model-value="currentNote"
      @update:model-value="handleNoteChange"
      @save="handleSaveNote"
    />

    <!-- 答题卡弹窗 -->
    <AnswerSheet
      v-model:visible="showAnswerSheetModal"
      :questions="questions"
      :current-index="currentQuestionIndex"
      :answers="answers"
      :marked="marks"
      @go-to-question="goToQuestion"
      @submit="handleSubmit"
    />

    <!-- 交卷确认对话框 -->
    <el-dialog
      v-model="showSubmitDialog"
      title="确认交卷"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="submit-dialog-content">
        <el-icon class="submit-icon"><WarningFilled /></el-icon>
        <div class="submit-info">
          <p>你还有 <strong>{{ unansweredCount }}</strong> 道题未完成</p>
          <p>确定要交卷吗？</p>
        </div>
      </div>

      <template #footer>
        <el-button @click="showSubmitDialog = false">继续答题</el-button>
        <el-button type="primary" @click="confirmSubmit">
          确认交卷
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FullScreen,
  WarningFilled,
  Close,
} from '@element-plus/icons-vue';
import AppLoading from '@/components/common/AppLoading.vue';
import AppEmpty from '@/components/common/AppEmpty.vue';
import QuestionProgress from '@/components/practice/QuestionProgress.vue';
import QuestionCard from '@/components/practice/QuestionCard.vue';
import PracticeToolbar from '@/components/practice/PracticeToolbar.vue';
import AnswerSheet from '@/components/practice/AnswerSheet.vue';
import Timer from '@/components/practice/Timer.vue';
import DrawingCanvas from '@/components/practice/DrawingCanvas.vue';
import DrawingToolbar from '@/components/practice/DrawingToolbar.vue';
import NoteEditor from '@/components/practice/NoteEditor.vue';
import SimpleCalculator from '@/components/common/SimpleCalculator.vue';
import DraftNotePanel from '@/components/common/DraftNotePanel.vue';
import { usePracticeStore } from '@/stores/practice';
import { usePracticeShortcuts } from '@/composables/useKeyboardShortcuts';
import type { QuestionInfo, type DrawingOptions } from '@/api/practice';

const router = useRouter();
const route = useRoute();
const practiceStore = usePracticeStore();

const examId = route.params.id as string;
const loading = ref(true);
const isFullscreen = ref(false);
const showAnswerSheetModal = ref(false);
const showSubmitDialog = ref(false);
const timerRef = ref();

// 画布相关
const drawingEnabled = ref(false);
const drawingData = ref('');
const drawingCanvasRef = ref<InstanceType<typeof DrawingCanvas> | null>(null);
const hasDrawing = ref(false);
const drawingOptions = ref<DrawingOptions>({
  color: '#ff6e00',
  lineWidth: 3,
  mode: 'draw',
  opacity: 1,
});

// 计算器
const showCalculator = ref(false);
const calculatorRef = ref<InstanceType<typeof SimpleCalculator> | null>(null);

// 草稿
const draftPanelRef = ref<InstanceType<typeof DraftNotePanel> | null>(null);

// 笔记编辑器
const showNoteEditor = ref(false);

// 设置
const showProgress = ref(true);
const showTimeSpent = ref(true);
const autoJump = ref(false);

// 练习信息
const examName = ref('');
const questions = ref<QuestionInfo[]>([]);
const currentQuestionIndex = ref(0);
const answers = ref<Map<string, string>>(new Map());
const favorites = ref<Set<string>>(new Set());
const marks = ref<Set<string>>(new Set());
const notes = ref<Map<string, string>>(new Map());

// 时间信息
const timeLimit = ref(0);
const elapsedTime = ref(0);
const questionStartTime = ref(0);
const questionTimeSpent = ref<Map<string, number>>(new Map());

// 定时器
let timeInterval: number | null = null;
let timeoutCheckInterval: number | null = null;

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] || null);

const currentAnswer = computed(() => {
  if (!currentQuestion.value) return '';
  return answers.value.get(currentQuestion.value.id) || '';
});

const currentNote = computed(() => {
  if (!currentQuestion.value) return '';
  return notes.value.get(currentQuestion.value.id) || '';
});

const currentQuestionTimeSpent = computed(() => {
  if (!currentQuestion.value) return 0;
  return questionTimeSpent.value.get(currentQuestion.value.id) || 0;
});

const answeredCount = computed(() => answers.value.size);
const unansweredCount = computed(() => questions.value.length - answeredCount.value);
const markedCount = computed(() => marks.value.size);

const isQuestionFavorited = computed(() => {
  if (!currentQuestion.value) return false;
  return favorites.value.has(currentQuestion.value.id);
});

const isQuestionMarked = computed(() => {
  if (!currentQuestion.value) return false;
  return marks.value.has(currentQuestion.value.id);
});

const hasQuestionNote = computed(() => {
  if (!currentQuestion.value) return false;
  const note = notes.value.get(currentQuestion.value.id);
  return !!note && note.length > 0;
});

// 快捷键控制
const shortcutsEnabled = ref(true);

usePracticeShortcuts({
  onNext: () => goToNext(),
  onPrevious: () => goToPrevious(),
  onToggleAnswerSheet: () => { showAnswerSheetModal.value = true; },
  onToggleMark: () => handleToggleMark(),
  onToggleFavorite: () => handleToggleFavorite(),
  onToggleNote: () => handleShowNote(),
  onToggleDrawing: () => handleToggleDrawing(),
  onToggleCalculator: () => { showCalculator.value = !showCalculator.value; },
  onSubmit: () => handleSubmit(),
  onExit: () => { if (isFullscreen.value) toggleFullscreen(); },
  onSelectOption: (index) => handleSelectOptionByShortcut(index),
  enabled: shortcutsEnabled,
});

// 初始化
onMounted(async () => {
  await initPractice();
  startTimer();
  loadSettings();
});

onUnmounted(() => {
  stopTimer();
  stopTimeoutCheck();
  saveSettings();
});

// 加载设置
const loadSettings = () => {
  const savedSettings = localStorage.getItem('practiceSettings');
  if (savedSettings) {
    try {
      const settings = JSON.parse(savedSettings);
      showProgress.value = settings.showProgress ?? true;
      showTimeSpent.value = settings.showTimeSpent ?? true;
      autoJump.value = settings.autoJump ?? false;
      if (settings.drawingOptions) {
        drawingOptions.value = { ...drawingOptions.value, ...settings.drawingOptions };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
};

// 保存设置
const saveSettings = () => {
  const settings = {
    showProgress: showProgress.value,
    showTimeSpent: showTimeSpent.value,
    autoJump: autoJump.value,
    drawingOptions: drawingOptions.value,
  };
  localStorage.setItem('practiceSettings', JSON.stringify(settings));
};

const initPractice = async () => {
  loading.value = true;
  try {
    const exam = await practiceStore.fetchExamById(examId);
    examName.value = exam.name;
    timeLimit.value = exam.timeLimit || 0;

    const response = await practiceStore.startExam(examId, { shuffleAnswers: false });
    questions.value = response.questions;

    if (response.isResume) {
      const progress = await practiceStore.fetchProgress(response.examRecordId);
      progress.answers.forEach((answer) => {
        if (answer.userAnswer) {
          answers.value.set(answer.questionId, answer.userAnswer);
        }
        if (answer.isFavorite) {
          favorites.value.add(answer.questionId);
        }
        if (answer.note) {
          notes.value.set(answer.questionId, answer.note);
        }
      });
    }

    if (timeLimit.value > 0) {
      startTimeoutCheck();
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载练习失败');
    router.back();
  } finally {
    loading.value = false;
  }
};

// 启动计时器
const startTimer = () => {
  questionStartTime.value = Date.now();
  timeInterval = window.setInterval(() => {
    elapsedTime.value++;
    updateQuestionTimeSpent();
  }, 1000);
};

// 停止计时器
const stopTimer = () => {
  if (timeInterval !== null) {
    clearInterval(timeInterval);
    timeInterval = null;
  }
};

// 停止超时检查
const stopTimeoutCheck = () => {
  if (timeoutCheckInterval !== null) {
    clearInterval(timeoutCheckInterval);
    timeoutCheckInterval = null;
  }
};

// 更新当前题目用时
const updateQuestionTimeSpent = () => {
  if (!currentQuestion.value) return;
  const spent = Math.floor((Date.now() - questionStartTime.value) / 1000);
  const prevSpent = questionTimeSpent.value.get(currentQuestion.value.id) || 0;
  questionTimeSpent.value.set(currentQuestion.value.id, prevSpent + 1);
};

// 启动超时检查
const startTimeoutCheck = () => {
  timeoutCheckInterval = window.setInterval(async () => {
    await checkTimeout();
  }, 30000);
};

// 检查是否超时
const checkTimeout = async () => {
  if (!practiceStore.currentExamRecord) return;

  try {
    const response = await practiceStore.checkTimeout(practiceStore.currentExamRecord.id);

    if (response.hasTimeout) {
      stopTimer();
      stopTimeoutCheck();
      ElMessage.warning('答题时间已到，系统已自动交卷');
      router.push(`/practice/record/${practiceStore.currentExamRecord.id}`);
    }
  } catch (error: any) {
    console.error('Failed to check timeout:', error);
  }
};

// 判断题目是否已答
const isAnswered = (index: number) => {
  const question = questions.value[index];
  return question ? answers.value.has(question.id) : false;
};

// 判断题目是否已标记
const isMarked = (index: number) => {
  const question = questions.value[index];
  return question ? marks.value.has(question.id) : false;
};

// 答题
const handleAnswer = (value: string) => {
  if (!currentQuestion.value) return;

  const oldAnswer = answers.value.get(currentQuestion.value.id);
  answers.value.set(currentQuestion.value.id, value);

  if (!oldAnswer) {
    saveAnswer(currentQuestion.value.id, value);
  } else {
    debouncedSaveAnswer(currentQuestion.value.id, value);
  }

  // 自动跳转下一题
  if (autoJump.value && currentQuestionIndex.value < questions.value.length - 1) {
    setTimeout(() => goToNext(), 300);
  }
};

// 快捷键选择选项
const handleSelectOptionByShortcut = (index: number) => {
  if (!currentQuestion.value) return;

  const optionLetters = ['A', 'B', 'C', 'D'];
  if (index < optionLetters.length) {
    handleAnswer(optionLetters[index]);
  }
};

// 保存答案
const saveAnswer = async (questionId: string, answer: string) => {
  try {
    const timeSpent = questionTimeSpent.value.get(questionId) || 0;
    await practiceStore.submitAnswer(practiceStore.currentExamRecord!.id, questionId, answer, timeSpent);
  } catch (error: any) {
    console.error('Failed to save answer:', error);
  }
};

// 防抖保存
let saveTimeout: number | null = null;
const debouncedSaveAnswer = (questionId: string, answer: string) => {
  if (saveTimeout !== null) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = window.setTimeout(() => {
    saveAnswer(questionId, answer);
  }, 1000);
};

// 切换收藏
const handleToggleFavorite = async () => {
  if (!currentQuestion.value) return;

  if (favorites.value.has(currentQuestion.value.id)) {
    favorites.value.delete(currentQuestion.value.id);
  } else {
    favorites.value.add(currentQuestion.value.id);
  }

  try {
    await practiceStore.toggleFavorite(practiceStore.currentExamRecord!.id, currentQuestion.value.id);
  } catch (error: any) {
    console.error('Failed to toggle favorite:', error);
  }
};

// 切换标记
const handleToggleMark = () => {
  if (!currentQuestion.value) return;

  if (marks.value.has(currentQuestion.value.id)) {
    marks.value.delete(currentQuestion.value.id);
  } else {
    marks.value.add(currentQuestion.value.id);
  }
};

// 切换画布
const handleToggleDrawing = () => {
  drawingEnabled.value = !drawingEnabled.value;
  if (drawingEnabled.value) {
    shortcutsEnabled.value = false;
  } else {
    shortcutsEnabled.value = true;
  }
};

// 切换计算器
const handleToggleCalculator = () => {
  showCalculator.value = !showCalculator.value;
};

// 画布事件
const onDrawStart = () => {
  shortcutsEnabled.value = false;
};

const onDrawEnd = () => {
  hasDrawing.value = true;
  saveDrawingToQuestion();
};

const onDrawClear = () => {
  hasDrawing.value = false;
  saveDrawingToQuestion();
};

// 保存画布到题目
const saveDrawingToQuestion = async () => {
  if (!currentQuestion.value) return;

  try {
    // 保存画布数据到后端（如果需要）
    // await practiceStore.saveDrawing(practiceStore.currentExamRecord!.id, currentQuestion.value.id, drawingData.value);
  } catch (error: any) {
    console.error('Failed to save drawing:', error);
  }
};

// 保存画布
const handleSaveDrawing = () => {
  if (drawingCanvasRef.value) {
    drawingCanvasRef.value.downloadImage(`画布-第${currentQuestionIndex.value + 1}题.png`);
  }
};

// 显示笔记
const handleShowNote = () => {
  if (!currentQuestion.value) return;
  showNoteEditor.value = true;
  showAnswerSheetModal.value = false;
  showCalculator.value = false;
};

// 笔记变化
const handleNoteChange = (content: string) => {
  if (!currentQuestion.value) return;

  if (content) {
    notes.value.set(currentQuestion.value.id, content);
  } else {
    notes.value.delete(currentQuestion.value.id);
  }
};

// 保存笔记
const handleSaveNote = async (content: string) => {
  if (!currentQuestion.value) return;

  handleNoteChange(content);

  try {
    await practiceStore.addNote(
      practiceStore.currentExamRecord!.id,
      currentQuestion.value.id,
      content
    );
  } catch (error: any) {
    console.error('Failed to save note:', error);
  }
};

// 打开草稿
const handleOpenDraft = (draft: any) => {
  showNoteEditor.value = true;
  if (draft.content) {
    handleNoteChange(draft.content);
  }
};

// 自动跳转设置变化
const handleAutoJumpChange = (value: boolean) => {
  autoJump.value = value;
  saveSettings();
};

// 导航
const goToPrevious = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
    questionStartTime.value = Date.now();
  }
};

const goToNext = () => {
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    questionStartTime.value = Date.now();
  }
};

const goToQuestion = (index: number) => {
  currentQuestionIndex.value = index;
  questionStartTime.value = Date.now();
  showAnswerSheetModal.value = false;
};

// 全屏切换
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  if (isFullscreen.value) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
};

// 退出练习
const handleExit = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出练习吗？进度将会保存，可稍后继续。',
      '确认退出',
      { type: 'warning' }
    );
    router.back();
  } catch {
    // 取消退出
  }
};

// 时间到
const handleTimeUp = async () => {
  try {
    await ElMessageBox.alert(
      '答题时间已到，系统将自动交卷',
      '时间到',
      { type: 'warning' }
    );
    await doSubmit();
  } catch {
    // 对话框关闭
  }
};

const handleTimerTick = (remaining: number) => {
  if (remaining === 60) {
    ElMessage.warning('还有1分钟，请抓紧时间！');
  } else if (remaining === 300) {
    ElMessage.info('还有5分钟');
  }
};

// 交卷
const handleSubmit = () => {
  if (unansweredCount.value > 0) {
    showSubmitDialog.value = true;
  } else {
    confirmSubmit();
  }
};

const confirmSubmit = async () => {
  showSubmitDialog.value = false;
  await doSubmit();
};

const doSubmit = async () => {
  try {
    stopTimer();
    stopTimeoutCheck();

    const result = await practiceStore.submitExam(
      practiceStore.currentExamRecord!.id,
      { force: true }
    );

    ElMessage.success('交卷成功！');
    router.push(`/practice/record/${practiceStore.currentExamRecord!.id}`);
  } catch (error: any) {
    ElMessage.error(error.message || '交卷失败');
    startTimer();
  }
};
</script>

<style scoped lang="scss">
.practice-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-light);

  &.is-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }
}

.practice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-white);
  border-bottom: 1px solid var(--color-border);
  gap: var(--spacing-lg);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-shrink: 0;
}

.practice-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

.header-center {
  flex: 1;
  max-width: 600px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.practice-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: var(--spacing-md);
  gap: var(--spacing-md);
}

.question-container {
  flex: 1;
  overflow-y: auto;
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.practice-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.navigation-info {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  font-weight: var(--font-weight-semibold);

  .question-number {
    font-size: var(--font-size-xxl);
    color: var(--primary-color);
  }

  .divider {
    color: var(--color-text-secondary);
  }

  .total-number {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
  }
}

// 计算器面板
.calculator-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1001;
  animation: fadeIn 0.3s ease-out;
}

.calculator-close {
  position: absolute;
  top: -12px;
  right: -12px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

.submit-dialog-content {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-start;
}

.submit-icon {
  font-size: 48px;
  color: var(--warning-color);
  flex-shrink: 0;
}

.submit-info {
  flex: 1;

  p {
    margin: 0 0 var(--spacing-sm);

    &:last-child {
      margin-bottom: 0;
    }

    strong {
      color: var(--warning-color);
      font-size: var(--font-size-xl);
    }
  }
}

@media (max-width: $breakpoint-md) {
  .practice-header {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .header-center {
    order: 3;
    width: 100%;
    max-width: none;
  }

  .practice-title {
    max-width: 150px;
  }

  .practice-navigation {
    .navigation-info {
      display: none;
    }
  }

  .practice-content {
    padding: var(--spacing-sm);
  }

  .question-container {
    padding: var(--spacing-md);
  }
}
</style>
