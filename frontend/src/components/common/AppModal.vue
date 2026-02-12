<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :fullscreen="fullscreen"
    :draggable="draggable"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :before-close="handleBeforeClose"
    :class="['app-modal', `app-modal--${size}`]"
    destroy-on-close
    append-to-body
  >
    <div class="app-modal__body">
      <slot />
    </div>

    <template v-if="$slots.footer" #footer>
      <div class="app-modal__footer">
        <slot name="footer" />
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  modelValue: boolean;
  title?: string;
  size?: 'small' | 'default' | 'large';
  width?: string | number;
  fullscreen?: boolean;
  draggable?: boolean;
  closeOnClickModal?: boolean;
  closeOnPressEscape?: boolean;
  showClose?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: 'default',
  width: '500px',
  fullscreen: false,
  draggable: true,
  closeOnClickModal: true,
  closeOnPressEscape: true,
  showClose: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'before-close': [done: () => void];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const handleBeforeClose = (done: () => void) => {
  emit('before-close', done);
};
</script>

<style scoped lang="scss">
.app-modal {
  :deep(.el-dialog__header) {
    padding: var(--spacing-lg);
    border-bottom: 1px solid var(--color-border);
  }

  :deep(.el-dialog__title) {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__footer) {
    padding: var(--spacing-lg);
    border-top: 1px solid var(--color-border);
  }

  &--small {
    :deep(.el-dialog) {
      max-width: 400px;
    }
  }

  &--large {
    :deep(.el-dialog) {
      max-width: 800px;
    }
  }
}

.app-modal__body {
  padding: var(--spacing-lg);
}

.app-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}
</style>
