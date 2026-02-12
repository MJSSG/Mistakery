<template>
  <el-dialog
    :model-value="modelValue"
    title="导出选项"
    width="500px"
    @update:model-value="$emit('update:modelValue', $event)"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" label-width="100px">
      <el-form-item label="导出内容">
        <el-checkbox-group v-model="form.includeSections">
          <el-checkbox label="overview">概览统计</el-checkbox>
          <el-checkbox label="trends">趋势数据</el-checkbox>
          <el-checkbox label="subjects">科目统计</el-checkbox>
          <el-checkbox label="details">详细记录</el-checkbox>
          <el-checkbox label="advice">学习建议</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="数据范围">
        <el-radio-group v-model="form.dateRange">
          <el-radio label="week">本周</el-radio>
          <el-radio label="month">本月</el-radio>
          <el-radio label="quarter">本季度</el-radio>
          <el-radio label="year">本年</el-radio>
          <el-radio label="all">全部</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="type === 'pdf'" label="页面格式">
        <el-radio-group v-model="form.orientation">
          <el-radio label="portrait">纵向</el-radio>
          <el-radio label="landscape">横向</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="type === 'excel'" label="包含图表">
        <el-switch v-model="form.includeCharts" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="exporting" @click="handleConfirm">
        导出{{ type === 'excel' ? 'Excel' : 'PDF' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import type { FormInstance } from 'element-plus';

interface Props {
  modelValue: boolean;
  type: 'pdf' | 'excel';
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', options: ExportOptions): void;
}

interface ExportOptions {
  includeSections: string[];
  dateRange: string;
  orientation?: string;
  includeCharts?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const exporting = ref(false);

const form = reactive({
  includeSections: ['overview', 'trends', 'subjects', 'details'],
  dateRange: 'month',
  orientation: 'portrait',
  includeCharts: true,
});

function handleCancel() {
  emit('update:modelValue', false);
}

function handleConfirm() {
  const options: ExportOptions = {
    includeSections: form.includeSections,
    dateRange: form.dateRange,
  };

  if (props.type === 'pdf') {
    options.orientation = form.orientation;
  } else {
    options.includeCharts = form.includeCharts;
  }

  emit('confirm', options);
}
</script>

<style scoped lang="scss">
:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
</style>
