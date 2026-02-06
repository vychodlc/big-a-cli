import fs from 'fs';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.big-a-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

interface Config {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export function getConfig(): Config {
  // 尝试从用户主目录配置文件读取
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // 忽略解析错误
    }
  }
  return {};
}

export function saveConfig(config: Config): void {
  // 确保配置目录存在
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  // 保存配置
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getApiKey(): string | undefined {
  return getConfig().apiKey;
}

export function getBaseUrl(): string {
  return getConfig().baseUrl || 'https://api.openai.com/v1';
}

export function getModel(): string {
  return getConfig().model || 'gpt-3.5-turbo';
}