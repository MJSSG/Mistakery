import { test, expect } from '@playwright/test';

test.describe('练习流程 E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[placeholder*="用户名"]', 'testuser');
    await page.fill('input[placeholder*="密码"]', 'password123');
    await page.click('button:has-text("登录")');
    await page.waitForURL('/');
  });

  test('应该能进入智能组卷页面', async ({ page }) => {
    await page.goto('/practice');

    // 检查页面标题
    await expect(page.locator('text=智能组卷').or(page.locator('h1, h2'))).toBeVisible();

    // 检查筛选选项
    await expect(page.locator('text=科目')).toBeVisible();
    await expect(page.locator('text=题型')).toBeVisible();
    await expect(page.locator('text=难度')).toBeVisible();
    await expect(page.locator('text=状态')).toBeVisible();
  });

  test('应该能生成一套练习题', async ({ page }) => {
    await page.goto('/practice');

    // 选择科目
    await page.click('.el-select:has-text("科目")');
    await page.click('text=数学');

    // 选择题型
    await page.click('.el-select:has-text("题型")');
    await page.click('text=单选题');

    // 选择题数
    await page.fill('input[placeholder*="题数"]', '10');

    // 点击生成
    await page.click('button:has-text("生成试卷")');

    // 等待跳转到练习页面
    await page.waitForURL(/\/practice\/\w+/, { timeout: 10000 });

    // 验证进入练习页面
    await expect(page.locator('.question-card').or(page.locator('.practice-content'))).toBeVisible();
  });

  test('应该能答题并切换题目', async ({ page }) => {
    // 直接进入一个已有的练习
    await page.goto('/practice/exam-session');

    // 等待题目加载
    await expect(page.locator('.question-content').or(page.locator('.practice-question'))).toBeVisible();

    // 选择答案
    await page.click('.option-item, .el-radio').first();

    // 点击下一题
    await page.click('button:has-text("下一题")');

    // 等待题目切换
    await page.waitForTimeout(500);

    // 再次选择答案
    await page.click('.option-item, .el-radio').first();

    // 点击上一题
    await page.click('button:has-text("上一题")');

    // 验证答案保持
    const selectedOption = page.locator('.option-item.option-selected, .el-radio.is-checked');
    await expect(selectedOption).toBeVisible();
  });

  test('应该能查看答题卡', async ({ page }) => {
    await page.goto('/practice/exam-session');

    // 打开答题卡
    await page.click('button:has-text("答题卡")');

    // 验证答题卡弹窗
    await expect(page.locator('.el-dialog').or(page.locator('.answer-sheet'))).toBeVisible();

    // 验证答题状态
    const answerNumbers = page.locator('.answer-number, .sheet-item');
    await expect(answerNumbers.first()).toBeVisible();
  });

  test('应该能收藏题目', async ({ page }) => {
    await page.goto('/practice/exam-session');

    // 点击收藏按钮
    const favoriteButton = page.locator('button:has-text("收藏")').or(page.locator('.favorite-btn'));
    await favoriteButton.first().click();

    // 验证收藏状态
    await expect(favoriteButton.first()).toHaveClass(/favorite|is-favorite/);
  });

  test('应该能交卷并查看结果', async ({ page }) => {
    await page.goto('/practice/exam-session');

    // 点击交卷按钮
    await page.click('button:has-text("交卷")');

    // 确认交卷
    await page.click('.el-button--primary:has-text("确定")');

    // 等待跳转到结果页面
    await page.waitForURL(/\/practice\/record\/\w+/, { timeout: 10000 });

    // 验证结果页面
    await expect(page.locator('.result-page').or(page.locator('text=练习结果'))).toBeVisible();

    // 验证统计数据
    await expect(page.locator('text=总题数')).toBeVisible();
    await expect(page.locator('text=正确率')).toBeVisible();
  });

  test('应该能查看题目解析', async ({ page }) => {
    // 先进入练习结果页面
    await page.goto('/practice/record/mock-record-id');

    // 点击查看解析按钮
    await page.click('button:has-text("查看解析")');

    // 验证解析弹窗
    await expect(page.locator('.el-dialog').or(page.locator('.analysis-dialog'))).toBeVisible();
    await expect(page.locator('text=正确答案')).toBeVisible();
  });
});

test.describe('练习结果页面', () => {
  test('应该显示完整的统计数据', async ({ page }) => {
    await page.goto('/practice/record/mock-record-id');

    // 验证统计卡片
    await expect(page.locator('text=总题数')).toBeVisible();
    await expect(page.locator('text=答对')).toBeVisible();
    await expect(page.locator('text=答错')).toBeVisible();
    await expect(page.locator('text=正确率')).toBeVisible();
    await expect(page.locator('text=用时')).toBeVisible();
  });

  test('应该显示图表', async ({ page }) => {
    await page.goto('/practice/record/mock-record-id');

    // 验证图表容器
    await expect(page.locator('.echarts-container').or(page.locator('canvas'))).toBeVisible();
  });

  test('应该能将错题加入复习', async ({ page }) => {
    await page.goto('/practice/record/mock-record-id');

    // 找到错题并加入复习
    const addToReviewButtons = page.locator('button:has-text("加入复习")');

    const count = await addToReviewButtons.count();
    if (count > 0) {
      await addToReviewButtons.first().click();

      // 验证成功消息
      await expect(page.locator('.el-message--success')).toBeVisible();
    }
  });

  test('应该能再次练习相同题目', async ({ page }) => {
    await page.goto('/practice/record/mock-record-id');

    // 点击再练一次按钮
    await page.click('button:has-text("再练一次")');

    // 验证跳转到练习页面
    await page.waitForURL(/\/practice\/\w+/, { timeout: 10000 });
  });
});
