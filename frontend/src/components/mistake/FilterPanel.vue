<template>
  <div class="filter-panel">
    <div class="panel-header">
      <span class="panel-title">筛选条件</span>
      <el-button type="primary" link @click="$emit('reset')">重置</el-button>
    </div>

    <div class="panel-content">
      <!-- 搜索 -->
      <div class="filter-group">
        <div class="filter-label">关键词</div>
        <el-input
          v-model="localFilters.keyword"
          placeholder="搜索题目内容..."
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- 科目 -->
      <div class="filter-group">
        <div class="filter-label">科目</div>
        <el-select
          v-model="localFilters.subjectId"
          placeholder="全部科目"
          clearable
        >
          <el-option label="全部科目" value="" />
          <el-option
            v-for="subject in subjects"
            :key="subject.value"
            :label="subject.label"
            :value="subject.value"
          />
        </el-select>
      </div>

      <!-- 难度 -->
      <div class="filter-group">
        <div class="filter-label">难度</div>
        <el-select
          v-model="localFilters.difficultyLevel"
          placeholder="全部难度"
          clearable
        >
          <el-option label="全部难度" value="" />
          <el-option label="简单" value="easy" />
          <el-option label="中等" value="medium" />
          <el-option label="困难" value="hard" />
        </el-select>
      </div>

      <!-- 排序 -->
      <div class="filter-group">
        <div class="filter-label">排序方式</div>
        <el-select
          v-model="localFilters.sortBy"
        >
          <el-option label="最近添加" value="recent" />
          <el-option label="题目难度" value="difficulty" />
          <el-option label="复习次数" value="reviewCount" />
        </el-select>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="panel-footer">
      <span class="footer-text">找到 {{ totalCount }} 道错题</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Search } from '@element-plus/icons-vue';

export interface MistakeFilters {
  keyword?: string;
  subjectId?: string;
  difficultyLevel?: string;
  sortBy?: string;
  isFavorite?: boolean;
}

interface Props {
  modelValue: MistakeFilters;
  totalCount: number;
  subjects: Array<{ value: string; label: string }>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [filters: MistakeFilters];
  reset: [];
}>();

// Sync props changes to local filters (for reset functionality)
watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(localFilters, newValue);
  },
  { deep: true }
);

// Use computed for proper v-model two-way binding
const localFilters = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});
</script>

<style scoped lang="scss">
.filter-panel {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  height: fit-content;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border-light);
}

.panel-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.filter-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.panel-footer {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border-light);
  text-align: center;
}

.footer-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

:deep(.el-select),
:deep(.el-input) {
  width: 100%;
}
</style>
