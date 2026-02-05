#!/usr/bin/env node

/**
 * Test script to verify emoji removal from stock analysis
 */

import { analyzeStock } from './dist/services/stockAnalysis.js';
import { formatDashboardReport } from './dist/services/reportFormatter.js';

async function testEmojiRemoval() {
  console.log('Testing emoji removal in stock analysis...\n');

  const testCode = '000001';  // 平安银行
  console.log(`Analyzing ${testCode}...\n`);

  const result = await analyzeStock(testCode);

  if (!result) {
    console.error('Failed to get analysis result');
    process.exit(1);
  }

  const report = formatDashboardReport(result);

  // Check for common emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[✓✅⚠️❌🟢🟡🔴📈📉💰📦💹⭐]/gu;
  const foundEmojis = report.match(emojiRegex);

  if (foundEmojis && foundEmojis.length > 0) {
    console.error('❌ FAILED: Found emojis in output:');
    console.error(foundEmojis);
    console.error('\n--- Full Report ---');
    console.log(report);
    process.exit(1);
  } else {
    console.log('✅ SUCCESS: No emojis found in dashboard report\n');
    console.log('--- Sample Output ---');
    console.log(report);
  }

  // Check internal data structures
  const dataEmojis = JSON.stringify(result).match(emojiRegex);
  if (dataEmojis && dataEmojis.length > 0) {
    console.error('\n❌ WARNING: Found emojis in internal data structures:');
    console.error(dataEmojis);
  } else {
    console.log('\n✅ SUCCESS: No emojis in internal data structures');
  }
}

testEmojiRemoval().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
