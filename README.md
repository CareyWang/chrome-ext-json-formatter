# JSON Formatter（Chrome 扩展）

一个基于 Plasmo 的 Chrome Extension（Manifest V3），用于把浏览器中直接打开的 raw JSON 自动格式化成更易读的视图，并提供折叠、行号、复制等能力。

## 功能

- 自动检测 raw JSON 页面
  - 处理 Chrome 直接展示 JSON 的典型场景（常见为单个 `<pre>`）。
  - 对 `Content-Type` 明确为 JSON 的页面也会尝试格式化。
- 更易读的展示
  - 2 空格缩进（`JSON.stringify(..., null, 2)`）。
  - 轻量语法高亮。
- 折叠 / 展开
  - 对象与数组支持单节点折叠。
  - 快捷按钮：展开全部、折叠全部、折叠 1/2/3 级。
- 行号
  - 展示行号，折叠/展开后会自动更新。
- 一键复制
  - “复制JSON”：复制 2 空格缩进的格式化文本到剪贴板。
- 性能保护
  - 内容脚本在 `document_start` 运行，降低 raw JSON 闪屏。
  - 大 JSON 默认使用纯文本模式，避免大量 DOM 构建卡顿。

## 架构

- `src/content.ts`：Plasmo content script 入口，负责 JSON 页面检测、预隐藏、渲染接管。
- `src/content/*`：content script 的检测逻辑、页面组件和 Shadow DOM 样式。
- `src/json/*`：共享 JSON 解析、格式化和折叠树渲染。
- `src/options.tsx`：Plasmo options page 入口。
- `src/options/*`：手动粘贴格式化页面。
- `src/background.ts`：点击扩展图标时打开 options 页面。
- `assets/`：Plasmo 图标源文件。

## 安装开发版

1. 安装依赖：`pnpm install`
2. 构建扩展：`pnpm build`
3. 打开 Chrome，进入 `chrome://extensions`
4. 开启“开发者模式”
5. 点击“加载已解压的扩展程序”
6. 选择 `build/chrome-mv3-prod`

## 使用方法

安装扩展后，打开任意 raw JSON 页面即可自动生效：页面会短暂显示 Loading，然后渲染格式化后的 JSON（含高亮、行号与折叠）。

### 粘贴格式化页面

1. 打开 `chrome://extensions`，找到本扩展并点击“详情”。
2. 点击“扩展程序选项（Options）”。
3. 在左侧粘贴 JSON 字符串，右侧会自动格式化显示。

### 手工验证

1. 启动本地服务：`python3 -m http.server 8000`
2. 打开 `http://localhost:8000/test.json`
3. 检查：格式化、折叠按钮、行号、“复制JSON”是否正常。
4. 再测试无效 JSON 和普通 HTML 页面，确认不会误格式化。

## 开发与打包

- 开发模式：`pnpm dev`
- 生产构建：`pnpm build`
- 生成 zip：`pnpm package`
- 脚本打包：`bash build.sh`

`pnpm package` 会生成：

- `build/chrome-mv3-prod/`：可直接加载的扩展目录。
- `build/chrome-mv3-prod.zip`：可分发压缩包。

## 权限与隐私

- `host_permissions` 仅包含 `http://*/*` 与 `https://*/*`，用于在访问的页面上运行 content script。
- 扩展不会把数据发送到网络；所有解析与渲染都在本地页面内完成。

## 常见问题

### 本地 `file://` 的 JSON 没生效？

当前默认只匹配 `http://*/*` 与 `https://*/*`。如需处理 `file://`，需要额外调整 content script 匹配范围，并在扩展详情页开启文件访问权限。

### 某些页面没有被格式化？

扩展刻意做了保守检测以避免误伤普通网页：只有判断为 raw JSON 才会接管页面。如果目标页面是 HTML 外壳里包了一段 JSON，则不会自动格式化。
