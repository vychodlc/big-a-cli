# Chat CLI

一个简单的命令行 AI 对话工具，使用 Ink + React 构建。

## 功能特性

- 流式 AI 对话
- 简洁的终端界面
- 内置实用命令
- 支持多种 AI 提供商（OpenAI、DeepSeek、Moonshot 等）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填写你的 API 配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
AI_API_KEY=your-api-key-here
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-3.5-turbo
```

### 3. 运行

```bash
npm run dev
```

## 可用命令

- `/help` - 显示帮助信息
- `/clear` - 清空聊天历史
- `/joke` - 随机讲一个笑话
- `/fact` - 分享一个随机知识
- `/stock <代码>` - 查询股票行情（如：`/stock 600519`）

## 快捷键

- `↑` (上箭头) - 浏览上一条历史消息
- `↓` (下箭头) - 浏览下一条历史消息
- `Tab` - 自动补全命令（输入 `/` 后使用）
- `Enter` - 发送消息

## 支持的 AI 提供商

### OpenAI
```env
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-3.5-turbo
```

### DeepSeek
```env
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
```

### Moonshot (Kimi)
```env
AI_BASE_URL=https://api.moonshot.cn/v1
AI_MODEL=moonshot-v1-8k
```

## 开发

- `npm run dev` - 开发模式运行
- `npm run build` - 构建项目
- `npm start` - 运行构建后的版本

## 技术栈

- Ink 4 - React for CLI
- Vercel AI SDK - AI 集成
- TypeScript - 类型安全
- dotenv - 环境配置
