/**
 * 股票深度分析服务 - Dashboard版
 * 参考 daily_stock_analysis 的 analyze_stock 流程和决策仪表盘结构
 */

import { getRealtimeQuote, getKLineData } from './eastmoney.js';

// ========== Dashboard 数据结构 ==========

export interface Dashboard {
  intelligence?: {
    sentiment_summary?: string;
    earnings_outlook?: string;
    risk_alerts?: string[];
    positive_catalysts?: string[];
    latest_news?: string;
  };
  core_conclusion: {
    one_sentence: string;
    signal_type: string;  // 买入信号/持有/卖出信号
    time_sensitivity: string;  // 本周内/3日内/当下
    position_advice: {
      no_position: string;  // 空仓者建议
      has_position: string;  // 持仓者建议
    };
  };
  data_perspective: {
    trend_status: {
      ma_alignment: string;  // 多头排列/空头排列
      is_bullish: boolean;
      trend_score: number;  // 0-100
    };
    price_position: {
      current_price: number;
      ma5: number;
      ma10: number;
      ma20: number;
      bias_ma5: number;  // 乖离率
      bias_status: string;  // 安全/警戒/危险
      support_level: number;
      resistance_level: number;
    };
    volume_analysis: {
      volume_ratio: number;
      volume_status: string;  // 放量/缩量/正常
      turnover_rate: number;
      volume_meaning: string;  // 解读说明
    };
  };
  battle_plan: {
    sniper_points: {
      ideal_buy: string;  // 理想买入点
      secondary_buy: string;  // 次优买入点
      stop_loss: string;  // 止损位
      take_profit: string;  // 目标位
    };
    position_strategy: {
      suggested_position: string;  // 建议仓位
      entry_plan: string;  // 建仓策略
      risk_control: string;  // 风控策略
    };
    action_checklist: string[];  // 检查清单
  };
}

export interface EnhancedAnalysisResult {
  code: string;
  name: string;

  // 核心指标
  sentiment_score: number;  // 0-100
  trend_prediction: string;  // 强烈看多/看多/震荡/看空
  operation_advice: string;  // 买入/持有/卖出
  decision_type: 'buy' | 'hold' | 'sell';
  confidence_level: '高' | '中' | '低';

  // 决策仪表盘数据
  dashboard: Dashboard;

  // 技术分析（保留原有简单结构）
  technical: {
    ma5: number;
    ma10: number;
    ma20: number;
    trend: string;
    volumeStatus: string;
  };

  // 实时行情
  realtime: {
    price: number;
    changePct: number;
    volume: number;
    turnoverRate: number;
  };

  // 趋势信号
  trendAnalysis: {
    status: string;
    strength: string;
    signals: string[];
    risks: string[];
  };
}

// ========== 分析函数 ==========

/**
 * 分析趋势状态
 */
function analyzeTrend(klines: any[]): { status: string; strength: string } {
  if (klines.length < 3) {
    return { status: '数据不足', strength: '未知' };
  }

  const recent = klines.slice(-3);
  const closes = recent.map(k => k.close);

  const isUptrend = closes[2] > closes[1] && closes[1] > closes[0];
  const isDowntrend = closes[2] < closes[1] && closes[1] < closes[0];

  const totalChange = ((closes[2] - closes[0]) / closes[0]) * 100;

  let status = '震荡';
  if (isUptrend) status = '上涨趋势';
  else if (isDowntrend) status = '下跌趋势';

  let strength = '弱';
  if (Math.abs(totalChange) > 5) strength = '强';
  else if (Math.abs(totalChange) > 2) strength = '中';

  return { status, strength };
}

/**
 * 分析成交量状态
 */
function analyzeVolume(klines: any[]): string {
  if (klines.length < 6) return '未知';

  const recent = klines.slice(-5);
  const volumes = recent.map(k => k.volume);
  const avgVolume = volumes.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
  const latestVolume = volumes[4];

  const volumeRatio = latestVolume / avgVolume;

  if (volumeRatio > 1.5) return '明显放量';
  if (volumeRatio > 1.2) return '温和放量';
  if (volumeRatio < 0.8) return '明显缩量';
  return '成交正常';
}

/**
 * 计算量比
 */
function calculateVolumeRatio(klines: any[]): number {
  if (klines.length < 6) return 1.0;

  const recent = klines.slice(-5);
  const volumes = recent.map(k => k.volume);
  const avgVolume = volumes.slice(0, 4).reduce((a, b) => a + b, 0) / 4;
  const latestVolume = volumes[4];

  return latestVolume / avgVolume;
}

/**
 * 生成买入信号
 */
function generateBuySignals(
  trend: { status: string; strength: string },
  volumeStatus: string,
  quote: any,
  technical: any
): string[] {
  const signals: string[] = [];

  if (trend.status === '上涨趋势') {
    signals.push('价格处于上涨趋势');
  }

  if (volumeStatus.includes('放量')) {
    signals.push('成交量配合良好');
  }

  if (quote.price > technical.ma5 && technical.ma5 > technical.ma10) {
    signals.push('均线呈多头排列');
  }

  if (quote.changePct > 0) {
    signals.push('当日价格上涨');
  }

  if (quote.turnoverRate > 3 && quote.turnoverRate < 15) {
    signals.push('换手率适中');
  }

  return signals;
}

/**
 * 生成风险因素
 */
function generateRiskFactors(
  trend: { status: string; strength: string },
  volumeStatus: string,
  quote: any
): string[] {
  const risks: string[] = [];

  if (trend.status === '下跌趋势') {
    risks.push('价格处于下跌趋势');
  }

  if (volumeStatus.includes('缩量') && quote.changePct < 0) {
    risks.push('缩量下跌，买盘不足');
  }

  if (quote.changePct < -5) {
    risks.push('当日跌幅较大');
  }

  if (quote.turnoverRate > 20) {
    risks.push('换手率过高，波动较大');
  }

  if (quote.changePct > 8) {
    risks.push('短期涨幅过大，注意回调风险');
  }

  return risks;
}

// ========== Dashboard 辅助函数 ==========

/**
 * 生成狙击点位
 */
function generateSniperPoints(
  quote: any,
  technical: any,
  supportLevel: number,
  resistanceLevel: number
): Dashboard['battle_plan']['sniper_points'] {
  return {
    ideal_buy: `${(supportLevel * 1.01).toFixed(2)} (支撑位上方)`,
    secondary_buy: `${technical.ma5.toFixed(2)} (MA5附近)`,
    stop_loss: `${(supportLevel * 0.97).toFixed(2)} (跌破支撑3%)`,
    take_profit: `${(resistanceLevel * 0.98).toFixed(2)} (接近压力位)`,
  };
}

/**
 * 确定信号类型
 */
function determineSignalType(signals: string[], risks: string[]): string {
  if (signals.length >= 3 && risks.length <= 1) return '买入信号';
  if (risks.length >= 3) return '卖出信号';
  return '持有';
}

/**
 * 生成仓位策略
 */
function generatePositionStrategy(
  signals: string[],
  risks: string[],
  biasMA5: number
): Dashboard['battle_plan']['position_strategy'] {
  const signalCount = signals.length;
  const riskCount = risks.length;

  if (signalCount > riskCount && Math.abs(biasMA5) < 3) {
    return {
      suggested_position: '30-50%',
      entry_plan: '分批建仓，首次30%，回调至支撑位加仓',
      risk_control: '跌破止损位坚决止损，盈利5%以上设置移动止损',
    };
  } else if (riskCount > signalCount) {
    return {
      suggested_position: '0-20%',
      entry_plan: '轻仓试探或观望',
      risk_control: '严格止损，快进快出',
    };
  } else {
    return {
      suggested_position: '20-30%',
      entry_plan: '小仓位试探',
      risk_control: '控制仓位，设置止损',
    };
  }
}

/**
 * 生成行动检查清单
 */
function generateActionChecklist(
  signals: string[],
  risks: string[],
  sniperPoints: Dashboard['battle_plan']['sniper_points']
): string[] {
  const checklist: string[] = [];

  checklist.push(`确认买入点位: ${sniperPoints.ideal_buy}`);
  checklist.push(`设置止损位: ${sniperPoints.stop_loss}`);

  if (signals.some(s => s.includes('上涨'))) {
    checklist.push('关注是否突破压力位');
  }
  if (risks.some(r => r.includes('跌幅'))) {
    checklist.push('注意短期回调风险');
  }

  checklist.push('控制仓位不超过建议上限');
  checklist.push('设置价格提醒');

  return checklist;
}

/**
 * 生成舆情总结
 */
function generateSentimentSummary(
  trend: { status: string; strength: string },
  volumeStatus: string,
  signals: string[],
  risks: string[]
): string {
  const signalCount = signals.length;
  const riskCount = risks.length;

  if (signalCount > riskCount && trend.status === '上涨趋势') {
    return '技术面偏多，市场情绪积极';
  } else if (riskCount > signalCount && trend.status === '下跌趋势') {
    return '技术面偏空，市场情绪谨慎';
  } else {
    return '市场情绪中性，观望氛围较浓';
  }
}

/**
 * 生成一句话结论
 */
function generateOneSentenceConclusion(
  trend: { status: string; strength: string },
  signals: string[],
  risks: string[]
): string {
  const signalCount = signals.length;
  const riskCount = risks.length;

  if (signalCount >= 3 && riskCount <= 1) {
    return '技术面多头信号明确，可考虑分批建仓';
  } else if (riskCount >= 3) {
    return '风险因素较多，建议暂时观望或减仓';
  } else if (trend.status === '上涨趋势') {
    return '趋势向好但信号不够充分，可小仓位试探';
  } else {
    return '技术面中性，建议等待更明确信号';
  }
}

/**
 * 空仓者建议
 */
function generateNoPositionAdvice(signals: string[], risks: string[]): string {
  const signalCount = signals.length;
  const riskCount = risks.length;

  if (signalCount >= 3 && riskCount <= 1) {
    return '可考虑分批建仓，首次30%试探';
  } else if (signalCount > riskCount) {
    return '可小仓位试探，控制在20%以内';
  } else {
    return '暂时观望，等待更好时机';
  }
}

/**
 * 持仓者建议
 */
function generateHasPositionAdvice(
  signals: string[],
  risks: string[],
  changePct: number
): string {
  const riskCount = risks.length;

  if (riskCount >= 3) {
    return '考虑减仓或止盈，控制风险';
  } else if (changePct > 5 && risks.some(r => r.includes('涨幅过大'))) {
    return '涨幅较大，建议部分止盈';
  } else if (signals.length > risks.length) {
    return '继续持有，设置移动止损';
  } else {
    return '维持现有仓位，观察后续走势';
  }
}

/**
 * 计算趋势评分
 */
function calculateTrendScore(
  trend: { status: string; strength: string },
  isBullish: boolean,
  signalCount: number,
  riskCount: number
): number {
  let score = 50;  // 基础分

  // 趋势加分
  if (trend.status === '上涨趋势') {
    score += trend.strength === '强' ? 20 : trend.strength === '中' ? 10 : 5;
  } else if (trend.status === '下跌趋势') {
    score -= trend.strength === '强' ? 20 : trend.strength === '中' ? 10 : 5;
  }

  // 多头排列加分
  if (isBullish) score += 15;

  // 信号和风险
  score += signalCount * 5;
  score -= riskCount * 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * 解读量能状态
 */
function interpretVolumeStatus(volumeStatus: string, changePct: number): string {
  if (volumeStatus.includes('放量') && changePct > 0) {
    return '放量上涨，资金积极介入，买盘强劲';
  } else if (volumeStatus.includes('放量') && changePct < 0) {
    return '放量下跌，抛压较重，需警惕';
  } else if (volumeStatus.includes('缩量') && changePct > 0) {
    return '缩量上涨，上涨动力不足或惜售';
  } else if (volumeStatus.includes('缩量') && changePct < 0) {
    return '缩量下跌，下跌动能减弱';
  } else {
    return '成交正常，无明显异常信号';
  }
}

/**
 * 计算情绪评分
 */
function calculateSentimentScore(
  signals: string[],
  risks: string[],
  trend: { status: string; strength: string }
): number {
  let score = 50;  // 基础分

  // 信号加分
  score += signals.length * 8;

  // 风险减分
  score -= risks.length * 8;

  // 趋势调整
  if (trend.status === '上涨趋势') {
    score += trend.strength === '强' ? 15 : trend.strength === '中' ? 8 : 3;
  } else if (trend.status === '下跌趋势') {
    score -= trend.strength === '强' ? 15 : trend.strength === '中' ? 8 : 3;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * 确定操作建议
 */
function determineOperation(signals: string[], risks: string[]): string {
  const signalCount = signals.length;
  const riskCount = risks.length;

  if (signalCount >= 4 && riskCount <= 1) return '买入';
  if (signalCount >= 3 && riskCount <= 1) return '逢低买入';
  if (riskCount >= 3) return '卖出';
  if (riskCount >= 2 && signalCount <= 1) return '观望';
  return '持有';
}

/**
 * 确定决策类型
 */
function determineDecisionType(signals: string[], risks: string[]): 'buy' | 'hold' | 'sell' {
  const signalCount = signals.length;
  const riskCount = risks.length;

  if (signalCount >= 3 && riskCount <= 1) return 'buy';
  if (riskCount >= 3) return 'sell';
  return 'hold';
}

/**
 * 计算置信度
 */
function calculateConfidence(signals: string[], risks: string[]): '高' | '中' | '低' {
  const totalSignals = signals.length + risks.length;
  const diff = Math.abs(signals.length - risks.length);

  if (totalSignals >= 5 && diff >= 3) return '高';
  if (totalSignals >= 3 && diff >= 2) return '中';
  return '低';
}

// ========== 主分析函数 ==========

/**
 * 综合分析股票（增强版，生成完整Dashboard）
 */
export async function analyzeStock(code: string): Promise<EnhancedAnalysisResult | null> {
  try {
    console.log(`[分析] 开始分析 ${code}...`);

    // Step 1: 获取实时行情
    const quote = await getRealtimeQuote(code);
    if (!quote) {
      console.error(`[分析] 无法获取 ${code} 的实时行情`);
      return null;
    }

    // Step 2: 获取历史 K 线数据
    const klines = await getKLineData(code, 30);
    if (klines.length === 0) {
      console.error(`[分析] 无法获取 ${code} 的历史数据`);
      return null;
    }

    // Step 3: 计算技术指标 (MA5, MA10, MA20)
    const closes = klines.map(k => k.close);
    const ma5 = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const ma10 = closes.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const ma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / 20;

    // Step 4: 趋势分析
    const trend = analyzeTrend(klines);

    // Step 5: 成交量分析
    const volumeStatus = analyzeVolume(klines);

    // Step 6: 生成信号和风险
    const technical = { ma5, ma10, ma20, trend: trend.status, volumeStatus };
    const signals = generateBuySignals(trend, volumeStatus, quote, technical);
    const risks = generateRiskFactors(trend, volumeStatus, quote);

    // Step 7: 计算增强指标
    const biasMA5 = ((quote.price - ma5) / ma5) * 100;
    const biasStatus = Math.abs(biasMA5) < 3 ? '安全' : Math.abs(biasMA5) < 5 ? '警戒' : '危险';

    const isBullish = quote.price > ma5 && ma5 > ma10 && ma10 > ma20;
    const maAlignment = isBullish
      ? 'MA5>MA10>MA20 多头排列'
      : quote.price < ma5 && ma5 < ma10 && ma10 < ma20
      ? 'MA5<MA10<MA20 空头排列'
      : '均线混乱';

    const supportLevel = Math.min(ma5, ma10, ma20);
    const resistanceLevel = Math.max(...klines.slice(-10).map(k => k.high));

    const volumeRatio = calculateVolumeRatio(klines);

    // Step 8: 生成Dashboard结构
    const sniperPoints = generateSniperPoints(quote, technical, supportLevel, resistanceLevel);
    const positionStrategy = generatePositionStrategy(signals, risks, biasMA5);
    const actionChecklist = generateActionChecklist(signals, risks, sniperPoints);

    const dashboard: Dashboard = {
      intelligence: {
        sentiment_summary: generateSentimentSummary(trend, volumeStatus, signals, risks),
        risk_alerts: risks.length > 0 ? risks : undefined,
        positive_catalysts: signals.length > 0 ? signals : undefined,
      },
      core_conclusion: {
        one_sentence: generateOneSentenceConclusion(trend, signals, risks),
        signal_type: determineSignalType(signals, risks),
        time_sensitivity: '本周内',
        position_advice: {
          no_position: generateNoPositionAdvice(signals, risks),
          has_position: generateHasPositionAdvice(signals, risks, quote.changePct),
        },
      },
      data_perspective: {
        trend_status: {
          ma_alignment: maAlignment,
          is_bullish: isBullish,
          trend_score: calculateTrendScore(trend, isBullish, signals.length, risks.length),
        },
        price_position: {
          current_price: quote.price,
          ma5: parseFloat(ma5.toFixed(2)),
          ma10: parseFloat(ma10.toFixed(2)),
          ma20: parseFloat(ma20.toFixed(2)),
          bias_ma5: parseFloat(biasMA5.toFixed(2)),
          bias_status: biasStatus,
          support_level: parseFloat(supportLevel.toFixed(2)),
          resistance_level: parseFloat(resistanceLevel.toFixed(2)),
        },
        volume_analysis: {
          volume_ratio: parseFloat(volumeRatio.toFixed(2)),
          volume_status: volumeStatus,
          turnover_rate: quote.turnoverRate,
          volume_meaning: interpretVolumeStatus(volumeStatus, quote.changePct),
        },
      },
      battle_plan: {
        sniper_points: sniperPoints,
        position_strategy: positionStrategy,
        action_checklist: actionChecklist,
      },
    };

    console.log(`[分析] ${code} ${quote.name} 分析完成`);

    return {
      code,
      name: quote.name,
      sentiment_score: calculateSentimentScore(signals, risks, trend),
      trend_prediction: trend.status,
      operation_advice: determineOperation(signals, risks),
      decision_type: determineDecisionType(signals, risks),
      confidence_level: calculateConfidence(signals, risks),
      dashboard,
      technical: {
        ma5: parseFloat(ma5.toFixed(2)),
        ma10: parseFloat(ma10.toFixed(2)),
        ma20: parseFloat(ma20.toFixed(2)),
        trend: trend.status,
        volumeStatus,
      },
      realtime: {
        price: quote.price,
        changePct: quote.changePct,
        volume: quote.volume,
        turnoverRate: quote.turnoverRate,
      },
      trendAnalysis: {
        status: trend.status,
        strength: trend.strength,
        signals,
        risks,
      },
    };
  } catch (error) {
    console.error(`[分析] ${code} 分析失败:`, error);
    return null;
  }
}

/**
 * 格式化分析结果为文本（保留原有简单格式作为后备）
 */
export function formatAnalysisResult(result: EnhancedAnalysisResult): string {
  const { code, name, realtime, technical, trendAnalysis } = result;

  const changeSymbol = realtime.changePct >= 0 ? '+' : '';
  const trend = realtime.changePct >= 0 ? '[上涨]' : '[下跌]';

  let report = `${trend} ${name} (${code}) - 深度分析报告\n\n`;

  // 实时行情
  report += `【实时行情】\n`;
  report += `最新价: ${realtime.price.toFixed(2)} 元 (${changeSymbol}${realtime.changePct.toFixed(2)}%)\n`;
  report += `成交量: ${(realtime.volume / 10000).toFixed(2)} 万手\n`;
  report += `换手率: ${realtime.turnoverRate.toFixed(2)}%\n\n`;

  // 技术指标
  report += `【技术指标】\n`;
  report += `MA5:  ${technical.ma5.toFixed(2)} 元\n`;
  report += `MA10: ${technical.ma10.toFixed(2)} 元\n`;
  report += `MA20: ${technical.ma20.toFixed(2)} 元\n\n`;

  // 趋势分析
  report += `【趋势分析】\n`;
  report += `趋势状态: ${trendAnalysis.status} (${trendAnalysis.strength})\n`;
  report += `成交量: ${technical.volumeStatus}\n\n`;

  // 买入信号
  if (trendAnalysis.signals.length > 0) {
    report += `【买入信号】\n`;
    trendAnalysis.signals.forEach(signal => {
      report += `${signal}\n`;
    });
    report += '\n';
  }

  // 风险因素
  if (trendAnalysis.risks.length > 0) {
    report += `【风险提示】\n`;
    trendAnalysis.risks.forEach(risk => {
      report += `${risk}\n`;
    });
    report += '\n';
  }

  // 综合建议
  report += `【综合建议】\n`;
  const signalCount = trendAnalysis.signals.length;
  const riskCount = trendAnalysis.risks.length;

  if (signalCount > riskCount && signalCount >= 3) {
    report += `建议: 可以关注 [强烈推荐]\n`;
    report += `该股票具有较多积极信号，技术面较好。\n`;
  } else if (signalCount > riskCount) {
    report += `建议: 谨慎关注 [推荐]\n`;
    report += `该股票具有一定积极信号，但仍需观察。\n`;
  } else if (riskCount > signalCount) {
    report += `建议: 暂时观望 [不推荐]\n`;
    report += `该股票存在较多风险因素，建议等待更好机会。\n`;
  } else {
    report += `建议: 中性 [观望]\n`;
    report += `该股票信号与风险相当，建议结合其他信息判断。\n`;
  }

  return report;
}
