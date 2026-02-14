<template>
  <div class="edit-view">
    <el-page-header @back="goBack" title="返回">
      <template #content>
        <span class="page-title">编辑错题</span>
      </template>
    </el-page-header>

    <el-card v-loading="loading" class="edit-card" v-if="formData">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="top"
      >
        <!-- 科目选择 -->
        <el-form-item label="科目" prop="subjectId" required>
          <CategorySelector v-model="formData.subjectId" @change="handleSubjectChange" />
        </el-form-item>

        <!-- 题型选择 -->
        <el-form-item label="题型" prop="type" required>
          <el-radio-group v-model="formData.type">
            <el-radio label="单选题" value="choice" />
            <el-radio label="多选题" value="choice-multi" />
            <el-radio label="判断题" value="judge" />
            <el-radio label="填空题" value="fill" />
            <el-radio label="简答题" value="essay" />
            <el-radio label="其他" value="other" />
          </el-radio-group>
        </el-form-item>

        <!-- 难度选择 -->
        <el-form-item label="难度" prop="difficultyLevel">
          <el-radio-group v-model="formData.difficultyLevel">
            <el-radio label="简单" value="easy" />
            <el-radio label="中等" value="medium" />
            <el-radio label="困难" value="hard" />
          </el-radio-group>
        </el-form-item>

        <!-- 题目内容 -->
        <el-form-item label="题目内容" prop="content" required>
          <QuestionEditor
            v-model="formData.content"
            :height="300"
            placeholder="请输入题目内容..."
          />
        </el-form-item>

        <!-- 选项（仅选择题需要） -->
        <el-form-item
          v-if="['choice', 'choice-multi'].includes(formData.type)"
          label="选项"
          prop="options"
        >
          <el-input
            v-model="formData.options"
            type="textarea"
            :rows="6"
            placeholder="请输入选项，每行一个选项..."
          />
        </el-form-item>

        <!-- 答案对比 -->
        <el-form-item label="正确答案" prop="answer" required>
          <el-input v-model="formData.answer" placeholder="请输入正确答案" />
        </el-form-item>

        <el-form-item label="用户答案" prop="userAnswer">
          <el-input v-model="formData.userAnswer" placeholder="请输入用户答案" />
        </el-form-item>

        <!-- 题目解析 -->
        <el-form-item label="题目解析" prop="analysis">
          <QuestionEditor
            v-model="formData.analysis"
            :height="200"
            placeholder="请输入解析..."
          />
        </el-form-item>

        <!-- 来源 -->
        <el-form-item label="来源" prop="source">
          <el-input v-model="formData.source" placeholder="如：2024年考试" />
        </el-form-item>

        <!-- 知识点 -->
        <el-form-item label="知识点" prop="knowledgePoints">
          <el-input
            v-model="formData.knowledgePoints"
            placeholder="多个知识点用逗号分隔"
          />
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button @click="goBack">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            保存修改
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 空状态 -->
    <el-empty v-else-if="!loading" description="错题不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import CategorySelector from '@/components/mistake/CategorySelector.vue';
import QuestionEditor from '@/components/mistake/QuestionEditor.vue';
import { mistakeApi } from '@/api/mistake';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const formData = reactive({
  subjectId: '',
  type: 'choice',
  difficultyLevel: 'medium',
  content: '',
  options: '',
  answer: '',
  userAnswer: '',
  analysis: '',
  source: '',
  knowledgePoints: ''
});

// 表单验证规则
const formRules = {
  subjectId: [{ required: true, message: '请选择科目', trigger: 'blur' }],
  type: [{ required: true, message: '请选择题型', trigger: 'change' }],
  content: [{ required: true, message: '请输入题目内容', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入正确答案', trigger: 'blur' }]
};

// 加载错题数据
const loadMistake = async () => {
  loading.value = true;
  try {
    const id = route.params.id as string;
    const response = await mistakeApi.getById(id);
    console.log('Edit page - API Response:', response);

    const data = response.data;
    console.log('Edit page - Mistake data:', data);

    // 回填表单数据
    Object.assign(formData, {
      subjectId: data.subjectId || '',
      type: data.type || 'choice',
      difficultyLevel: data.difficultyLevel || 'medium',
      content: data.content || data.question || '',
      options: data.options || '',
      answer: data.answer || '',
      userAnswer: data.userAnswer || '',
      analysis: data.analysis || '',
      source: data.source || '',
      knowledgePoints: data.knowledgePoints ? data.knowledgePoints.join(', ') : ''
    });
  } catch (error: any) {
    console.error('加载错题详情失败:', error);
    ElMessage.error('加载失败，请稍后重试');
  } finally {
    loading.value = false;
  }
};

// 科目变更处理
const handleSubjectChange = () => {
  console.log('Subject changed to:', formData.subjectId);
};

// 提交表单
const handleSubmit = async () => {
  const formRef = ref.value;
  if (!formRef) return;

  try {
    await formRef.validate();
    submitting.value = true;

    const id = route.params.id as string;
    const response = await mistakeApi.update(id, {
      subjectId: formData.subjectId,
      type: formData.type,
      difficultyLevel: formData.difficultyLevel,
      content: formData.content,
      options: formData.options,
      answer: formData.answer,
      userAnswer: formData.userAnswer,
      analysis: formData.analysis,
      source: formData.source,
      knowledgePoints: formData.knowledgePoints ? formData.knowledgePoints.split(',').map(s => s.trim()) : []
    });

    console.log('Update response:', response);

    ElMessage.success('修改成功');
    goBack();
  } catch (error: any) {
    console.error('提交失败:', error);
    if (error.errors) {
      ElMessage.error(error.errors[0]?.message || '提交失败，请检查表单');
    } else {
      ElMessage.error(error.message || '提交失败，请稍后重试');
    }
  } finally {
    submitting.value = false;
  }
};

// 返回列表页
const goBack = () => {
  router.back();
};

onMounted(() => {
  loadMistake();
});
</script>

<style scoped lang="scss">
.edit-view {
  padding: 20px;

  .page-title {
    font-size: 18px;
    font-weight: 500;
  }

  .edit-card {
    margin-top: 20px;
  }
}
</style>
