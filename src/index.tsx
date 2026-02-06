#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { getConfig, getApiKey, getBaseUrl, getModel } from './config.js';
import App from './App.js';
import Config from './ConfigUI.js';

// 清空控制台
console.clear();

// 检查是否是 config 命令
const args = process.argv.slice(2);
if (args[0] === 'config') {
  render(<Config onComplete={() => process.exit(0)} />);
  process.exit(0);
}

const apiKey = getApiKey();

if (!apiKey) {
  console.log('未找到 API Key 配置');
  console.log('');
  console.log('请使用以下方式配置 API Key：');
  console.log('');
  console.log('方式 1: 使用配置命令');
  console.log('  big-a config');
  console.log('');
  console.log('方式 2: 手动创建配置文件');
  console.log('  在 ~/.big-a-cli/config.json 中添加：');
  console.log('  {');
  console.log('    "apiKey": "your_api_key_here",');
  console.log('    "baseUrl": "https://api.openai.com/v1",');
  console.log('    "model": "gpt-3.5-turbo"');
  console.log('  }');
  process.exit(1);
}

render(<App apiKey={apiKey} baseUrl={getBaseUrl()} model={getModel()} />);