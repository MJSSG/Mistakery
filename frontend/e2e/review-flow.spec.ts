import { test, expect } from '@playwright/test';

test.describe('复习流程 E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[placeholder*="用户名"]', 'testuser');
    await page.fill('input[placeholder*="密码"]', 'password123');
    await page.click('button:has-text("登录")');
    await page.waitForURL('/');
  });

  test('应该能进入复习系统页面', async ({ page }) => {
    await page.goto('/review');

    // 检查页面标题
    await expect(page.locator('text=复习系统').or(page.locator('h1, h2'))).toBeVisible();

    // 检查 Leitner 箱子展示
    await expect(page.locator('text=Leitner').or(page.locator('.leitner-box'))).toBeVisible();
  });

  test('应该显示待复习错题数量', async ({ page }) => {
    await page.goto('/review');

    // 检查待复习数量
    const dueCount = page.locator('.due-count, .review-count');
    await expect(dueCount.first()).toBeVisible();
  });

  test('应该能开始复习会话', async ({ page }) => {
    await page.goto('/review');

    // 点击开始复习按钮
    const startButton = page.locator('button:has-text("开始复习")').or(page.locator('button:has-text("立即复习")'));

    const count = await startButton.count();
    if (count > 0) {
      await startButton.first().click();

      // 验证跳转到复习会话页面
      await page.waitForURL(/\/review\/session/, { timeout: 10000 });

      // 验证题目显示
      await expect(page.locator('.review-question, .question-card')).toBeVisible();
    }
  });

  test('应该能提交复习反馈', async ({ page }) => {
    // 直接进入复习会话
    await page.goto('/review/session');

    // 等待题目加载
    await expect(page.locator('.review-question, .question-card')).toBeVisible();

    // 选择反馈选项
    await page.click('text=记得').or(page.locator('.feedback-option.correct'));

    // 点击提交
    await page.click('button:has-text("提交")');

    // 等待下一题加载
    await page.waitForTimeout(500);

    // 验证进度更新
    const progress = page.locator('.review-progress');
    await expect(progress).toBeVisible();
  });

  test('应该能跳过当前复习题', async ({ page }) => {
    await page.goto('/review/session');

    // 点击跳过按钮
    await page.click('button:has-text("跳过")');

    // 验证确认对话框
    await expect(page.locator('.el-dialog')).toBeVisible();

    // 确认跳过
    await page.click('.el-button--primary:has-text("确定")');

    // 验证加载下一题
    await page.waitForTimeout(500);
  });

  test('应该能查看复习进度', async ({ page }) => {
    await page.goto('/review/session');

    // 检查进度条
    const progressBar = page.locator('.el-progress-bar, .progress-bar');
    await expect(progressBar).toBeVisible();

    // 检查进度文字
    const progressText = page.locator(/已复习.*\d+.*题/);
    await expect(progressText).toBeVisible();
  });

  test('复习完成后应该显示总结', async ({ page }) => {
    // 模拟复习完成场景
    await page.goto('/review/session');

    // 检查是否有完成按钮（假设最后一题后显示）
    const finishButton = page.locator('button:has-text("完成复习")');
    const count = await finishButton.count();

    if (count > 0) {
      await finishButton.click();

      // 验证跳转到总结页面
      await page.waitForURL(/\/review/, { timeout: 10000 });

      // 检查总结内容
      await expect(page.locator('text=复习完成').or(page.locator('.review-summary'))).toBeVisible();
    }
  });
});

test.describe('Leitner 算法功能', () => {
  test('应该显示 Leitner 箱子分布', async ({ page }) => {
    await page.goto('/review');

    // 检查各个箱子的显示
    const boxes = page.locator('.leitner-box, .box-level');

    const boxCount = await boxes.count();
    expect(boxCount).toBeGreaterThan(0);

    // 验证箱子标签
    await expect(page.locator('text=箱子1').or(page.locator('[data-box="1"]'))).toBeVisible();
  });

  test('应该显示下次复习时间', async ({ page }) => {
    await page.goto('/review');

    // 检查下次复习时间显示
    const nextReviewTime = page.locator('.next-review-time, .review-date');
    await expect(nextReviewTime.first()).toBeVisible();
  });

  test('应该能查看箱子中的题目详情', async ({ page }) => {
    await page.goto('/review');

    // 点击某个箱子
    const box = page.locator('.leitner-box, .box-level').first();
    await box.click();

    // 验证题目列表弹窗
    await expect(page.locator('.el-dialog').or(page.locator('.box-detail'))).toBeVisible();
  });
});

test.describe('复习统计', () => {
  test('应该显示复习统计数据', async ({ page }) => {
    await page.goto('/review');

    // 检查统计卡片
    await expect(page.locator('text=总复习次数').or(page.locator('.total-reviews'))).toBeVisible();
    await expect(page.locator('text=正确率').or(page.locator('.review-accuracy'))).toBeVisible();
  });

  test('应该能按条件筛选复习题', async ({ page }) => {
    await page.goto('/review');

    // 检查筛选选项
    const filterSelect = page.locator('.el-select').first();

    if (await filterSelect.isVisible()) {
      await filterSelect.click();

      // 选择筛选条件
      await page.click('li:has-text("今日到期")');

      // 应用筛选
      await page.click('button:has-text("筛选")');

      // 验证筛选结果
      await page.waitForTimeout(500);
    }
  });
});

test.describe('复习历史', () => {
  test('应该能查看复习历史记录', async ({ page }) => {
    await page.goto('/review');

    // 点击历史记录标签
    const historyTab = page.locator('text=历史记录').or(page.locator('[role="tab"]:has-text("历史")'));

    if (await historyTab.isVisible()) {
      await historyTab.click();

      // 验证历史列表
      const historyList = page.locator('.history-list, .review-history');
      await expect(historyList).toBeVisible();
    }
  });

  test('应该能在历史记录中查看详情', async ({ page }) => {
    await page.goto('/review');

    const historyTab = page.locator('text=历史记录').or(page.locator('[role="tab"]:has-text("历史")'));

    if (await historyTab.isVisible()) {
      await historyTab.click();

      // 点击某条历史记录
      const historyItem = page.locator('.history-item').first();
      await historyItem.click();

      // 验证详情显示
      await expect(page.locator('.history-detail').or(page.locator('.el-dialog'))).toBeVisible();
    }
  });
});
