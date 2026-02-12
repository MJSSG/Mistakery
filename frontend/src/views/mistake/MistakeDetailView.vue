<template>
  <MainLayout>
    <div class="mistake-detail">
      <el-page-header @back="goBack" title="返回">
        <template #content>
          <span class="page-title">错题详情</span>
        </template>
      </el-page-header>

      <el-card v-loading="loading" class="detail-card">
        <template v-if="mistake">
          <!-- 题目内容 -->
          <div class="question-content">
            <div class="meta-info">
              <el-tag :type="getTypeTag(mistake.question?.type)">
                {{ getTypeLabel(mistake.question?.type) }}
              </el-tag>
              <el-tag :type="getDifficultyTag(mistake.question?.difficulty)">
                {{ getDifficultyLabel(mistake.question?.difficulty) }}
              </el-tag>
              <el-tag>{{ getSubjectLabel(mistake.question?.subject) }}</el-tag>
            </div>

            <h3 class="question-text">{{ mistake.question?.content }}</h3>

            <!-- 选项 -->
            <div v-if="mistake.question?.options" class="options">
              <div
                v-for="(option, key) in mistake.question.options"
                :key="key"
                class="option-item"
                :class="{
                  'is-correct': mistake.question?.correctAnswer?.includes(key),
                  'is-wrong': mistake.userAnswer?.includes(key) && !mistake.question?.correctAnswer?.includes(key)
                }"
              >
                <span class="option-key">{{ key }}.</span>
                <span class="option-value">{{ option }}</span>
                <el-icon v-if="mistake.question?.correctAnswer?.includes(key)" class="icon-correct">
                  <CircleCheck />
                </el-icon>
                <el-icon v-if="mistake.userAnswer?.includes(key) && !mistake.question?.correctAnswer?.includes(key)" class="icon-wrong">
                  <CircleClose />
                </el-icon>
              </div>
            </div>

            <!-- 答案对比 -->
            <div class="answer-comparison">
              <div class="answer-item">
                <span class="label">我的答案：</span>
                <el-tag type="danger">{{ mistake.userAnswer?.join(', ') || '未作答' }}</el-tag>
              </div>
              <div class="answer-item">
                <span class="label">正确答案：</span>
                <el-tag type="success">{{ mistake.question?.correctAnswer?.join(', ') }}</el-tag>
              </div>
            </div>

            <!-- 解析 -->
            <div v-if="mistake.question?.explanation" class="explanation">
              <h4>解析</h4>
              <p>{{ mistake.question.explanation }}</p>
            </div>

            <!-- 错误信息 -->
            <div class="mistake-info">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="错误次数">{{ mistake.reviewCount }}</el-descriptions-item>
                <el-descriptions-item label="掌握状态">
                  <el-tag :type="getStatusTag(mistake.status)">
                    {{ getStatusLabel(mistake.status) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="下次复习">{{ formatDate(mistake.nextReviewDate) }}</el-descriptions-item>
                <el-descriptions-item label="记录时间">{{ formatDate(mistake.createdAt) }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </template>

        <el-empty v-else-if="!loading" description="错题不存在" />
      </el-card>

      <!-- 操作按钮 -->
      <div v-if="mistake" class="action-buttons">
        <el-button @click="goBack">返回</el-button>
        <el-button type="primary" @click="startReview">开始复习</el-button>
        <el-button :type="mistake.isMarked ? 'warning' : 'default'" @click="toggleMark">
          {{ mistake.isMarked ? '取消收藏' : '收藏' }}
        </el-button>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MainLayout from '@/components/layout/MainLayout.vue';
import { CircleCheck, CircleClose } from '@element-plus/icons-vue';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const mistake = ref<any>(null);
const loading = ref(false);

const loadMistake = async () => {
  loading.value = true;
  try {
    // TODO: 调用 API 获取错题详情
    // const { data } = await mistakeApi.getMistakeDetail(route.params.id);
    // mistake.value = data;
  } catch (error) {
    console.error('加载错题详情失败:', error);
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.back();
};

const startReview = () => {
  router.push(`/review/session?mistakeId=${route.params.id}`);
};

const toggleMark = async () => {
  try {
    // TODO: 调用 API 切换收藏状态
    mistake.value.isMarked = !mistake.value.isMarked;
  } catch (error) {
    console.error('切换收藏状态失败:', error);
  }
};

const formatDate = (date: string) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '未设置';
};

const getTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
    fill: '填空题',
    comprehensive: '综合题',
    essay: '简答题',
    indefinite: '不定项选择题'
  };
  return types[type] || type;
};

const getTypeTag = (type: string) => {
  const tags: Record<string, any> = {
    single: '',
    multiple: 'warning',
    judge: 'info',
    fill: 'success',
    comprehensive: 'danger',
    essay: 'warning',
    indefinite: 'warning'
  };
  return tags[type] || '';
};

const getDifficultyLabel = (difficulty: string) => {
  const levels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  };
  return levels[difficulty] || difficulty;
};

const getDifficultyTag = (difficulty: string) => {
  const tags: Record<string, any> = {
    easy: 'success',
    medium: 'warning',
    hard: 'danger'
  };
  return tags[difficulty] || '';
};

const getSubjectLabel = (subject: string) => {
  const subjects: Record<string, string> = {
    politicalTheory: '政治理论',
    commonSense: '常识',
    verbalUnderstanding: '言语理解',
    logicalReasoning: '逻辑推理',
    quantitativeRelation: '数量关系'
  };
  return subjects[subject] || subject;
};

const getStatusLabel = (status: string) => {
  const statuses: Record<string, string> = {
    new: '新错题',
    learning: '学习中',
    mastered: '已掌握'
  };
  return statuses[status] || status;
};

const getStatusTag = (status: string) => {
  const tags: Record<string, any> = {
    new: 'info',
    learning: 'warning',
    mastered: 'success'
  };
  return tags[status] || '';
};

onMounted(() => {
  loadMistake();
});
</script>

<style scoped lang="scss">
.mistake-detail {
  padding: 20px;

  .page-title {
    font-size: 18px;
    font-weight: 500;
  }

  .detail-card {
    margin-top: 20px;
  }

  .question-content {
    .meta-info {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
    }

    .question-text {
      font-size: 18px;
      line-height: 1.8;
      margin-bottom: 24px;
    }

    .options {
      margin-bottom: 24px;

      .option-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        margin-bottom: 8px;
        border: 2px solid var(--el-border-color);
        border-radius: 8px;
        transition: all 0.3s;

        .option-key {
          font-weight: 600;
          margin-right: 12px;
        }

        .option-value {
          flex: 1;
        }

        .el-icon {
          margin-left: 8px;
          font-size: 20px;
        }

        &.is-correct {
          border-color: var(--el-color-success);
          background-color: var(--el-color-success-light-9);
        }

        &.is-wrong {
          border-color: var(--el-color-danger);
          background-color: var(--el-color-danger-light-9);
        }
      }
    }

    .answer-comparison {
      display: flex;
      gap: 24px;
      padding: 16px;
      margin-bottom: 24px;
      background-color: var(--el-fill-color-light);
      border-radius: 8px;

      .answer-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          font-weight: 500;
        }
      }
    }

    .explanation {
      padding: 16px;
      margin-bottom: 24px;
      background-color: var(--el-color-primary-light-9);
      border-left: 4px solid var(--el-color-primary);
      border-radius: 4px;

      h4 {
        margin: 0 0 8px;
        color: var(--el-color-primary);
      }

      p {
        margin: 0;
        line-height: 1.8;
      }
    }

    .mistake-info {
      margin-top: 24px;
    }
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
  }
}
</style>
