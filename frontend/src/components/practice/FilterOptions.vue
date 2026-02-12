<template>
  <div class="filter-options">
    <div class="filter-group">
      <label class="filter-label">题型</label>
      <el-select
        :model-value="type"
        placeholder="全部题型"
        clearable
        @change="(val) => $emit('update:type', val)"
      >
        <el-option label="单选题" value="choice" />
        <el-option label="多选题" value="choice-multi" />
        <el-option label="填空题" value="fill" />
        <el-option label="判断题" value="judge" />
        <el-option label="解答题" value="essay" />
      </el-select>
    </div>

    <div class="filter-group">
      <label class="filter-label">难度</label>
      <el-select
        :model-value="difficulty"
        placeholder="全部难度"
        clearable
        @change="(val) => $emit('update:difficulty', val)"
      >
        <el-option label="简单" value="easy">
          <span class="difficulty-option">
            <span class="difficulty-dot difficulty-easy"></span>
            简单
          </span>
        </el-option>
        <el-option label="中等" value="medium">
          <span class="difficulty-option">
            <span class="difficulty-dot difficulty-medium"></span>
            中等
          </span>
        </el-option>
        <el-option label="困难" value="hard">
          <span class="difficulty-option">
            <span class="difficulty-dot difficulty-hard"></span>
            困难
          </span>
        </el-option>
      </el-select>
    </div>

    <div class="filter-group">
      <label class="filter-label">掌握程度</label>
      <el-select
        :model-value="mastery"
        placeholder="全部程度"
        clearable
        @change="(val) => $emit('update:mastery', val)"
      >
        <el-option label="未掌握" value="unknown">
          <span class="mastery-option">
            <el-tag size="small" type="info">未掌握</el-tag>
          </span>
        </el-option>
        <el-option label="熟悉" value="familiar">
          <span class="mastery-option">
            <el-tag size="small" type="warning">熟悉</el-tag>
          </span>
        </el-option>
        <el-option label="已掌握" value="mastered">
          <span class="mastery-option">
            <el-tag size="small" type="success">已掌握</el-tag>
          </span>
        </el-option>
      </el-select>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: string;
  difficulty?: string;
  mastery?: string;
}

defineProps<Props>();

defineEmits<{
  (e: 'update:type', value: string | undefined): void;
  (e: 'update:difficulty', value: string | undefined): void;
  (e: 'update:mastery', value: string | undefined): void;
}>();
</script>

<style scoped lang="scss">
.filter-options {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  min-width: 140px;
}

.filter-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

:deep(.el-select) {
  width: 140px;
}

.difficulty-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.difficulty-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;

  &.difficulty-easy {
    background-color: var(--success-color);
  }

  &.difficulty-medium {
    background-color: var(--warning-color);
  }

  &.difficulty-hard {
    background-color: var(--danger-color);
  }
}

.mastery-option {
  display: flex;
  align-items: center;
}

@media (max-width: $breakpoint-sm) {
  .filter-options {
    flex-direction: column;
  }

  :deep(.el-select) {
    width: 100%;
  }
}
</style>
