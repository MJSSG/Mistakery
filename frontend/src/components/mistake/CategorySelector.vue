<template>
  <div class="category-selector">
    <div class="category-grid">
      <div
        v-for="category in categories"
        :key="category.id"
        :class="['category-item', { 'is-selected': isSelected(category.id) }]"
        @click="handleSelect(category.id)"
      >
        <div class="category-icon" :style="{ backgroundColor: category.color }">
          {{ category.icon }}
        </div>
        <div class="category-name">{{ category.name }}</div>
        <div v-if="category.count" class="category-count">{{ category.count }}</div>
        <div v-if="isSelected(category.id)" class="category-check">
          <el-icon><CircleCheck /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { CircleCheck } from '@element-plus/icons-vue';
import { useSubjectStore } from '@/stores/subject';

interface Subject {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  count?: number;
}

const emit = defineEmits<{
  select: [id: string];
  'update:modelValue': [value: string];
}>();

const props = defineProps<{
  modelValue?: string;
}>();

const subjectStore = useSubjectStore();

const categories = computed<Subject[]>(() => {
  const defaultCategories = [
    // 政治理论
    { id: 'politics', name: '政治理论', icon: '🏛️', color: '#e74c3c' },
    { id: 'general', name: '常识判断', icon: '🌐', color: '#3498db' },
    { id: 'verbal', name: '言语理解', icon: '📖', color: '#9b59b6' },
    { id: 'reasoning', name: '判断推理', icon: '🧩', color: '#1abc9c' },
    { id: 'quant', name: '数量关系', icon: '🔢', color: '#e67e22' },
  ];

  const userSubjects = subjectStore.subjects.map(s => ({
    id: s.id,
    name: s.name,
    icon: s.icon || '📚',
    color: s.color || '#1890ff',
    count: s.mistakeCount,
  }));

  return userSubjects.length > 0 ? userSubjects : defaultCategories;
});

const selectedId = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isSelected = (id: string) => selectedId.value === id;

const handleSelect = (id: string) => {
  // 同时更新内部状态和触发父组件更新
  emit('update:modelValue', id);
  emit('select', id);
};
</script>

<style scoped lang="scss">
.category-selector {
  padding: var(--spacing-md);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-md);
}

.category-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: var(--color-white);
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all var(--transition-duration) var(--transition-timing);

  &:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  &.is-selected {
    border-color: var(--primary-color);
    background: var(--primary-color-light);
  }
}

.category-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border-radius: var(--border-radius-lg);
}

.category-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  text-align: center;
}

.category-count {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  color: var(--color-white);
  background: var(--danger-color);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-check {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  width: 18px;
  height: 18px;
  color: var(--primary-color);
  background: var(--color-white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
