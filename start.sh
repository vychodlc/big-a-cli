#!/bin/bash
# 启动 Chat CLI

# 确保在真实的终端环境中运行
if [ ! -t 0 ]; then
    echo "错误：请在真实的终端中运行此程序"
    echo "使用方法：npm run dev"
    exit 1
fi

# 启动应用
npm run dev
