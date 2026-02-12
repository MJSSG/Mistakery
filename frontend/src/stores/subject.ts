import { defineStore } from 'pinia';
import { ref } from 'vue';
import { subjectApi, type Subject } from '@/api/subject';

export const useSubjectStore = defineStore('subject', () => {
  const subjects = ref<Subject[]>([]);
  const currentSubject = ref<Subject | null>(null);
  const loading = ref(false);

  async function fetchSubjects() {
    loading.value = true;
    try {
      subjects.value = await subjectApi.getList();
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
      // 使用默认科目（公务员考试分类）
      subjects.value = [
        // 政治理论
        { id: 'politics', name: '政治理论', icon: '🏛️', color: '#e74c3c', isPublic: true, mistakeCount: 0, sortOrder: 1, createdAt: '', updatedAt: '' },
        { id: 'politics-masi', name: '马思', icon: '📕', color: '#c0392b', parentId: 'politics', isPublic: true, mistakeCount: 0, sortOrder: 1, createdAt: '', updatedAt: '' },
        { id: 'politics-mao', name: '毛思', icon: '📘', color: '#e74c3c', parentId: 'politics', isPublic: true, mistakeCount: 0, sortOrder: 2, createdAt: '', updatedAt: '' },
        { id: 'politics-xi', name: '习思', icon: '📗', color: '#27ae60', parentId: 'politics', isPublic: true, mistakeCount: 0, sortOrder: 3, createdAt: '', updatedAt: '' },
        { id: 'politics-zhongte', name: '中特', icon: '📙', color: '#f39c12', parentId: 'politics', isPublic: true, mistakeCount: 0, sortOrder: 4, createdAt: '', updatedAt: '' },
        { id: 'politics-party', name: '党史', icon: '🚩', color: '#d35400', parentId: 'politics', isPublic: true, mistakeCount: 0, sortOrder: 5, createdAt: '', updatedAt: '' },
        { id: 'politics-current', name: '时政', icon: '📰', color: '#7f8c8d', parentId: 'politics', isPublic: true, mistakeCount: 0, sortOrder: 6, createdAt: '', updatedAt: '' },
        // 常识判断
        { id: 'general', name: '常识判断', icon: '🌐', color: '#3498db', isPublic: true, mistakeCount: 0, sortOrder: 2, createdAt: '', updatedAt: '' },
        { id: 'general-economy', name: '经济', icon: '💰', color: '#27ae60', parentId: 'general', isPublic: true, mistakeCount: 0, sortOrder: 1, createdAt: '', updatedAt: '' },
        { id: 'general-tech', name: '科技', icon: '🔬', color: '#16a085', parentId: 'general', isPublic: true, mistakeCount: 0, sortOrder: 2, createdAt: '', updatedAt: '' },
        { id: 'general-history', name: '历史', icon: '📜', color: '#f39c12', parentId: 'general', isPublic: true, mistakeCount: 0, sortOrder: 3, createdAt: '', updatedAt: '' },
        { id: 'general-culture', name: '人文', icon: '🎭', color: '#9b59b6', parentId: 'general', isPublic: true, mistakeCount: 0, sortOrder: 4, createdAt: '', updatedAt: '' },
        { id: 'general-geo', name: '地理', icon: '🌍', color: '#2ecc71', parentId: 'general', isPublic: true, mistakeCount: 0, sortOrder: 5, createdAt: '', updatedAt: '' },
        { id: 'general-law', name: '法律', icon: '⚖️', color: '#34495e', parentId: 'general', isPublic: true, mistakeCount: 0, sortOrder: 6, createdAt: '', updatedAt: '' },
        // 言语理解
        { id: 'verbal', name: '言语理解', icon: '📖', color: '#9b59b6', isPublic: true, mistakeCount: 0, sortOrder: 3, createdAt: '', updatedAt: '' },
        { id: 'verbal-reading', name: '片段阅读', icon: '📄', color: '#8e44ad', parentId: 'verbal', isPublic: true, mistakeCount: 0, sortOrder: 1, createdAt: '', updatedAt: '' },
        { id: 'verbal-fill', name: '逻辑填空', icon: '📝', color: '#2980b9', parentId: 'verbal', isPublic: true, mistakeCount: 0, sortOrder: 2, createdAt: '', updatedAt: '' },
        { id: 'verbal-expression', name: '语句表达', icon: '💬', color: '#27ae60', parentId: 'verbal', isPublic: true, mistakeCount: 0, sortOrder: 3, createdAt: '', updatedAt: '' },
        // 判断推理
        { id: 'reasoning', name: '判断推理', icon: '🧩', color: '#1abc9c', isPublic: true, mistakeCount: 0, sortOrder: 4, createdAt: '', updatedAt: '' },
        { id: 'reasoning-graphic', name: '图形推理', icon: '🔷', color: '#e74c3c', parentId: 'reasoning', isPublic: true, mistakeCount: 0, sortOrder: 1, createdAt: '', updatedAt: '' },
        { id: 'reasoning-analogy', name: '类比推理', icon: '🔗', color: '#3498db', parentId: 'reasoning', isPublic: true, mistakeCount: 0, sortOrder: 2, createdAt: '', updatedAt: '' },
        { id: 'reasoning-definition', name: '定义判断', icon: '📋', color: '#9b59b6', parentId: 'reasoning', isPublic: true, mistakeCount: 0, sortOrder: 3, createdAt: '', updatedAt: '' },
        { id: 'reasoning-logic', name: '逻辑判断', icon: '🧠', color: '#1abc9c', parentId: 'reasoning', isPublic: true, mistakeCount: 0, sortOrder: 4, createdAt: '', updatedAt: '' },
        // 数量关系
        { id: 'quant', name: '数量关系', icon: '🔢', color: '#e67e22', isPublic: true, mistakeCount: 0, sortOrder: 5, createdAt: '', updatedAt: '' },
        { id: 'quant-calc', name: '简单计算', icon: '➕', color: '#27ae60', parentId: 'quant', isPublic: true, mistakeCount: 0, sortOrder: 1, createdAt: '', updatedAt: '' },
        { id: 'quant-travel', name: '行程问题', icon: '🚗', color: '#2980b9', parentId: 'quant', isPublic: true, mistakeCount: 0, sortOrder: 2, createdAt: '', updatedAt: '' },
        { id: 'quant-work', name: '工程问题', icon: '🏗️', color: '#f39c12', parentId: 'quant', isPublic: true, mistakeCount: 0, sortOrder: 3, createdAt: '', updatedAt: '' },
        { id: 'quant-profit', name: '经济利润', icon: '💴', color: '#27ae60', parentId: 'quant', isPublic: true, mistakeCount: 0, sortOrder: 4, createdAt: '', updatedAt: '' },
        { id: 'quant-permutation', name: '排列组合', icon: '🎲', color: '#8e44ad', parentId: 'quant', isPublic: true, mistakeCount: 0, sortOrder: 5, createdAt: '', updatedAt: '' },
        { id: 'quant-probability', name: '概率', icon: '📊', color: '#16a085', parentId: 'quant', isPublic: true, mistakeCount: 0, sortOrder: 6, createdAt: '', updatedAt: '' },
        { id: 'quant-geometry', name: '几何', icon: '📐', color: '#c0392b', parentId: 'quant', isPublic: true, mistakeCount: 0, sortOrder: 7, createdAt: '', updatedAt: '' },
      ];
    } finally {
      loading.value = false;
    }
  }

  async function fetchSubjectById(id: string) {
    loading.value = true;
    try {
      currentSubject.value = await subjectApi.getById(id);
    } finally {
      loading.value = false;
    }
  }

  async function createSubject(data: Partial<Subject>) {
    loading.value = true;
    try {
      const response = await subjectApi.create(data as any);
      subjects.value.push(response);
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function updateSubject(id: string, data: Partial<Subject>) {
    loading.value = true;
    try {
      const response = await subjectApi.update(id, data as any);
      const index = subjects.value.findIndex(s => s.id === id);
      if (index !== -1) {
        subjects.value[index] = response;
      }
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function deleteSubject(id: string) {
    loading.value = true;
    try {
      await subjectApi.delete(id);
      subjects.value = subjects.value.filter(s => s.id !== id);
    } finally {
      loading.value = false;
    }
  }

  return {
    subjects,
    currentSubject,
    loading,
    fetchSubjects,
    fetchSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
  };
});
