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

interface Props {
  modelValue?: string[];
  subjectId?: string;
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

const treeProps = {
  label: 'name',
  children: 'children',
  value: 'id',
};

const selectedPoints = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// 根据科目ID获取知识点树
watch(
  () => props.subjectId,
  async (subjectId) => {
    if (!subjectId) {
      treeData.value = [];
      return;
    }

    loading.value = true;
    try {
      // 获取该科目下的知识点分布
      const response = await mistakeApi.getStatsBySubject(subjectId);
      treeData.value = buildTreeFromStats(response.knowledgePoints || []);
    } catch (error) {
      console.error('Failed to fetch knowledge points:', error);
      // 使用默认知识点树
      treeData.value = getDefaultKnowledgeTree();
    } finally {
      loading.value = false;
    }
  },
  { immediate: true }
);

const filterNode = (value: string, data: any) => {
  if (!value) return true;
  return data.name.includes(value);
};

const handleChange = (value: string[]) => {
  emit('update:modelValue', value);
};

// 从统计数据构建知识点树
const buildTreeFromStats = (stats: Array<{ name: string; count: number }>) => {
  const map = new Map<string, any>();

  stats.forEach((stat) => {
    const parts = stat.name.split('/');
    let currentLevel = map;

    parts.forEach((part, index) => {
      if (!currentLevel.has(part)) {
        currentLevel.set(part, {
          id: stat.name,
          name: part,
          children: [],
        });
      }
      if (index < parts.length - 1) {
        const node = currentLevel.get(part);
        if (!node.childrenMap) {
          node.childrenMap = new Map();
        }
        currentLevel = node.childrenMap;
      }
    });
  });

  return Array.from(map.values());
};

// 获取默认知识点树结构
const getDefaultKnowledgeTree = () => {
  return [
    {
      id: 'algebra',
      name: '代数',
      children: [
        { id: 'algebra-eq', name: '方程与不等式' },
        { id: 'algebra-func', name: '函数' },
        { id: 'algebra-seq', name: '数列' },
      ],
    },
    {
      id: 'geometry',
      name: '几何',
      children: [
        { id: 'geo-plane', name: '平面几何' },
        { id: 'geo-solid', name: '立体几何' },
        { id: 'geo-analytic', name: '解析几何' },
      ],
    },
    {
      id: 'probability',
      name: '概率与统计',
      children: [
        { id: 'prob-count', name: '计数原理' },
        { id: 'prob-basic', name: '概率基础' },
        { id: 'stat-basic', name: '统计基础' },
      ],
    },
    {
      id: 'trigonometry',
      name: '三角函数',
      children: [
        { id: 'tri-basic', name: '三角函数基础' },
        { id: 'tri-identity', name: '三角恒等变换' },
        { id: 'tri-eq', name: '三角方程' },
      ],
    },
  ];
};
</script>

<style scoped lang="scss">
.knowledge-point-tree {
  width: 100%;

  :deep(.el-tree-select) {
    width: 100%;
  }

  :deep(.el-select__wrapper) {
    min-height: 40px;
  }
}

.w-full {
  width: 100%;
}
</style>
