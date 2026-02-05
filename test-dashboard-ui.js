#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { analyzeStock } from './dist/services/stockAnalysis.js';
import { DashboardReport } from './dist/components/DashboardReport.js';

async function testDashboard() {
  const code = process.argv[2] || '601288';

  console.log(`\nAnalyzing ${code}...\n`);

  const result = await analyzeStock(code);

  if (!result) {
    console.error('Failed to analyze stock');
    process.exit(1);
  }

  // Render the React component
  const { waitUntilExit } = render(React.createElement(DashboardReport, { result }));
  await waitUntilExit();
}

testDashboard().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
