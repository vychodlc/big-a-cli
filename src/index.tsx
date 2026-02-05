#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import dotenv from 'dotenv';
import App from './App.js';

// 清空控制台
console.clear();

dotenv.config();

const apiKey = process.env.AI_API_KEY;
const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const model = process.env.AI_MODEL || 'gpt-3.5-turbo';

if (!apiKey) {
  console.error('Error: AI_API_KEY not found in .env file');
  process.exit(1);
}

render(<App apiKey={apiKey} baseUrl={baseUrl} model={model} />);
