import { defineStore } from 'pinia';
import { ref } from 'vue';
import { mistakeApi, type Mistake } from '@/api/mistake';

export const useMistakeStore = defineStore('mistake', () => {
  const mistakes = ref<Mistake[]>([]);
  const currentMistake = ref<Mistake | null>(null);
  const loading = ref(false);

  async function fetchMistakes(params?: {
    subjectId?: string;
    type?: string;
    masteryLevel?: string;
    isFavorite?: boolean;
    page?: number;
    limit?: number;
  }) {
    loading.value = true;
    try {
      const response = await mistakeApi.getList(params);
      mistakes.value = response.data;
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMistakeById(id: string) {
    loading.value = true;
    try {
      currentMistake.value = await mistakeApi.getById(id);
    } finally {
      loading.value = false;
    }
  }

  async function createMistake(data: Partial<Mistake>) {
    loading.value = true;
    try {
      const response = await mistakeApi.save(data as any);
      mistakes.value.unshift(response);
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function updateMistake(id: string, data: Partial<Mistake>) {
    loading.value = true;
    try {
      const response = await mistakeApi.update(id, data as any);
      const index = mistakes.value.findIndex(m => m.id === id);
      if (index !== -1) {
        mistakes.value[index] = response;
      }
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function deleteMistake(id: string) {
    loading.value = true;
    try {
      await mistakeApi.delete(id);
      mistakes.value = mistakes.value.filter(m => m.id !== id);
    } finally {
      loading.value = false;
    }
  }

  async function toggleFavorite(id: string) {
    const mistake = mistakes.value.find(m => m.id === id);
    if (mistake) {
      const response = await mistakeApi.toggleFavorite(id);
      mistake.isFavorite = response.isFavorite;
    }
  }

  // 批量删除错题
  async function batchDelete(ids: string[]) {
    loading.value = true;
    try {
      await Promise.all(ids.map(id => mistakeApi.delete(id)));
      // 从mistakes数组中移除已删除的错题
      const idsSet = new Set(ids);
      mistakes.value = mistakes.value.filter(m => !idsSet.has(m.id));
    } finally {
      loading.value = false;
    }
  }

  // 批量更新掌握状态
  async function batchUpdateStatus(ids: string[], status: string) {
    loading.value = true;
    try {
      await Promise.all(ids.map(id => mistakeApi.update(id, { masteryLevel: status } as any)));
      ids.forEach(id => {
        const mistake = mistakes.value.find(m => m.id === id);
        if (mistake) {
          mistake.masteryLevel = status;
        }
      });
    } finally {
      loading.value = false;
    }
  }

  // 导出错题
  async function exportMistakes(ids: string[]) {
    const items = mistakes.value.filter(m => ids.includes(m.id || ''));
    // 简单实现：导出为 JSON
    const data = JSON.stringify(items, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `错题导出_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 添加到练习
  async function addToPractice(ids: string[]) {
    // TODO: 调用练习API
    console.log('Add to practice:', ids);
  }

  // 更新笔记
  async function updateNote(id: string, note: string) {
    const mistake = mistakes.value.find(m => m.id === id);
    if (mistake) {
      mistake.note = note;
      await mistakeApi.update(id, { note } as any);
    }
  }

  return {
    mistakes,
    currentMistake,
    loading,
    fetchMistakes,
    fetchMistakeById,
    createMistake,
    updateMistake,
    deleteMistake,
    toggleFavorite,
    batchDelete,
    batchUpdateStatus,
    exportMistakes,
    addToPractice,
    updateNote,
  };
});
