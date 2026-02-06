/**
 * 股票监控设置组件
 * 交互式选择股票代码、阈值和间隔
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { StockMonitor as StockMonitorClass } from '../services/stockMonitor.js';
import { isValidStockCode } from '../services/eastmoney.js';

interface MonitorSetupProps {
  onComplete: (config: { stockCode: string; thresholds: { rise: number; fall: number }; interval: number }) => void;
  onCancel: () => void;
}

type Step = 'stockCode' | 'threshold' | 'interval';

const THRESHOLD_OPTIONS = [
  { name: '保守', rise: 3, fall: 2 },
  { name: '稳健', rise: 5, fall: 3 },
  { name: '激进', rise: 8, fall: 5 },
  { name: '高频', rise: 2, fall: 1 },
];

const INTERVAL_OPTIONS = [
  { name: '快速', seconds: 30 },
  { name: '正常', seconds: 60 },
  { name: '节能', seconds: 120 },
  { name: '低频', seconds: 300 },
];

export function MonitorSetup({ onComplete, onCancel }: MonitorSetupProps) {
  const [step, setStep] = useState<Step>('stockCode');
  const [stockCode, setStockCode] = useState('');
  const [selectedThreshold, setSelectedThreshold] = useState(0);
  const [selectedInterval, setSelectedInterval] = useState(1);

  // 按空格确认，上下键选择，ESC取消，输入股票代码
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (key.return) {
      // 确认当前步骤
      if (step === 'stockCode') {
        if (isValidStockCode(stockCode)) {
          setStep('threshold');
        }
      } else if (step === 'threshold') {
        setStep('interval');
      } else if (step === 'interval') {
        onComplete({
          stockCode,
          thresholds: THRESHOLD_OPTIONS[selectedThreshold],
          interval: INTERVAL_OPTIONS[selectedInterval].seconds,
        });
      }
    } else if (key.leftArrow || key.upArrow) {
      if (step === 'threshold') {
        setSelectedThreshold(prev => (prev > 0 ? prev - 1 : THRESHOLD_OPTIONS.length - 1));
      } else if (step === 'interval') {
        setSelectedInterval(prev => (prev > 0 ? prev - 1 : INTERVAL_OPTIONS.length - 1));
      }
    } else if (key.rightArrow || key.downArrow) {
      if (step === 'threshold') {
        setSelectedThreshold(prev => (prev < THRESHOLD_OPTIONS.length - 1 ? prev + 1 : 0));
      } else if (step === 'interval') {
        setSelectedInterval(prev => (prev < INTERVAL_OPTIONS.length - 1 ? prev + 1 : 0));
      }
    } else if (key.backspace || key.delete) {
      if (step === 'stockCode') {
        setStockCode(prev => prev.slice(0, -1));
      }
    } else if (input && step === 'stockCode' && !key.ctrl && !key.meta) {
      // 只允许输入数字
      if (/^\d$/.test(input) && stockCode.length < 6) {
        setStockCode(prev => prev + input);
      }
    }
  });

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="blue" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="blue">📌 股票监控设置</Text>
        <Text dimColor> (ESC 取消)</Text>
      </Box>

      {step === 'stockCode' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>步骤 1/3: 输入股票代码</Text>
          </Box>
          <Box marginBottom={1}>
            <Text>股票代码: </Text>
            <Text color="cyan">{stockCode || '_'}</Text>
            <Text dimColor> (6位数字)</Text>
          </Box>
          <Box>
            <Text dimColor>示例: 600519 (茅台), 000001 (平安)</Text>
          </Box>
          {!isValidStockCode(stockCode) && stockCode.length > 0 && (
            <Box marginTop={1}>
              <Text color="red">请输入有效的6位股票代码</Text>
            </Box>
          )}
          {isValidStockCode(stockCode) && (
            <Box marginTop={1}>
              <Text color="green">✓ 代码有效，按 Enter 继续</Text>
            </Box>
          )}
        </Box>
      )}

      {step === 'threshold' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>步骤 2/3: 选择阈值策略</Text>
          </Box>
          <Box flexDirection="column">
            {THRESHOLD_OPTIONS.map((option, idx) => (
              <Box key={option.name}>
                <Text color={idx === selectedThreshold ? 'cyan' : 'gray'}>
                  {idx === selectedThreshold ? '→' : ' '}
                </Text>
                <Text bold={idx === selectedThreshold} color={idx === selectedThreshold ? 'cyan' : 'gray'}>
                  {option.name}
                </Text>
                <Text dimColor>: 上涨 {option.rise}% / 下跌 {option.fall}%</Text>
              </Box>
            ))}
          </Box>
          <Box marginTop={1}>
            <Text dimColor>使用 ← → 或 ↑ ↓ 选择，Enter 确认</Text>
          </Box>
        </Box>
      )}

      {step === 'interval' && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold>步骤 3/3: 选择检查间隔</Text>
          </Box>
          <Box flexDirection="column">
            {INTERVAL_OPTIONS.map((option, idx) => (
              <Box key={option.name}>
                <Text color={idx === selectedInterval ? 'cyan' : 'gray'}>
                  {idx === selectedInterval ? '→' : ' '}
                </Text>
                <Text bold={idx === selectedInterval} color={idx === selectedInterval ? 'cyan' : 'gray'}>
                  {option.name}
                </Text>
                <Text dimColor>: {option.seconds}秒</Text>
              </Box>
            ))}
          </Box>
          <Box marginTop={1}>
            <Text dimColor>使用 ← → 或 ↑ ↓ 选择，Enter 确认</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}