<template>
  <div class="answer-analysis-view">
    <!-- 顶部导航 -->
    <div class="analysis-header">
      <el-button link @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <div class="header-title">
        <h2>答案解析</h2>
        <span class="question-index">第 {{ currentIndex + 1 }} / {{ totalQuestions }} 题</span>
      </div>
      <div class="header-actions">
        <el-button @click="toggleNotes" :type="hasNotes ? 'primary' : 'default'">
          <el-icon><Document /></el-icon>
          笔记 {{ notesCount > 0 ? `(${notesCount})` : '' }}
        </el-button>
        <el-button @click="toggleFavorite">
          <el-icon><Star /></el-icon>
          {{ isFavorite ? '已收藏' : '收藏' }}
        </el-button>
      </div>
    </div>

    <div class="analysis-content">
      <!-- 主内容区 -->
      <div class="main-section">
        <!-- 题目卡片 -->
        <el-card class="question-card">
          <div class="question-header">
            <el-tag :type="getSubjectTagType(question.subject)" size="small">
              {{ question.subject || '未分类' }}
            </el-tag>
            <el-tag :type="getDifficultyTagType(question.difficulty)" size="small">
              {{ getDifficultyText(question.difficulty) }}
            </el-tag>
            <el-tag :type="getStatusTagType(question.status)" size="small">
              {{ getStatusText(question.status) }}
            </el-tag>
          </div>

          <!-- 题目内容 -->
          <div class="question-content">
            <div class="question-text" v-html="question.questionText"></div>

            <!-- 选项 -->
            <div v-if="isChoiceQuestion()" class="options-list">
              <div
                v-for="(option, index) in question.options"
                :key="index"
                class="option-item"
                :class="{
                  'option-correct': isCorrectAnswer(index),
                  'option-wrong': isWrongAnswer(index),
                  'option-selected': isSelectedAnswer(index),
                }"
              >
                <span class="option-label">{{ getOptionLabel(index) }}</span>
                <span class="option-text" v-html="option"></span>
                <el-icon v-if="isCorrectAnswer(index)" class="option-icon correct">
                  <CircleCheckFilled />
                </el-icon>
                <el-icon v-if="isWrongAnswer(index)" class="option-icon wrong">
                  <CircleCloseFilled />
                </el-icon>
              </div>
            </div>

            <!-- 判断题选项 -->
            <div v-if="question.type === 'boolean'" class="boolean-options">
              <div
                class="boolean-option"
                :class="{
                  'option-correct': question.correctAnswer === 'true',
                  'option-selected': userAnswer === 'true',
                }"
              >
                <span>正确</span>
                <el-icon v-if="question.correctAnswer === 'true'" class="option-icon correct">
                  <CircleCheckFilled />
                </el-icon>
              </div>
              <div
                class="boolean-option"
                :class="{
                  'option-correct': question.correctAnswer === 'false',
                  'option-selected': userAnswer === 'false',
                }"
              >
                <span>错误</span>
                <el-icon v-if="question.correctAnswer === 'false'" class="option-icon correct">
                  <CircleCheckFilled />
                </el-icon>
              </div>
            </div>
          </div>

          <!-- 用户答案统计 -->
          <div v-if="showStats" class="answer-stats">
            <div class="stat-item">
              <span class="stat-label">你的答案：</span>
              <span class="stat-value" :class="{ 'correct': isCorrect, 'wrong': !isCorrect }">
                {{ getUserAnswerText() }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">正确答案：</span>
              <span class="stat-value correct">{{ getCorrectAnswerText() }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">用时：</span>
              <span class="stat-value">{{ formatTime(question.timeSpent || 0) }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">答题时间：</span>
              <span class="stat-value">{{ formatDate(question.answeredAt) }}</span>
            </div>
          </div>
        </el-card>

        <!-- 答案解析卡片 -->
        <el-card class="analysis-card">
          <template #header>
            <div class="card-header">
              <el-icon><ChatLineRound /></el-icon>
              <span>答案解析</span>
            </div>
          </template>

          <div class="analysis-content">
            <div v-if="question.analysis" class="analysis-text" v-html="question.analysis"></div>
            <div v-else class="no-analysis">
              <el-empty description="暂无解析" :image-size="80" />
            </div>

            <!-- 知识点 -->
            <div v-if="question.knowledgePoints && question.knowledgePoints.length > 0" class="knowledge-points">
              <div class="points-label">相关知识点：</div>
              <el-tag
                v-for="point in question.knowledgePoints"
                :key="point"
                size="small"
                class="point-tag"
              >
                {{ point }}
              </el-tag>
            </div>

            <!-- 来源 -->
            <div v-if="question.source" class="question-source">
              <span class="source-label">题目来源：</span>
              <span class="source-value">{{ question.source }}</span>
            </div>
          </div>
        </el-card>

        <!-- 错因分析卡片（仅错题显示） -->
        <el-card v-if="!isCorrect" class="mistake-reason-card">
          <template #header>
            <div class="card-header">
              <el-icon><WarningFilled /></el-icon>
              <span>错因分析</span>
            </div>
          </template>

          <div class="reason-content">
            <el-radio-group v-model="selectedReason" @change="handleReasonChange">
              <el-radio value="concept">概念理解错误</el-radio>
              <el-radio value="calculation">计算错误</el-radio>
              <el-radio value="careless">粗心大意</el-radio>
              <el-radio value="method">方法不当</el-radio>
              <el-radio value="time">时间不够</el-radio>
              <el-radio value="other">其他原因</el-radio>
            </el-radio-group>

            <el-input
              v-model="reasonDetail"
              type="textarea"
              :rows="3"
              placeholder="请详细记录错误原因，帮助后续复习..."
              class="reason-detail"
              @blur="saveReasonDetail"
            />
          </div>
        </el-card>

        <!-- 相关题目推荐 -->
        <el-card v-if="relatedQuestions.length > 0" class="related-card">
          <template #header>
            <div class="card-header">
              <el-icon><Link /></el-icon>
              <span>相关题目</span>
            </div>
          </template>

          <div class="related-list">
            <div
              v-for="related in relatedQuestions"
              :key="related.id"
              class="related-item"
              @click="viewRelatedQuestion(related.id)"
            >
              <div class="related-info">
                <span class="related-subject">{{ related.subject }}</span>
                <span class="related-text">{{ related.questionText.substring(0, 50) }}...</span>
              </div>
              <el-icon class="related-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 侧边栏：笔记面板 -->
      <div class="side-section" :class="{ 'collapsed': !showNotesPanel }">
        <el-card class="notes-card">
          <template #header>
            <div class="notes-header">
              <div class="header-left">
                <el-icon><EditPen /></el-icon>
                <span>我的笔记</span>
              </div>
              <el-button link @click="toggleNotes">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </template>

          <div class="notes-content">
            <el-input
              v-model="noteContent"
              type="textarea"
              :rows="12"
              placeholder="记录你的学习心得、解题思路或重点笔记..."
              class="notes-textarea"
              @blur="saveNotes"
            />

            <div class="notes-toolbar">
              <el-button size="small" @click="saveNotes">
                <el-icon><Check /></el-icon>
                保存
              </el-button>
              <el-button size="small" @click="clearNotes">
                <el-icon><Delete /></el-icon>
                清空
              </el-button>
            </div>

            <!-- 历史笔记 -->
            <div v-if="notesHistory.length > 0" class="notes-history">
              <div class="history-header">历史记录</div>
              <div class="history-list">
                <div
                  v-for="(note, index) in notesHistory"
                  :key="index"
                  class="history-item"
                >
                  <div class="history-time">{{ formatNoteTime(note.createdAt) }}</div>
                  <div class="history-text">{{ note.content }}</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 底部导航 -->
    <div class="analysis-footer">
      <el-button size="large" :disabled="currentIndex === 0" @click="previousQuestion">
        <el-icon><ArrowLeft /></el-icon>
        上一题
      </el-button>
      <div class="footer-info">
        <el-button link @click="jumpToQuestion">跳转</el-button>
      </div>
      <el-button
        size="large"
        type="primary"
        :disabled="currentIndex === totalQuestions - 1"
        @click="nextQuestion"
      >
        下一题
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  ArrowLeft,
  ArrowRight,
  Document,
  Star,
  CircleCheckFilled,
  CircleCloseFilled,
  ChatLineRound,
  WarningFilled,
  Link,
  EditPen,
  Close,
  Check,
  Delete,
} from '@element-plus/icons-vue';
import { api } from '@/services/api';

const router = useRouter();
const route = useRoute();

// 当前题目索引
const currentIndex = ref(0);
const totalQuestions = ref(0);
const questions = ref<any[]>([]);

// 当前题目
const question = ref<any>({});
const userAnswer = ref('');
const isCorrect = ref(false);

// 笔记
const showNotesPanel = ref(false);
const noteContent = ref('');
const notesCount = ref(0);
const notesHistory = ref<any[]>([]);

// 收藏
const isFavorite = ref(false);

// 错因
const selectedReason = ref('');
const reasonDetail = ref('');

// 统计显示
const showStats = ref(true);

// 相关题目
const relatedQuestions = ref<any[]>([]);

/**
 * 判断是否为选择题
 */
function isChoiceQuestion() {
  const type = question.value.type;
  return ['single', 'multiple'].includes(type);
}

/**
 * 获取选项标签
 */
function getOptionLabel(index: number) {
  return String.fromCharCode(65 + index); // A, B, C, D...
}

/**
 * 是否为正确答案
 */
function isCorrectAnswer(index: string) {
  const correct = question.value.correctAnswer;
  if (Array.isArray(correct)) {
    return correct.includes(getOptionLabel(index));
  }
  return correct === getOptionLabel(index);
}

/**
 * 是否为错误答案
 */
function isWrongAnswer(index: string) {
  const label = getOptionLabel(index);
  const selected = userAnswer.value;
  if (Array.isArray(selected)) {
    return selected.includes(label) && !isCorrectAnswer(index);
  }
  return selected === label && !isCorrectAnswer(index);
}

/**
 * 是否为选中答案
 */
function isSelectedAnswer(index: string) {
  const label = getOptionLabel(index);
  const selected = userAnswer.value;
  if (Array.isArray(selected)) {
    return selected.includes(label);
  }
  return selected === label;
}

/**
 * 获取用户答案文本
 */
function getUserAnswerText() {
  const selected = userAnswer.value;
  if (!selected) return '未作答';
  if (Array.isArray(selected)) {
    return selected.join(', ');
  }
  if (selected === 'true') return '正确';
  if (selected === 'false') return '错误';
  return selected.toUpperCase();
}

/**
 * 获取正确答案文本
 */
function getCorrectAnswerText() {
  const correct = question.value.correctAnswer;
  if (!correct) return '-';
  if (Array.isArray(correct)) {
    return correct.join(', ');
  }
  if (correct === 'true') return '正确';
  if (correct === 'false') return '错误';
  return correct.toUpperCase();
}

/**
 * 格式化时间
 */
function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds}秒`;
  return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
}

/**
 * 格式化日期
 */
function formatDate(dateString: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('zh-CN');
}

/**
 * 格式化笔记时间
 */
function formatNoteTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}小时前`;
  return date.toLocaleDateString('zh-CN');
}

/**
 * 获取科目标签类型
 */
function getSubjectTagType(subject: string) {
  const types: Record<string, any> = {
    '数学': 'primary',
    '物理': 'success',
    '化学': 'warning',
    '生物': 'danger',
  };
  return types[subject] || 'info';
}

/**
 * 获取难度标签类型
 */
function getDifficultyTagType(difficulty: string) {
  const types: Record<string, any> = {
    'easy': 'success',
    'medium': 'warning',
    'hard': 'danger',
  };
  return types[difficulty] || 'info';
}

/**
 * 获取难度文本
 */
function getDifficultyText(difficulty: string) {
  const texts: Record<string, string> = {
    'easy': '简单',
    'medium': '中等',
    'hard': '困难',
  };
  return texts[difficulty] || '未知';
}

/**
 * 获取状态标签类型
 */
function getStatusTagType(status: string) {
  const types: Record<string, any> = {
    'mastered': 'success',
    'learning': 'warning',
    'new': 'info',
  };
  return types[status] || 'info';
}

/**
 * 获取状态文本
 */
function getStatusText(status: string) {
  const texts: Record<string, string> = {
    'mastered': '已掌握',
    'learning': '学习中',
    'new': '新题',
  };
  return texts[status] || '未知';
}

/**
 * 切换笔记面板
 */
function toggleNotes() {
  showNotesPanel.value = !showNotesPanel.value;
}

/**
 * 切换收藏状态
 */
async function toggleFavorite() {
  isFavorite.value = !isFavorite.value;

  try {
    await api.put(`/mistake/${question.value.id}/favorite`, {
      favorite: isFavorite.value,
    });
    ElMessage.success(isFavorite.value ? '已收藏' : '已取消收藏');
  } catch (err) {
    ElMessage.error('操作失败');
    isFavorite.value = !isFavorite.value;
  }
}

/**
 * 保存笔记
 */
async function saveNotes() {
  if (!noteContent.value.trim()) return;

  try {
    await api.post(`/mistake/${question.value.id}/notes`, {
      content: noteContent.value,
    });
    notesCount.value++;
    ElMessage.success('笔记已保存');
    loadNotesHistory();
  } catch (err) {
    ElMessage.error('保存失败');
  }
}

/**
 * 清空笔记
 */
function clearNotes() {
  noteContent.value = '';
  saveNotes();
}

/**
 * 加载笔记历史
 */
async function loadNotesHistory() {
  try {
    const response = await api.get(`/mistake/${question.value.id}/notes`);
    notesHistory.value = response.data.notes || [];
    notesCount.value = notesHistory.value.length;
    if (notesHistory.value.length > 0) {
      noteContent.value = notesHistory.value[0].content;
    }
  } catch (err) {
    // 忽略错误
  }
}

/**
 * 处理错因变化
 */
async function handleReasonChange() {
  try {
    await api.put(`/mistake/${question.value.id}/reason`, {
      reason: selectedReason.value,
    });
  } catch (err) {
    ElMessage.error('保存失败');
  }
}

/**
 * 保存错因详情
 */
async function saveReasonDetail() {
  if (!reasonDetail.value.trim()) return;

  try {
    await api.put(`/mistake/${question.value.id}/reason-detail`, {
      detail: reasonDetail.value,
    });
  } catch (err) {
    // 忽略错误
  }
}

/**
 * 查看相关题目
 */
function viewRelatedQuestion(id: string) {
  router.push(`/mistake/${id}`);
}

/**
 * 上一题
 */
function previousQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    loadCurrentQuestion();
  }
}

/**
 * 下一题
 */
function nextQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++;
    loadCurrentQuestion();
  }
}

/**
 * 跳转题目
 */
function jumpToQuestion() {
  // 可以打开一个对话框让用户输入题号
  ElMessage.info('跳转功能开发中...');
}

/**
 * 返回
 */
function goBack() {
  router.back();
}

/**
 * 加载当前题目
 */
async function loadCurrentQuestion() {
  const recordId = route.params.recordId as string;
  const questionId = questions.value[currentIndex.value]?.id;

  if (!questionId) return;

  try {
    const response = await api.get(`/practice/record/${recordId}/question/${questionId}`);
    question.value = response.data.question;
    userAnswer.value = response.data.userAnswer;
    isCorrect.value = response.data.isCorrect;
    isFavorite.value = response.data.favorite || false;
    selectedReason.value = response.data.mistakeReason || '';
    reasonDetail.value = response.data.mistakeReasonDetail || '';

    // 加载笔记
    if (showNotesPanel.value) {
      loadNotesHistory();
    }

    // 加载相关题目
    loadRelatedQuestions();
  } catch (err) {
    ElMessage.error('加载题目失败');
  }
}

/**
 * 加载相关题目
 */
async function loadRelatedQuestions() {
  try {
    const response = await api.get(`/mistake/${question.value.id}/related`, {
      params: { limit: 5 },
    });
    relatedQuestions.value = response.data.questions || [];
  } catch (err) {
    // 忽略错误
  }
}

/**
 * 初始化
 */
onMounted(async () => {
  const recordId = route.params.recordId as string;

  try {
    // 加载练习记录的题目列表
    const response = await api.get(`/practice/record/${recordId}/questions`);
    questions.value = response.data.questions || [];
    totalQuestions.value = questions.value.length;

    // 加载第一题
    if (questions.value.length > 0) {
      loadCurrentQuestion();
    }
  } catch (err) {
    ElMessage.error('加载失败');
  }
});
</script>

<style scoped lang="scss">
.answer-analysis-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg);
}

.analysis-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-white);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);

  h2 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
  }
}

.question-index {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.analysis-content {
  display: flex;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  flex: 1;
}

.main-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.side-section {
  width: 350px;
  transition: all 0.3s ease;

  &.collapsed {
    width: 0;
    overflow: hidden;
  }
}

.question-card {
  .question-header {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
  }

  .question-content {
    .question-text {
      font-size: var(--font-size-base);
      line-height: 1.8;
      margin-bottom: var(--spacing-lg);
    }
  }
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  transition: all 0.2s;

  .option-label {
    flex-shrink: 0;
    font-weight: var(--font-weight-medium);
  }

  .option-text {
    flex: 1;
  }

  .option-icon {
    flex-shrink: 0;
    font-size: 20px;

    &.correct {
      color: var(--success-color);
    }

    &.wrong {
      color: var(--danger-color);
    }
  }

  &.option-correct {
    background: #f0f9ff;
    border-color: #67c23a;
  }

  &.option-wrong {
    background: #fef2f2;
    border-color: #f56c6c;
  }

  &.option-selected {
    border-width: 2px;
  }
}

.boolean-options {
  display: flex;
  gap: var(--spacing-lg);
}

.boolean-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);

  &.option-correct {
    background: #f0f9ff;
    border-color: #67c23a;
    color: #67c23a;
  }

  &.option-selected {
    border-width: 2px;
  }
}

.answer-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  margin-top: var(--spacing-lg);

  .stat-item {
    display: flex;
    gap: var(--spacing-xs);

    .stat-label {
      color: var(--color-text-secondary);
    }

    .stat-value {
      font-weight: var(--font-weight-medium);

      &.correct {
        color: var(--success-color);
      }

      &.wrong {
        color: var(--danger-color);
      }
    }
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
}

.analysis-card {
  .analysis-text {
    line-height: 1.8;
    color: var(--color-text-primary);
  }

  .no-analysis {
    text-align: center;
    padding: var(--spacing-xl) 0;
  }

  .knowledge-points {
    margin-top: var(--spacing-lg);
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--color-border);

    .points-label {
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-sm);
    }

    .point-tag {
      margin-right: var(--spacing-xs);
      margin-bottom: var(--spacing-xs);
    }
  }

  .question-source {
    margin-top: var(--spacing-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}

.mistake-reason-card {
  .reason-content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  :deep(.el-radio-group) {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }
}

.related-card {
  .related-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .related-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    background: var(--color-bg-light);
    border-radius: var(--border-radius-md);
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: var(--color-bg-hover);
    }
  }

  .related-info {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    flex: 1;
    min-width: 0;
  }

  .related-subject {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  .related-text {
    font-size: var(--font-size-sm);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .related-arrow {
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }
}

.notes-card {
  position: sticky;
  top: var(--spacing-lg);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
}

.notes-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.notes-textarea {
  :deep(.el-textarea__inner) {
    resize: none;
  }
}

.notes-toolbar {
  display: flex;
  gap: var(--spacing-sm);
}

.notes-history {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);

  .history-header {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-md);
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    max-height: 300px;
    overflow-y: auto;
  }

  .history-item {
    padding: var(--spacing-sm);
    background: var(--color-bg-light);
    border-radius: var(--border-radius-sm);

    .history-time {
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-xs);
    }

    .history-text {
      font-size: var(--font-size-sm);
      line-height: 1.5;
    }
  }
}

.analysis-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-white);
  border-top: 1px solid var(--color-border);
}

.footer-info {
  flex: 1;
  text-align: center;
}

@media (max-width: $breakpoint-lg) {
  .analysis-content {
    flex-direction: column;
  }

  .side-section {
    width: 100%;

    &.collapsed {
      display: none;
    }
  }
}

@media (max-width: $breakpoint-sm) {
  .analysis-header {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }

  .header-title {
    width: 100%;
    justify-content: center;
  }

  .answer-stats {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
</style>
