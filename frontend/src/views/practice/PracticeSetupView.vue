<template>
  <div class="practice-setup-view">
      <div class="page-header">
        <div class="header-left">
          <el-button :icon="ArrowLeft" @click="goBack" circle />
          <h1 class="page-title">智能组卷</h1>
        </div>
        <div class="header-right">
          <el-tag v-if="examCount > 0" type="info">
            已有 {{ examCount }} 个练习
          </el-tag>
        </div>
      </div>

      <div class="page-content">
        <el-card class="setup-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Grid /></el-icon>
              <span class="header-title">配置练习</span>
            </div>
          </template>

          <ExamSetup
            @generated="handleExamGenerated"
            @cancel="handleCancel"
          />
        </el-card>

        <!-- 历史练习 -->
        <el-card v-if="recentExams.length > 0" class="history-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Clock /></el-icon>
              <span class="header-title">最近练习</span>
              <el-link type="primary" @click="viewAllExams">查看全部</el-link>
            </div>
          </template>

          <div class="exam-list">
            <div
              v-for="exam in recentExams"
              :key="exam.id"
              class="exam-item"
              @click="startExam(exam.id)"
            >
              <div class="exam-info">
                <div class="exam-name">{{ exam.name }}</div>
                <div class="exam-meta">
                  <span>{{ exam.questionCount }} 题</span>
                  <el-divider direction="vertical" />
                  <span>{{ formatDate(exam.createdAt) }}</span>
                </div>
              </div>

              <div class="exam-status">
                <el-tag :type="getStatusType(exam.status)" size="small">
                  {{ getStatusLabel(exam.status) }}
                </el-tag>
              </div>

              <div class="exam-actions">
                <el-button type="primary" size="small" @click.stop="startExam(exam.id)">
                  <el-icon><VideoPlay /></el-icon>
                  开始
                </el-button>
                <el-button size="small" @click.stop="deleteExam(exam.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 使用提示 -->
        <el-card class="tips-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><QuestionFilled /></el-icon>
              <span class="header-title">使用提示</span>
            </div>
          </template>

          <div class="tips-content">
            <div class="tip-item">
              <div class="tip-icon">
                <el-icon><Select /></el-icon>
              </div>
              <div class="tip-text">
                <div class="tip-title">多维度筛选</div>
                <div class="tip-desc">支持按科目、知识点、题型、难度、掌握程度等条件筛选题目</div>
              </div>
            </div>

            <div class="tip-item">
              <div class="tip-icon">
                <el-icon><Refresh /></el-icon>
              </div>
              <div class="tip-text">
                <div class="tip-title">智能去重</div>
                <div class="tip-desc">系统会自动排除已掌握的题目（可在高级选项中调整）</div>
              </div>
            </div>

            <div class="tip-item">
              <div class="tip-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="tip-text">
                <div class="tip-title">限时答题</div>
                <div class="tip-desc">可设置答题时间限制，培养时间管理能力</div>
              </div>
            </div>

            <div class="tip-item">
              <div class="tip-icon">
                <el-icon><DocumentCopy /></el-icon>
              </div>
              <div class="tip-text">
                <div class="tip-title">保存配置</div>
                <div class="tip-desc">生成的练习可保存为模板，方便下次快速组卷</div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  ArrowLeft,
  Grid,
  Clock,
  QuestionFilled,
  VideoPlay,
  Delete,
  Select,
  Refresh,
  Timer,
  DocumentCopy,
} from '@element-plus/icons-vue';
import ExamSetup from '@/components/practice/ExamSetup.vue';
import { usePracticeStore } from '@/stores/practice';

const router = useRouter();
const practiceStore = usePracticeStore();

const examCount = ref(0);
const recentExams = ref<any[]>([]);

onMounted(async () => {
  await fetchRecentExams();
});

const fetchRecentExams = async () => {
  try {
    const response = await practiceStore.fetchExamList({ limit: 5 });
    examCount.value = response.total;
    recentExams.value = response.data;
  } catch (error) {
    console.error('Failed to fetch recent exams:', error);
  }
};

const goBack = () => {
  router.back();
};

const handleExamGenerated = (examId: string) => {
  ElMessage.success('练习生成成功！');
  router.push(`/practice/${examId}`);
};

const handleCancel = () => {
  router.back();
};

const startExam = async (examId: string) => {
  router.push(`/practice/${examId}`);
};

const deleteExam = async (examId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个练习吗？', '确认删除', {
      type: 'warning',
    });

    await practiceStore.deleteExam(examId);
    ElMessage.success('删除成功');
    await fetchRecentExams();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败');
    }
  }
};

const viewAllExams = () => {
  router.push('/practice/list');
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes === 0 ? '刚刚' : `${minutes} 分钟前`;
    }
    return `${hours} 小时前`;
  } else if (days === 1) {
    return '昨天';
  } else if (days < 7) {
    return `${days} 天前`;
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: '草稿',
    'in-progress': '进行中',
    completed: '已完成',
    abandoned: '已放弃',
  };
  return labels[status] || status;
};

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    draft: 'info',
    'in-progress': 'warning',
    completed: 'success',
    abandoned: 'danger',
  };
  return types[status] || 'info';
};
</script>

<style scoped lang="scss">
.practice-setup-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.setup-card,
.history-card,
.tips-card {
  border-radius: var(--border-radius-lg);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.header-icon {
  font-size: var(--font-size-lg);
  color: var(--primary-color);
}

.header-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  flex: 1;
}

.exam-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.exam-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--color-bg-hover);
    box-shadow: var(--shadow-sm);
  }
}

.exam-info {
  flex: 1;
  min-width: 0;
}

.exam-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.exam-meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.exam-status {
  flex-shrink: 0;
}

.exam-actions {
  display: flex;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.tips-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.tip-item {
  display: flex;
  gap: var(--spacing-md);
}

.tip-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-color-light));
  color: var(--color-white);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.tip-text {
  flex: 1;
}

.tip-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.tip-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

:deep(.el-card__header) {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}

:deep(.el-card__body) {
  padding: var(--spacing-xl);
}

@media (max-width: $breakpoint-md) {
  .practice-setup-view {
    padding: var(--spacing-md);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .exam-item {
    flex-wrap: wrap;
  }

  .exam-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .tips-content {
    grid-template-columns: 1fr;
  }
}
</style>
