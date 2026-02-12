import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { useNotes } from '@/composables/useNotes';
import { api } from '@/services/api';

// Mock api module
vi.mock('@/services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('useNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchNotes', () => {
    it('should fetch notes successfully', async () => {
      const mockNotes = [
        {
          id: '1',
          content: 'Test note',
          targetType: 'mistake',
          targetId: '123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(api.get).mockResolvedValue({ data: { notes: mockNotes } });

      const { notes, fetchNotes } = useNotes();
      const result = await fetchNotes('mistake', '123');

      expect(notes.value).toEqual(mockNotes);
      expect(result).toEqual(mockNotes);
      expect(api.get).toHaveBeenCalledWith('/notes/mistake/123');
    });

    it('should handle empty notes', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { notes: [] } });

      const { notes, currentNote, fetchNotes } = useNotes();
      await fetchNotes('mistake', '123');

      expect(notes.value).toEqual([]);
      expect(currentNote.value).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

      const { notes, currentNote, fetchNotes } = useNotes();
      const result = await fetchNotes('mistake', '123');

      expect(notes.value).toEqual([]);
      expect(currentNote.value).toBeNull();
      expect(result).toEqual([]);
    });
  });

  describe('saveNote', () => {
    it('should create new note when currentNote is null', async () => {
      const newNote = {
        id: '2',
        content: 'New note content',
        targetType: 'mistake' as const,
        targetId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(api.post).mockResolvedValue({ data: { note: newNote } });

      const { notes, currentNote, saveNote } = useNotes();
      const result = await saveNote('mistake', '123', 'New note content');

      expect(result).toEqual(newNote);
      expect(notes.value).toContainEqual(newNote);
      expect(currentNote.value).toEqual(newNote);
      expect(api.post).toHaveBeenCalledWith('/notes', {
        targetType: 'mistake',
        targetId: '123',
        content: 'New note content',
      });
    });

    it('should update existing note', async () => {
      const existingNote = {
        id: '1',
        content: 'Old content',
        targetType: 'mistake' as const,
        targetId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedNote = {
        ...existingNote,
        content: 'Updated content',
      };

      vi.mocked(api.put).mockResolvedValue({ data: { note: updatedNote } });

      const { notes, currentNote, saveNote } = useNotes();
      notes.value = [existingNote];
      currentNote.value = existingNote;

      const result = await saveNote('mistake', '123', 'Updated content');

      expect(result).toEqual(updatedNote);
      expect(notes.value[0]).toEqual(updatedNote);
      expect(api.put).toHaveBeenCalledWith('/notes/1', {
        content: 'Updated content',
      });
    });

    it('should reject empty content', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: {} });

      const { saveNote } = useNotes();
      const result = await saveNote('mistake', '123', '   ');

      expect(result).toBeNull();
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  describe('deleteNote', () => {
    it('should delete note successfully', async () => {
      const noteToDelete = {
        id: '1',
        content: 'To be deleted',
        targetType: 'mistake' as const,
        targetId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(api.delete).mockResolvedValue({ data: {} });

      const { notes, currentNote, deleteNote } = useNotes();
      notes.value = [noteToDelete];
      currentNote.value = noteToDelete;

      const result = await deleteNote('1');

      expect(result).toBe(true);
      expect(notes.value).not.toContainEqual(noteToDelete);
      expect(currentNote.value).toBeNull();
      expect(api.delete).toHaveBeenCalledWith('/notes/1');
    });
  });

  describe('clearCurrentNote', () => {
    it('should clear currentNote', () => {
      const { currentNote, clearCurrentNote } = useNotes();
      currentNote.value = {
        id: '1',
        content: 'Test',
        targetType: 'mistake' as const,
        targetId: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      clearCurrentNote();

      expect(currentNote.value).toBeNull();
    });
  });
});
