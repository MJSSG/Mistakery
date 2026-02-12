<template>
  <div class="sub-category-selector">
    <div class="sub-category-header">
      <h4 class="sub-category-title">{{ title }}</h4>
      <el-button
        v-if="showAdd"
        type="primary"
        :icon="Plus"
        size="small"
        text
        @click="handleAdd"
      >
        添加
      </el-button>
    </div>

    <div class="sub-category-list">
      <el-checkbox-group v-model="selectedList" @change="handleChange">
        <el-checkbox
          v-for="item in items"
          :key="item.id"
          :label="item.id"
          :class="['sub-category-item', { 'is-selected': isSelected(item.id) }]"
        >
          <span class="item-name">{{ item.name }}</span>
          <span v-if="item.count" class="item-count">({{ item.count }})</span>
        </el-checkbox>
      </el-checkbox-group>
    </div>

    <div v-if="selectedList.length > 0" class="sub-category-summary">
      已选择 {{ selectedList.length }} 项
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Plus } from '@element-plus/icons-vue';

interface SubCategoryItem {
  id: string;
  name: string;
  count?: number;
}

interface Props {
  title?: string;
  items: SubCategoryItem[];
  modelValue: string[];
  showAdd?: boolean;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '选择分类',
  showAdd: false,
  multiple: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
  select: [value: string[]];
  add: [];
}>();

const selectedList = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
    emit('select', value);
  },
});

const isSelected = (id: string) => selectedList.value.includes(id);

const handleChange = (value: string[]) => {
  emit('select', value);
};

const handleAdd = () => {
  emit('add');
};
</script>

<style scoped lang="scss">
.sub-category-selector {
  padding: var(--spacing-md);
}

.sub-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.sub-category-title {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.sub-category-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.sub-category-item {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-duration);

  &:hover {
    background: var(--color-background);
  }

  &.is-selected {
    background: var(--primary-color-light);
  }

  :deep(.el-checkbox__label) {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    flex: 1;
  }
}

.item-name {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.item-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.sub-category-summary {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  font-size: var(--font-size-sm);
  color: var(--primary-color);
  background: var(--primary-color-light);
  border-radius: var(--border-radius-md);
  text-align: center;
}
</style>
