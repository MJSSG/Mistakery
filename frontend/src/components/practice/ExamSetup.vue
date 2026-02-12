<template>
  <div class="exam-setup">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-position="top">
      <!-- 科目选择 -->
      <el-form-item label="选择科目" prop="subjectId" required>
        <CategorySelector v-model="formData.subjectId" @change="handleSubjectChange" />
      </el-form-item>

      <!-- 知识点选择 -->
      <el-form-item label="知识点筛选">
        <KnowledgePointTree
          v-model="formData.knowledgePoints"
          :subject-id="formData.subjectId"
          placeholder="选择知识点，不选则包含所有知识点"
        />
      </el-form-item>

      <!-- 筛选条件 -->
      <el-form-item label="筛选条件">
        <FilterOptions
          v-model:type="formData.type"
          v-model:difficulty="formData.difficulty"
          v-model:mastery="formData.masteryLevel"
          @update:type="handleFilterChange"
          @update:difficulty="handleFilterChange"
          @update:mastery="handleFilterChange"
        />
      </el-form-item>

      <!-- 题目数量 -->
      <el-form-item label="题目数量" prop="questionCount">
        <CountSelector
          v-model="formData.questionCount"
          :min="1"
          :max="100"
          :available="availableCount"
        />
        <div v-if="availableCount !== null" class="available-hint">
          可用题目数量：{{ availableCount }}
        </div>
      </el-form-item>

      <!-- 练习名称 -->
      <el-form-item label="练习名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="为本次练习命名，方便后续查看"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <!-- 高级选项 -->
      <el-form-item>
        <el-collapse>
          <el-collapse-item title="高级选项" name="advanced">
            <el-form-item label="是否包含已掌握题目">
              <el-switch v-model="formData.includeMastered" />
            </el-form-item>
            <el-form-item label="随机题目顺序">
              <el-switch v-model="formData.shuffleQuestions" />
            </el-form-item>
            <el-form-item label="限时答题">
              <el-input-number
                v-model="formData.timeLimit"
                :min="0"
                :max="180"
                :step="5"
                controls-position="right"
              />
              <span class="ml-2">分钟（0为不限时）</span>
            </el-form-item>
          </el-collapse-item>
        </el-collapse>
      </el-form-item>

      <!-- 操作按钮 -->
      <el-form-item class="form-actions">
        <el-button size="large" @click="handleReset">重置</el-button>
        <el-button
          type="primary"
          size="large"
          :loading="generating"
          :disabled="!canGenerate"
          @click="handleGenerate"
        >
          {{ generating ? '生成中...' : '生成练习' }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import CategorySelector from '@/components/mistake/CategorySelector.vue';
import KnowledgePointTree from './KnowledgePointTree.vue';
import FilterOptions from './FilterOptions.vue';
import CountSelector from './CountSelector.vue';
import { practiceApi } from '@/api/practice';

export interface ExamConfig {
  subjectId: string;
  knowledgePoints?: string[];
  type?: string;
  difficulty?: string;
  masteryLevel?: string;
  questionCount: number;
  name: string;
  includeMastered?: boolean;
  shuffleQuestions?: boolean;
  timeLimit?: number;
}

const emit = defineEmits<{
  (e: 'generated', examId: string): void;
  (e: 'cancel'): void;
}>();

const formRef = ref();
const generating = ref(false);
const availableCount = ref<number | null>(null);

const formData = reactive<ExamConfig>({
  subjectId: '',
  knowledgePoints: [],
  type: '',
  difficulty: '',
  masteryLevel: '',
  questionCount: 20,
  name: '',
  includeMastered: false,
  shuffleQuestions: true,
  timeLimit: 0,
});

const formRules = {
  subjectId: [{ required: true, message: '请选择科目', trigger: 'change' }],
  questionCount: [
    { required: true, message: '请设置题目数量', trigger: 'change' },
    {
      validator: (_rule: any, value: number) => {
        if (value <= 0) {
          return Promise.reject('题目数量必须大于0');
        }
        if (availableCount.value !== null && value > availableCount.value) {
          return Promise.reject(`题目数量不能超过可用数量（${availableCount.value}）`);
        }
        return Promise.resolve();
      },
      trigger: 'change',
    },
  ],
  name: [
    { required: true, message: '请输入练习名称', trigger: 'blur' },
    { min: 2, max: 50, message: '练习名称长度在2-50个字符', trigger: 'blur' },
  ],
};

const canGenerate = computed(() => {
  return formData.subjectId && formData.questionCount > 0 && formData.name;
});

// 自动生成练习名称
watch(
  () => [formData.subjectId, formData.type, formData.difficulty],
  ([subjectId, type, difficulty]) => {
    if (subjectId && !formData.name) {
      const date = new Date();
      const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
      formData.name = `${dateStr}练习`;
    }
  },
  { deep: true }
);

// 监听筛选条件变化，更新可用题目数
watch(
  () => [
    formData.subjectId,
    formData.knowledgePoints,
    formData.type,
    formData.difficulty,
    formData.masteryLevel,
  ],
  async () => {
    if (formData.subjectId) {
      await updateAvailableCount();
    }
  },
  { deep: true }
);

const handleSubjectChange = () => {
  formData.knowledgePoints = [];
};

const handleFilterChange = () => {
  updateAvailableCount();
};

const updateAvailableCount = async () => {
  if (!formData.subjectId) {
    availableCount.value = null;
    return;
  }

  try {
    const response = await practiceApi.getAvailableCount({
      subjectId: formData.subjectId,
      knowledgePoints: formData.knowledgePoints,
      type: formData.type,
      difficulty: formData.difficulty,
      masteryLevel: formData.masteryLevel,
    });
    availableCount.value = response.count;
  } catch (error) {
    console.error('Failed to get available count:', error);
    availableCount.value = null;
  }
};

const handleReset = () => {
  formRef.value?.resetFields();
  formData.knowledgePoints = [];
  formData.includeMastered = false;
  formData.shuffleQuestions = true;
  formData.timeLimit = 0;
  availableCount.value = null;
};

const handleGenerate = async () => {
  try {
    await formRef.value?.validate();

    if (availableCount.value !== null && formData.questionCount > availableCount.value) {
      ElMessage.warning(`题目数量超过可用数量（${availableCount.value}）`);
      return;
    }

    generating.value = true;

    const response = await practiceApi.createExam({
      subjectId: formData.subjectId,
      name: formData.name,
      filterConfig: {
        knowledgePoints: formData.knowledgePoints,
        type: formData.type,
        difficulty: formData.difficulty,
        masteryLevel: formData.masteryLevel,
        includeMastered: formData.includeMastered,
      },
      questionCount: formData.questionCount,
      shuffleQuestions: formData.shuffleQuestions,
      timeLimit: formData.timeLimit,
    });

    ElMessage.success('练习生成成功！');
    emit('generated', response.id);
  } catch (error: any) {
    if (error.errors) {
      // 表单验证错误
      return;
    }
    ElMessage.error(error.message || '生成练习失败');
  } finally {
    generating.value = false;
  }
};
</script>

<style scoped lang="scss">
.exam-setup {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.available-hint {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.form-actions {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);

  .el-button {
    min-width: 120px;
  }
}

.ml-2 {
  margin-left: var(--spacing-sm);
}

:deep(.el-collapse-item__header) {
  font-weight: var(--font-weight-medium);
}

:deep(.el-collapse-item__content) {
  padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) var(--spacing-xl);
}
</style>
