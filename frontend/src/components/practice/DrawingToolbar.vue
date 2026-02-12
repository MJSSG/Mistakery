<template>
  <div class="drawing-toolbar">
    <!-- 工具选择 -->
    <div class="tool-group">
      <el-tooltip content="画笔 (P)" placement="top">
        <el-button
          :type="mode === 'draw' ? 'primary' : 'default'"
          :icon="Edit"
          circle
          @click="setMode('draw')"
        />
      </el-tooltip>

      <el-tooltip content="橡皮擦 (E)" placement="top">
        <el-button
          :type="mode === 'erase' ? 'primary' : 'default'"
          :icon="Eraser"
          circle
          @click="setMode('erase')"
        />
      </el-tooltip>
    </div>

    <!-- 颜色选择 -->
    <div class="tool-group" v-if="mode === 'draw'">
      <el-popover
        v-model:visible="showColorPicker"
        placement="top"
        :width="280"
        trigger="click"
      >
        <template #reference>
          <el-tooltip content="颜色选择 (C)" placement="top">
            <div class="color-picker-btn" :style="{ backgroundColor: color }" />
          </el-tooltip>
        </template>

        <div class="color-picker-content">
          <div class="color-presets">
            <div
              v-for="preset in presetColors"
              :key="preset"
              class="color-preset"
              :class="{ 'is-active': color === preset }"
              :style="{ backgroundColor: preset }"
              @click="setColor(preset)"
            />
          </div>

          <el-color-picker
            v-model="customColor"
            show-alpha
            @change="handleCustomColorChange"
          />
        </div>
      </el-popover>
    </div>

    <!-- 粗细选择 -->
    <div class="tool-group">
      <el-slider
        v-model="lineWidth"
        :min="1"
        :max="20"
        :step="1"
        :show-tooltip="false"
        class="line-width-slider"
        @input="handleLineWidthChange"
      />
      <span class="line-width-value">{{ lineWidth }}px</span>
    </div>

    <!-- 透明度选择 -->
    <div class="tool-group" v-if="mode === 'draw'">
      <el-slider
        v-model="opacity"
        :min="0.1"
        :max="1"
        :step="0.1"
        :show-tooltip="false"
        class="opacity-slider"
        @input="handleOpacityChange"
      />
      <span class="opacity-value">{{ Math.round(opacity * 100) }}%</span>
    </div>

    <!-- 撤销/重做 -->
    <div class="tool-group">
      <el-tooltip content="撤销 (Ctrl+Z)" placement="top">
        <el-button
          :icon="RefreshLeft"
          :disabled="!canUndo"
          circle
          size="small"
          @click="undo"
        />
      </el-tooltip>

      <el-tooltip content="重做 (Ctrl+Y)" placement="top">
        <el-button
          :icon="RefreshRight"
          :disabled="!canRedo"
          circle
          size="small"
          @click="redo"
        />
      </el-tooltip>
    </div>

    <!-- 操作按钮 -->
    <div class="tool-group">
      <el-tooltip content="保存图片 (S)" placement="top">
        <el-button
          :icon="Download"
          circle
          size="small"
          @click="handleSave"
        />
      </el-tooltip>

      <el-popconfirm
        title="确定要清空画布吗？"
        confirm-button-text="确定"
        cancel-button-text="取消"
        @confirm="handleClear"
      >
        <template #reference>
          <el-tooltip content="清空画布" placement="top">
            <el-button
              :icon="Delete"
              circle
              size="small"
              type="danger"
            />
          </el-tooltip>
        </template>
      </el-popconfirm>
    </div>

    <!-- 关闭按钮 -->
    <el-tooltip content="关闭画布" placement="top">
      <el-button
        :icon="Close"
        circle
        size="small"
        @click="handleClose"
      />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Edit,
  Eraser,
  RefreshLeft,
  RefreshRight,
  Download,
  Delete,
  Close,
} from '@element-plus/icons-vue';

interface Props {
  mode?: 'draw' | 'erase';
  color?: string;
  lineWidth?: number;
  opacity?: number;
  canUndo?: boolean;
  canRedo?: boolean;
}

interface Emits {
  (e: 'update:mode', value: 'draw' | 'erase'): void;
  (e: 'update:color', value: string): void;
  (e: 'update:lineWidth', value: number): void;
  (e: 'update:opacity', value: number): void;
  (e: 'undo'): void;
  (e: 'redo'): void;
  (e: 'clear'): void;
  (e: 'save'): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'draw',
  color: '#ff6e00',
  lineWidth: 3,
  opacity: 1,
  canUndo: false,
  canRedo: false,
});

const emit = defineEmits<Emits>();

const showColorPicker = ref(false);
const customColor = ref(props.color);

// 预设颜色
const presetColors = [
  '#ff6e00', // 高顿橙
  '#ff0000', // 红
  '#ff8800', // 橙
  '#ffcc00', // 黄
  '#00cc00', // 绿
  '#0088ff', // 蓝
  '#8800ff', // 紫
  '#000000', // 黑
  '#666666', // 灰
];

// 更新模式
const setMode = (newMode: 'draw' | 'erase') => {
  emit('update:mode', newMode);
};

// 设置颜色
const setColor = (newColor: string) => {
  customColor.value = newColor;
  emit('update:color', newColor);
};

// 自定义颜色变化
const handleCustomColorChange = (value: string) => {
  emit('update:color', value);
};

// 线宽变化
const handleLineWidthChange = (value: number) => {
  emit('update:lineWidth', value);
};

// 透明度变化
const handleOpacityChange = (value: number) => {
  emit('update:opacity', value);
};

// 撤销
const undo = () => {
  emit('undo');
};

// 重做
const redo = () => {
  emit('redo');
};

// 清空
const handleClear = () => {
  emit('clear');
  ElMessage.success('画布已清空');
};

// 保存
const handleSave = () => {
  emit('save');
};

// 关闭
const handleClose = () => {
  emit('close');
};

// 监听颜色变化
watch(() => props.color, (newColor) => {
  customColor.value = newColor;
});
</script>

<style scoped lang="scss">
.drawing-toolbar {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-white);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding-right: var(--spacing-md);
  border-right: 1px solid var(--color-border);

  &:last-child {
    padding-right: 0;
    border-right: none;
  }
}

.color-picker-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--primary-color);
    transform: scale(1.1);
  }
}

.color-picker-content {
  padding: var(--spacing-md);
}

.color-presets {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.color-preset {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all var(--transition-fast);

  &:hover {
    transform: scale(1.1);
  }

  &.is-active {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--color-white), 0 0 0 4px var(--primary-color);
  }
}

.line-width-slider,
.opacity-slider {
  width: 100px;
}

.line-width-value,
.opacity-value {
  min-width: 50px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-align: right;
}

:deep(.el-slider__runway) {
  background-color: var(--color-bg-light);
}

:deep(.el-slider__button) {
  border-color: var(--primary-color);
}
</style>
