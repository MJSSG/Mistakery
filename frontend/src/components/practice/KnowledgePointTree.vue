<template>
  <div class="knowledge-point-tree">
    <el-tree-select
      v-model="selectedPoints"
      :data="treeData"
      :props="treeProps"
      :placeholder="placeholder"
      :render-after-expand="false"
      multiple
      show-checkbox
      check-strictly
      collapse-tags
      collapse-tags-tooltip
      clearable
      filterable
      :filter-node-method="filterNode"
      class="w-full"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { mistakeApi } from '@/api/mistake';

interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

interface Props {
  modelValue?: string[];
  subjectId?: string;
  category?: string;  // 添加科目分类参数
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  placeholder: '请选择知识点',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void;
}>();

const treeData = ref<any[]>([]);
const loading = ref(false);

// v-model 绑定
const selectedPoints = computed({
  get: () => props.modelValue || [],
  set: (value: string[]) => emit('update:modelValue', value)
});

// Element Plus Tree 组件的 props 配置
const treeProps = {
  label: 'name',
  children: 'children',
  value: 'id',
};

// 根据科目分类获取知识点树结构
const getDefaultKnowledgeTree = (category?: string) => {
  const categoryMap: Record<string, any[]> = {
    politics: [
      { id: 'mao', name: '马思' },
      { id: 'mao-deng', name: '毛思' },
      { id: 'xi-si', name: '习思' },
      { id: 'zhong-tese', name: '中特' },
      { id: 'dang-shi', name: '党史' },
      { id: 'shi-zheng', name: '时政' },
    ],
    general: [
      { id: 'economy', name: '经济' },
      { id: 'tech', name: '科技' },
      { id: 'history', name: '历史' },
      { id: 'humanities', name: '人文' },
      { id: 'geography', name: '地理' },
      { id: 'law', name: '法律' },
    ],
    verbal: [
      { id: 'reading', name: '片段阅读' },
      { id: 'logic', name: '逻辑填空' },
      { id: 'expression', name: '语句表达' },
    ],
    reasoning: [
      { id: 'graphic', name: '图形推理' },
      { id: 'analogic', name: '类比推理' },
      { id: 'definition', name: '定义判断' },
      { id: 'logic', name: '逻辑判断' },
    ],
    quant: [
      { id: 'calculation', name: '简单计算' },
      { id: 'route', name: '行程问题' },
      { id: 'engineering', name: '工程问题' },
      { id: 'profit', name: '经济利润' },
      { id: 'permutation', name: '排列组合' },
      { id: 'probability', name: '概率' },
      { id: 'geometry', name: '几何' },
    ],
  };

  return categoryMap[category as string] || [];
};

// 根据科目ID和分类获取知识点树
watch(
  () => [props.subjectId, props.category],
  async ([subjectId, category]) => {
    if (!subjectId) {
      treeData.value = [];
      return;
    }
    loading.value = true;
    try {
      // 获取该科目下的知识点分布
      const response = await mistakeApi.getStatsBySubject(subjectId);
      // 如果API返回了知识点数据，使用它构建树
      if (response?.data?.knowledgePoints && response.data.knowledgePoints.length > 0) {
        treeData.value = response.data.knowledgePoints.map((kp: any) => ({
          id: kp.name,
          name: kp.name,
        }));
      } else {
        // 否则使用默认知识点树
        treeData.value = getDefaultKnowledgeTree(category);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge points:', error);
      // 使用默认知识点树
      treeData.value = getDefaultKnowledgeTree(category);
    } finally {
      loading.value = false;
    }
  },
);

const handleChange = (value: string[]) => {
  emit('update:modelValue', value);
};

const filterNode = (value: string, data: any) => {
  if (!value) return true;
  return data.name.includes(value);
};
</script>

<style scoped lang="scss">
.knowledge-point-tree {
  width: 100%;
}

:deep(.el-tree-select) {
  width: 100%;
}

:deep(.el-select__wrapper) {
  min-height: 40px;
}

.w-full {
  width: 100%;
}
</style>
