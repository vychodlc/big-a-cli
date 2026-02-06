import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { saveConfig } from './config.js';

interface ConfigProps {
  onComplete: () => void;
}

function Config({ onComplete }: ConfigProps) {
  const [step, setStep] = useState<'apiKey' | 'baseUrl' | 'model' | 'done'>('apiKey');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [model, setModel] = useState('gpt-3.5-turbo');

  useInput((inputChar, key) => {
    if (key.return) {
      if (step === 'apiKey' && apiKey) {
        setStep('baseUrl');
      } else if (step === 'baseUrl' && baseUrl) {
        setStep('model');
      } else if (step === 'model' && model) {
        // 保存配置
        saveConfig({ apiKey, baseUrl, model });
        setStep('done');
        setTimeout(() => onComplete(), 1500);
      }
    } else if (key.backspace || key.delete) {
      if (step === 'apiKey') {
        setApiKey(prev => prev.slice(0, -1));
      } else if (step === 'baseUrl') {
        setBaseUrl(prev => prev.slice(0, -1));
      } else if (step === 'model') {
        setModel(prev => prev.slice(0, -1));
      }
    } else if (!key.ctrl && !key.meta && inputChar) {
      if (step === 'apiKey') {
        setApiKey(prev => prev + inputChar);
      } else if (step === 'baseUrl') {
        setBaseUrl(prev => prev + inputChar);
      } else if (step === 'model') {
        setModel(prev => prev + inputChar);
      }
    }
  });

  if (step === 'done') {
    return (
      <Box flexDirection="column">
        <Text color="green">✓ 配置已保存！</Text>
        <Text dimColor>运行 big-a 开始使用</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text bold color="blue">配置 big-a-cli</Text>
      <Box marginY={1}>

        {step === 'apiKey' && (
          <Box flexDirection="column">
            <Text>请输入 API Key:</Text>
            <Box marginY={1}>
              <Text dimColor>{apiKey || '(输入中...)'}</Text>
            </Box>
          </Box>
        )}

        {step === 'baseUrl' && (
          <Box flexDirection="column">
            <Text>请输入 Base URL (默认: https://api.openai.com/v1):</Text>
            <Box marginY={1}>
              <Text dimColor>{baseUrl || '(输入中...)'}</Text>
            </Box>
          </Box>
        )}

        {step === 'model' && (
          <Box flexDirection="column">
            <Text>请输入 Model (默认: gpt-3.5-turbo):</Text>
            <Box marginY={1}>
              <Text dimColor>{model || '(输入中...)'}</Text>
            </Box>
          </Box>
        )}

      </Box>
      <Text dimColor>按 Enter 确认，按 Ctrl+C 取消</Text>
    </Box>
  );
}

export default Config;