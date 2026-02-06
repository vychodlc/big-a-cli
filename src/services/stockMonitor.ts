/**
 * 股票监控服务
 * 提供安全的股票价格波动监控功能
 */

import { getRealtimeQuote, type StockQuote } from './eastmoney.js';
import { exec } from 'child_process';

export interface MonitorConfig {
  stockCode: string;
  thresholds: {
    rise: number;      // 上涨阈值（百分比）
    fall: number;      // 下跌阈值（百分比）
  };
  interval: number;    // 检查间隔（秒）
}

export interface MonitorState {
  isActive: boolean;
  config: MonitorConfig | null;
  lastQuote: StockQuote | null;
  lastCheckTime: Date | null;
  alerts: Alert[];
}

export interface Alert {
  id: string;
  type: 'rise' | 'fall' | 'info';
  message: string;
  timestamp: Date;
  quote: StockQuote;
}

class StockMonitor {
  private state: MonitorState = {
    isActive: false,
    config: null,
    lastQuote: null,
    lastCheckTime: null,
    alerts: []
  };

  private timer: NodeJS.Timeout | null = null;
  private listeners: Set<(state: MonitorState) => void> = new Set();

  /**
   * 添加状态监听器
   */
  subscribe(listener: (state: MonitorState) => void): () => void {
    this.listeners.add(listener);
    // 立即触发一次，让监听器获取当前状态
    listener(this.getState());
    // 返回取消订阅函数
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器
   */
  private notify() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * 获取当前状态
   */
  getState(): MonitorState {
    return { ...this.state };
  }

  /**
   * 获取最近告警
   */
  getRecentAlerts(limit: number = 5): Alert[] {
    // 返回最新的告警（从上往下显示，新的在上面）
    return this.state.alerts.slice(-limit).reverse();
  }

  /**
   * 清空告警历史
   */
  clearAlerts(): void {
    this.state.alerts = [];
    this.notify();
  }

  /**
   * 添加告警
   */
  private addAlert(type: 'rise' | 'fall' | 'info', message: string, quote: StockQuote): void {
    const alert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      quote
    };
    this.state.alerts.push(alert);
    // 只保留最近50条告警
    if (this.state.alerts.length > 50) {
      this.state.alerts = this.state.alerts.slice(-50);
    }
    this.notify();
  }

  /**
   * 发送系统通知
   */
  private sendNotification(title: string, body: string): void {
    try {
      const platform = process.platform;

      if (platform === 'darwin') {
        // macOS 使用 osascript
        exec(`osascript -e 'display notification "${body}" with title "${title}"'`, (error) => {
          if (error) console.error('通知发送失败:', error);
        });
      } else if (platform === 'linux') {
        // Linux 使用 notify-send
        exec(`notify-send "${title}" "${body}"`, (error) => {
          if (error) console.error('通知发送失败:', error);
        });
      }
      // Windows 暂不支持，需要额外依赖
    } catch (error) {
      // 静默失败，不影响监控功能
    }
  }

  /**
   * 检查价格变化并触发告警
   */
  private async checkPrice(): Promise<void> {
    if (!this.state.config) return;

    const quote = await getRealtimeQuote(this.state.config.stockCode);
    if (!quote) return;

    const lastQuote = this.state.lastQuote;
    this.state.lastQuote = quote;
    this.state.lastCheckTime = new Date();

    // 如果有上一次价格，计算变化
    if (lastQuote) {
      const changePct = ((quote.price - lastQuote.price) / lastQuote.price) * 100;
      const dayChangePct = quote.changePct;

      // 检查是否触发上涨告警
      if (changePct >= this.state.config.thresholds.rise) {
        const message = `区间涨 ${changePct.toFixed(2)}%，今日涨 ${dayChangePct >= 0 ? '+' : ''}${dayChangePct.toFixed(2)}%`;
        this.addAlert('rise', message, quote);
        this.sendNotification(`${quote.name} 上涨告警`, message);
      }

      // 检查是否触发下跌告警
      if (changePct <= -this.state.config.thresholds.fall) {
        const message = `区间跌 ${Math.abs(changePct).toFixed(2)}%，今日${dayChangePct >= 0 ? '涨' : '跌'} ${Math.abs(dayChangePct).toFixed(2)}%`;
        this.addAlert('fall', message, quote);
        this.sendNotification(`${quote.name} 下跌告警`, message);
      }

      // 检查当日涨跌幅是否达到阈值（且区间变化未触发告警）
      if (dayChangePct >= this.state.config.thresholds.rise && changePct < this.state.config.thresholds.rise) {
        const message = `区间涨 ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%，今日涨 ${dayChangePct.toFixed(2)}%`;
        this.addAlert('rise', message, quote);
        this.sendNotification(`${quote.name} 涨幅告警`, message);
      }

      if (dayChangePct <= -this.state.config.thresholds.fall && changePct > -this.state.config.thresholds.fall) {
        const message = `区间跌 ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%，今日跌 ${Math.abs(dayChangePct).toFixed(2)}%`;
        this.addAlert('fall', message, quote);
        this.sendNotification(`${quote.name} 跌幅告警`, message);
      }
    } else {
      // 第一次获取价格，记录初始状态
      const message = `监控已启动，初始价格 ${quote.price.toFixed(2)} 元`;
      this.addAlert('info', message, quote);
      this.sendNotification(`${quote.name} 监控启动`, message);
    }

    this.notify();
  }

  /**
   * 启动监控
   */
  async start(config: MonitorConfig): Promise<{ success: boolean; message: string }> {
    if (this.state.isActive) {
      return {
        success: false,
        message: `监控已在运行中，股票: ${this.state.config?.stockCode}`
      };
    }

    // 验证股票代码
    try {
      const quote = await getRealtimeQuote(config.stockCode);
      if (!quote) {
        return {
          success: false,
          message: `无法获取股票 ${config.stockCode} 的数据，请检查代码是否正确`
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `初始化失败: ${error.message}`
      };
    }

    this.state.isActive = true;
    this.state.config = config;
    this.state.lastQuote = null;
    this.state.lastCheckTime = null;
    this.state.alerts = [];

    // 立即执行一次检查
    await this.checkPrice();

    // 启动定时检查
    this.timer = setInterval(() => {
      this.checkPrice().catch(err => {
        console.error('监控检查失败:', err);
      });
    }, config.interval * 1000);

    this.notify();
    return {
      success: true,
      message: `✓ 监控已启动：${config.stockCode}\n` +
             `  - 上涨阈值: ${config.thresholds.rise}%\n` +
             `  - 下跌阈值: ${config.thresholds.fall}%\n` +
             `  - 检查间隔: ${config.interval}秒`
    };
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.state.isActive = false;
    this.state.config = null;
    this.notify();
  }

  /**
   * 获取预设阈值配置
   */
  static getPresetThresholds(): Record<string, { rise: number; fall: number }> {
    return {
      '保守': { rise: 3, fall: 2 },
      '稳健': { rise: 5, fall: 3 },
      '激进': { rise: 8, fall: 5 },
      '高频': { rise: 2, fall: 1 }
    };
  }

  /**
   * 获取预设间隔配置
   */
  static getPresetIntervals(): Record<string, number> {
    return {
      '快速': 30,      // 30秒
      '正常': 60,      // 1分钟
      '节能': 120,     // 2分钟
      '低频': 300      // 5分钟
    };
  }
}

// 导出单例
export const stockMonitor = new StockMonitor();

// 导出类供外部使用静态方法
export { StockMonitor };