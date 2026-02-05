import React from 'react';
import { Box, Text } from 'ink';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface CustomBarChartProps {
  data: BarData[];
  width?: number;
  labelWidth?: number;
  showValue?: boolean;
}

export default function CustomBarChart({
  data,
  width = 40,
  labelWidth = 10,
  showValue = true
}: CustomBarChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Box flexDirection="column">
      {data.map((item, idx) => {
        const barLength = Math.round((item.value / maxValue) * width);
        const bar = '▓'.repeat(barLength);

        return (
          <Box key={idx} flexDirection="row">
            <Box width={labelWidth}>
              <Text>{item.label}</Text>
            </Box>
            <Box width={width + 2}>
              <Text color={item.color}>{bar}</Text>
            </Box>
            {showValue && (
              <Box marginLeft={1}>
                <Text>{item.value.toFixed(2)}</Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
