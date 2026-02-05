import React from "react";
import { Box, Text } from "ink";

interface TableProps {
  data: Record<string, any>[];
}

export default function Table({ data }: TableProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const columns = Object.keys(data[0]);

  return (
    <Box flexDirection="column">
      {data.map((row, idx) => (
        <Box key={idx} flexDirection="row">
          {columns.map((col, colIdx) => (
            <Box
              key={colIdx}
              width={colIdx === 0 ? "30%" : "auto"}
              paddingRight={1}
            >
              <Text>{String(row[col] || "")}</Text>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
