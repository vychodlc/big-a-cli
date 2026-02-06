import React, { useState, useEffect, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import figlet from "figlet";
import {
  getRealtimeQuote,
  getKLineData,
  isValidStockCode,
} from "./services/eastmoney.js";
import { StockInfo } from "./components/StockInfo.js";
import {
  analyzeStock,
  formatAnalysisResult,
} from "./services/stockAnalysis.js";
import { formatDashboardReport } from "./services/reportFormatter.js";
import { DashboardReport } from "./components/DashboardReport.js";
import { StockMonitor as StockMonitorComponent } from "./components/StockMonitor.js";
import { MonitorSetup } from "./components/MonitorSetup.js";
import {
  stockMonitor,
  StockMonitor as StockMonitorClass,
} from "./services/stockMonitor.js";
import { stdout } from "process";

interface AppProps {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface Message {
  role: "user" | "assistant";
  content: string | React.ReactNode;
  type?: "text" | "component";
}

const COMMANDS = [
  "help",
  "clear",
  "stock",
  "analyze",
  "monitor",
];

// 消息渲染组件（使用 memo 避免不必要的重渲染）
const MessageItem = React.memo(
  ({ msg, idx }: { msg: Message; idx: number }) => {
    // 组件类型消息
    if (msg.type === "component") {
      return (
        <Box key={idx} flexDirection="column" marginY={1}>
          <Text bold color="blue" dimColor>
            AI:
          </Text>
          {msg.content as React.ReactNode}
        </Box>
      );
    }

    // 普通文本消息
    return (
      <Box key={idx} marginY={0}>
        <Text bold color={msg.role === "user" ? "green" : "blue"}>
          {msg.role === "user" ? "你" : "AI"}:
        </Text>
        <Text> {msg.content as string}</Text>
      </Box>
    );
  },
);

MessageItem.displayName = "MessageItem";

function App({ apiKey, baseUrl, model }: AppProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "你好！我是 AI 助手。输入消息开始对话，或输入 /help 查看可用命令。",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // 历史消息记录
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 监控状态
  const [monitorActive, setMonitorActive] = useState(false);
  const [showMonitorSetup, setShowMonitorSetup] = useState(false);

  // 获取终端宽度
  const terminalWidth = stdout.columns || 80;

  // 生成 figlet 大字
  const bigTitle = useMemo(() => {
    return figlet.textSync("HERE IS BIG A", {
      font: "ANSI Shadow",
      horizontalLayout: "default",
      verticalLayout: "default",
    });
  }, []);

  // Get command suggestions
  const getCommandSuggestions = (): string[] => {
    if (!input.startsWith("/")) return [];
    const query = input.slice(1).toLowerCase();
    if (!query) return COMMANDS;
    return COMMANDS.filter((cmd) => cmd.startsWith(query));
  };

  // 订阅监控状态变化
  useEffect(() => {
    const unsubscribe = stockMonitor.subscribe((state) => {
      setMonitorActive(state.isActive);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // 处理监控设置完成
  const handleMonitorSetupComplete = async (config: {
    stockCode: string;
    thresholds: { rise: number; fall: number };
    interval: number;
  }) => {
    setShowMonitorSetup(false);

    const result = await stockMonitor.start({
      stockCode: config.stockCode,
      thresholds: config.thresholds,
      interval: config.interval,
    });

    if (result.success) {
      setMonitorActive(true);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.message,
          type: "text",
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.message,
          type: "text",
        },
      ]);
    }
  };

  // 处理监控设置取消
  const handleMonitorSetupCancel = () => {
    setShowMonitorSetup(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "已取消监控设置",
        type: "text",
      },
    ]);
  };

  useInput((inputChar, key) => {
    // 监控设置模式下，禁用主输入
    if (showMonitorSetup || isLoading) return;

    if (key.return) {
      handleSubmit();
    } else if (key.upArrow) {
      // 方向键上：向前浏览历史
      if (
        messageHistory.length > 0 &&
        historyIndex < messageHistory.length - 1
      ) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(messageHistory[messageHistory.length - 1 - newIndex]);
      }
    } else if (key.downArrow) {
      // 方向键下：向后浏览历史
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(messageHistory[messageHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        // 回到当前输入（清空）
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
      setHistoryIndex(-1); // 编辑时退出历史浏览
    } else if (key.tab && input.startsWith("/")) {
      // Tab completion for commands
      const suggestions = getCommandSuggestions();
      if (suggestions.length === 1) {
        setInput("/" + suggestions[0]);
      }
    } else if (!key.ctrl && !key.meta && !key.tab && inputChar) {
      setInput((prev) => prev + inputChar);
      setHistoryIndex(-1); // 输入时退出历史浏览
    }
  });

  const handleCommand = async (cmd: string): Promise<boolean> => {
    const parts = cmd.slice(1).split(" ");
    const command = parts[0].toLowerCase();

    switch (command) {
      case "help":
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `可用命令：
  /help           - 显示此帮助信息
  /clear          - 清空聊天历史
  /stock <代码>   - 查询股票行情 (如: /stock 600519)
  /analyze <代码> - 深度分析股票 (如: /analyze 600519)
  /monitor        - 交互式设置股票监控
  /monitor stop   - 停止监控
  /monitor status - 查看监控状态`,
          },
        ]);
        return true;

      case "clear":
        setMessages([{ role: "assistant", content: "聊天历史已清空。" }]);
        return true;

      case "stock":
        const stockCode = parts[1];
        if (!stockCode) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "请输入股票代码，例如: /stock 600519",
            },
          ]);
          return true;
        }

        if (!isValidStockCode(stockCode)) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `无效的股票代码: ${stockCode}\nA股代码格式：6位数字（如 600519、000001、300750）`,
            },
          ]);
          return true;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `正在查询 ${stockCode}...`,
          },
        ]);

        try {
          const [quote, klines] = await Promise.all([
            getRealtimeQuote(stockCode),
            getKLineData(stockCode, 30),
          ]);

          if (!quote) {
            setMessages((prev) => [
              ...prev.slice(0, -1),
              {
                role: "assistant",
                content: `无法获取 ${stockCode} 的行情数据，请检查代码是否正确。`,
                type: "text",
              },
            ]);
            return true;
          }

          setMessages((prev) => [
            ...prev.slice(0, -1),
            {
              role: "assistant",
              content: <StockInfo quote={quote} klines={klines} />,
              type: "component",
            },
          ]);
        } catch (error: any) {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            {
              role: "assistant",
              content: `查询失败: ${error.message}`,
              type: "text",
            },
          ]);
        }
        return true;

      case "analyze":
        const analyzeCode = parts[1];
        if (!analyzeCode) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "请输入股票代码，例如: /analyze 600519",
              type: "text",
            },
          ]);
          return true;
        }

        if (!isValidStockCode(analyzeCode)) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `无效的股票代码: ${analyzeCode}\nA股代码格式：6位数字（如 600519、000001、300750）`,
              type: "text",
            },
          ]);
          return true;
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `正在深度分析 ${analyzeCode}，请稍候...`,
            type: "text",
          },
        ]);

        try {
          const analysisResult = await analyzeStock(analyzeCode);

          if (!analysisResult) {
            setMessages((prev) => [
              ...prev.slice(0, -1),
              {
                role: "assistant",
                content: `无法分析 ${analyzeCode}，请检查代码是否正确或稍后重试。`,
                type: "text",
              },
            ]);
            return true;
          }

          // 使用新的React组件Dashboard
          setMessages((prev) => [
            ...prev.slice(0, -1),
            {
              role: "assistant",
              content: <DashboardReport result={analysisResult} />,
              type: "component",
            },
          ]);
        } catch (error: any) {
          setMessages((prev) => [
            ...prev.slice(0, -1),
            {
              role: "assistant",
              content: `分析失败: ${error.message}`,
              type: "text",
            },
          ]);
        }
        return true;

      case "monitor":
        const monitorAction = parts[1];

        // 停止监控
        if (monitorAction === "stop" || monitorAction === "停止") {
          stockMonitor.stop();
          setMonitorActive(false);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "🔕 监控已停止",
              type: "text",
            },
          ]);
          return true;
        }

        // 查看监控状态
        if (monitorAction === "status" || monitorAction === "状态") {
          const state = stockMonitor.getState();
          if (!state.isActive) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: "监控未启动",
                type: "text",
              },
            ]);
          } else {
            const alerts = stockMonitor.getRecentAlerts(5);
            let statusMsg = `📊 监控状态\n`;
            statusMsg += `股票: ${state.config?.stockCode}\n`;
            statusMsg += `阈值: 上涨 ${state.config?.thresholds.rise}% / 下跌 ${state.config?.thresholds.fall}%\n`;
            statusMsg += `间隔: ${state.config?.interval}秒\n`;
            statusMsg += `上次更新: ${state.lastCheckTime?.toLocaleTimeString("zh-CN") || "--"}\n`;
            if (alerts.length > 0) {
              statusMsg += `\n最近告警:\n`;
              alerts.forEach((alert) => {
                statusMsg += `[${alert.timestamp.toLocaleTimeString("zh-CN")}] ${alert.message}\n`;
              });
            }
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: statusMsg,
                type: "text",
              },
            ]);
          }
          return true;
        }

        // 显示交互式设置界面
        setShowMonitorSetup(true);
        return true;

      default:
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `未知命令: ${command}。输入 /help 查看可用命令。`,
          },
        ]);
        return true;
    }
  };

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage = trimmed;
    setInput("");

    // 保存到历史记录
    setMessageHistory((prev) => [...prev, userMessage]);
    setHistoryIndex(-1); // 重置历史索引

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Handle commands
    if (userMessage.startsWith("/")) {
      await handleCommand(userMessage);
      return;
    }

    // Handle AI chat
    setIsLoading(true);
    setStreamingContent("");

    try {
      const client = createOpenAI({
        apiKey,
        baseURL: baseUrl,
      });

      const { textStream } = await streamText({
        // @ts-ignore
        model: client(model),
        messages: [
          {
            role: "system",
            content:
              "你是一个友好、乐于助人的 AI 助手。用简洁、清晰的方式回答问题。",
          },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        maxTokens: 2000,
      });

      let fullText = "";
      let buffer = "";
      let lastUpdate = Date.now();

      for await (const chunk of textStream) {
        fullText += chunk;
        buffer += chunk;

        // Batch updates every 100ms
        const now = Date.now();
        if (now - lastUpdate > 100) {
          setStreamingContent(fullText);
          buffer = "";
          lastUpdate = now;
        }
      }

      // Final update
      setStreamingContent("");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fullText },
      ]);
    } catch (error: any) {
      setStreamingContent("");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `错误: ${error.message || "无法连接到 AI 服务"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Figlet 大标题 */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="red">
          Welcome back!
        </Text>

        <Box marginTop={2} justifyContent="center">
          <Text color="red">{bigTitle}</Text>
        </Box>
      </Box>

      <Box
        borderStyle="round"
        borderColor="red"
        flexDirection="column"
        paddingX={1}
      >
        <Text bold color="red">
          按 Enter 发送消息 | /help 查看命令
        </Text>
        {monitorActive && <Text color="yellow"> [监控中]</Text>}
      </Box>

      <Box flexDirection="column" marginTop={1} marginBottom={1}>
        {messages.map((msg, idx) => (
          <MessageItem key={idx} msg={msg} idx={idx} />
        ))}
        {streamingContent && (
          <Box>
            <Text bold color="blue">
              AI:
            </Text>
            <Text> {streamingContent}</Text>
          </Box>
        )}
      </Box>

      {/* 监控设置界面 */}
      {showMonitorSetup && (
        <Box marginTop={1}>
          <MonitorSetup
            onComplete={handleMonitorSetupComplete}
            onCancel={handleMonitorSetupCancel}
          />
        </Box>
      )}

      {/* 监控显示面板 */}
      {monitorActive && !showMonitorSetup && (
        <Box marginTop={1}>
          <StockMonitorComponent />
        </Box>
      )}

      {/* 输入框 - 仅在非设置模式下显示 */}
      {!showMonitorSetup && (
        <Box flexDirection="column">
          <Box borderStyle="single" borderColor="gray">
            <Text color={isLoading ? "gray" : "white"}>
              {isLoading ? "思考中..." : `> ${input}│`}
            </Text>
          </Box>

          {input.startsWith("/") && getCommandSuggestions().length > 0 && (
            <Box marginTop={0} paddingLeft={1}>
              <Text dimColor>
                Tab 补全:{" "}
                {getCommandSuggestions()
                  .map((cmd) => `/${cmd}`)
                  .join("  ")}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export default App;
