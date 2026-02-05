import React from 'react';
import { Box, Text } from 'ink';
import { StockChart, Sparkline } from './StockChart.js';

interface StockQuote {
  code: string;
  name: string;
  price: number;
  changePct: number;
  changeAmount: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  amount: number;
  turnoverRate: number;
}

interface KLineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
  changePct: number;
}

interface StockInfoProps {
  quote: StockQuote;
  klines?: KLineData[];
}

export function StockInfo({ quote, klines = [] }: StockInfoProps) {
  const isUp = quote.changePct >= 0;
  const changeSymbol = isUp ? '+' : '';
  const trend = isUp ? '📈' : '📉';

  // 提取收盘价用于图表
  const closePrices = klines.map(k => k.close);

  return (
    <Box flexDirection="column" paddingX={1}>
      {/* 标题 */}
      <Box>
        <Text bold color={isUp ? 'green' : 'red'}>
          {trend} {quote.name} ({quote.code})
        </Text>
      </Box>

      {/* 价格信息 */}
      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text>💰 最新价: </Text>
          <Text bold color={isUp ? 'green' : 'red'}>
            {quote.price.toFixed(2)} 元
          </Text>
          <Text dimColor> </Text>
          <Text color={isUp ? 'green' : 'red'}>
            {changeSymbol}{quote.changePct.toFixed(2)}% ({changeSymbol}{quote.changeAmount.toFixed(2)})
          </Text>
        </Box>

        <Box marginTop={1}>
          <Box flexDirection="column" width="50%">
            <Text>📈 今日最高: <Text color="green">{quote.high.toFixed(2)}</Text></Text>
            <Text>📉 今日最低: <Text color="red">{quote.low.toFixed(2)}</Text></Text>
            <Text>🔔 今日开盘: {quote.open.toFixed(2)}</Text>
          </Box>

          <Box flexDirection="column" width="50%">
            <Text>💹 换手率: {quote.turnoverRate.toFixed(2)}%</Text>
            <Text>📦 成交量: {(quote.volume / 10000).toFixed(2)} 万手</Text>
            <Text>💵 成交额: {(quote.amount / 100000000).toFixed(2)} 亿</Text>
          </Box>
        </Box>
      </Box>

      {/* 趋势图 */}
      {closePrices.length > 0 && (
        <Box marginTop={1}>
          <StockChart
            data={closePrices}
            width={60}
            height={10}
            label={`近${closePrices.length}日走势`}
          />
        </Box>
      )}

      {/* 最近5日明细 */}
      {klines.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold dimColor>📅 最近交易日:</Text>
          <Box flexDirection="column" marginTop={0}>
            {klines.slice(-5).reverse().map((k, idx) => {
              const dayUp = k.changePct >= 0;
              const symbol = dayUp ? '↗' : '↘';
              return (
                <Box key={idx}>
                  <Text dimColor>{k.date}</Text>
                  <Text> </Text>
                  <Text color={dayUp ? 'green' : 'red'}>
                    {k.close.toFixed(2)} {symbol} {dayUp ? '+' : ''}{k.changePct.toFixed(2)}%
                  </Text>
                  <Text dimColor> 量: {(k.volume / 10000).toFixed(0)}万</Text>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}
