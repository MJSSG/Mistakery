<template>
  <div class="batch-actions">
    <div class="actions-header">
      <el-checkbox
        :model-value="allSelected"
        :indeterminate="isIndeterminate"
        @change="toggleAll"
      >
        已选择 {{ selectedCount }} 项
      </el-checkbox>
      <el-button
        v-if="selectedCount > 0"
        type="primary"
        link
        @click="$emit('cancel-select')"
      >
        取消选择
      </el-button>
    </div>

    <el-collapse-transition>
      <div v-if="showActions" class="actions-content">
        <div class="action-buttons">
          <el-button
            type="danger"
            plain
            :icon="Delete"
            @click="$emit('delete-selected')"
          >
            删除 ({{ selectedCount }})
          </el-button>
          <el-dropdown split-button type="warning" @command="handleMarkCommand">
            标记为
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="new">
                  <el-icon><Document /></el-icon>
                  新增
                </el-dropdown-item>
                <el-dropdown-item command="reviewing">
                  <el-icon><Clock /></el-icon>
                  复习中
                </el-dropdown-item>
                <el-dropdown-item command="reviewed">
                  <el-icon><Check /></el-icon>
                  已复习
                </el-dropdown-item>
                <el-dropdown-item command="mastered">
                  <el-icon><Trophy /></el-icon>
                  已掌握
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            type="primary"
            plain
            :icon="Download"
            @click="$emit('export-selected')"
          >
            导出
          </el-button>
          <el-button
            type="info"
            plain
            :icon="Collection"
            @click="$emit('add-to-practice')"
          >
            加入练习
          </el-button>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Delete,
  Download,
  Collection,
  Document,
  Clock,
  Check,
  Trophy,
} from '@element-plus/icons-vue';

interface Props {
  selectedCount: number;
  totalCount: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'toggle-all': [checked: boolean];
  'cancel-select': [];
  'delete-selected': [];
  'mark-as': [status: string];
  'export-selected': [];
  'add-to-practice': [];
}>();

const showActions = computed(() => props.selectedCount > 0);

const allSelected = computed(() => {
  return props.selectedCount > 0 && props.selectedCount === props.totalCount;
});

const isIndeterminate = computed(() => {
  return props.selectedCount > 0 && props.selectedCount < props.totalCount;
});

const toggleAll = (checked: boolean) => {
  emit('toggle-all', checked);
};

const handleMarkCommand = (command: string) => {
  emit('mark-as', command);
};
</script>

<style scoped lang="scss">
.batch-actions {
  background: var(--color-bg-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  border: 1px solid var(--color-border);
}

.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.actions-content {
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--color-border-light);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}
</style>
