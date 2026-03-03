# Changelog

## v0.1.0 (2026-03-03)

### 新增
- 项目初始化，完成核心功能开发
- **设备识别**：自动检测 USB 连接的 Android 设备，显示型号、品牌、Android 版本
- **应用模糊搜索**：不区分大小写，支持缩写匹配（如 "kb" 匹配 kiwibit），基于 thefuzz 评分排序
- **全量日志采集**：后台持续运行 adb logcat，采集全量日志存入内存缓冲
- **PID 动态过滤**：基于 pidof 追踪应用 PID，每 3 秒刷新，历史 PID 保留，应用重启不丢日志
- **日志级别过滤**：V/D/I/W/E/F 可勾选，带中文说明，默认 Info 及以上
- **日志内搜索**：关键词搜索 + 高亮匹配 + 上下跳转定位
- **系统日志拉取**：手动拉取 system/crash 缓冲区中与应用相关的系统日志，按时间戳拼接
- **一键复制**：复制筛选后的应用日志 或 全量设备日志
- **日志导出**：导出为 .log 文件，支持筛选/全量两种模式
- **虚拟滚动**：基于 react-window 处理大量日志，保持 UI 流畅
- **自动滚动**：默认跟随最新日志，手动滚动时暂停，支持一键回到底部
- **暖棕色调 UI**：继承 Liok 平台设计风格，日志面板暗色背景保护视觉

### 技术栈
- 后端：FastAPI + WebSocket + asyncio
- 前端：React 19 + TypeScript + Vite + Ant Design + Zustand
- 架构：core 模块预留 iOS 扩展接口（DeviceProvider / LogProvider 抽象基类）
