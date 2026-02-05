import React from "react";
import { Box, Text } from "ink";
import { BarChart } from "@pppp606/ink-chart";
import Table from "./Table.js";
import CustomBarChart from "./CustomBarChart.js";
import { EnhancedAnalysisResult } from "../services/stockAnalysis.js";

interface DashboardReportProps {
  result: EnhancedAnalysisResult;
}

export function DashboardReport({ result }: DashboardReportProps) {
  const { dashboard, realtime, name, code } = result;

  // 信号颜色
  const getSignalColor = (advice: string) => {
    if (advice.includes("买入")) return "green";
    if (advice.includes("卖出")) return "red";
    return "yellow";
  };

  const signalColor = getSignalColor(result.operation_advice);

  // 1. 核心结论表
  const conclusionData = [
    { 项目: "操作建议", 内容: result.operation_advice },
    { 项目: "信号类型", 内容: dashboard.core_conclusion.signal_type },
    { 项目: "趋势预测", 内容: result.trend_prediction },
    { 项目: "置信度", 内容: result.confidence_level },
    { 项目: "核心结论", 内容: dashboard.core_conclusion.one_sentence },
  ];

  // 2. 市场情报表
  const intelligenceData = [
    {
      项目: "市场情绪",
      内容: dashboard.intelligence?.sentiment_summary || "-",
    },
    {
      项目: "空仓建议",
      内容: dashboard.core_conclusion.position_advice.no_position,
    },
    {
      项目: "持仓建议",
      内容: dashboard.core_conclusion.position_advice.has_position,
    },
  ];

  if (
    dashboard.intelligence?.risk_alerts &&
    dashboard.intelligence.risk_alerts.length > 0
  ) {
    intelligenceData.push({
      项目: "风险提示",
      内容: dashboard.intelligence.risk_alerts[0],
    });
  }

  // 3. 价格数据图表
  const priceChartData = [
    {
      label: "当前价",
      value: parseFloat(
        dashboard.data_perspective.price_position.current_price.toFixed(2),
      ),
    },
    {
      label: "MA5",
      value: parseFloat(
        dashboard.data_perspective.price_position.ma5.toFixed(2),
      ),
    },
    {
      label: "MA10",
      value: parseFloat(
        dashboard.data_perspective.price_position.ma10.toFixed(2),
      ),
    },
    {
      label: "MA20",
      value: parseFloat(
        dashboard.data_perspective.price_position.ma20.toFixed(2),
      ),
    },
    {
      label: "支撑位",
      value: parseFloat(
        dashboard.data_perspective.price_position.support_level.toFixed(2),
      ),
    },
    {
      label: "压力位",
      value: parseFloat(
        dashboard.data_perspective.price_position.resistance_level.toFixed(2),
      ),
    },
  ];

  // 4. 趋势与量能表
  const trendVolumeData = [
    {
      类别: "趋势",
      指标: "均线排列",
      数值: dashboard.data_perspective.trend_status.is_bullish
        ? "多头排列"
        : "空头排列",
    },
    {
      类别: "趋势",
      指标: "趋势强度",
      数值: `${dashboard.data_perspective.trend_status.trend_score}/100`,
    },
    {
      类别: "量能",
      指标: "量比",
      数值: `${dashboard.data_perspective.volume_analysis.volume_ratio.toFixed(2)} (${dashboard.data_perspective.volume_analysis.volume_status})`,
    },
    {
      类别: "量能",
      指标: "换手率",
      数值: `${dashboard.data_perspective.volume_analysis.turnover_rate.toFixed(2)}%`,
    },
    {
      类别: "量能",
      指标: "涨跌幅",
      数值: `${realtime.changePct >= 0 ? "+" : ""}${realtime.changePct.toFixed(2)}%`,
    },
  ];

  // 5. 狙击点位图表
  const sniperChartData = [
    {
      label: "理想买入",
      value: parseFloat(dashboard.battle_plan.sniper_points.ideal_buy),
      color: "green",
    },
    {
      label: "次优买入",
      value: parseFloat(dashboard.battle_plan.sniper_points.secondary_buy),
      color: "cyan",
    },
    {
      label: "止损位",
      value: parseFloat(dashboard.battle_plan.sniper_points.stop_loss),
      color: "red",
    },
    {
      label: "目标位",
      value: parseFloat(dashboard.battle_plan.sniper_points.take_profit),
      color: "yellow",
    },
  ];

  // 6. 仓位策略图表数据
  const positionChartData = [
    { label: "建议仓位", value: 30, color: "#4aaa1a" },
    { label: "风险控制", value: 20, color: "#d89612" },
    { label: "观望比例", value: 50, color: "#a61d24" },
  ];

  // 7. 行动清单表
  const checklistData = dashboard.battle_plan.action_checklist
    .slice(0, 6)
    .map((item, idx) => {
      const hasWarning = item.includes("注意") || item.includes("风险");
      return {
        内容: hasWarning ? "[!]" : "[√]" + item,
      };
    });

  return (
    <Box flexDirection="column">
      {/* 标题 */}
      <Box
        borderStyle="round"
        borderColor={signalColor}
        paddingX={2}
        paddingY={1}
      >
        <Text bold color={signalColor}>
          {name} ({code}) - {result.operation_advice} - 综合评分:{" "}
          {result.sentiment_score}/100
        </Text>
      </Box>

      <Box
        borderStyle="round"
        borderColor={signalColor}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
      >
        {/* 第一行：3列 */}
        <Box flexDirection="row">
          {/* 左列：核心结论 */}
          <Box flexDirection="column" width="33%">
            <Text bold color="cyan">
              【核心结论】
            </Text>
            <Table data={conclusionData} />
          </Box>

          {/* 中列：市场情报 */}
          <Box flexDirection="column" width="33%" marginLeft={1}>
            <Text bold color="blue">
              【市场情报】
            </Text>
            <Table data={intelligenceData} />
          </Box>

          {/* 右列：价格数据 */}
          <Box flexDirection="column" width="34%" marginLeft={1}>
            <Text bold color="yellow">
              【价格数据】
            </Text>
            <Box flexDirection="column">
              <CustomBarChart
                data={priceChartData}
                width={30}
                labelWidth={8}
                showValue={true}
              />
              <Box>
                <Text>
                  乖离率:{" "}
                  {dashboard.data_perspective.price_position.bias_ma5.toFixed(
                    2,
                  )}
                  % [{dashboard.data_perspective.price_position.bias_status}]
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* 第二行：3列 */}
        <Box marginTop={1} flexDirection="row">
          {/* 左列：趋势与量能 */}
          <Box flexDirection="column" width="33%">
            <Text bold color="magenta">
              【趋势量能】
            </Text>
            <Table data={trendVolumeData} />
          </Box>

          {/* 中列：狙击点位 */}
          <Box flexDirection="column" width="33%" marginLeft={1}>
            <Text bold color="green">
              【狙击点位】
            </Text>
            <Box>
              <CustomBarChart
                data={sniperChartData}
                width={30}
                labelWidth={10}
                showValue={true}
              />
            </Box>
          </Box>

          {/* 右列：仓位策略 */}
          <Box flexDirection="column" width="34%" marginLeft={1}>
            <Text bold color="magenta">
              【仓位策略】
            </Text>
            <Box flexDirection="column">
              <BarChart
                data={[
                  { label: "建议仓位", value: 30 },
                  { label: "风险控制", value: 20 },
                  { label: "观望比例", value: 50 },
                ]}
                showValue="right"
                width={40}
                barChar="▓"
                format={(v) => `${v}%`}
              />
            </Box>
            <Box flexDirection="column">
              <Text>
                入场策略: {dashboard.battle_plan.position_strategy.entry_plan}
              </Text>
              <Text>
                风控策略: {dashboard.battle_plan.position_strategy.risk_control}
              </Text>
            </Box>
          </Box>
        </Box>

        {/* 行动清单（全宽） */}
        <Box marginTop={1}>
          <Text bold color="cyan">
            【行动清单】
          </Text>
        </Box>
        <Table data={checklistData} />

        {/* 页脚 */}
        <Box marginTop={1}>
          <Text dimColor>生成时间: {new Date().toLocaleString("zh-CN")}</Text>
        </Box>
      </Box>
    </Box>
  );
}
