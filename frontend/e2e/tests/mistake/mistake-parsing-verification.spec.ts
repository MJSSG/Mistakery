import { test, expect } from '@playwright/test';

test.describe('TC-MISTAKE-001 智能解析 - 验证修复', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到错题录入页面
    await page.goto('http://localhost:5173/mistake/entry');
    await page.waitForLoadState('networkidle');
  });

  test('解析内容正确提取 - 单选题格式', async ({ page }) => {
    // 选择科目
    await page.click('text=政治理论');

    // 填写测试题目内容（包含解析）
    const testContent = `资本主义的基本矛盾是什么？
A. 生产和消费的矛盾
B. 无产阶级和资产阶级的矛盾
C. 私人劳动和社会劳动的矛盾
D. 生产社会化和生产资料资本主义私人占有之间的矛盾

我的答案：A
正确答案：D
解析：资本主义的基本矛盾是生产社会化和生产资料资本主义私人占有之间的矛盾`;

    await page.fill('textarea[placeholder*="题目内容"]', testContent);

    // 等待解析完成
    await page.waitForTimeout(500);

    // 验证解析预览面板
    const previewPanel = page.locator('.preview-panel');
    await expect(previewPanel).toBeVisible();

    // 验证题目类型识别为单选题
    const questionType = page.locator('.preview-type .el-tag');
    await expect(questionType).toContainText(['单选题', '选择题']);

    // 验证题目内容提取
    const questionText = page.locator('.preview-question .preview-text');
    await expect(questionText).toContainText('资本主义的基本矛盾是什么？');

    // 验证选项提取
    const options = page.locator('.preview-options .option-item');
    await expect(options).toHaveCount(4);

    // 验证正确答案
    const correctAnswer = page.locator('.preview-answer .preview-text.answer-text');
    await expect(correctAnswer).toContainText('D');

    // 验证用户答案
    const userAnswer = page.locator('.preview-user-answer .preview-text');
    await expect(userAnswer).toContainText('A');

    // 验证解析内容提取 - 关键修复验证
    const analysisText = page.locator('.preview-analysis .preview-text');

    // 验证解析内容不为空且不显示"未提供解析"
    await expect(analysisText).not.toContainText('未提供解析');
    await expect(analysisText).not.toContainText('未识别到解析');

    // 验证解析内容包含关键信息
    await expect(analysisText).toContainText('资本主义的基本矛盾');
    await expect(analysisText).toContainText('生产社会化');
    await expect(analysisText).toContainText('生产资料资本主义私人占有');

    // 截图保存证据
    await page.screenshot({
      path: 'screenshots/tc-mistake-001-verification-passed.png',
      fullPage: true
    });
  });

  test('解析内容正确提取 - 多行解析格式', async ({ page }) => {
    // 选择科目
    await page.click('text=政治理论');

    // 测试多行解析格式
    const testContent = `马克思主义的三个组成部分是？
A. 马克思主义哲学
B. 马克思主义政治经济学
C. 科学社会主义
D. 马克思主义法学

我的答案：AB
正确答案：ABC

解析：
马克思主义哲学是马克思主义理论体系的重要组成部分，
是科学的世界观和方法论，是无产阶级认识世界
和改造世界的思想武器。`;

    await page.fill('textarea[placeholder*="题目内容"]', testContent);

    // 等待解析完成
    await page.waitForTimeout(500);

    // 验证多行解析内容被正确提取
    const analysisText = page.locator('.preview-analysis .preview-text');
    await expect(analysisText).not.toContainText('未提供解析');
    await expect(analysisText).toContainText('马克思主义哲学');
    await expect(analysisText).toContainText('科学的世界观和方法论');
  });

  test('答案识别验证', async ({ page }) => {
    await page.click('text=政治理论');

    const testContent = `商品的基本属性是什么？
A. 使用价值
B. 价值
C. 交换价值
D. 以上都是

答案：D
我的答案：A`;

    await page.fill('textarea[placeholder*="题目内容"]', testContent);
    await page.waitForTimeout(500);

    // 验证答案识别（"答案："格式）
    const correctAnswer = page.locator('.preview-answer .preview-text.answer-text');
    await expect(correctAnswer).toContainText('D');

    // 验证用户答案识别（"我的答案："格式）
    const userAnswer = page.locator('.preview-user-answer .preview-text');
    await expect(userAnswer).toContainText('A');

    // 验证预览面板显示错误状态
    const userAnswerElement = page.locator('.preview-user-answer .preview-text');
    await expect(userAnswerElement).toHaveClass(/is-wrong/);
  });
});
