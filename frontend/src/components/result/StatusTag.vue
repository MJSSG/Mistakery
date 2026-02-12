<template>
  <el-tag :type="tagType" :size="size" effect="plain">
    {{ label }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type MasteryLevel = 'mastered' | 'proficient' | 'learning' | 'struggling';
export type ReviewStatus = 'new' | 'reviewing' | 'reviewed' | 'mastered';

interface Props {
  level?: MasteryLevel | ReviewStatus;
  size?: 'large' | 'default' | 'small';
}

const props = withDefaults(defineProps<Props>(), {
  level: 'learning',
  size: 'default',
});

const masteryLabels: Record<MasteryLevel, string> = {
  mastered: '已掌握',
  proficient: '熟练',
  learning: '学习中',
  struggling: '困难',
};

const reviewLabels: Record<ReviewStatus, string> = {
  new: '新增',
  reviewing: '复习中',
  reviewed: '已复习',
  mastered: '已掌握',
};

const label = computed(() => {
  if (props.level in masteryLabels) {
    return masteryLabels[props.level as MasteryLevel];
  }
  return reviewLabels[props.level as ReviewStatus];
});

const tagType = computed(() => {
  switch (props.level) {
    case 'mastered':
      return 'success';
    case 'proficient':
    case 'reviewed':
      return 'info';
    case 'learning':
    case 'reviewing':
      return 'warning';
    case 'struggling':
      return 'danger';
    default:
      return 'info';
  }
});
</script>
