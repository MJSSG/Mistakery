<template>
  <div class="practice-toolbar">
    <!-- 主工具栏 -->
    <div class="toolbar-main">
      <el-tooltip content="答题卡 (Alt+C)" placement="top">
        <el-button
          :type="showAnswerSheet ? 'primary' : 'default'"
          :icon="Grid"
          circle
          @click="handleToggleAnswerSheet"
        >
          <el-badge
            v-if="unansweredCount > 0"
            :value="unansweredCount"
            :max="99"
            type="danger"
          />
        </el-button>
      </el-tooltip>

      <el-tooltip content="标记题目 (Alt+M)" placement="top">
        <el-button
          :type="isMarked ? 'warning' : 'default'"
          :icon="isMarked ? StarFilled : Star"
          circle
          @click="handleToggleMark"
        />
      </el-tooltip>

      <el-tooltip content="收藏题目 (Alt+F)" placement="top">
        <el-button
          :type="isFavorited ? 'warning' : 'default'"
          :icon="isFavorited ? 'star-filled' : 'star'"
          circle
          @click="handleToggleFavorite"
        />
      </el-tooltip>

      <el-divider direction="vertical" />

      <el-tooltip content="草稿 (Alt+N)" placement="top">
        <el-button
          :type="showNote ? 'primary' : 'default'"
          :icon="EditPen"
          circle
          @click="handleToggleNote"
        >
          <el-badge v-if="hasNote" type="success" is-dot />
        </el-button>
      </el-tooltip>

      <el-tooltip content="计算器" placement="top">
        <el-button :icon="Calculator" circle @click="handleToggleCalculator" />
      </el-tooltip>

      <el-tooltip content="画笔" placement="top">
        <el-button
          :type="hasDrawing ? 'primary' : 'default'"
          :icon="Edit"
          circle
          @click="handleToggleDrawing"
        />
      </el-tooltip>

      <el-divider direction="vertical" />

      <el-tooltip content="设置" placement="top">
        <el-button :icon="Setting" circle @click="handleShowSettings" />
      </el-tooltip>

      <el-tooltip content="帮助" placement="top">
        <el-button :icon="QuestionFilled" circle @click="handleShowHelp" />
      </el-tooltip>
    </div>

    <!-- 自动跳转开关 -->
    <div v-if="showAutoJump" class="toolbar-auto-jump">
      <el-switch
        :model-value="autoJump"
        size="small"
        @change="handleAutoJumpChange"
      />
      <span class="auto-jump-label">答题后自动跳转</span>
    </div>

    <!-- 帮助弹窗 -->
    <el-dialog
      v-model="showHelpDialog"
      title="快捷键帮助"
      width="500px"
    >
      <div class="shortcuts-help">
        <div class="shortcut-section">
          <h4>答题操作</h4>
          <div class="shortcut-list">
            <div class="shortcut-item">
              <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd>
              <span>选择选项</span>
            </div>
            <div class="shortcut-item">
              <kbd>←</kbd><kbd>→</kbd>
              <span>上一题/下一题</span>
            </div>
            <div class="shortcut-item">
              <kbd>Alt</kbd> + <kbd>C</kbd>
              <span>打开答题卡</span>
            </div>
            <div class="shortcut-item">
              <kbd>Alt</kbd> + <kbd>M</kbd>
              <span>标记/取消标记</span>
            </div>
            <div class="shortcut-item">
              <kbd>Alt</kbd> + <kbd>F</kbd>
              <span>收藏/取消收藏</span>
            </div>
            <div class="shortcut-item">
              <kbd>Alt</kbd> + <kbd>N</kbd>
              <span>打开笔记</span>
            </div>
            <div class="shortcut-item">
              <kbd>Alt</kbd> + <kbd>D</kbd>
              <span>开启/关闭画笔</span>
            </div>
            <div class="shortcut-item">
              <kbd>Alt</kbd> + <kbd>C</kbd>
              <span>开启/关闭计算器</span>
            </div>
          </div>
        </div>
        <div class="shortcut-section">
          <h4>其他操作</h4>
          <div class="shortcut-list">
            <div class="shortcut-item">
              <kbd>ESC</kbd>
              <span>关闭弹窗/退出全屏</span>
            </div>
            <div class="shortcut-item">
              <kbd>F11</kbd>
              <span>全屏模式</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 设置弹窗 -->
    <el-dialog
      v-model="showSettingsDialog"
      title="答题设置"
      width="400px"
    >
      <div class="practice-settings">
        <div class="setting-item">
          <span class="setting-label">答题后自动跳转下一题</span>
          <el-switch :model-value="autoJump" @change="handleAutoJumpChange" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Grid,
  Star,
  StarFilled,
  EditPen,
  Calculator,
  Edit,
  Setting,
  QuestionFilled,
} from '@element-plus/icons-vue';

interface Props {
  answeredCount?: number;
  isMarked?: boolean;
  isFavorited?: boolean;
  hasNote?: boolean;
  hasDrawing?: boolean;
  showAutoJump?: boolean;
  autoJump?: boolean;
}

interface Emits {
  (e: 'toggleAnswerSheet'): void;
  (e: 'toggleMark'): void;
  (e: 'toggleFavorite'): void;
  (e: 'toggleNote'): void;
  (e: 'toggleDrawing'): void;
  (e: 'toggleCalculator'): void;
  (e: 'autoJumpChange', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  answeredCount: 0,
  isMarked: false,
  isFavorited: false,
  hasNote: false,
  hasDrawing: false,
  showAutoJump: true,
  autoJump: false,
});

const emit = defineEmits<Emits>();

// 设置
const showSettingsDialog = ref(false);
const showHelpDialog = ref(false);

// 显示状态
const showAnswerSheet = ref(false);
const showNote = computed(() => props.hasNote);

const handleToggleAnswerSheet = () => {
  showAnswerSheet.value = !showAnswerSheet.value;
  emit('toggleAnswerSheet');
};
const handleToggleMark = () => emit('toggleMark');
const handleToggleFavorite = () => emit('toggleFavorite');
const handleToggleNote = () => emit('toggleNote');
const handleToggleDrawing = () => emit('toggleDrawing');
const handleToggleCalculator = () => emit('toggleCalculator');

const handleShowSettings = () => {
  showSettingsDialog.value = true;
};
const handleShowHelp = () => {
  showHelpDialog.value = true;
};

// 设置操作
const handleAutoJumpChange = (value: boolean) => emit('autoJumpChange', value);
</script>

<style scoped lang="scss">
.practice-toolbar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.toolbar-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
  justify-content: center;
}

.toolbar-auto-jump {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-light);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);

  .auto-jump-label {
    color: var(--color-text-secondary);
  }
}

/* 快捷键帮助样式 */
.shortcuts-help {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.shortcut-section h4 {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);

  kbd {
    display: inline-block;
    padding: 2px 6px;
    background: var(--color-bg-light);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    font-family: 'SF Mono', 'Monaco', monospace;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    box-shadow: var(--shadow-xs);
  }

  span {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}

/* 设置样式 */
.practice-settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .setting-label {
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
  }
}

@media (max-width: $breakpoint-sm) {
  .toolbar-main {
    gap: var(--spacing-xs);
  }

  .toolbar-auto-jump {
    flex-direction: column;
    text-align: center;
  }
}
</style>
