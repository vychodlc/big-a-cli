import React from 'react';
import { Box, Text } from 'ink';

interface StockChartProps {
  data: number[];  // 价格数据
  width?: number;  // 图表宽度
  height?: number; // 图表高度
  label?: string;  // 标签
}

/**
 * ASCII 股票趋势图
 * 使用 Unicode 字符绘制简单的折线图
 */
export function StockChart({ data, width = 50, height = 8, label }: StockChartProps) {
  if (data.length === 0) {
    return <Text dimColor>无数据</Text>;
  }

  // 归一化数据到图表高度
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const normalized = data.map(value => {
    return Math.round(((value - min) / range) * (height - 1));
  });

  // 创建图表网格
  const chart: string[][] = [];
  for (let i = 0; i < height; i++) {
    chart.push(new Array(width).fill(' '));
  }

  // 绘制数据点
  const step = Math.max(1, Math.floor(data.length / width));
  for (let i = 0; i < width && i * step < normalized.length; i++) {
    const value = normalized[i * step];
    const y = height - 1 - value;  // 反转 Y 轴（顶部为高，底部为低）

    // 使用不同字符表示趋势
    if (i > 0 && i * step < normalized.length) {
      const prevValue = normalized[(i - 1) * step];
      const prevY = height - 1 - prevValue;

      if (y < prevY) {
        chart[y][i] = '╱';  // 上涨
      } else if (y > prevY) {
        chart[y][i] = '╲';  // 下跌
      } else {
        chart[y][i] = '─';  // 持平
      }
    } else {
      chart[y][i] = '●';
    }
  }

  // 计算涨跌幅
  const first = data[0];
  const last = data[data.length - 1];
  const changePercent = ((last - first) / first * 100).toFixed(2);
  const isUp = last >= first;
  const trend = isUp ? '📈' : '📉';

  return (
    <Box flexDirection="column">
      {label && (
        <Text bold>
          {trend} {label} {isUp ? '+' : ''}{changePercent}%
          <Text dimColor> ({first.toFixed(2)} → {last.toFixed(2)})</Text>
        </Text>
      )}

      <Box flexDirection="column" marginTop={1}>
        <Text dimColor>
          {max.toFixed(2)} ┤
        </Text>

        {chart.map((row, i) => (
          <Box key={i}>
            <Text color={isUp ? 'green' : 'red'}>
              {i === Math.floor(height / 2) ? `${((min + max) / 2).toFixed(2).padStart(8)} ┤` : '         ┤'}
              {row.join('')}
            </Text>
          </Box>
        ))}

        <Text dimColor>
          {min.toFixed(2)} └{'─'.repeat(width)}
        </Text>
      </Box>
    </Box>
  );
}

/**
 * 简单的 Sparkline（迷你图）
 */
export function Sparkline({ data }: { data: number[] }) {
  if (data.length === 0) return <Text>-</Text>;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // 使用 Unicode 块字符: ▁▂▃▄▅▆▇█
  const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  const spark = data.map(value => {
    const normalized = (value - min) / range;
    const index = Math.min(Math.floor(normalized * blocks.length), blocks.length - 1);
    return blocks[index];
  }).join('');

  const isUp = data[data.length - 1] >= data[0];

  return (
    <Text color={isUp ? 'green' : 'red'}>
      {spark}
    </Text>
  );
}
