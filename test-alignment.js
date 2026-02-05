#!/usr/bin/env node

import { analyzeStock } from './dist/services/stockAnalysis.js';
import { formatDashboardReport } from './dist/services/reportFormatter.js';

async function testAlignment() {
  const codes = ['601288', '000001', '600519'];

  for (const code of codes) {
    console.log(`\n${'='.repeat(120)}`);
    console.log(`Testing ${code}...`);
    console.log('='.repeat(120));

    const result = await analyzeStock(code);
    if (result) {
      const report = formatDashboardReport(result);
      console.log(report);
    } else {
      console.log(`Failed to analyze ${code}`);
    }

    // 小延迟避免API限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

testAlignment().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
