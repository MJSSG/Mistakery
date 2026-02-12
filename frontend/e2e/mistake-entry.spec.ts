import { test, expect } from '@playwright/test';

test.describe('错题录入流程 E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到错题录入页面
    await page.goto('/mistake/entry');
  });

  test('应该显示错题录入表单', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('h1, h2').filter({ hasText: '录入错题' })).toBeVisible();

    // 检查表单字段
    await expect(page.locator('input[placeholder*="题目"]').or(page.locator('textarea[placeholder*="题目"]'))).toBeVisible();
    await expect(page.locator('text=科目')).toBeVisible();
    await expect(page.locator('text=题型')).toBeVisible();
    await expect(page.locator('text=难度')).toBeVisible();
  });

  test('应该能成功录入一道单选题', async ({ page }) => {
    // 选择科目
    await page.click('text=科目');
    await page.click('text=数学');

    // 选择题型
    await page.click('text=题型');
    await page.click('text=单选题');

    // 输入题目内容
    await page.fill('textarea[placeholder*="题目"]', '下列哪个是质数？');

    // 输入选项
    await page.fill('input[placeholder*="A"]', '2');
    await page.fill('input[placeholder*="B"]', '4');
    await page.fill('input[placeholder*="C"]', '5');
    await page.fill('input[placeholder*="D"]', '6');

    // 选择正确答案
    await page.click('text=正确答案');
    await page.click('text=C');

    // 输入解析
    await page.fill('textarea[placeholder*="解析"]', '质数是指只能被1和自身整除的大于1的自然数。5是质数。');

    // 点击保存
    await page.click('button:has-text("保存")');

    // 验证成功消息
    await expect(page.locator('.el-message--success').or(page.locator('text=保存成功'))).toBeVisible({ timeout: 5000 });
  });

  test('应该能成功录入一道判断题', async ({ page }) => {
    // 选择科目
    await page.click('text=科目');
    await page.click('text=物理');

    // 选择题型
    await page.click('text=题型');
    await page.click('text=判断题');

    // 输入题目内容
    await page.fill('textarea[placeholder*="题目"]', '光速在真空中是3×10^8 m/s');

    // 选择正确答案
    await page.click('text=正确');

    // 输入解析
    await page.fill('textarea[placeholder*="解析"]', '这是物理学的基本常数');

    // 点击保存
    await page.click('button:has-text("保存")');

    // 验证成功消息
    await expect(page.locator('.el-message--success').or(page.locator('text=保存成功'))).toBeVisible({ timeout: 5000 });
  });

  test('应该显示表单验证错误', async ({ page }) => {
    // 不填写任何内容，直接点击保存
    await page.click('button:has-text("保存")');

    // 验证错误提示
    await expect(page.locator('.el-message--error').or(page.locator('text=请填写题目'))).toBeVisible();
  });

  test('应该能从错题本查看刚录入的错题', async ({ page }) => {
    // 录入一道题
    await page.click('text=科目');
    await page.click('text=数学');

    await page.click('text=题型');
    await page.click('text=单选题');

    await page.fill('textarea[placeholder*="题目"]', 'E2E测试题目');
    await page.fill('input[placeholder*="A"]', '选项A');
    await page.fill('input[placeholder*="B"]', '选项B');
    await page.click('text=正确答案');
    await page.click('text=A');

    await page.click('button:has-text("保存")');
    await page.waitForTimeout(1000);

    // 导航到错题本
    await page.goto('/mistake/list');

    // 应该看到刚录入的题目
    await expect(page.locator('text=E2E测试题目')).toBeVisible();
  });

  test('应该能编辑已录入的错题', async ({ page }) => {
    // 先导航到错题本
    await page.goto('/mistake/list');

    // 点击第一个错题的编辑按钮
    const editButton = page.locator('.el-button:has-text("编辑")').first();
    await editButton.click();

    // 修改题目内容
    const textarea = page.locator('textarea[placeholder*="题目"]').or(page.locator('.question-text'));
    await textarea.fill('修改后的题目内容');

    // 保存修改
    await page.click('button:has-text("保存")');

    // 验证成功消息
    await expect(page.locator('.el-message--success').or(page.locator('text=保存成功'))).toBeVisible({ timeout: 5000 });
  });

  test('应该能删除错题', async ({ page }) => {
    // 导航到错题本
    await page.goto('/mistake/list');

    // 获取初始错题数量
    const mistakeCards = page.locator('.mistake-card');
    const initialCount = await mistakeCards.count();

    // 点击删除按钮
    await page.locator('.el-button:has-text("删除")').first().click();

    // 确认删除
    await page.click('.el-button--primary:has-text("确定")');

    // 验证错题数量减少
    const newCount = await mistakeCards.count();
    expect(newCount).toBe(initialCount - 1);
  });
});

test.describe('错题批量操作', () => {
  test('应该能批量选择错题', async ({ page }) => {
    await page.goto('/mistake/list');

    // 点击全选
    await page.check('input[type="checkbox"].first()');

    // 验证所有复选框被选中
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  test('应该能批量删除错题', async ({ page }) => {
    await page.goto('/mistake/list');

    // 选择几个错题
    await page.check('input[type="checkbox"]').nth(0);
    await page.check('input[type="checkbox"]').nth(1);

    // 点击批量删除
    await page.click('button:has-text("批量删除")');

    // 确认删除
    await page.click('.el-button--primary:has-text("确定")');

    // 验证成功消息
    await expect(page.locator('.el-message--success')).toBeVisible();
  });

  test('应该能按科目筛选错题', async ({ page }) => {
    await page.goto('/mistake/list');

    // 选择科目筛选
    await page.click('.el-select:has-text("科目")');
    await page.click('text=数学');

    // 点击应用筛选
    await page.click('button:has-text("筛选")');

    // 验证结果只包含数学科目
    const subjects = page.locator('.el-tag:has-text("数学")');
    const allTags = page.locator('.el-tag');

    const subjectCount = await subjects.count();
    const allCount = await allTags.count();

    expect(subjectCount).toBe(allCount);
  });
});
