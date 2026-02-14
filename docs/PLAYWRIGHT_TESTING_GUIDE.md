# Mistakery Playwright 测试操作规范

## 文档概述

本文档定义了使用 Playwright 和 Chrome DevTools MCP 协同完成 Mistakery 平台功能测试的操作规范，包括环境准备、测试执行、问题定位和报告生成的完整流程。

**适用范围：** 本规范适用于 `docs/FUNCTIONAL_TESTING_DOCUMENTATION.md` 中定义的所有功能测试用例

**技术栈：** Playwright + Chrome DevTools MCP + Claude Code

**版本：** v1.0
**最后更新：** 2026年2月

---

## 目录

1. [工具架构说明](#1-工具架构说明)
2. [环境准备](#2-环境准备)
3. [基础操作规范](#3-基础操作规范)
4. [模块测试规范](#4-模块测试规范)
5. [问题定位流程](#5-问题定位流程)
6. [测试报告模板](#6-测试报告模板)
7. [最佳实践](#7-最佳实践)
8. [故障排除](#8-故障排除)

---

## 1. 工具架构说明

### 1.1 工具协同架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        测试执行层                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌──────────────────┐         ┌─────────────────────────────┐  │
│   │   Playwright     │         │   Chrome DevTools MCP       │  │
│   │   (自动化测试)    │◄────────┤   (交互式调试+截图)         │  │
│   └────────┬─────────┘         └─────────────────────────────┘  │
│            │                                                       │
│            ▼                                                       │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    Mistakery 应用                          │  │
│   │              (http://localhost:5173)                      │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 工具职责划分

| 工具                 | 主要职责                                    | 适用场景                           |
| -------------------- | ------------------------------------------- | ---------------------------------- |
| **Playwright**       | 端到端自动化测试、表单填写、流程验证         | 回归测试、批量测试、CI/CD          |
| **Chrome DevTools**  | 交互式调试、网络请求监控、Console 日志、截图 | 问题定位、视觉验证、网络请求调试   |
| **Skill 工具**       | 使用 webapp-testing skill 执行 Playwright   | 自动化测试执行                    |

### 1.3 选择原则

- **使用 Playwright 当：**
  - 需要自动化重复测试流程
  - 需要验证用户交互路径
  - 需要批量执行测试用例
  - 需要生成可重复执行的测试脚本

- **使用 Chrome DevTools 当：**
  - 需要查看网络请求详情
  - 需要检查 Console 错误
  - 需要手动操作验证 UI
  - 需要截取页面截图
  - 需要验证元素样式和布局

---

## 2. 环境准备

### 2.1 前置条件检查

#### 2.1.1 服务状态检查

```bash
# 检查前端服务
curl http://localhost:5173

# 检查后端服务
curl http://localhost:3001/api/auth/health

# 检查数据库连接
mysql -u root -p -e "USE mistakery; SELECT COUNT(*) FROM users;"
```

#### 2.1.2 工具可用性检查

在 Claude Code 中执行以下命令验证工具可用性：

```bash
# 使用 Bash 工具检查 Playwright 安装
cd frontend && npx playwright --version

# 使用 Chrome DevTools MCP 检查浏览器连接
# (通过 ToolSearch 加载 chrome-devtools 工具)
```

### 2.2 测试数据准备

#### 2.2.1 基础测试账号

```sql
-- 创建测试账号
INSERT INTO users (username, email, password, nickname) VALUES
('playwright_test', 'test@example.com', '$2b$10$...', '测试用户'),
('chrome_test', 'chrome@example.com', '$2b$10$...', 'Chrome测试');
```

#### 2.2.2 错题测试数据

```bash
# 执行种子数据脚本
cd backend
npm run seed:mistakes
```

### 2.3 工具初始化

#### 2.3.1 Playwright 测试目录结构

```
frontend/
├── e2e/
│   ├── fixtures/          # 测试数据
│   │   └── test-data.ts
│   ├── pages/             # 页面对象模型
│   │   ├── auth.page.ts
│   │   ├── mistake.page.ts
│   │   ├── practice.page.ts
│   │   └── review.page.ts
│   ├── tests/             # 测试用例
│   │   ├── auth/
│   │   ├── mistake/
│   │   ├── practice/
│   │   └── review/
│   └── playwright.config.ts
```

#### 2.3.2 Chrome DevTools MCP 加载

在开始测试前，需要加载 Chrome DevTools 工具：

```javascript
// 通过 ToolSearch 加载
ToolSearch: { query: "chrome-devtools", max_results: 5 }
```

---

## 3. 基础操作规范

### 3.1 核心操作命令

#### 3.1.1 使用 Playwright (Skill 工具)

```bash
# 调用 webapp-testing skill
Skill: webapp-testing
```

#### 3.1.2 使用 Chrome DevTools MCP

```javascript
// 先加载工具
ToolSearch: { query: "chrome-devtools" }

// 然后使用具体功能
mcp__chrome-devtools__new_page    // 打开新页面
mcp__chrome-devtools__navigate_page // 导航到 URL
mcp__chrome-devtools__take_screenshot // 截图
mcp__chrome-devtools__list_network_requests // 查看网络请求
mcp__chrome-devtools__list_console_messages // 查看 Console 日志
```

### 3.2 标准测试流程

```
┌──────────────────────────────────────────────────────────────┐
│                    标准测试流程                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. 工具加载       ToolSearch 加载所需工具                     │
│     │                                                          │
│     ▼                                                          │
│  2. 环境准备       启动服务、准备数据、清理环境                 │
│     │                                                          │
│     ▼                                                          │
│  3. 测试执行       Playwright 自动化 / DevTools 交互验证         │
│     │                                                          │
│     ▼                                                          │
│  4. 结果收集     截图、日志、网络请求、性能数据                 │
│     │                                                          │
│     ▼                                                          │
│  5. 问题定位     分析失败原因、记录缺陷                         │
│     │                                                          │
│     ▼                                                          │
│  6. 报告生成     生成测试报告、统计数据                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 页面对象模型 (POM) 规范

#### 3.3.1 页面基类

```typescript
// frontend/e2e/pages/base.page.ts
import { Page } from 'playwright';

export class BasePage {
  constructor(protected page: Page) {}

  async navigate(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  async checkConsoleErrors() {
    const errors = await this.page.evaluate(() => {
      return (window as any).__consoleErrors || [];
    });
    return errors;
  }
}
```

#### 3.3.2 认证页面示例

```typescript
// frontend/e2e/pages/auth.page.ts
export class AuthPage extends BasePage {
  readonly URL = '/login';
  readonly usernameInput = this.page.locator('input[name="username"]');
  readonly passwordInput = this.page.locator('input[name="password"]');
  readonly loginButton = this.page.locator('button[type="submit"]');

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL('/');
  }

  async register(data: RegisterData) {
    await this.page.goto('/register');
    // 注册流程...
  }
}
```

---

## 4. 模块测试规范

### 4.1 认证模块测试

#### 4.1.1 TC-AUTH-001 用户注册 (Playwright)

```typescript
// frontend/e2e/tests/auth/auth-register.spec.ts
import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';

test.describe('TC-AUTH-001 用户注册', () => {
  test('正常注册流程', async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.navigate('http://localhost:5173/register');
    await authPage.register({
      username: 'test_user_' + Date.now(),
      email: `test_${Date.now()}@example.com`,
      password: 'Test123456',
      nickname: '测试用户'
    });

    // 验证跳转到首页
    await expect(page).toHaveURL('/');
    await expect(page.locator('.user-avatar')).toBeVisible();
  });

  test('反向测试：用户名过短', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate('http://localhost:5173/register');

    await page.fill('input[name="username"]', 'ab');
    await page.blur('input[name="username"]');

    await expect(page.locator('.error-message'))
      .toContainText('用户名至少3个字符');
  });
});
```

#### 4.1.2 TC-AUTH-002 用户登录 (Chrome DevTools)

```javascript
// 使用 Chrome DevTools MCP 验证登录后 Token 存储
{
  // 1. 导航到登录页
  "tool": "mcp__chrome-devtools__navigate_page",
  "url": "http://localhost:5173/login"
}

{
  // 2. 填写登录表单
  "tool": "mcp__chrome-devtools__fill",
  "selector": "input[name='username']",
  "value": "test_user"
}

{
  // 3. 提交表单
  "tool": "mcp__chrome-devtools__click",
  "selector": "button[type='submit']"
}

{
  // 4. 验证网络请求
  "tool": "mcp__chrome-devtools__list_network_requests"
}

{
  // 5. 验证 Token 存储
  "tool": "mcp__chrome-devtools__evaluate_script",
  "script": "localStorage.getItem('mistakery_token')"
}
```

### 4.2 错题管理模块测试

#### 4.2.1 TC-MISTAKE-001 智能解析 (Playwright)

```typescript
// frontend/e2e/tests/mistake/mistake-parsing.spec.ts
import { test, expect } from '@playwright/test';
import { MistakeEntryPage } from '../../pages/mistake-entry.page';

test.describe('TC-MISTAKE-001 智能解析', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    const authPage = new AuthPage(page);
    await authPage.login('test_user', 'Test123456');
  });

  const testQuestions = [
    {
      type: '单选题',
      content: `资本主义的基本矛盾是什么？
A. 生产和消费的矛盾
B. 无产阶级和资产阶级的矛盾
C. 私人劳动和社会劳动的矛盾
D. 生产社会化和生产资料资本主义私人占有之间的矛盾

我的答案：A
正确答案：D
解析：资本主义的基本矛盾是生产社会化和生产资料资本主义私人占有之间的矛盾`
    },
    {
      type: '多选题',
      content: `马克思主义的三个组成部分是？
A. 马克思主义哲学
B. 马克思主义政治经济学
C. 科学社会主义
D. 马克思主义法学

我的答案：AB
正确答案：ABC`
    }
  ];

  for (const testCase of testQuestions) {
    test(`解析${testCase.type}`, async ({ page }) => {
      const entryPage = new MistakeEntryPage(page);

      await entryPage.navigate();
      await entryPage.selectSubject('政治理论');
      await entryPage.pasteContent(testCase.content);
      await entryPage.clickParse();

      // 验证解析结果
      const parsed = await entryPage.getParsedResult();
      expect(parsed.question).toContain('资本主义的基本矛盾');
      expect(parsed.options).toHaveLength(4);
      expect(parsed.correctAnswer).toBe('D');
      expect(parsed.userAnswer).toBe('A');

      await entryPage.takeScreenshot(`parse-${testCase.type}`);
    });
  }
});
```

#### 4.2.2 TC-MISTAKE-003 错题列表筛选 (Chrome DevTools)

```javascript
// 验证筛选功能的网络请求和响应
{
  "tool": "mcp__chrome-devtools__navigate_page",
  "url": "http://localhost:5173/mistake/list"
}

{
  // 清空网络请求记录
  "tool": "mcp__chrome-devtools__evaluate_script",
  "script": "performance.clearResourceTimings()"
}

{
  // 执行筛选操作
  "tool": "mcp__chrome-devtools__click",
  "selector": ".filter-panel .subject-select"
}

{
  "tool": "mcp__chrome-devtools__click",
  "selector": ".filter-panel .subject-option[value='政治理论']"
}

{
  // 获取网络请求
  "tool": "mcp__chrome-devtools__list_network_requests"
}

// 验证：
// 1. 筛选 API 被正确调用
// 2. 请求参数包含筛选条件
// 3. 响应数据与筛选条件匹配
```

### 4.3 练习模块测试

#### 4.3.1 TC-PRACTICE-001 智能组卷 (Playwright)

```typescript
// frontend/e2e/tests/practice/practice-setup.spec.ts
test.describe('TC-PRACTICE-001 智能组卷', () => {
  const testCases = [
    {
      name: '基础组卷',
      subject: '政治理论',
      type: '全部',
      difficulty: '全部',
      count: 20,
      expectedQuestions: 20
    },
    {
      name: '指定题型',
      subject: '政治理论',
      type: '单选题',
      difficulty: '全部',
      count: 10,
      expectedQuestions: 10
    },
    {
      name: '超出数量',
      subject: '政治理论',
      type: '全部',
      difficulty: '全部',
      count: 999,
      expectedQuestions: 'max_available'
    }
  ];

  for (const tc of testCases) {
    test(tc.name, async ({ page }) => {
      const setupPage = new PracticeSetupPage(page);

      await setupPage.navigate();
      await setupPage.configure({
        subject: tc.subject,
        type: tc.type,
        difficulty: tc.difficulty,
        count: tc.count,
        shuffle: false
      });

      const availableCount = await setupPage.getAvailableCount();

      await setupPage.clickGenerate();

      // 验证结果
      if (tc.expectedQuestions === 'max_available') {
        // 应该提示最多可选数量
        await expect(page.locator('.toast-message'))
          .toContainText('最多可选');
      } else {
        await expect(page).toHaveURL(/\/practice\/\d+/);
        const practicePage = new PracticePage(page);
        const questionCount = await practicePage.getQuestionCount();
        expect(questionCount).toBe(Math.min(tc.expectedQuestions, availableCount));
      }
    });
  }
});
```

#### 4.3.2 TC-PRACTICE-003 答题辅助功能 (Chrome DevTools)

```javascript
// 测试画笔功能的 Canvas 操作
{
  "tool": "mcp__chrome-devtools__navigate_page",
  "url": "http://localhost:5173/practice/1"
}

{
  // 开启画笔
  "tool": "mcp__chrome-devtools__click",
  "selector": ".toolbar .drawing-tool"
}

{
  // 验证 Canvas 元素存在
  "tool": "mcp__chrome-devtools__evaluate_script",
  "script": "document.querySelector('canvas.drawing-canvas') !== null"
}

{
  // 截图验证画笔工具界面
  "tool": "mcp__chrome-devtools__take_screenshot",
  "path": "screenshots/practice-drawing-tool.png"
}

{
  // 测试清除功能
  "tool": "mcp__chrome-devtools__click",
  "selector": ".drawing-panel .clear-btn"
}

// 验证计时器
{
  "tool": "mcp__chrome-devtools__evaluate_script",
  "script": `
    const timerText = document.querySelector('.timer').textContent;
    const [minutes, seconds] = timerText.split(':').map(Number);
    return { minutes, seconds, totalSeconds: minutes * 60 + seconds };
  `
}
```

### 4.4 复习模块测试

#### 4.4.1 TC-REVIEW-001 Leitner 复习系统 (Playwright)

```typescript
// frontend/e2e/tests/review/review-leitner.spec.ts
test.describe('TC-REVIEW-001 Leitner 复习系统', () => {
  test('复习间隔验证', async ({ page }) => {
    const reviewPage = new ReviewPage(page);

    // Box 1 → 答对 → Box 2
    await reviewPage.startReview();
    await reviewPage.answerQuestion('correct');

    const nextReviewTime = await reviewPage.getNextReviewTime();
    const expectedDays = 3; // Box 2 = 3天
    const actualDays = Math.ceil(
      (new Date(nextReviewTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    expect(actualDays).toBe(expectedDays);
  });

  test('答错重置到 Box 1', async ({ page }) => {
    const reviewPage = new ReviewPage(page);

    // 设置到 Box 3
    await reviewPage.setBoxLevel('question_id', 3);

    // 答错后应该重置到 Box 1
    await reviewPage.answerQuestion('incorrect');

    const newBoxLevel = await reviewPage.getBoxLevel('question_id');
    expect(newBoxLevel).toBe(1);
  });
});
```

### 4.5 统计分析模块测试

#### 4.5.1 TC-ANALYTICS-001 学习概览统计 (Chrome DevTools)

```javascript
// 验证统计数据和图表渲染
{
  "tool": "mcp__chrome-devtools__navigate_page",
  "url": "http://localhost:5173/statistics"
}

{
  // 等待图表加载完成
  "tool": "mcp__chrome-devtools__wait_for",
  "selector": ".echarts-container canvas",
  "timeout": 5000
}

{
  // 截图
  "tool": "mcp__chrome-devtools__take_screenshot",
  "path": "screenshots/statistics-overview.png"
}

{
  // 验证 ECharts 实例
  "tool": "mcp__chrome-devtools__evaluate_script",
  "script": `
    const chart = echarts.getInstanceByDom(document.querySelector('.echarts-container'));
    return {
      hasChart: chart !== null,
      option: chart ? chart.getOption() : null
    };
  `
}

{
  // 验证网络请求获取统计数据
  "tool": "mcp__chrome-devtools__list_network_requests",
  "filter": "url.includes('/api/analytics')"
}
```

### 4.6 性能检验

#### 4.6.1 TC-PERF-001 前端性能指标 (Chrome DevTools)

```javascript
// 使用 Performance Trace 获取性能指标
{
  "tool": "mcp__chrome-devtools__performance_start_trace"
}

{
  "tool": "mcp__chrome-devtools__navigate_page",
  "url": "http://localhost:5173"
}

{
  "tool": "mcp__chrome-devtools__wait_for",
  "selector": ".main-content",
  "timeout": 5000
}

{
  "tool": "mcp__chrome-devtools__performance_stop_trace"
}

{
  "tool": "mcp__chrome-devtools__performance_analyze_insight",
  "insight": "FCP"
}

// 验证指标：
// - FCP < 1.5s
// - LCP < 2.5s
// - TTI < 3s
```

---

## 5. 问题定位流程

### 5.1 问题定位决策树

```
                    测试失败
                       │
                       ▼
              ┌─────────────────┐
              │   失败类型？    │
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌────────┐    ┌────────┐    ┌──────────────┐
   │ UI 错误 │    │ API 错误│    │ 性能问题     │
   └───┬────┘    └───┬────┘    └──────┬───────┘
       │             │                │
       ▼             ▼                ▼
   截图验证      网络请求分析      性能分析
   Console日志   响应数据检查      Trace分析
   样式检查      状态码验证        资源加载
```

### 5.2 UI 问题定位流程

#### 步骤 1: 截图对比

```javascript
// 失败时截图
{
  "tool": "mcp__chrome-devtools__take_screenshot",
  "path": "screenshots/failed/tc-mistake-001-failed.png"
}
```

#### 步骤 2: 检查 Console 错误

```javascript
{
  "tool": "mcp__chrome-devtools__list_console_messages",
  "level": "error"
}

// 分析错误类型：
// - TypeError: 代码逻辑错误
// - 404: 资源未找到
// - CORS: 跨域问题
// - UnhandledRejection: Promise 异常
```

#### 步骤 3: 验证元素状态

```javascript
{
  "tool": "mcp__chrome-devtools__evaluate_script",
  "script": `
    const element = document.querySelector('.target-element');
    return {
      exists: element !== null,
      visible: element ? element.offsetParent !== null : false,
      textContent: element ? element.textContent : null,
      computedStyle: element ? window.getComputedStyle(element) : null
    };
  `
}
```

### 5.3 API 问题定位流程

#### 步骤 1: 获取网络请求

```javascript
{
  "tool": "mcp__chrome-devtools__list_network_requests"
}
```

#### 步骤 2: 分析请求详情

```javascript
{
  "tool": "mcp__chrome-devtools__get_network_request",
  "requestId": "请求ID"
}

// 验证：
// - URL 正确性
// - 请求头（Authorization）
// - 请求体格式
// - 响应状态码
// - 响应数据结构
```

#### 步骤 3: 对比预期与实际

| 检查项       | 预期值              | 实际值              | 结论  |
| ------------ | ------------------- | ------------------- | ----- |
| 请求方法     | POST                |                     |       |
| 请求 URL     | /api/mistake/parse  |                     |       |
| Content-Type | application/json    |                     |       |
| 状态码       | 200                 |                     |       |
| 响应格式     | {code, message, data}|                    |       |

### 5.4 性能问题定位流程

```javascript
// 1. 启动性能追踪
{
  "tool": "mcp__chrome-devtools__performance_start_trace"
}

// 2. 执行操作
// ...

// 3. 停止追踪
{
  "tool": "mcp__chrome-devtools__performance_stop_trace"
}

// 4. 分析性能洞察
{
  "tool": "mcp__chrome-devtools__performance_analyze_insight",
  "insight": "LCP"
}

// 5. 分析常见问题：
// - LCP 慢: 图片未优化、CSS 阻塞渲染
// - FID 慢: JavaScript 执行时间长
// - CLS 高: 动态内容插入、图片尺寸未定
```

---

## 6. 测试报告模板

### 6.1 测试执行报告

```markdown
# Mistakery 测试执行报告

## 测试概要

| 项目           | 内容                        |
| -------------- | --------------------------- |
| 测试日期       | 2026-02-14                 |
| 测试人员       | [姓名]                     |
| 测试环境       | 开发环境 (localhost:5173)   |
| 测试工具       | Playwright + Chrome DevTools |
| 文档版本       | v1.0                       |

## 测试统计

| 模块         | 用例数 | 通过 | 失败 | 阻塞 | 通过率 |
| ------------ | ------ | ---- | ---- | ---- | ------ |
| 认证模块     | 4      | 4    | 0    | 0    | 100%   |
| 错题管理     | 9      | 8    | 1    | 0    | 89%    |
| 练习模块     | 8      | 7    | 1    | 0    | 88%    |
| 复习模块     | 5      | 5    | 0    | 0    | 100%   |
| 统计分析     | 6      | 6    | 0    | 0    | 100%   |
| 用户中心     | 4      | 4    | 0    | 0    | 100%   |
| **总计**     | **36** | **34**| **2** | **0** | **94%** |

## 失败用例详情

### TC-MISTAKE-005 编辑错题

**失败描述：** 保存后内容未更新

**复现步骤：**
1. 登录系统
2. 进入错题详情页
3. 点击编辑
4. 修改题目内容
5. 点击保存

**实际结果：**
- 保存提示成功
- 返回列表后内容未更新
- 详情页仍显示旧内容

**预期结果：**
- 列表和详情页应显示更新后的内容

**问题定位：**
```
Console Error:
[Error] PUT /api/mistake/:id 返回 200 但数据未更新
```

**网络请求分析：**
```json
{
  "url": "/api/mistake/123",
  "method": "PUT",
  "request": {
    "content": "修改后的内容"
  },
  "response": {
    "code": 200,
    "message": "更新成功"
  }
}
```

**根本原因：** 前端缓存未失效，显示的是旧数据

**严重程度：** P1 (严重)

**负责人：** [开发者姓名]

## 性能测试结果

| 指标    | 目标值  | 实际值  | 状态  |
| ------- | ------- | ------- | ----- |
| FCP     | <1.5s   | 1.2s    | ✅     |
| LCP     | <2.5s   | 2.8s    | ❌     |
| FID     | <100ms  | 85ms    | ✅     |
| CLS     | <0.1    | 0.05    | ✅     |
| TTI     | <3s     | 3.5s    | ❌     |

**性能问题说明：**
- LCP 超标：首页大图未优化
- TTI 超标：JavaScript 初始化时间过长

## 截图证据

### TC-MISTAKE-005 失败截图

![编辑失败](screenshots/tc-mistake-005-failed.png)

### 性能测试截图

![Lighthouse报告](screenshots/performance-lighthouse.png)

## 测试建议

1. **高优先级修复：**
   - TC-MISTAKE-005: 修复缓存更新问题
   - TC-PRACTICE-003: 优化 JavaScript 初始化

2. **性能优化：**
   - 实施图片懒加载
   - 压缩 JavaScript Bundle
   - 使用 CDN 加速静态资源

3. **流程改进：**
   - 添加 E2E 测试到 CI/CD
   - 建立性能监控告警
   - 定期执行回归测试

## 测试结论

- [ ] 通过，可以发布
- [x] 有问题，需要修复后回归

---
**报告生成时间：** 2026-02-14 18:00:00
**报告生成工具：** Claude Code + Playwright + Chrome DevTools MCP
```

### 6.2 缺陷报告模板

```markdown
## 缺陷报告：[缺陷标题]

### 基本信息

| 字段     | 内容           |
| -------- | -------------- |
| 缺陷编号 | BUG-20260214-01 |
| 用例编号 | TC-MISTAKE-005  |
| 发现日期 | 2026-02-14      |
| 严重程度 | P1 (严重)       |
| 优先级   | P0 (高)         |
| 缺陷类型 | 功能缺陷        |
| 所属模块 | 错题管理        |

### 环境信息

| 字段     | 内容                          |
| -------- | ----------------------------- |
| 浏览器   | Chrome 120                    |
| 操作系统 | Windows 10                    |
| 设备类型 | 桌面                          |
| 网络环境 | WiFi                          |

### 复现步骤

1. 登录测试账号
2. 进入错题详情页 `/mistake/detail/123`
3. 点击"编辑"按钮
4. 修改题目内容为"新内容"
5. 点击"保存"按钮
6. 返回错题列表

### 实际结果

- 编辑页面显示"保存成功"提示
- 返回列表后，题目内容仍为旧内容
- 刷新页面后内容仍未更新

### 预期结果

- 保存后应立即更新显示
- 列表和详情页应同步显示最新内容

### 证据

**Console 日志：**
```
[API] PUT /api/mistake/123 - 200 OK
[Cache] Cache key: mistake:123 - HIT (should be INVALIDATED)
```

**网络请求：**
- Request: `PUT /api/mistake/123`
- Status: 200 OK
- Response: `{"code":200,"message":"更新成功","data":{...}}`

**截图：**
- [screenshots/bug-20260214-01-before.png](编辑前)
- [screenshots/bug-20260214-01-after.png](编辑后)

### 根本原因分析

前端使用 Redis 缓存错题数据，更新后未使缓存失效，导致显示旧数据。

### 修复建议

```typescript
// 在 mistake.service.ts 的 update 方法中添加
async update(id: string, data: UpdateMistakeDto) {
  // ... 更新数据库

  // 使缓存失效
  await this.cacheService.del(`mistake:${id}`);
  await this.cacheService.del(`mistake:list:*`);

  return result;
}
```

### 修复验证计划

1. 添加单元测试验证缓存失效
2. 执行 TC-MISTAKE-005 回归测试
3. 验证其他错题相关 API 缓存处理

---
**报告人：** [姓名]
**报告时间：** 2026-02-14
```

---

## 7. 最佳实践

### 7.1 测试设计原则

#### 7.1.1 AAA 模式

```typescript
test('示例测试', async ({ page }) => {
  // Arrange (准备)
  const testData = { username: 'test', password: '123456' };
  await page.goto('/login');

  // Act (执行)
  await page.fill('input[name="username"]', testData.username);
  await page.fill('input[name="password"]', testData.password);
  await page.click('button[type="submit"]');

  // Assert (断言)
  await expect(page).toHaveURL('/');
});
```

#### 7.1.2 独立性原则

每个测试用例应该：
- 独立运行，不依赖其他测试
- 使用独立的测试数据
- 执行前清理环境
- 执行后恢复状态

```typescript
test.beforeEach(async ({ page }) => {
  // 每个测试前重置状态
  await page.evaluate(() => localStorage.clear());
  await page.context().clearCookies();
});

test.afterEach(async ({ page }, testInfo) => {
  // 失败时截图
  if (testInfo.status !== 'passed') {
    await page.screenshot({
      path: `screenshots/failed/${testInfo.title}.png`
    });
  }
});
```

### 7.2 选择器最佳实践

#### 7.2.1 选择器优先级

| 优先级 | 选择器类型            | 示例                      | 说明               |
| ------ | --------------------- | ------------------------- | ------------------ |
| 1      | data-testid           | `[data-testid="submit"]`  | 最稳定，专门用于测试 |
| 2      | aria-label            | `[aria-label="提交"]`     | 无障碍友好         |
| 3      | role                  | `[role="button"]`         | 语义化             |
| 4      | 文本内容              | `text="登录"`             | 直观但脆弱         |
| 5      | CSS 类                | `.login-button`           | 可能变化           |
| 6      | ID                    | `#submit-btn`             | 较少使用           |
| ❌      | XPath                 | `//div[@class='btn']`     | 避免使用           |

#### 7.2.2 等待策略

```typescript
// ❌ 不推荐：固定等待
await page.waitForTimeout(5000);

// ✅ 推荐：等待元素可见
await page.waitForSelector('.result', { state: 'visible' });

// ✅ 推荐：等待网络空闲
await page.waitForLoadState('networkidle');

// ✅ 推荐：等待特定条件
await page.waitForURL('**/dashboard');
await page.waitForResponse('**/api/data');
```

### 7.3 数据管理

#### 7.3.1 测试数据隔离

```typescript
// fixtures/test-data.ts
export const getUniqueUser = () => ({
  username: `test_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'Test123456'
});

export const getUniqueMistake = () => ({
  content: `测试题目 ${Date.now()}`,
  subject: '政治理论',
  type: 'single'
});
```

#### 7.3.2 数据清理

```typescript
test.afterAll(async ({ request }) => {
  // 清理测试数据
  await request.delete('/api/test/cleanup');
});
```

### 7.4 并行测试

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,  // CI 环境减少并发
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
  ],
});
```

### 7.5 Chrome DevTools 技巧

#### 7.5.1 批量操作

```javascript
// 批量验证多个元素的状态
{
  "tool": "mcp__chrome-devtools__evaluate_script",
  "script": `
    const selectors = ['.btn-primary', '.btn-secondary', '.btn-danger'];
    return selectors.map(sel => {
      const el = document.querySelector(sel);
      return {
        selector: sel,
        exists: el !== null,
        disabled: el ? el.disabled : null
      };
    });
  `
}
```

#### 7.5.2 网络请求过滤

```javascript
// 只获取 API 请求
{
  "tool": "mcp__chrome-devtools__list_network_requests",
  "filter": "url.includes('/api/')"
}

// 只获取错误请求
{
  "tool": "mcp__chrome-devtools__evaluate_script",
  "script": `
    return performance.getEntries()
      .filter(e => e.transferSize > 0 && e.decodedBodyLength === 0)
      .map(e => e.name);
  `
}
```

---

## 8. 故障排除

### 8.1 常见问题及解决方案

#### 8.1.1 Playwright 问题

| 问题                              | 原因                     | 解决方案                                   |
| --------------------------------- | ------------------------ | ------------------------------------------ |
| `TimeoutError: waiting for selector` | 元素加载时间过长         | 增加超时时间或使用动态等待                 |
| `Test hung`                       | 异步操作未完成           | 检查 Promise 是否正确 await                |
| `Browser not found`               | 浏览器未安装             | 运行 `npx playwright install`               |
| `Selector not found`              | 选择器错误               | 使用 DevTools 验证选择器                   |
| `Element not visible`              | 元素被遮挡               | 先滚动到元素位置 `scrollIntoView()`        |

#### 8.1.2 Chrome DevTools MCP 问题

| 问题                          | 原因                   | 解决方案                           |
| ----------------------------- | ---------------------- | ---------------------------------- |
| `Page not found`              | URL 错误或服务未启动    | 检查服务状态和 URL                 |
| `Cannot find element`         | 选择器错误             | 使用更精确的选择器或等待加载        |
| `Network request failed`      | 网络问题或 API 错误     | 检查网络连接和 API 状态            |
| `Screenshot failed`           | 权限问题或路径无效      | 检查文件路径和写入权限             |
| `Evaluate script failed`      | 脚本语法错误           | 验证 JavaScript 语法               |

### 8.2 调试技巧

#### 8.2.1 Playwright 调试模式

```bash
# 调试模式（带界面）
npx playwright test --debug

# 慢动作模式
npx playwright test --headed --slow-mo=1000

# 显示浏览器
npx playwright test --headed
```

#### 8.2.2 Chrome DevTools 调试

```javascript
// 在页面中插入调试断点
{
  "tool": "mcp__chrome-devtools__evaluate_script",
  "script": "debugger;"
}

// 获取元素完整信息
{
  "tool": "mcp__chrome-devtools__evaluate_script",
  "script": `
    const el = document.querySelector('.target');
    console.log('Element:', el);
    console.log('Styles:', window.getComputedStyle(el));
    console.log('Position:', el.getBoundingClientRect());
    return el.outerHTML;
  `
}
```

### 8.3 日志收集

```typescript
// 配置详细日志
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
});
```

---

## 附录

### A. 快速命令参考

```bash
# Playwright
npx playwright test                    # 运行所有测试
npx playwright test --ui               # UI 模式
npx playwright test --project=chromium # 仅 Chrome
npx playwright codegen http://localhost:5173  # 录制测试
npx playwright install                 # 安装浏览器
npx playwright show-report            # 查看报告

# 服务管理
docker-compose up -d                  # 启动所有服务
docker-compose logs -f backend        # 查看后端日志
docker-compose down                   # 停止服务

# 数据库
mysql -u root -p mistakery           # 连接数据库
```

### B. 测试用例映射表

| 文档用例编号 | Playwright 测试文件                     | Chrome DevTools 验证项                |
| ------------ | --------------------------------------- | ------------------------------------ |
| TC-AUTH-001  | auth/auth-register.spec.ts              | Token 存储、路由跳转                 |
| TC-AUTH-002  | auth/auth-login.spec.ts                 | 网络请求、localStorage               |
| TC-MISTAKE-001 | mistake/mistake-parsing.spec.ts       | API 响应、解析结果展示               |
| TC-MISTAKE-003 | mistake/mistake-list.spec.ts          | 筛选网络请求、列表渲染              |
| TC-PRACTICE-001 | practice/practice-setup.spec.ts       | 生成请求、试卷创建                  |
| TC-PRACTICE-003 | practice/practice-tools.spec.ts       | Canvas 操作、计时器验证             |
| TC-REVIEW-001 | review/review-leitner.spec.ts         | 箱子等级、下次复习时间计算          |
| TC-ANALYTICS-001 | analytics/analytics-overview.spec.ts  | 图表渲染、API 数据准确性           |
| TC-PERF-001  | performance/perf-frontend.spec.ts       | Lighthouse 指标、Trace 分析         |

### C. 选择器速查表

| 功能                   | Playwright                          | Chrome DevTools Script             |
| ---------------------- | ----------------------------------- | --------------------------------- |
| 通过文本查找           | `page.getByText('登录')`            | `document.querySelector('...')`    |
| 通过 data-testid 查找  | `page.getByTestId('submit-btn')`    | `[data-testid="submit-btn"]`      |
| 通过 role 查找         | `page.getByRole('button')`           | `[role="button"]`                 |
| 通过 label 查找        | `page.getByLabel('用户名')`          | `[aria-label="用户名"]`           |
| 通过 placeholder 查找  | `page.getByPlaceholder('输入...')`   | `[placeholder="输入..."]`          |

---

**文档结束**

**变更历史：**

| 版本 | 日期       | 修改人 | 修改内容                                   |
| ---- | ---------- | ------ | ------------------------------------------ |
| v1.0 | 2026-02-14 | Claude | 初始版本，建立 Playwright + DevTools MCP 协同测试规范 |
