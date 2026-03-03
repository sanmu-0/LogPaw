# LogPaw

Android 实时日志查看工具，面向手动测试场景。

后台持续采集设备全量日志，前端只展示指定应用的筛选日志。不管应用是否崩溃重启、进程 PID 如何变化，都能稳定拿到应用日志并展示。

## 核心功能

- **应用模糊搜索** — 输入关键词即可匹配设备上的应用（不区分大小写，支持缩写匹配，如 "kb" 匹配 kiwibit）
- **应用日志筛选** — 只展示目标应用的日志，基于 PID 动态追踪，应用重启自动适应
- **日志级别过滤** — V/D/I/W/E/F 可勾选，默认显示 Info 及以上
- **日志内搜索** — 关键词搜索 + 高亮 + 上下跳转
- **系统日志拉取** — 手动拉取与应用相关的系统日志，按时间戳拼接展示
- **一键复制** — 复制筛选后的应用日志 或 全量设备日志
- **导出日志** — 导出为 .log 文件下载

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | FastAPI + WebSocket + asyncio |
| 前端 | React + TypeScript + Vite + Ant Design |
| 状态管理 | Zustand |
| 虚拟滚动 | react-window |
| ADB 交互 | asyncio.create_subprocess_exec |
| 模糊匹配 | thefuzz |

## 快速开始

### 前置条件

- Python 3.11+
- Node.js 18+
- ADB (Android Debug Bridge) 已安装且在 PATH 中
- Android 设备通过 USB 连接，已开启 USB 调试

### 启动后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

打开浏览器访问 http://localhost:3000

### 使用流程

1. 连接 Android 设备（USB），确保 `adb devices` 可以看到设备
2. 打开 LogPaw，页面会自动检测设备
3. 在搜索框输入应用关键词，选择目标应用
4. 日志面板开始展示该应用的实时日志
5. 按需过滤级别、搜索关键词、拉取系统日志、复制/导出

## 架构设计

```
全量采集，筛选展示，全量备份
```

- 后台始终运行 `adb logcat`，采集全量日志存入内存
- 前端只展示 PID 匹配的应用日志 + 手动拉取的相关系统日志
- 全量日志在用户主动「复制全量」「导出全量」时使用
- PID 每 3 秒刷新，历史 PID 保留不删除，保证零丢失

## 项目结构

```
LogPaw/
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI 入口
│   │   ├── config.py                  # 配置
│   │   ├── core/                      # 核心引擎（无 Web 依赖）
│   │   │   ├── base.py                # 抽象接口
│   │   │   ├── android/               # Android 实现
│   │   │   │   ├── adb_client.py      # ADB 异步封装
│   │   │   │   ├── device.py          # 设备发现
│   │   │   │   ├── app_finder.py      # 应用模糊匹配
│   │   │   │   ├── log_capture.py     # 全量采集 + PID 过滤
│   │   │   │   └── sys_log.py         # 系统日志拉取
│   │   │   └── ios/                   # 预留
│   │   ├── api/                       # REST API
│   │   └── websocket/                 # WebSocket 日志流
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/LogViewer/           # 主页面
│   │   ├── hooks/                     # React Hooks
│   │   ├── api/                       # API 客户端
│   │   └── styles/                    # 主题
│   └── package.json
└── docs/
    └── changelog.md
```

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/device` | 获取设备信息 |
| GET | `/api/v1/device/apps?q=keyword` | 模糊搜索应用 |
| POST | `/api/v1/logs/system` | 拉取系统日志 |
| GET | `/api/v1/logs/export?type=filtered` | 导出日志文件 |
| GET | `/api/v1/logs/full` | 获取全量日志 |
| WS | `/ws/logs/{package_name}` | 实时日志流 |

## Liok 平台集成

LogPaw 已集成到 Liok 自动化平台，作为内置工具模块：

- 后端模块位于 `Liok-auto-platform/backend/app/logpaw/`
- 前端页面位于 `Liok-auto-platform/frontend/src/pages/LogPaw/`
- API 前缀为 `/api/v1/logpaw/`
- WebSocket 端点为 `/ws/logpaw/{package_name}`
- 侧边栏菜单可直接访问

## 后续规划

- [ ] iOS 设备支持（基于 pymobiledevice3）
- [ ] 自动崩溃检测与标记
