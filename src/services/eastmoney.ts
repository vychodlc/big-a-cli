/**
 * 东方财富 API 客户端
 * 免费获取 A 股实时行情和历史数据
 */

interface StockQuote {
  code: string;
  name: string;
  price: number;
  changePct: number;
  changeAmount: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  amount: number;
  turnoverRate: number;
}

interface KLineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
  changePct: number;
}

/**
 * 转换股票代码为东财 secid 格式
 * 规则：沪市=1.code, 深市=0.code
 */
function getSecid(code: string): string {
  // 6开头是上海，0/3开头是深圳
  if (code.startsWith('6')) {
    return `1.${code}`;
  } else if (code.startsWith('0') || code.startsWith('3')) {
    return `0.${code}`;
  }
  throw new Error(`不支持的股票代码: ${code}`);
}

/**
 * 获取实时行情
 */
export async function getRealtimeQuote(code: string): Promise<StockQuote | null> {
  try {
    const secid = getSecid(code);

    // 东财实时行情 API
    // f58=股票名称, f107=股票代码, f57=涨跌幅, f43=最新价, f169=涨跌额
    // f170=换手率, f46=最高, f44=最低, f45=今开, f60=成交量, f47=成交额
    const url = `http://push2.eastmoney.com/api/qt/stock/get?` +
      `secid=${secid}&` +
      `fields=f58,f107,f57,f43,f169,f170,f46,f44,f45,f60,f47,f168`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.rc !== 0 || !result.data) {
      return null;
    }

    const data = result.data;

    // 东财 API 返回的价格单位是"分"，需要除以100转换为"元"
    return {
      code: data.f57 || code,
      name: data.f58 || '',
      price: (data.f43 || 0) / 100,
      changePct: (data.f170 || 0) / 100,
      changeAmount: (data.f169 || 0) / 100,
      high: (data.f46 || 0) / 100,
      low: (data.f44 || 0) / 100,
      open: (data.f45 || 0) / 100,
      volume: data.f60 || 0,
      amount: data.f47 || 0,
      turnoverRate: (data.f168 || 0) / 100,
    };
  } catch (error) {
    console.error(`获取 ${code} 实时行情失败:`, error);
    return null;
  }
}

/**
 * 获取历史 K 线数据
 * @param code 股票代码
 * @param days 获取天数（默认30天）
 */
export async function getKLineData(
  code: string,
  days: number = 30
): Promise<KLineData[]> {
  try {
    const secid = getSecid(code);

    // 使用东财公开 API（不同端点）
    const url = `http://push2his.eastmoney.com/api/qt/stock/kline/get?` +
      `secid=${secid}&` +
      `fields1=f1,f2,f3,f4,f5&` +
      `fields2=f51,f52,f53,f54,f55,f56,f57&` +
      `klt=101&` +
      `fqt=1&` +
      `beg=0&` +
      `end=20500101&` +
      `lmt=${days}`;

    const response = await fetch(url);
    const result = await response.json();

    if (result.rc !== 0 || !result.data || !result.data.klines) {
      // 如果获取失败，生成模拟数据用于演示
      console.warn(`获取 ${code} K线数据失败，返回空数组`);
      return [];
    }

    // 解析 K 线数据
    // 格式: "日期,开盘,收盘,最高,最低,成交量,成交额"
    const klines = result.data.klines
      .slice(-days)  // 只取最近的数据
      .map((line: string) => {
        const parts = line.split(',');
        const close = parseFloat(parts[2]);
        const open = parseFloat(parts[1]);

        return {
          date: parts[0],
          open: open,
          close: close,
          high: parseFloat(parts[3]),
          low: parseFloat(parts[4]),
          volume: parseInt(parts[5]),
          amount: parseFloat(parts[6]),
          changePct: open > 0 ? ((close - open) / open * 100) : 0,
        };
      });

    return klines;
  } catch (error) {
    console.error(`获取 ${code} K线数据失败:`, error);
    return [];
  }
}

/**
 * 格式化股票信息为文本
 */
export function formatStockInfo(quote: StockQuote, klines: KLineData[]): string {
  const changeSymbol = quote.changePct >= 0 ? '+' : '';
  const trend = quote.changePct >= 0 ? '📈' : '📉';

  let info = `${trend} ${quote.name} (${quote.code})\n\n`;
  info += `💰 最新价: ${quote.price.toFixed(2)} 元\n`;
  info += `📊 涨跌幅: ${changeSymbol}${quote.changePct.toFixed(2)}% (${changeSymbol}${quote.changeAmount.toFixed(2)})\n`;
  info += `📈 今日最高: ${quote.high.toFixed(2)} 元\n`;
  info += `📉 今日最低: ${quote.low.toFixed(2)} 元\n`;
  info += `🔔 今日开盘: ${quote.open.toFixed(2)} 元\n`;
  info += `💹 换手率: ${quote.turnoverRate.toFixed(2)}%\n`;
  info += `📦 成交量: ${(quote.volume / 10000).toFixed(2)} 万手\n`;
  info += `💵 成交额: ${(quote.amount / 100000000).toFixed(2)} 亿元\n`;

  if (klines.length > 0) {
    const recent = klines.slice(-5);
    info += `\n📅 最近5日走势:\n`;
    recent.forEach(k => {
      const symbol = k.changePct >= 0 ? '↗' : '↘';
      info += `  ${k.date}: ${k.close.toFixed(2)} ${symbol} ${k.changePct >= 0 ? '+' : ''}${k.changePct.toFixed(2)}%\n`;
    });
  }

  return info;
}

/**
 * 搜索股票（简单的代码验证）
 */
export function isValidStockCode(code: string): boolean {
  // A股代码: 6位数字
  // 沪市: 6开头
  // 深市: 0或3开头
  return /^[036]\d{5}$/.test(code);
}
