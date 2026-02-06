/**
 * 股票监控界面组件
 * 在 CLI 中显示监控状态和告警信息
 */

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { stockMonitor, StockMonitor as StockMonitorService, type MonitorState, type Alert } from '../services/stockMonitor.js';

interface StockMonitorProps {
  onClose?: () => void;
}

export function StockMonitor({ onClose }: StockMonitorProps) {
  const [state, setState] = useState<MonitorState>(stockMonitor.getState());

  useEffect(() => {
    // 订阅监控状态变化
    const unsubscribe = stockMonitor.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!state.isActive || !state.config) {
    return (
      <Box flexDirection="column">
        <Text color="yellow">监控未启动</Text>
        <Text dimColor>使用 /monitor 命令启动监控</Text>
      </Box>
    );
  }

  const recentAlerts = stockMonitor.getRecentAlerts(10);
  const lastQuote = state.lastQuote;

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="blue" paddingX={1}>
      {/* 标题 */}
      <Box marginBottom={1}>
        <Text bold color="blue">
          📊 股票监控: {state.config.stockCode}
        </Text>
        <Text dimColor> | 间隔: {state.config.interval}s</Text>
      </Box>

      {/* 当前价格信息 */}
      {lastQuote && (
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text bold color={lastQuote.changePct >= 0 ? 'red' : 'green'}>
              {lastQuote.name} ({lastQuote.code})
            </Text>
          </Box>
          <Box>
            <Text bold color={lastQuote.changePct >= 0 ? 'red' : 'green'}>
              ¥{lastQuote.price.toFixed(2)}
            </Text>
            <Text color={lastQuote.changePct >= 0 ? 'red' : 'green'}>
              {lastQuote.changePct >= 0 ? '+' : ''}{lastQuote.changePct.toFixed(2)}%
            </Text>
          </Box>
          <Text dimColor>
            上次更新: {state.lastCheckTime?.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) || '--:--:--'}
          </Text>
        </Box>
      )}

      {/* 阈值信息 */}
      <Box marginBottom={1}>
        <Text color="red">上涨 {state.config.thresholds.rise}%</Text>
        <Text> | </Text>
        <Text color="green">下跌 {state.config.thresholds.fall}%</Text>
      </Box>

      {/* 告警列表 */}
      {recentAlerts.length > 0 && (
        <Box flexDirection="column">
          <Box marginBottom={0}>
            <Text bold color="yellow">🔔 告警记录</Text>
          </Box>
          {recentAlerts.map((alert) => (
            <Box key={alert.id} marginLeft={1}>
              <Text color={
                alert.type === 'rise' ? 'red' :
                alert.type === 'fall' ? 'green' : 'blue'
              }>
                [{alert.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
              </Text>
              <Text> {alert.message}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* 提示信息 */}
      <Box marginTop={1}>
        <Text dimColor>提示: 输入 /monitor stop 停止监控</Text>
      </Box>
    </Box>
  );
}

/**
 * 监控配置选择组件
 */
export function MonitorConfigSelector({
  stockCode,
  onConfigSelected
}: {
  stockCode: string;
  onConfigSelected: (config: { thresholds: { rise: number; fall: number }; interval: number }) => void;
}) {
  const thresholds = StockMonitorService.getPresetThresholds();
  const intervals = StockMonitorService.getPresetIntervals();

  const thresholdOptions = Object.entries(thresholds);
  const intervalOptions = Object.entries(intervals);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">📌 配置股票监控: {stockCode}</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold>选择阈值策略:</Text>
        {thresholdOptions.map(([name, config]) => (
          <Box key={name} marginLeft={1}>
            <Text color="cyan">• {name}</Text>
            <Text dimColor>: 上涨 {(config as any).rise}% / 下跌 {(config as any).fall}%</Text>
          </Box>
        ))}
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold>选择检查间隔:</Text>
        {intervalOptions.map(([name, seconds]) => (
          <Box key={name} marginLeft={1}>
            <Text color="cyan">• {name}</Text>
            <Text dimColor>: {seconds}秒</Text>
          </Box>
        ))}
      </Box>

      <Box>
        <Text dimColor>使用: /monitor {stockCode} [阈值] [间隔]</Text>
        <Text dimColor> 例如: /monitor 600519 稳健 正常</Text>
      </Box>
    </Box>
  );
}