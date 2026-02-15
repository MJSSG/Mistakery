import { test, expect } from '@playwright/test';

/**
 * TC-MISTAKE-001: 智能解析错题录入
 *
 * 测试目标：验证错题录入页面的智能解析功能
 * 前置条件：用户已登录，访问错题录入页面
 */

test.describe('TC-MISTAKE-001 智能解析错题录入', () => {
  // 测试数据
  const testSubject = '政治理论';
  const testContent = `资本主义的基本矛盾是什么？
A. 生产和消费的矛盾
B. 无产阶级和资产阶级的矛盾
C. 私人劳动和社会劳动的矛盾
D. 生产社会化和生产资料资本主义私人占有之间的矛盾

我的答案：A
正确答案：D
解析：资本主义的基本矛盾是生产社会化和生产资料资本主义私人占有之间的矛盾`;

  const expectedResults = {
    questionType: '单选题',
    question: '资本主义的基本矛盾是什么？',
    options: [
      'A. 生产和消费的矛盾',
      'B. 无产阶级和资产阶级的矛盾',
      'C. 私人劳动和社会劳动的矛盾',
      'D. 生产社会化和生产资料资本主义私人占有之间的矛盾'
    ],
    correctAnswer: 'D',
    userAnswer: 'A',
    analysis: '资本主义的基本矛盾是生产社会化和生产资料资本主义私人占有之间的矛盾'
  };

  test.beforeEach(async ({ page }) => {
    // 导航到错题录入页面
    await page.goto('http://localhost:5173/mistake/entry');
    await page.waitForLoadState('networkidle');
  });

  test('TC-MISTAKE-001.1: 智能解析 - 完整流程验证', async ({ page }) => {
    // 步骤 1: 选择科目
    await test.step('选择科目', async () => {
      const subjectButton = page.getByText(testSubject);
      await subjectButton.click();

      // 验证科目已选中
      await expect(subjectButton).toHaveClass(/selected|active/i);
    });

    // 步骤 2: 粘贴题目内容
    await test.step('粘贴题目内容', async () => {
      const contentTextarea = page.locator('textarea[placeholder*="题目内容"]');
      await contentTextarea.fill(testContent);

      // 等待解析触发
      await page.waitForTimeout(1000);
    });

    // 步骤 3: 验证题目类型识别
    await test.step('验证题目类型识别', async () => {
      const questionTypeTag = page.locator('.preview-type .el-tag').first();
      const typeText = await questionTypeTag.textContent();

      expect(typeText).toContain(expectedResults.questionType);
    });

    // 步骤 4: 验证题目内容提取
    await test.step('验证题目内容提取', async ({ page }) => {
      const questionText = page.locator('.preview-question .preview-text');
      await expect(questionText).toBeVisible();

      const question = await questionText.textContent();
      expect(question).toContain(expectedResults.question);
    });

    // 步骤 5: 验证选项提取
    await test.step('验证选项 A-D 提取', async ({ page }) => {
      const optionItems = page.locator('.preview-options .option-item');
      await expect(optionItems).toHaveCount(4);

      for (let i = 0; i < expectedResults.options.length; i++) {
        const optionText = await optionItems.nth(i).locator('.option-content').textContent();
        expect(optionText).toContain(expectedResults.options[i].substring(3)); // 去掉 "A. " 前缀
      }
    });

    // 步骤 6: 验证正确答案识别
    await test.step('验证正确答案识别', async ({ page }) => {
      const answerElement = page.locator('.preview-answer .preview-text.answer-text');
      await expect(answerElement).toBeVisible();

      const answer = await answerElement.textContent();
      expect(answer).toContain(expectedResults.correctAnswer);
    });

    // 步骤 7: 验证用户答案识别
    await test.step('验证用户答案识别', async ({ page }) => {
      const userAnswerElement = page.locator('.preview-user-answer .preview-text');
      await expect(userAnswerElement).toBeVisible();

      const userAnswer = await userAnswerElement.textContent();
      expect(userAnswer).toContain(expectedResults.userAnswer);
    });

    // 步骤 8: 验证解析内容提取 - 关键修复验证
    await test.step('验证解析内容提取', async ({ page }) => {
      const analysisElement = page.locator('.preview-analysis .preview-text');
      await expect(analysisElement).toBeVisible();

      const analysis = await analysisElement.textContent();

      // 验证不是"未提供解析"
      expect(analysis).not.toContain('未提供解析');
      expect(analysis).not.toContain('未识别到解析');

      // 验证包含关键信息
      expect(analysis).toContain('资本主义的基本矛盾');
      expect(analysis).toContain('生产社会化');
      expect(analysis).toContain('生产资料资本主义私人占有');
    });

    // 步骤 9: 截图保存证据
    await test.step('保存测试截图', async ({ page }) => {
      await page.screenshot({
        path: 'screenshots/TC-MISTAKE-001-final.png',
        fullPage: true
      });
    });
  });

  test('TC-MISTAKE-001.2: 反向测试 - 缺少解析内容', async ({ page }) => {
    const contentWithoutAnalysis = `资本主义的基本矛盾是什么？
A. 正确
B. 错误

我的答案：A
正确答案：A`;

    await page.locator('textarea[placeholder*="题目内容"]').fill(contentWithoutAnalysis);
    await page.waitForTimeout(1000);

    // 验证显示"未提供解析"
    const analysisElement = page.locator('.preview-analysis .preview-text');
    await expect(analysisElement).toContainText('未提供解析');
  });

  test('TC-MISTAKE-001.3: 边界测试 - 多行解析内容', async ({ page }) => {
    const multiLineContent = `马克思主义的三个组成部分是？
A. 马克思主义哲学
B. 马克思主义政治经济学
C. 科学社会主义

我的答案：AB
正确答案：ABC

解析：
第一部分：马克思主义哲学
第二部分：马克思主义政治经济学
第三部分：科学社会主义`;

    await page.locator('textarea[placeholder*="题目内容"]').fill(multiLineContent);
    await page.waitForTimeout(1000);

    // 验证多行解析内容被提取
    const analysisElement = page.locator('.preview-analysis .preview-text');
    const analysis = await analysisElement.textContent();

    expect(analysis).toContain('马克思主义哲学');
    expect(analysis).toContain('马克思主义政治经济学');
    expect(analysis).toContain('科学社会主义');
  });

  test('TC-MISTAKE-001.4: 答案格式变体测试', async ({ page }) => {
    // 测试不同的答案格式
    const answerVariations = [
      '答案：D',
      '正确答案：D',
      '答：D',
      'Answer: D'
    ];

    for (const answerFormat of answerVariations) {
      const testContent = `测试题？
A. 选项A
B. 选项B

${answerFormat}`;

      await page.locator('textarea[placeholder*="题目内容"]').fill(testContent);
      await page.waitForTimeout(500);

      const answerElement = page.locator('.preview-answer .preview-text.answer-text');
      const answer = await answerElement.textContent();

      expect(answer).toContain('D');
    }
  });
});
