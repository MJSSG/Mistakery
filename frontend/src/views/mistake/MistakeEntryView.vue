<template>
  <div class="mistake-entry-view">
      <div class="entry-header">
        <h1 class="entry-title">录入错题</h1>
        <p class="entry-desc">支持粘贴题目，智能识别题型和答案</p>
      </div>

      <div class="entry-container">
        <div class="entry-main">
          <!-- 科目选择 -->
          <AppCard title="选择科目" class="entry-section">
            <CategorySelector v-model="formData.subjectId" @select="handleSubjectSelect" />
          </AppCard>

          <!-- 题目编辑 -->
          <AppCard title="题目内容" class="entry-section">
            <QuestionEditor
              v-model="formData.content"
              placeholder="请输入或粘贴题目内容，支持智能识别题型、选项和答案..."
              :rows="12"
              @parse="handleParse"
            />

            <!-- 题型选择 -->
            <div v-if="showTypeSelector" class="type-selector">
              <div class="type-label">题型：</div>
              <el-radio-group v-model="formData.type" size="small">
                <el-radio-button label="choice">单选</el-radio-button>
                <el-radio-button label="choice-multi">多选</el-radio-button>
                <el-radio-button label="fill">填空</el-radio-button>
                <el-radio-button label="judge">判断</el-radio-button>
                <el-radio-button label="essay">解答</el-radio-button>
              </el-radio-group>
            </div>

            <!-- 难度选择 -->
            <div class="difficulty-selector">
              <div class="difficulty-label">难度：</div>
              <el-radio-group v-model="formData.difficultyLevel" size="small">
                <el-radio-button label="easy">简单</el-radio-button>
                <el-radio-button label="medium">中等</el-radio-button>
                <el-radio-button label="hard">困难</el-radio-button>
              </el-radio-group>
            </div>

            <!-- 来源 -->
            <div class="source-selector">
              <div class="source-label">来源：</div>
              <el-input
                v-model="formData.source"
                placeholder="如：2023年高考数学卷"
                size="small"
                style="width: 200px;"
              />
            </div>
          </AppCard>

          <!-- 答案和解析 -->
          <AppCard title="答案与解析" class="entry-section">
            <el-form label-position="top">
              <el-form-item label="正确答案">
                <el-input
                  v-model="formData.answer"
                  placeholder="请输入正确答案"
                  :maxlength="200"
                />
              </el-form-item>

              <el-form-item label="我的答案（可选）">
                <el-input
                  v-model="formData.userAnswer"
                  placeholder="记录你的错误答案"
                  :maxlength="200"
                />
              </el-form-item>

              <el-form-item label="解析">
                <el-input
                  v-model="formData.analysis"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入题目解析..."
                  :maxlength="1000"
                  show-word-limit
                />
              </el-form-item>
            </el-form>
          </AppCard>

          <!-- 知识点 -->
          <AppCard title="知识点标签" class="entry-section">
            <div class="knowledge-input">
              <el-input
                v-model="knowledgeInput"
                placeholder="输入知识点后按回车添加"
                @keyup.enter="addKnowledgePoint"
              >
                <template #append>
                  <el-button :icon="Plus" @click="addKnowledgePoint">添加</el-button>
                </template>
              </el-input>

              <div v-if="formData.knowledgePoints.length > 0" class="knowledge-list">
                <el-tag
                  v-for="(point, index) in formData.knowledgePoints"
                  :key="index"
                  closable
                  @close="removeKnowledgePoint(index)"
                  class="knowledge-tag"
                >
                  {{ point }}
                </el-tag>
              </div>
            </div>
          </AppCard>
        </div>

        <!-- 预览面板 -->
        <div class="entry-sidebar">
          <PreviewPanel
            :parsed-data="parsedData"
            @confirm="handleConfirm"
            @edit="handleEdit"
            @clear="handleClear"
          />
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import AppCard from '@/components/common/AppCard.vue';
import CategorySelector from '@/components/mistake/CategorySelector.vue';
import QuestionEditor from '@/components/mistake/QuestionEditor.vue';
import PreviewPanel from '@/components/mistake/PreviewPanel.vue';
import { mistakeApi } from '@/api/mistake';

interface FormData {
  subjectId: string;
  type: string;
  content: string;
  question?: string;
  options?: string;
  answer: string;
  userAnswer?: string;
  analysis: string;
  knowledgePoints: string[];
  difficultyLevel: string;
  source?: string;
}

const router = useRouter();

const knowledgeInput = ref('');
const showTypeSelector = ref(false);

const formData = reactive<FormData>({
  subjectId: '',
  type: 'choice',
  content: '',
  question: '',
  options: '',
  answer: '',
  userAnswer: '',
  analysis: '',
  knowledgePoints: [],
  difficultyLevel: 'medium',
  source: '',
});

const parsedData = computed(() => {
  return {
    type: formData.type,
    difficulty: formData.difficultyLevel,
    question: formData.question || formData.content,
    options: parseOptions(formData.options),
    answer: formData.answer,
    userAnswer: formData.userAnswer,
    isCorrect: formData.answer === formData.userAnswer,
    analysis: formData.analysis,
    knowledgePoints: formData.knowledgePoints,
  };
});

const parseOptions = (optionsStr?: string) => {
  if (!optionsStr) return [];
  // 简单的选项解析逻辑
  const lines = optionsStr.split('\n').filter(line => line.trim());
  return lines.map((line, index) => {
    const label = String.fromCharCode(65 + index); // A, B, C, D
    const match = line.match(/^[A-Z][.、]\s*(.+)/);
    return {
      label,
      content: match ? match[1] : line,
      isCorrect: line.includes('✓') || line.includes('√'),
    };
  });
};

const handleSubjectSelect = (id: string) => {
  console.log('Selected subject:', id);
  formData.subjectId = id;
};

const handleParse = (content: string) => {
  // 智能解析题目内容
  if (!content) return;

  // 检测题型
  if (content.includes('多选') || (content.includes('A.') && content.includes('(AB)'))) {
    formData.type = 'choice-multi';
  } else if (content.includes('填空') || content.includes('____')) {
    formData.type = 'fill';
  } else if (content.includes('判断') || content.includes('对错')) {
    formData.type = 'judge';
  } else {
    formData.type = 'choice';
  }

  // 提取题目（去除选项后的内容）
  const lines = content.split('\n');
  const questionLines: string[] = [];
  const optionLines: string[] = [];
  const analysisLines: string[] = [];
  let inOptions = false;
  let inAnalysis = false;

  for (const line of lines) {
    // 检测是否进入解析部分
    if (line.trim() === '解析' || line.trim().startsWith('解析')) {
      inAnalysis = true;
      inOptions = false;
      continue;
    }

    if (inAnalysis) {
      // 解析部分的所有内容都加入
      if (line.trim()) {
        analysisLines.push(line);
      }
    } else if (/^\*\*[A-D]\*\*/.test(line) || /^[A-Z][.、]/.test(line) || /^[A-D]\)/.test(line)) {
      inOptions = true;
    }

    if (inOptions && !inAnalysis) {
      optionLines.push(line);
    } else if (!inOptions && !inAnalysis) {
      questionLines.push(line);
    }
  }

  formData.question = questionLines.join('\n').trim();
  formData.options = optionLines.join('\n').trim();

  // 提取答案 - 支持多种格式
  const answerPatterns = [
    /正确答案[：:]\s*([A-D]+)/i,
    /答案[：:]\s*([A-D]+)/i,
    /我的答案[：:]\s*([A-D]+)/i,
  ];

  for (const pattern of answerPatterns) {
    const match = content.match(pattern);
    if (match) {
      formData.answer = match[1];
      break;
    }
  }

  // 提取我的答案（用户答案）
  const myAnswerMatch = content.match(/我的答案[：:]\s*([A-D]+)/i);
  if (myAnswerMatch) {
    formData.userAnswer = myAnswerMatch[1];
  }

  // 提取解析
  if (analysisLines.length > 0) {
    formData.analysis = analysisLines.join('\n').trim();
  }

  showTypeSelector.value = true;
};

const addKnowledgePoint = () => {
  const point = knowledgeInput.value.trim();
  if (point && !formData.knowledgePoints.includes(point)) {
    formData.knowledgePoints.push(point);
    knowledgeInput.value = '';
  }
};

const removeKnowledgePoint = (index: number) => {
  formData.knowledgePoints.splice(index, 1);
};

const handleConfirm = async () => {
  // 验证必填字段
  // 如果没有选择科目，使用默认值
  const subjectIdToSubmit = formData.subjectId || 'quant'; // 默认使用数量关系（最接近数学）

  if (!formData.content) {
    ElMessage.warning('请输入题目内容');
    return;
  }
  if (!formData.answer) {
    ElMessage.warning('请输入正确答案');
    return;
  }
  if (!formData.analysis) {
    ElMessage.warning('请输入解析');
    return;
  }

  // 准备数据用于提交，确保使用正确的 subjectId
  const submitData = {
    ...formData,
    subjectId: subjectIdToSubmit
  };
  try {
    // 调用 API 保存错题
    await mistakeApi.save(submitData);
    ElMessage.success('错题录入成功！');
    // 清空表单
    handleClear();

    // 跳转到错题列表
    router.push('/mistake/list');
  } catch (error: any) {
    console.error('保存错题失败:', error);
    ElMessage.error(error.response?.data?.message || '保存失败，请重试');
  }
};

const handleEdit = () => {
  // 滚动到编辑区域
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleClear = () => {
  Object.assign(formData, {
    subjectId: '',
    type: 'choice',
    content: '',
    question: '',
    options: '',
    answer: '',
    userAnswer: '',
    analysis: '',
    knowledgePoints: [],
    difficultyLevel: 'medium',
    source: '',
  });
  knowledgeInput.value = '';
  showTypeSelector.value = false;
};
</script>

<style scoped lang="scss">
.mistake-entry-view {
  max-width: 1400px;
  margin: 0 auto;
}

.entry-header {
  text-align: center;
  margin-bottom: var(--spacing-xxl);
}

.entry-title {
  font-size: var(--font-size-xxl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.entry-desc {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.entry-container {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: var(--spacing-xl);
}

.entry-main {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.entry-sidebar {
  position: sticky;
  top: calc(var(--header-height) + var(--spacing-lg));
  height: fit-content;
}

.type-selector,
.difficulty-selector,
.source-selector {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.type-label,
.difficulty-label,
.source-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  min-width: 40px;
}

.knowledge-input {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.knowledge-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.knowledge-tag {
  margin: 0;
}

@media (max-width: $breakpoint-lg) {
  .entry-container {
    grid-template-columns: 1fr;
  }

  .entry-sidebar {
    position: static;
  }
}
</style>
