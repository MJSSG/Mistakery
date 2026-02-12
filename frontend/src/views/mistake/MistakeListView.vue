<template>
  <div class="mistake-list-view">
      <!-- 页面头部 -->
      <div class="list-header">
        <div class="header-left">
          <h1 class="list-title">错题本</h1>
          <el-tag type="info">{{ totalCount }} 道错题</el-tag>
        </div>
        <div class="header-actions">
          <el-button :icon="Upload" @click="handleImport">导入</el-button>
          <el-button type="primary" :icon="Plus" @click="goToEntry">
            录入错题
          </el-button>
        </div>
      </div>

      <!-- 批量操作栏 -->
      <el-collapse-transition>
        <BatchActions
          v-if="showBatchActions"
          :selected-count="selectedCount"
          :total-count="totalCount"
          @toggle-all="handleToggleAll"
          @cancel-select="handleCancelSelect"
          @delete-selected="handleBatchDelete"
          @mark-as="handleBatchMark"
          @export-selected="handleBatchExport"
          @add-to-practice="handleAddToPractice"
        />
      </el-collapse-transition>

      <div class="list-layout">
        <!-- 筛选面板 -->
        <FilterPanel
          v-model:filters="filters"
          :total-count="filteredCount"
          :subjects="subjectOptions"
          @reset="handleResetFilters"
        />

        <!-- 错题列表 -->
        <div class="list-content">
          <AppLoading v-if="loading" />
          <AppEmpty
            v-else-if="mistakes.length === 0"
            description="暂无错题，快去录入吧！"
            :action-text="'录入错题'"
            :action-handler="goToEntry"
          />
          <div v-else class="mistake-list">
            <MistakeCard
              v-for="mistake in mistakes"
              :key="mistake.id"
              :mistake="mistake"
              :is-selected="selectedIds.has(mistake.id)"
              :is-deleted="deletedIds.has(mistake.id)"
              @select="handleSelectMistake"
              @view="handleViewMistake"
              @edit-note="handleEditNote"
              @single-practice="handleSinglePractice"
              @export="handleExportMistake"
              @delete="handleDeleteMistake"
            />
          </div>

          <!-- 分页 -->
          <div v-if="total > 0" class="list-pagination">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.limit"
              :total="total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入错题"
      width="500px"
    >
      <el-upload
        drag
        action=""
        :auto-upload="false"
        accept=".json,.xlsx,.xls"
        @change="handleImportChange"
      >
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="upload-text">
          <div class="text-main">将文件拖到此处，或<em>点击上传</em></div>
          <div class="text-sub">支持 JSON、Excel 格式</div>
        </div>
      </el-upload>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmImport">确认导入</el-button>
      </template>
    </el-dialog>

    <!-- 笔记编辑对话框 -->
    <NoteEditor
      v-model:visible="showNoteEditor"
      :model-value="editingNote"
      @update:model-value="handleNoteChange"
      @save="handleSaveNote"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus,
  Upload,
  UploadFilled,
} from '@element-plus/icons-vue';
import AppLoading from '@/components/common/AppLoading.vue';
import AppEmpty from '@/components/common/AppEmpty.vue';
import FilterPanel, { type MistakeFilters } from '@/components/mistake/FilterPanel.vue';
import BatchActions from '@/components/mistake/BatchActions.vue';
import MistakeCard, { type MistakeData } from '@/components/mistake/MistakeCard.vue';
import NoteEditor from '@/components/practice/NoteEditor.vue';
import { useMistakeStore } from '@/stores/mistake';

const router = useRouter();
const mistakeStore = useMistakeStore();

const loading = ref(false);
const mistakes = ref<MistakeData[]>([]);
const totalCount = ref(0);
const filteredCount = ref(0);
const total = ref(0);

const showBatchActions = computed(() => selectedCount.value > 0);
const selectedIds = ref<Set<string>>(new Set());
const deletedIds = ref<Set<string>>(new Set());

const filters = reactive<MistakeFilters>({
  sortBy: 'recent',
});

const pagination = reactive({
  page: 1,
  limit: 20,
});

const showImportDialog = ref(false);
const showNoteEditor = ref(false);
const editingNote = ref('');
const editingMistakeId = ref('');

const subjectOptions = computed(() => {
  return [
    { value: 'math', label: '数学' },
    { value: 'english', label: '英语' },
    { value: 'chinese', label: '语文' },
    { value: 'physics', label: '物理' },
    { value: 'chemistry', label: '化学' },
    { value: 'biology', label: '生物' },
    { value: 'history', label: '历史' },
    { value: 'geography', label: '地理' },
  ];
});

const selectedCount = computed(() => selectedIds.value.size);

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await mistakeStore.fetchMistakes({
      ...filters,
      page: pagination.page,
      limit: pagination.limit,
    });

    mistakes.value = response.items.map((item: any, index: number) => ({
      id: item.id,
      index: (pagination.page - 1) * pagination.limit + index + 1,
      question: item.question,
      subject: item.subject,
      questionType: item.type,
      difficulty: item.difficulty,
      myAnswer: item.myAnswer,
      correctAnswer: item.correctAnswer,
      errorCount: item.errorCount || 1,
      reviewCount: item.reviewCount || 0,
      reviewStatus: item.reviewStatus || 'new',
      note: item.note,
      createdAt: item.createdAt,
      subjectColor: getSubjectColor(item.subject),
    }));

    totalCount.value = response.total || 0;
    filteredCount.value = response.total || 0;
    total.value = response.total || 0;
  } catch (error: any) {
    ElMessage.error(error.message || '获取错题列表失败');
  } finally {
    loading.value = false;
  }
};

const getSubjectColor = (subject: string): string => {
  const colorMap: Record<string, string> = {
    数学: '#409EFF',
    英语: '#67C23A',
    语文: '#E6A23C',
    物理: '#F56C6C',
    化学: '#909399',
    生物: '#67C23A',
    历史: '#E6A23C',
    地理: '#409EFF',
  };
  return colorMap[subject] || '#909399';
};

const handleSearch = () => {
  pagination.page = 1;
  fetchData();
};

const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchData();
};

const handleSizeChange = (size: number) => {
  pagination.limit = size;
  pagination.page = 1;
  fetchData();
};

const handleResetFilters = () => {
  Object.assign(filters, {
    keyword: '',
    subject: '',
    difficulty: '',
    status: '',
    questionType: '',
    errorCount: '',
    timeRange: '',
    sortBy: 'recent',
  });
  handleSearch();
};

// 选择相关
const handleSelectMistake = (id: string) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
};

const handleToggleAll = (checked: boolean) => {
  if (checked) {
    mistakes.value.forEach(m => selectedIds.value.add(m.id));
  } else {
    selectedIds.value.clear();
  }
};

const handleCancelSelect = () => {
  selectedIds.value.clear();
};

// 批量操作
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedCount.value} 道错题吗？`,
      '确认删除',
      { type: 'warning' }
    );

    await mistakeStore.batchDelete(Array.from(selectedIds.value));
    selectedIds.value.clear();
    ElMessage.success('删除成功');
    fetchData();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
};

const handleBatchMark = async (status: string) => {
  try {
    await mistakeStore.batchUpdateStatus(Array.from(selectedIds.value), status);
    ElMessage.success('标记成功');
    fetchData();
  } catch (error: any) {
    ElMessage.error(error.message || '标记失败');
  }
};

const handleBatchExport = async () => {
  try {
    await mistakeStore.exportMistakes(Array.from(selectedIds.value));
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败');
  }
};

const handleAddToPractice = async () => {
  try {
    await mistakeStore.addToPractice(Array.from(selectedIds.value));
    ElMessage.success('已加入练习队列');
    router.push('/practice/setup');
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  }
};

// 单个操作
const handleViewMistake = (id: string) => {
  router.push(`/mistake/${id}`);
};

const handleEditNote = (id: string) => {
  const mistake = mistakes.value.find(m => m.id === id);
  if (mistake) {
    editingMistakeId.value = id;
    editingNote.value = mistake.note || '';
    showNoteEditor.value = true;
  }
};

const handleNoteChange = (content: string) => {
  editingNote.value = content;
};

const handleSaveNote = async (content: string) => {
  try {
    await mistakeStore.updateNote(editingMistakeId.value, content);
    ElMessage.success('笔记保存成功');
    fetchData();
  } catch (error: any) {
    ElMessage.error(error.message || '保存失败');
  }
};

const handleSinglePractice = (id: string) => {
  router.push(`/practice/single/${id}`);
};

const handleExportMistake = async (id: string) => {
  try {
    await mistakeStore.exportMistakes([id]);
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败');
  }
};

const handleDeleteMistake = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这道错题吗？', '确认删除', {
      type: 'warning',
    });

    await mistakeStore.deleteMistake(id);
    deletedIds.value.add(id);
    ElMessage.success('删除成功');

    setTimeout(() => {
      fetchData();
    }, 500);
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
};

// 导入
const handleImport = () => {
  showImportDialog.value = true;
};

const handleImportChange = (file: any) => {
  // 处理文件选择
};

const handleConfirmImport = async () => {
  // TODO: 实现导入逻辑
  showImportDialog.value = false;
  ElMessage.success('导入成功');
  fetchData();
};

const goToEntry = () => {
  router.push('/mistake/entry');
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.mistake-list-view {
  padding: var(--spacing-xl);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.list-title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.list-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-lg);
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.mistake-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.list-pagination {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl) 0;
}

.upload-icon {
  font-size: 67px;
  color: var(--primary-color);
}

.upload-text {
  margin-top: var(--spacing-md);

  .text-main {
    font-size: var(--font-size-md);
    color: var(--color-text-primary);

    em {
      color: var(--primary-color);
      font-style: normal;
    }
  }

  .text-sub {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-top: var(--spacing-xs);
  }
}

@media (max-width: $breakpoint-xl) {
  .list-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: $breakpoint-md) {
  .mistake-list-view {
    padding: var(--spacing-md);
  }

  .list-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
