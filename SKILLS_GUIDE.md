# Claude Code 技能分类说明文档

本文档对当前可用的所有技能进行分类，并说明每个技能的适用场景。

---

## 📁 目录

- [开发与代码相关](#开发与代码相关)
- [文档与内容处理](#文档与内容处理)
- [设计与创意](#设计与创意)
- [测试与自动化](#测试与自动化)
- [项目管理与 Git](#项目管理与-git)
- [系统与工具](#系统与工具)

---

## 开发与代码相关

### 🌐 Web 开发

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **frontend-design** | 创建高质量前端界面 | 构建 Web 组件、页面、仪表盘、管理面板、落地页、电商网站、作品集、博客等 |
| **web-artifacts-builder** | 构建 React/Tailwind 复杂 Web 构件 | 需要状态管理、路由或 shadcn/ui 组件的复杂 HTML 构件 |
| **ui-ux-pro-max** | UI/UX 设计智能系统 | 50 种风格、21 种配色方案、20 种图表类型；支持 React/Vue/Svelte 等多种技术栈 |
| **mcp-builder** | 构建 MCP 服务器 | 创建与外部服务集成的 Model Context Protocol 服务器（Python FastMCP 或 Node/TypeScript MCP SDK） |

### 🔧 代码质量

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **code-review** | Pull Request 代码审查 | 需要对 PR 进行代码审查时 |

### 🎮 游戏开发

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **renpy** | Ren'Py 视觉小说开发专家 | 创建视觉小说、剧情游戏、交互式故事、恋爱模拟游戏；支持角色定义、对话系统、分支剧情、CG 管理、UI 界面设计 |

---

## 文档与内容处理

### 📄 Office 文档

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **docx** | Word 文档处理 | 创建、编辑 Word 文档；处理修订、注释、格式保留；文本提取 |
| **xlsx** | Excel 表格处理 | 创建/编辑电子表格；公式与格式；数据分析与可视化 |
| **pptx** | PowerPoint 演示文稿处理 | 创建/编辑演示文稿；处理布局、注释、演讲者备注 |

### 📑 其他文档格式

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **pdf** | PDF 处理工具包 | 提取文本和表格；创建/合并/拆分 PDF；填写表单 |
| **doc-coauthoring** | 文档协作工作流 | 编写文档、提案、技术规范、决策文档等结构化内容 |
| **claude-md-management** | CLAUDE.md 管理 | 检查、审计、更新或修复 CLAUDE.md 文件；项目内存优化 |

### 📊 数据处理

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **csv-data-summarizer** | CSV 文件分析 | 使用 Python 和 pandas 分析 CSV 文件、生成统计摘要、绘制可视化图表 |

### 📝 内容创作

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **ai-content-operator** | 视频内容运营 | 根据视频脚本/字幕生成高点击率标题、视频简介、时间轴和标签 |
| **internal-comms** | 内部沟通文档 | 编写状态报告、领导层更新、项目通讯、FAQ、事故报告、项目更新等 |

---

## 设计与创意

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **canvas-design** | 视觉艺术创作 | 创建海报、艺术作品、设计或其他静态作品（PNG/PDF 格式） |
| **slack-gif-creator** | Slack GIF 动画制作 | 为 Slack 创建优化的动画 GIF |

---

## 测试与自动化

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **browser-use** | 浏览器自动化 | 网页测试、表单填写、截图、数据提取；与网页交互、导航网站 |
| **webapp-testing** | Web 应用测试 | 使用 Playwright 验证前端功能、调试 UI 行为、捕获浏览器截图、查看浏览器日志 |

---

## 项目管理与 Git

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **commit-commands:commit** | 创建 Git 提交 | 需要创建 git commit 时 |
| **commit-commands:commit-push-pr** | 提交、推送并创建 PR | 完整的 Git 工作流 |
| **commit-commands:clean_gone** | 清理已删除的远程分支 | 清理标记为 [gone] 的本地分支 |

---

## 系统与工具

### 🗂️ 文件管理

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **file-organizer** | 智能文件整理 | 理解上下文、查找重复项、建议更好的结构、自动化清理任务 |

### 📹 媒体处理

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **video-downloader** | YouTube 视频下载 | 下载 YouTube 视频（支持多种质量：best/1080p/720p/480p/360p）和格式（mp4/webm/mkv），以及 MP3 音频提取 |

### ⚙️ 配置与开发工具

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **add-setting-env** | 环境变量配置 | 实现服务器端环境变量以控制用户设置的默认值 |
| **skill-creator** | 创建新技能 | 扩展 Claude 的能力，创建具有专门知识、工作流或工具集成的新技能 |
| **agent-sdk-dev:new-sdk-app** | Agent SDK 应用 | 创建和设置新的 Claude Agent SDK 应用 |

### 📊 使用与反馈

| 技能 | 说明 | 使用场景 |
|------|------|----------|
| **glm-plan-usage:usage-query** | 查询账户使用统计 | 查询 GLM Coding Plan 的使用信息 |
| **glm-plan-bug:case-feedback** | 提交案例反馈 | 报告问题或建议 |

---

## 快速参考：按任务类型查找技能

### 我想创建/设计什么...

| 任务 | 使用技能 |
|------|----------|
| 网页/落地页/仪表盘 | `frontend-design` |
| UI 组件 | `frontend-design`, `ui-ux-pro-max` |
| 漂亮的静态图像 | `canvas-design` |
| Word 文档 | `docx` |
| Excel 表格 | `xlsx` |
| PowerPoint 演示文稿 | `pptx` |
| PDF 文档 | `pdf` |
| 视频/标题/标签 | `ai-content-operator` |
| 视觉小说游戏 | `renpy` |
| Slack GIF | `slack-gif-creator` |

### 我想处理什么...

| 任务 | 使用技能 |
|------|----------|
| CSV 数据分析 | `csv-data-summarizer` |
| 文件整理 | `file-organizer` |
| YouTube 视频 | `video-downloader` |
| 代码审查 | `code-review` |
| Git 提交 | `commit-commands:commit` |

### 我想测试/自动化什么...

| 任务 | 使用技能 |
|------|----------|
| Web 应用测试 | `webapp-testing` |
| 浏览器自动化 | `browser-use` |

### 我想开发什么...

| 任务 | 使用技能 |
|------|----------|
| MCP 服务器 | `mcp-builder` |
| Claude Agent SDK 应用 | `agent-sdk-dev:new-sdk-app` |
| 新 Claude 技能 | `skill-creator` |

---

## 技能调用方式

在对话中，你可以通过以下方式使用技能：

1. **自然描述任务** - 例如："帮我设计一个落地页" 或 "下载这个 YouTube 视频"
2. **使用 `/` 命令** - 例如：`/commit`（如果技能支持命令调用）
3. **明确提及需求** - Claude 会自动识别匹配的技能

---

*最后更新：2026-02-13*
