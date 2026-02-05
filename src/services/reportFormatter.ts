/**
 * Dashboard Report Formatter - 无Emoji纯文字版
 *
 * 使用颜色和粗细区分信息层级，不使用emoji
 */

import { EnhancedAnalysisResult } from './stockAnalysis.js';

/**
 * 格式化Dashboard分析报告 - 紧凑多栏版（无emoji）
 */
export function formatDashboardReport(result: EnhancedAnalysisResult): string {
  const lines: string[] = [];

  // 标题栏
  const signalColor = getSignalColor(result.operation_advice);
  const title = `${result.name} (${result.code}) - ${result.operation_advice}`;
  lines.push('┌' + '─'.repeat(120) + '┐');
  lines.push('│' + color(centerText(title, 120), signalColor, true) + '│');
  lines.push('├' + '─'.repeat(120) + '┤');

  // 核心结论栏（顶部横跨）
  const core = result.dashboard.core_conclusion;
  lines.push('│ ' + padToWidth(bold('核心结论'), 118) + '│');

  const statusLine = `${getSignalText(result.operation_advice)} | ${result.trend_prediction} | 置信度: ${result.confidence_level}`;
  lines.push('│   ' + padToWidth(statusLine, 116) + '│');

  const conclusionLine = color(core.one_sentence, 'cyan');
  lines.push('│   ' + padToWidth(conclusionLine, 116) + '│');
  lines.push('├' + '─'.repeat(39) + '┬' + '─'.repeat(39) + '┬' + '─'.repeat(39) + '┤');

  // 第一行：情报 | 价格数据 | 狙击点位
  const leftCol1 = buildIntelligenceColumn(result);
  const midCol1 = buildPriceColumn(result);
  const rightCol1 = buildSniperColumn(result);

  const maxRows1 = Math.max(leftCol1.length, midCol1.length, rightCol1.length);
  for (let i = 0; i < maxRows1; i++) {
    const left = padToWidth(leftCol1[i] || '', 38);
    const mid = padToWidth(midCol1[i] || '', 38);
    const right = padToWidth(rightCol1[i] || '', 38);
    lines.push(`│ ${left}│ ${mid}│ ${right}│`);
  }

  lines.push('├' + '─'.repeat(39) + '┼' + '─'.repeat(39) + '┼' + '─'.repeat(39) + '┤');

  // 第二行：仓位策略 | 量能分析 | 检查清单
  const leftCol2 = buildPositionColumn(result);
  const midCol2 = buildVolumeColumn(result);
  const rightCol2 = buildChecklistColumn(result);

  const maxRows2 = Math.max(leftCol2.length, midCol2.length, rightCol2.length);
  for (let i = 0; i < maxRows2; i++) {
    const left = padToWidth(leftCol2[i] || '', 38);
    const mid = padToWidth(midCol2[i] || '', 38);
    const right = padToWidth(rightCol2[i] || '', 38);
    lines.push(`│ ${left}│ ${mid}│ ${right}│`);
  }

  lines.push('└' + '─'.repeat(39) + '┴' + '─'.repeat(39) + '┴' + '─'.repeat(39) + '┘');

  // 页脚
  const scoreColor = result.sentiment_score >= 70 ? 'green' : result.sentiment_score >= 50 ? 'yellow' : 'red';
  lines.push(`\n  生成时间: ${new Date().toLocaleString('zh-CN')} | 综合评分: ${color(result.sentiment_score + '/100', scoreColor, true)}`);

  return lines.join('\n');
}

/**
 * 构建情报栏（左上）
 */
function buildIntelligenceColumn(result: EnhancedAnalysisResult): string[] {
  const lines: string[] = [];
  const intel = result.dashboard.intelligence;
  const core = result.dashboard.core_conclusion;

  lines.push(bold('重要信息'));
  lines.push('');

  if (intel?.sentiment_summary) {
    lines.push(truncate(intel.sentiment_summary, 37));
  }

  lines.push('');
  lines.push(bold('持仓建议'));
  lines.push(color('[空仓]', 'blue') + ' ' + truncate(core.position_advice.no_position, 30));
  lines.push(color('[持仓]', 'blue') + ' ' + truncate(core.position_advice.has_position, 30));

  if (intel?.risk_alerts && intel.risk_alerts.length > 0) {
    lines.push('');
    lines.push(color('[风险] ', 'red') + truncate(intel.risk_alerts[0], 30));
  }

  return lines;
}

/**
 * 构建价格数据栏（中上）
 */
function buildPriceColumn(result: EnhancedAnalysisResult): string[] {
  const lines: string[] = [];
  const price = result.dashboard.data_perspective.price_position;
  const trend = result.dashboard.data_perspective.trend_status;

  lines.push(bold('价格数据'));
  lines.push('');
  lines.push(`当前: ${color(price.current_price.toFixed(2), 'cyan', true)}  MA5: ${price.ma5.toFixed(2)}`);
  lines.push(`MA10: ${price.ma10.toFixed(2)}  MA20: ${price.ma20.toFixed(2)}`);

  const biasColor = price.bias_status === '安全' ? 'green' : price.bias_status === '警戒' ? 'yellow' : 'red';
  lines.push(`乖离: ${color(price.bias_ma5.toFixed(2) + '%', biasColor)} [${price.bias_status}]`);
  lines.push('');
  lines.push(`支撑: ${price.support_level.toFixed(2)}  压力: ${price.resistance_level.toFixed(2)}`);
  lines.push('');

  const bullishText = trend.is_bullish ? color('[多头排列]', 'green') : color('[空头排列]', 'red');
  lines.push(`${bullishText} 强度 ${trend.trend_score}/100`);

  return lines;
}

/**
 * 构建狙击点位栏（右上）
 */
function buildSniperColumn(result: EnhancedAnalysisResult): string[] {
  const lines: string[] = [];
  const sniper = result.dashboard.battle_plan.sniper_points;

  lines.push(bold('狙击点位'));
  lines.push('');
  lines.push(color('[理想] ', 'green') + sniper.ideal_buy);
  lines.push(color('[次优] ', 'blue') + sniper.secondary_buy);
  lines.push(color('[止损] ', 'red') + sniper.stop_loss);
  lines.push(color('[目标] ', 'yellow') + sniper.take_profit);

  return lines;
}

/**
 * 构建仓位策略栏（左下）
 */
function buildPositionColumn(result: EnhancedAnalysisResult): string[] {
  const lines: string[] = [];
  const strategy = result.dashboard.battle_plan.position_strategy;

  lines.push(bold('仓位策略'));
  lines.push('');
  lines.push('建议: ' + color(strategy.suggested_position, 'cyan', true));
  lines.push('');
  lines.push(truncate('入场: ' + strategy.entry_plan, 37));
  lines.push('');
  lines.push(truncate('风控: ' + strategy.risk_control, 37));

  return lines;
}

/**
 * 构建量能分析栏（中下）
 */
function buildVolumeColumn(result: EnhancedAnalysisResult): string[] {
  const lines: string[] = [];
  const vol = result.dashboard.data_perspective.volume_analysis;
  const realtime = result.realtime;

  lines.push(bold('量能分析'));
  lines.push('');
  lines.push(`量比: ${vol.volume_ratio.toFixed(2)} (${vol.volume_status})`);
  lines.push(`换手: ${vol.turnover_rate.toFixed(2)}%`);
  lines.push('');
  lines.push(truncate(vol.volume_meaning, 37));
  lines.push('');

  const changeColor = realtime.changePct >= 0 ? 'green' : 'red';
  const changeSymbol = realtime.changePct >= 0 ? '+' : '';
  lines.push(color(`涨跌: ${changeSymbol}${realtime.changePct.toFixed(2)}%`, changeColor, true));

  return lines;
}

/**
 * 构建检查清单栏（右下）
 */
function buildChecklistColumn(result: EnhancedAnalysisResult): string[] {
  const lines: string[] = [];
  const checklist = result.dashboard.battle_plan.action_checklist;

  lines.push(bold('行动清单'));
  lines.push('');

  checklist.slice(0, 6).forEach((item, idx) => {
    // 移除原有的emoji标记
    const cleanItem = item.replace(/[✅⚠️]/g, '').trim();
    const hasWarning = item.includes('⚠️') || item.includes('注意') || item.includes('风险');
    const prefix = hasWarning ? color('[!]', 'yellow') : color('[√]', 'green');
    lines.push(prefix + ' ' + truncate(cleanItem, 33));
  });

  return lines;
}

/**
 * 辅助函数：文本居中
 */
function centerText(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

/**
 * 辅助函数：右侧填充
 */
function padRight(text: string, width: number): string {
  return text + ' '.repeat(Math.max(0, width - text.length));
}

/**
 * 辅助函数：截断文本
 */
function truncate(text: string, maxLen: number): string {
  // 移除所有emoji
  const cleaned = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').replace(/[✓✅⚠️❌]/g, '').trim();
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.substring(0, maxLen - 3) + '...';
}

/**
 * 辅助函数：加粗文本
 */
function bold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`;
}

/**
 * 辅助函数：添加颜色
 */
function color(text: string, colorName: string, isBold: boolean = false): string {
  const colors: Record<string, string> = {
    red: '31',
    green: '32',
    yellow: '33',
    blue: '34',
    magenta: '35',
    cyan: '36',
    white: '37',
    gray: '90',
  };

  const colorCode = colors[colorName] || '37';
  const boldCode = isBold ? '1;' : '';
  return `\x1b[${boldCode}${colorCode}m${text}\x1b[0m`;
}

/**
 * 辅助函数：计算颜色代码字符数
 */
function countColorCodes(text: string): number {
  const matches = text.match(/\x1b\[[0-9;]+m/g);
  if (!matches) return 0;
  return matches.reduce((sum, match) => sum + match.length, 0);
}

/**
 * 辅助函数：计算可见宽度（排除ANSI代码）
 */
function getVisibleWidth(text: string): number {
  // 移除所有ANSI转义序列后的长度
  const cleaned = text.replace(/\x1b\[[0-9;]+m/g, '');
  return cleaned.length;
}

/**
 * 辅助函数：填充到指定可见宽度
 */
function padToWidth(text: string, targetWidth: number): string {
  const visibleWidth = getVisibleWidth(text);
  const padding = Math.max(0, targetWidth - visibleWidth);
  return text + ' '.repeat(padding);
}

/**
 * 获取信号颜色
 */
function getSignalColor(operationAdvice: string): string {
  if (operationAdvice.includes('买入')) return 'green';
  if (operationAdvice.includes('卖出')) return 'red';
  return 'yellow';
}

/**
 * 获取信号文字
 */
function getSignalText(operationAdvice: string): string {
  if (operationAdvice.includes('买入')) return color('[买入信号]', 'green', true);
  if (operationAdvice.includes('卖出')) return color('[卖出信号]', 'red', true);
  return color('[持有]', 'yellow', true);
}
