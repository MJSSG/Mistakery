import { defineStore } from 'pinia';
import { ref } from 'vue';
import { practiceApi, type Exam, type ExamRecord, type QuestionInfo, type CreateExamDto, type ExamAnswer } from '@/api/practice';

export const usePracticeStore = defineStore('practice', () => {
  // 当前练习
  const currentExam = ref<Exam | null>(null);
  const currentExamRecord = ref<ExamRecord | null>(null);
  const currentQuestions = ref<QuestionInfo[]>([]);
  const currentAnswers = ref<Map<string, ExamAnswer>>(new Map());

  // 练习列表
  const examList = ref<Exam[]>([]);
  const examRecordList = ref<ExamRecord[]>([]);

  // 加载状态
  const loading = ref(false);
  const submittingAnswer = ref(false);

  // 获取可用题目数量
  async function getAvailableCount(params: {
    subjectId: string;
    knowledgePoints?: string[];
    type?: string;
    difficulty?: string;
    masteryLevel?: string;
  }) {
    try {
      const response = await practiceApi.getAvailableCount(params);
      return response.count;
    } catch (error) {
      console.error('Failed to get available count:', error);
      return 0;
    }
  }

  // 创建试卷
  async function createExam(data: CreateExamDto) {
    loading.value = true;
    try {
      const response = await practiceApi.createExam(data);
      examList.value.unshift(response);
      return response;
    } finally {
      loading.value = false;
    }
  }

  // 获取试卷列表
  async function fetchExamList(params?: { status?: string; page?: number; limit?: number }) {
    loading.value = true;
    try {
      const response = await practiceApi.getExamList(params);
      examList.value = response.data;
      return response;
    } finally {
      loading.value = false;
    }
  }

  // 获取试卷详情
  async function fetchExamById(id: string) {
    loading.value = true;
    try {
      currentExam.value = await practiceApi.getExamById(id);
      return currentExam.value;
    } finally {
      loading.value = false;
    }
  }

  // 删除试卷
  async function deleteExam(id: string) {
    loading.value = true;
    try {
      await practiceApi.deleteExam(id);
      examList.value = examList.value.filter(e => e.id !== id);
    } finally {
      loading.value = false;
    }
  }

  // 开始练习
  async function startExam(examId: string, params?: { shuffleAnswers?: boolean }) {
    loading.value = true;
    try {
      const response = await practiceApi.startExam(examId, params);
      currentExamRecord.value = {
        id: response.examRecordId,
        examId,
        examName: currentExam.value?.name || '',
        userId: '',
        status: 'in-progress',
        questionCount: response.questions.length,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: response.questions.length,
        accuracy: 0,
        timeSpent: 0,
        startedAt: new Date().toISOString(),
      } as ExamRecord;
      currentQuestions.value = response.questions;
      currentAnswers.value.clear();
      return response;
    } finally {
      loading.value = false;
    }
  }

  // 提交答案
  async function submitAnswer(examRecordId: string, questionId: string, userAnswer: string, timeSpent?: number) {
    submittingAnswer.value = true;
    try {
      const response = await practiceApi.submitAnswer(examRecordId, { questionId, userAnswer, timeSpent });
      currentAnswers.value.set(questionId, response);

      // 更新答题进度
      const totalAnswered = Array.from(currentAnswers.value.values()).filter(a => a.userAnswer).length;
      if (currentExamRecord.value) {
        currentExamRecord.value.unansweredCount = currentExamRecord.value.questionCount - totalAnswered;
      }

      return response;
    } finally {
      submittingAnswer.value = false;
    }
  }

  // 获取答题进度
  async function fetchProgress(examRecordId: string) {
    try {
      const response = await practiceApi.getProgress(examRecordId);
      response.answers.forEach(answer => {
        currentAnswers.value.set(answer.questionId, answer);
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    }
  }

  // 交卷
  async function submitExam(examRecordId: string, force = false) {
    loading.value = true;
    try {
      const response = await practiceApi.submitExam(examRecordId, { force });
      if (currentExamRecord.value) {
        currentExamRecord.value = response.examRecord;
      }
      return response;
    } finally {
      loading.value = false;
    }
  }

  // 获取练习结果
  async function fetchResult(examRecordId: string) {
    loading.value = true;
    try {
      return await practiceApi.getResult(examRecordId);
    } finally {
      loading.value = false;
    }
  }

  // 获取练习记录列表
  async function fetchExamRecordList(params?: { page?: number; limit?: number }) {
    loading.value = true;
    try {
      const response = await practiceApi.getExamRecordList(params);
      examRecordList.value = response.data;
      return response;
    } finally {
      loading.value = false;
    }
  }

  // 收藏题目
  async function toggleFavorite(examRecordId: string, questionId: string) {
    try {
      await practiceApi.toggleFavorite(examRecordId, questionId);
      const answer = currentAnswers.value.get(questionId);
      if (answer) {
        answer.isFavorite = !answer.isFavorite;
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }

  // 添加笔记
  async function addNote(examRecordId: string, questionId: string, note: string) {
    try {
      await practiceApi.addNote(examRecordId, questionId, note);
      const answer = currentAnswers.value.get(questionId);
      if (answer) {
        answer.note = note;
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  }

  // 检查超时
  async function checkTimeout(examRecordId: string) {
    try {
      return await practiceApi.checkTimeout(examRecordId);
    } catch (error) {
      console.error('Failed to check timeout:', error);
      return { hasTimeout: false, remainingTime: null };
    }
  }

  // 重置当前练习状态
  function resetCurrentPractice() {
    currentExam.value = null;
    currentExamRecord.value = null;
    currentQuestions.value = [];
    currentAnswers.value.clear();
  }

  return {
    // 状态
    currentExam,
    currentExamRecord,
    currentQuestions,
    currentAnswers,
    examList,
    examRecordList,
    loading,
    submittingAnswer,

    // 方法
    getAvailableCount,
    createExam,
    fetchExamList,
    fetchExamById,
    deleteExam,
    startExam,
    submitAnswer,
    fetchProgress,
    submitExam,
    fetchResult,
    fetchExamRecordList,
    toggleFavorite,
    addNote,
    resetCurrentPractice,
  };
});
