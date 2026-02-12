<template>
  <div class="question-editor">
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <el-button-group>
          <el-tooltip content="加粗 (Ctrl+B)">
            <el-button :icon="ChatLineRound" @click="formatText('bold')" />
          </el-tooltip>
          <el-tooltip content="斜体 (Ctrl+I)">
            <el-button @click="formatText('italic')">I</el-button>
          </el-tooltip>
          <el-tooltip content="下划线 (Ctrl+U)">
            <el-button :icon="Discount" @click="formatText('underline')" />
          </el-tooltip>
        </el-button-group>
      </div>

      <div class="toolbar-group">
        <el-button-group>
          <el-tooltip content="上标">
            <el-button @click="formatText('sup')">x²</el-button>
          </el-tooltip>
          <el-tooltip content="下标">
            <el-button @click="formatText('sub')">x₂</el-button>
          </el-tooltip>
        </el-button-group>
      </div>

      <div class="toolbar-group">
        <el-button-group>
          <el-tooltip content="插入图片">
            <el-button :icon="Picture" @click="insertImage" />
          </el-tooltip>
          <el-tooltip content="插入公式">
            <el-button @click="insertFormula">∑</el-button>
          </el-tooltip>
        </el-button-group>
      </div>

      <div class="toolbar-spacer"></div>

      <div class="toolbar-group">
        <el-button text @click="handleClear">清空</el-button>
        <el-button text @click="handlePaste">粘贴</el-button>
      </div>
    </div>

    <div class="editor-content">
      <el-input
        v-model="content"
        type="textarea"
        :placeholder="placeholder"
        :rows="rows"
        :maxlength="maxLength"
        show-word-limit
        @input="handleInput"
        @blur="handleBlur"
      />
    </div>

    <div v-if="suggestions.length > 0" class="editor-suggestions">
      <div class="suggestions-header">智能识别建议：</div>
      <div class="suggestions-list">
        <el-tag
          v-for="(suggestion, index) in suggestions"
          :key="index"
          :type="suggestion.type"
          @click="applySuggestion(suggestion)"
          class="suggestion-tag"
        >
          {{ suggestion.label }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Picture, ChatLineRound, Discount } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

interface Suggestion {
  type: 'success' | 'warning' | 'info' | 'danger';
  label: string;
  value: any;
}

interface Props {
  modelValue: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  autoParse?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请输入题目内容...',
  rows: 8,
  maxLength: 2000,
  autoParse: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  input: [value: string];
  parse: [content: string];
  blur: [];
}>();

const content = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const suggestions = ref<Suggestion[]>([]);

const handleInput = (value: string) => {
  emit('input', value);

  if (props.autoParse && value.trim()) {
    parseContent(value);
  }
};

const handleBlur = () => {
  emit('blur');
};

const handleClear = () => {
  content.value = '';
  suggestions.value = [];
};

const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText();
    content.value = text;
    handleInput(text);
    ElMessage.success('已粘贴');
  } catch {
    ElMessage.warning('无法访问剪贴板，请使用 Ctrl+V 粘贴');
  }
};

const parseContent = (text: string) => {
  const newSuggestions: Suggestion[] = [];

  // 检测题型
  if (text.includes('A.') || text.includes('（A）') || text.includes('A、')) {
    newSuggestions.push({ type: 'success', label: '选择题', value: 'choice' });
  }

  if (text.includes('____') || text.includes('（）') || text.includes('（  ）')) {
    newSuggestions.push({ type: 'info', label: '填空题', value: 'fill' });
  }

  if (text.includes('判断') || text.includes('对错') || text.includes('√×')) {
    newSuggestions.push({ type: 'warning', label: '判断题', value: 'judge' });
  }

  // 检测是否有答案
  const answerPatterns = [
    /答案[：:]\s*([A-D])/i,
    /正确答案[：:]\s*([A-D])/i,
    /答[：:]\s*([A-D])/i,
  ];

  for (const pattern of answerPatterns) {
    const match = text.match(pattern);
    if (match) {
      newSuggestions.push({ type: 'success', label: `答案: ${match[1]}`, value: match[1] });
      break;
    }
  }

  suggestions.value = newSuggestions;

  if (newSuggestions.length > 0) {
    emit('parse', text);
  }
};

const formatText = (type: 'bold' | 'italic' | 'underline' | 'sup' | 'sub') => {
  const textarea = document.querySelector('.question-editor textarea') as HTMLTextAreaElement;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = content.value.substring(start, end);

  let formatted = '';
  switch (type) {
    case 'bold':
      formatted = `**${selectedText}**`;
      break;
    case 'italic':
      formatted = `*${selectedText}*`;
      break;
    case 'underline':
      formatted = `<u>${selectedText}</u>`;
      break;
    case 'sup':
      formatted = `${selectedText}^2^`;
      break;
    case 'sub':
      formatted = `${selectedText}~2~`;
      break;
  }

  content.value =
    content.value.substring(0, start) + formatted + content.value.substring(end);
};

const insertImage = () => {
  ElMessage.info('图片上传功能开发中...');
};

const insertFormula = () => {
  ElMessage.info('公式编辑器功能开发中...');
};

const applySuggestion = (suggestion: Suggestion) => {
  if (typeof suggestion.value === 'string') {
    content.value += `\n答案：${suggestion.value}`;
  }
  suggestions.value = suggestions.value.filter(s => s !== suggestion);
};
</script>

<style scoped lang="scss">
.question-editor {
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-background);
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.toolbar-spacer {
  flex: 1;
}

.editor-content {
  padding: var(--spacing-md);
}

:deep(.el-textarea__inner) {
  border: none;
  padding: 0;
  resize: vertical;
  font-size: var(--font-size-base);
  line-height: var(--line-height-loose);

  &:focus {
    box-shadow: none;
  }
}

.editor-suggestions {
  padding: var(--spacing-md);
  background: var(--primary-color-light);
  border-top: 1px solid var(--color-border);
}

.suggestions-header {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--primary-color);
  margin-bottom: var(--spacing-sm);
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.suggestion-tag {
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
}
</style>
