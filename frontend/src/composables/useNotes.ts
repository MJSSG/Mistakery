import { ref } from 'vue';
import { api } from '@/services/api';
import { ElMessage } from 'element-plus';

export interface Note {
  id: string;
  content: string;
  targetType: 'mistake' | 'question' | 'subject';
  targetId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoteSummary {
  totalCount: number;
  recentNotes: Note[];
}

/**
 * 笔记管理 Composable
 * 用于管理用户的学习笔记
 */
export function useNotes() {
  const notes = ref<Note[]>([]);
  const loading = ref(false);
  const currentNote = ref<Note | null>(null);

  /**
   * 获取某个对象的笔记
   */
  async function fetchNotes(targetType: Note['targetType'], targetId: string) {
    loading.value = true;

    try {
      const response = await api.get(`/notes/${targetType}/${targetId}`);
      notes.value = response.data.notes || [];

      if (notes.value.length > 0) {
        currentNote.value = notes.value[0];
      } else {
        currentNote.value = null;
      }

      return notes.value;
    } catch (err: any) {
      if (err.response?.status !== 404) {
        ElMessage.error('加载笔记失败');
      }
      notes.value = [];
      currentNote.value = null;
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 创建或更新笔记
   */
  async function saveNote(
    targetType: Note['targetType'],
    targetId: string,
    content: string
  ) {
    if (!content.trim()) {
      ElMessage.warning('笔记内容不能为空');
      return null;
    }

    loading.value = true;

    try {
      let response;

      if (currentNote.value) {
        // 更新现有笔记
        response = await api.put(`/notes/${currentNote.value.id}`, {
          content,
        });

        const index = notes.value.findIndex(n => n.id === currentNote.value!.id);
        if (index !== -1) {
          notes.value[index] = response.data.note;
        }
        currentNote.value = response.data.note;

        ElMessage.success('笔记已更新');
      } else {
        // 创建新笔记
        response = await api.post(`/notes`, {
          targetType,
          targetId,
          content,
        });

        const newNote = response.data.note;
        notes.value.push(newNote);
        currentNote.value = newNote;

        ElMessage.success('笔记已保存');
      }

      return response.data.note;
    } catch (err: any) {
      ElMessage.error(err.response?.data?.message || '保存失败');
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 删除笔记
   */
  async function deleteNote(noteId: string) {
    loading.value = true;

    try {
      await api.delete(`/notes/${noteId}`);

      notes.value = notes.value.filter(n => n.id !== noteId);

      if (currentNote.value?.id === noteId) {
        currentNote.value = null;
      }

      ElMessage.success('笔记已删除');
      return true;
    } catch (err: any) {
      ElMessage.error('删除失败');
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 清空当前笔记内容（不删除）
   */
  function clearCurrentNote() {
    currentNote.value = null;
  }

  /**
   * 获取笔记摘要
   */
  async function fetchNotesSummary() {
    try {
      const response = await api.get('/notes/summary');
      return response.data as NoteSummary;
    } catch (err: any) {
      return {
        totalCount: 0,
        recentNotes: [],
      };
    }
  }

  /**
   * 搜索笔记
   */
  async function searchNotes(keyword: string, limit = 20) {
    loading.value = true;

    try {
      const response = await api.get('/notes/search', {
        params: { keyword, limit },
      });
      return response.data.notes as Note[];
    } catch (err: any) {
      ElMessage.error('搜索失败');
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * 获取所有笔记（分页）
   */
  async function fetchAllNotes(page = 1, limit = 20) {
    loading.value = true;

    try {
      const response = await api.get('/notes', {
        params: { page, limit },
      });
      return {
        notes: response.data.notes as Note[],
        total: response.data.total as number,
      };
    } catch (err: any) {
      ElMessage.error('加载笔记失败');
      return {
        notes: [],
        total: 0,
      };
    } finally {
      loading.value = false;
    }
  }

  return {
    notes,
    loading,
    currentNote,
    fetchNotes,
    saveNote,
    deleteNote,
    clearCurrentNote,
    fetchNotesSummary,
    searchNotes,
    fetchAllNotes,
  };
}
