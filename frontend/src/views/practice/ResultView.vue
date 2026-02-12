<template>
  <div class="result-view">
      <!-- 结果头部 -->
      <div class="result-header">
        <div class="header-left">
          <el-button :icon="ArrowLeft" @click="handleBack">返回</el-button>
          <div>
            <h1 class="result-title">{{ examName }}</h1>
            <p class="result-subtitle">练习时间: {{ formatDateTime(examDate) }}</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button :icon="Download" @click="handleExport">导出结果</el-button>
          <el-button type="primary" :icon="RefreshRight" @click="handleRetry">再练一次</el-button>
        </div>
      </div>

      <!-- 总体统计 -->
      <div class="overall-stats">
        <StatCard
          v-for="stat in overallStats"
          :key="stat.label"
          :label="stat.label"
          :value="stat.value"
          :total="stat.total"
          :icon="stat.icon"
          :type="stat.type"
          :show-trend="stat.showTrend"
          :trend="stat.trend"
        />
      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <div class="chart-row">
          <AccuracyChart
            :data="accuracyData"
            :show-average="true"
            :average-line="averageAccuracy"
          />
          <TimeChart
            :data="timeData"
            :show-average="true"
            :benchmark-time="averageTime"
          />
        </div>
        <div class="chart-row">
          <PieChart
            :data="masteryData"
            title="掌握情况分布"
            :show-total="true"
          />
          <PieChart
            :data="subjectData"
            title="科目分布"
            :show-total="false"
          />
        </div>
      </div>

      <!-- 分科统计 -->
      <div class="subject-section">
        <h2 class="section-title">各科成绩</h2>
        <div class="subject-grid">
          <SubjectStatCard
            v-for="subject in subjectStats"
            :key="subject.id"
            :subject="subject"
            :show-details="true"
            @review="handleSubjectReview"
          />
        </div>
      </div>

      <!-- 详细答题记录 -->
      <div class="questions-section">
        <div class="section-header">
          <h2 class="section-title">答题详情</h2>
          <el-button :icon="View" @click="toggleAnswerSheet">
            {{ showAnswerSheet ? '隐藏答题卡' : '显示答题卡' }}
          </el-button>
        </div>

        <div class="questions-layout">
          <!-- 答题卡 -->
          <el-collapse-transition>
            <ResultAnswerSheet
              v-show="showAnswerSheet"
              :questions="answerSheetData"
              @select-question="scrollToQuestion"
            />
          </el-collapse-transition>

          <!-- 题目列表 -->
          <div class="questions-list">
            <div
              v-for="(question, index) in questions"
              :key="question.id"
              :id="`question-${question.id}`"
              class="question-item"
              :class="getQuestionClass(question)"
            >
              <div class="question-header">
                <div class="question-info">
                  <span class="question-index">{{ index + 1 }}.</span>
                  <el-tag
                    :type="getSubjectTagType(question.subject || '未知')"
                    size="small"
                  >
                    {{ question.subject || '未知' }}
                  </el-tag>
                  <el-tag :type="getDifficultyType(question.difficulty || 'medium')" size="small">
                    {{ getDifficultyLabel(question.difficulty || 'medium') }}
                  </el-tag>
                </div>
                <div class="question-status">
                  <el-icon
                    v-if="question.isCorrect"
                    class="status-icon correct"
                  >
                    <CircleCheckFilled />
                  </el-icon>
                  <el-icon
                    v-else-if="question.userAnswer"
                    class="status-icon incorrect"
                  >
                    <CircleCloseFilled />
                  </el-icon>
                  <el-icon v-else class="status-icon unanswered">
                    <WarningFilled />
                  </el-icon>
                  <span class="status-text">{{ getStatusText(question) }}</span>
                </div>
              </div>

              <div class="question-content">
                <div class="question-text">{{ question.question }}</div>

                <div v-if="question.options && question.options.length > 0" class="question-options">
                  <div
                    v-for="(option, optIndex) in question.options"
                    :key="optIndex"
                    class="option-item"
                    :class="getOptionClass(option, question)"
                  >
                    <span class="option-label">{{ option.label }}.</span>
                    <span class="option-text">{{ option.text }}</span>
                    <el-icon v-if="isCorrectOption(option, question)" class="option-correct-icon">
                      <Check />
                    </el-icon>
                    <el-icon v-if="isWrongOption(option, question)" class="option-wrong-icon">
                      <Close />
                    </el-icon>
                  </div>
                </div>

                <div class="question-answer">
                  <div class="answer-row">
                    <span class="answer-label">我的答案:</span>
                    <span
                      class="answer-value"
                      :class="getAnswerValueClass(question)"
                    >
                      {{ question.userAnswer || '未作答' }}
                    </span>
                  </div>
                  <div class="answer-row">
                    <span class="answer-label">正确答案:</span>
                    <span class="answer-value correct">
                      {{ question.correctAnswer }}
                    </span>
                  </div>
                </div>

                <div class="question-meta">
                  <span class="meta-item">
                    <el-icon><Clock /></el-icon>
                    用时: {{ question.timeSpent }}秒
                  </span>
                  <span v-if="question.difficulty === 'hard'" class="meta-item">
                    <el-icon><WarningFilled /></el-icon>
                    困难题目
                  </span>
                  <el-button
                    v-if="!question.isCorrect"
                    type="primary"
                    link
                    size="small"
                    @click="handleAddToMistakeBook(question)"
                  >
                    <el-icon><Collection /></el-icon>
                    加入错题本
                  </el-button>
                </div>

                <!-- 解析区域 -->
                <el-collapse v-model="expandedQuestions">
                  <el-collapse-item :name="question.id">
                    <template #title>
                      <div class="explanation-header">
                        <el-icon><Document /></el-icon>
                        <span>题目解析</span>
                      </div>
                    </template>
                    <div class="explanation-content">
                      <div v-if="question.explanation" class="explanation-text">
                        <h4>解析:</h4>
                        <p>{{ question.explanation }}</p>
                      </div>
                      <div v-if="question.knowledgePoints && question.knowledgePoints.length > 0" class="knowledge-points">
                        <h4>知识点:</h4>
                        <el-tag
                          v-for="(point, idx) in question.knowledgePoints"
                          :key="idx"
                          size="small"
                          style="margin-right: 8px;"
                        >
                          {{ point }}
                        </el-tag>
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft,
  Download,
  RefreshRight,
  View,
  Clock,
  WarningFilled,
  CircleCheckFilled,
  CircleCloseFilled,
  Check,
  Close,
  Document,
  Collection,
  Trophy,
  TrendCharts,
} from '@element-plus/icons-vue';
import StatCard from '@/components/result/StatCard.vue';
import AccuracyChart from '@/components/result/AccuracyChart.vue';
import TimeChart from '@/components/result/TimeChart.vue';
import PieChart from '@/components/result/PieChart.vue';
import SubjectStatCard from '@/components/result/SubjectStatCard.vue';
import ResultAnswerSheet, { type QuestionResult } from '@/components/result/ResultAnswerSheet.vue';
import { usePracticeStore } from '@/stores/practice';
import type { QuestionInfo, QuestionType } from '@/api/practice';

// 扩展题目信息类型，包含运行时添加的属性
interface ResultQuestionInfo {
  id: string;
  type: QuestionType;
  content: string;
  question?: string;
  options?: Array<{ label: string; text: string; value: string }> | string;
  answer?: string;
  analysis: string;
  knowledgePoints?: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
  masteryLevel: 'unknown' | 'familiar' | 'mastered';
  subjectId: string;
  // Runtime properties
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  userAnswer?: string;
  isCorrect?: boolean;
  correctAnswer?: string;
  timeSpent?: number;
  explanation?: string;
}

const router = useRouter();
const route = useRoute();
const practiceStore = usePracticeStore();

const recordId = route.params.id as string;
const showAnswerSheet = ref(true);
const expandedQuestions = ref<string[]>([]);

// 结果数据
const loading = ref(true);
const examName = ref('');
const examDate = ref('');
const questions = ref<ResultQuestionInfo[]>([]);

const overallStats = computed(() => [
  {
    label: '总题数',
    value: questions.value.length,
    icon: Trophy,
    type: 'count' as const,
  },
  {
    label: '正确',
    value: questions.value.filter(q => q.isCorrect).length,
    icon: Check,
    type: 'count' as const,
  },
  {
    label: '错误',
    value: questions.value.filter(q => q.userAnswer && !q.isCorrect).length,
    icon: Close,
    type: 'count' as const,
  },
  {
    label: '正确率',
    value: averageAccuracy.value,
    icon: TrendCharts,
    type: 'percent' as const,
  },
  {
    label: '总用时',
    value: totalTime.value,
    icon: Clock,
    type: 'time' as const,
  },
]);

const totalTime = computed(() => {
  return questions.value.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
});

const averageAccuracy = computed(() => {
  if (questions.value.length === 0) return 0;
  const correctCount = questions.value.filter(q => q.isCorrect).length;
  return Math.round((correctCount / questions.value.length) * 100);
});

const averageTime = computed(() => {
  if (questions.value.length === 0) return 0;
  return Math.round(totalTime.value / questions.value.length);
});

const accuracyData = computed(() => {
  const grouped = groupBySubject();
  return Object.entries(grouped).map(([subject, qs]) => ({
    name: subject,
    correct: qs.filter(q => q.isCorrect).length,
    total: qs.length,
    accuracy: qs.length > 0
      ? Math.round((qs.filter(q => q.isCorrect).length / qs.length) * 100)
      : 0,
  }));
});

const timeData = computed(() => {
  return questions.value.map((q, index) => ({
    name: `题目${index + 1}`,
    time: q.timeSpent || 0,
    isCorrect: q.isCorrect,
  }));
});

const masteryData = computed(() => [
  { name: '已掌握', value: masteryCount('mastered'), color: '#67C23A' },
  { name: '熟练', value: masteryCount('proficient'), color: '#409EFF' },
  { name: '学习中', value: masteryCount('learning'), color: '#E6A23C' },
  { name: '困难', value: masteryCount('struggling'), color: '#F56C6C' },
]);

const subjectData = computed(() => {
  const grouped = groupBySubject();
  return Object.entries(grouped).map(([subject, qs]) => ({
    name: subject,
    value: qs.length,
  }));
});

const subjectStats = computed(() => {
  const grouped = groupBySubject();
  return Object.entries(grouped).map(([subject, qs], index) => ({
    id: `subject-${index}`,
    name: subject,
    type: getSubjectType(subject) as any,
    total: qs.length,
    correct: qs.filter(q => q.isCorrect).length,
    incorrect: qs.filter(q => q.userAnswer && !q.isCorrect).length,
    accuracy: qs.length > 0
      ? Math.round((qs.filter(q => q.isCorrect).length / qs.length) * 100)
      : 0,
    completed: qs.filter(q => q.userAnswer).length,
    totalTime: qs.reduce((sum, q) => sum + (q.timeSpent || 0), 0),
  }));
});

const answerSheetData = computed<QuestionResult[]>(() => {
  return questions.value.map((q, index) => ({
    id: q.id,
    index: index + 1,
    subject: q.subject || '未知',
    isCorrect: q.isCorrect ?? null,
    isAnswered: !!q.userAnswer,
    marked: false,
  }));
});

const groupBySubject = () => {
  const grouped: Record<string, ResultQuestionInfo[]> = {};
  questions.value.forEach(q => {
    const subject = q.subject || '未知';
    if (!grouped[subject]) {
      grouped[subject] = [];
    }
    grouped[subject].push(q);
  });
  return grouped;
};

const masteryCount = (level: string) => {
  // 简化的逻辑，实际应根据错题本数据
  const difficultyMap: Record<string, string> = {
    easy: 'mastered',
    medium: 'proficient',
    hard: 'struggling',
  };
  return questions.value.filter(q =>
    q.difficulty && difficultyMap[q.difficulty] === level
  ).length;
};

const getSubjectType = (subject: string) => {
  const typeMap: Record<string, string> = {
    数学: 'math',
    英语: 'english',
    语文: 'chinese',
    物理: 'science',
    化学: 'science',
  };
  return typeMap[subject] || 'other';
};

const getSubjectTagType = (subject: string) => {
  const typeMap: Record<string, any> = {
    数学: 'primary',
    英语: 'success',
    语文: 'warning',
    物理: 'danger',
    化学: 'info',
  };
  return typeMap[subject] || 'info';
};

const getDifficultyLabel = (difficulty: string) => {
  const labels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  return labels[difficulty] || '未知';
};

const getDifficultyType = (difficulty: string) => {
  const types: Record<string, any> = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger',
  };
  return types[difficulty] || 'info';
};

const getQuestionClass = (question: ResultQuestionInfo) => {
  if (!question.userAnswer) return 'is-unanswered';
  if (question.isCorrect) return 'is-correct';
  return 'is-incorrect';
};

const getStatusText = (question: ResultQuestionInfo) => {
  if (!question.userAnswer) return '未作答';
  if (question.isCorrect) return '正确';
  return '错误';
};

const getAnswerValueClass = (question: ResultQuestionInfo) => {
  if (!question.userAnswer) return 'unanswered';
  if (question.isCorrect) return 'correct';
  return 'incorrect';
};

const getOptionClass = (option: any, question: ResultQuestionInfo) => {
  const isUserAnswer = option.label === question.userAnswer;
  const isCorrectAnswer = option.label === question.correctAnswer;

  if (isCorrectAnswer) return 'is-correct-option';
  if (isUserAnswer && !isCorrectAnswer) return 'is-wrong-option';
  return '';
};

const isCorrectOption = (option: any, question: ResultQuestionInfo) => {
  return option.label === question.correctAnswer;
};

const isWrongOption = (option: any, question: ResultQuestionInfo) => {
  return option.label === question.userAnswer && option.label !== question.correctAnswer;
};

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toggleAnswerSheet = () => {
  showAnswerSheet.value = !showAnswerSheet.value;
};

const scrollToQuestion = (questionId: string) => {
  const element = document.getElementById(`question-${questionId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

const handleSubjectReview = (subjectId: string) => {
  // 导航到该科目的复习页面
  router.push(`/review/subject/${subjectId}`);
};

const handleBack = () => {
  router.back();
};

const handleExport = async () => {
  try {
    // TODO: 实现导出功能
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败');
  }
};

const handleRetry = () => {
  // 重新开始练习
  router.push(`/practice/${recordId}`);
};

const handleAddToMistakeBook = async (question: ResultQuestionInfo) => {
  try {
    // TODO: 调用API添加到错题本
    ElMessage.success('已加入错题本');
  } catch (error) {
    ElMessage.error('加入错题本失败');
  }
};

onMounted(async () => {
  try {
    const result = await practiceStore.fetchResult(recordId);
    examName.value = result.examRecord.examName;
    examDate.value = result.examRecord.completedAt;
    // Transform answers to questions format
    questions.value = result.answers.map(a => ({
      ...a.question,
      subject: a.question.subjectId, // Use subjectId as subject
      difficulty: a.question.difficultyLevel,
      userAnswer: a.userAnswer,
      isCorrect: a.isCorrect,
      correctAnswer: a.correctAnswer,
      timeSpent: a.timeSpent,
      options: a.question.options ? (typeof a.question.options === 'string' ? JSON.parse(a.question.options) : a.question.options) : undefined,
    })) as ResultQuestionInfo[];
  } catch (error: any) {
    ElMessage.error(error.message || '加载结果失败');
    router.back();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.result-view {
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.result-title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.result-subtitle {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.overall-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.charts-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--spacing-lg);
}

.subject-section {
  margin-bottom: var(--spacing-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.subject-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-md);
}

.questions-section {
  margin-bottom: var(--spacing-xl);
}

.questions-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-lg);
  align-items: start;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.question-item {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  transition: all var(--transition-fast);

  &.is-correct {
    border-left: 4px solid var(--success-color);
  }

  &.is-incorrect {
    border-left: 4px solid var(--danger-color);
  }

  &.is-unanswered {
    border-left: 4px solid var(--warning-color);
  }
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-light);
}

.question-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.question-index {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.question-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-icon {
  font-size: 20px;

  &.correct {
    color: var(--success-color);
  }

  &.incorrect {
    color: var(--danger-color);
  }

  &.unanswered {
    color: var(--warning-color);
  }
}

.status-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.question-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.question-text {
  font-size: var(--font-size-md);
  color: var(--color-text-primary);
  line-height: 1.6;
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-sm);
  position: relative;

  &.is-correct-option {
    background: rgba(103, 194, 58, 0.1);
    border: 1px solid var(--success-color);
  }

  &.is-wrong-option {
    background: rgba(245, 108, 108, 0.1);
    border: 1px solid var(--danger-color);
  }
}

.option-label {
  font-weight: var(--font-weight-medium);
  flex-shrink: 0;
}

.option-text {
  flex: 1;
}

.option-correct-icon {
  position: absolute;
  right: var(--spacing-sm);
  color: var(--success-color);
  font-size: 18px;
}

.option-wrong-icon {
  position: absolute;
  right: var(--spacing-sm);
  color: var(--danger-color);
  font-size: 18px;
}

.question-answer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
}

.answer-row {
  display: flex;
  gap: var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.answer-label {
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.answer-value {
  flex: 1;

  &.correct {
    color: var(--success-color);
  }

  &.incorrect {
    color: var(--danger-color);
  }

  &.unanswered {
    color: var(--warning-color);
  }
}

.question-meta {
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--primary-color);
}

.explanation-content {
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);

  h4 {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  p {
    margin: 0 0 var(--spacing-md) 0;
    color: var(--color-text-primary);
    line-height: 1.6;
  }
}

.knowledge-points {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

@media (max-width: $breakpoint-xl) {
  .questions-layout {
    grid-template-columns: 1fr;
  }

  .chart-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: $breakpoint-md) {
  .result-view {
    padding: var(--spacing-md);
  }

  .overall-stats {
    grid-template-columns: 1fr 1fr;
  }

  .subject-grid {
    grid-template-columns: 1fr;
  }
}
</style>
