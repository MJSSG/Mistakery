<template>
  <el-segmented v-model="internalValue" :options="options" @change="handleChange" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  modelValue: 'week' | 'month' | 'quarter' | 'year' | 'all';
}

interface Emits {
  (e: 'update:modelValue', value: 'week' | 'month' | 'quarter' | 'year' | 'all'): void;
  (e: 'change', value: 'week' | 'month' | 'quarter' | 'year' | 'all'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const internalValue = ref(props.modelValue);

const options = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年', value: 'year' },
  { label: '全部', value: 'all' },
];

watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue;
});

function handleChange(value: string) {
  emit('update:modelValue', value as Props['modelValue']);
  emit('change', value as Props['modelValue']);
}
</script>
