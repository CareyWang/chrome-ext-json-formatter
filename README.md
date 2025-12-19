# JSON Formatter（Chrome 扩展）

一个“零构建（no-build）”的 Chrome Extension（Manifest V3），用于把浏览器中直接打开的 raw JSON 自动格式化成更易读的视图，并提供折叠、行号、复制等能力。

## 功能

- 自动检测 raw JSON 页面
  - 优先处理“Chrome 直接展示 JSON”的典型场景（常见为单个 `<pre>`）。
  - 对 `Content-Type` 明确为 JSON 的页面也会尝试格式化，降低误判普通 HTML 的概率。
- 更易读的展示
  - 2 空格缩进（`JSON.stringify(..., null, 2)`）。
  - 轻量语法高亮（不依赖第三方脚本）。
- 折叠 / 展开
  - 对象与数组支持单节点折叠。
  - 快捷按钮：展开全部、折叠全部、折叠 1/2/3 级。
- 行号
  - 展示行号，折叠/展开后会自动更新。
- 一键复制
  - “复制JSON”：复制 2 空格缩进的格式化文本到剪贴板。
- 性能优化（减少闪屏/卡顿）
  - 尽早介入页面（`run_at: document_start`）降低“先看到原始 JSON 再替换”的闪屏。
  - 解析与渲染前先展示轻量 Loading。
  - 大 JSON 默认使用“纯文本模式”（更快）；需要折叠时可手动切换“启用折叠（较慢）”。

## 如何工作

1. 内容脚本 `content.js` 在页面开始阶段运行（MV3 content script）。
2. 判断页面是否是 raw JSON（单 `<pre>` 或 JSON `Content-Type`）。
3. `JSON.parse` 成功后，使用 Shadow DOM 渲染 UI，避免污染页面样式并更 CSP 友好。
4. 折叠/行号/复制等交互均通过事件监听实现（不使用字符串 `onclick` 注入）。

## 安装

1. 下载此项目的代码库或将其克隆到本地计算机。
2. 打开 Chrome 浏览器，导航到 `chrome://extensions`。
3. 确保右上角的 "开发者模式 (Developer mode)" 开关已启用。
4. 点击 "加载已解压的扩展程序 (Load unpacked)" 按钮。
5. 在文件选择对话框中，选择包含此项目文件（例如 `manifest.json` 所在的目录）的文件夹。
6. 扩展程序 "JSON Formatter" 现在应该已安装并处于活动状态。

## 使用方法

安装扩展程序后，打开任意 raw JSON 页面即可自动生效：页面会短暂显示 Loading，然后渲染格式化后的 JSON（含高亮、行号与折叠）。

说明：
- 为避免极大 JSON 导致卡顿，超过上限会提示并跳过格式化。
- 对于较大的 JSON，会默认走“纯文本模式”（更快），并提供“启用折叠（较慢）”按钮手动切换到折叠模式。

### 粘贴格式化页面

新增一个独立页面用于手动粘贴 JSON：

1. 打开 `chrome://extensions` → 找到本扩展 → 点击“详情”。
2. 点击“扩展程序选项（Options）”，会打开独立页面。
3. 在左侧粘贴 JSON 字符串，右侧自动格式化显示。

### 折叠功能使用

1. **控制按钮**：位于 JSON 主体卡片右上角（卡片内部）。
   - **展开全部**：展开所有折叠层级
   - **折叠全部**：折叠所有对象与数组
   - **折叠1级/2级/3级**：按层级深度折叠

2. **单节点折叠**：点击对象/数组前的 `-` 折叠该层级；点击 `+` 展开

3. **折叠状态显示**: 
   - 折叠的对象会显示 `... X 属性`
   - 折叠的数组会显示 `... X 项`

这些功能特别适用于查看大型 JSON 文件，可以帮助您快速定位和理解 JSON 结构。

## 权限与隐私

- `host_permissions: <all_urls>`：用于在你访问的页面上运行 content script，从而检测/格式化 raw JSON。
- 扩展不会把数据发送到网络；所有解析与渲染都在本地页面内完成。

## 手工验证

1. 打开 `chrome://extensions`，开启开发者模式，加载本目录为“已解压的扩展程序”。
2. 启动本地服务：`python3 -m http.server 8000`，打开 `http://localhost:8000/test.json`。
3. 检查：格式化/折叠按钮/行号/“复制JSON”是否正常；再测试一个无效 JSON，确认不会误格式化普通页面。

## 开发与调试

- 本项目无 npm / webpack / build 步骤，直接编辑 `content.js` / `manifest.json`。
- 修改代码后，在 `chrome://extensions` 页面点击该扩展卡片的“刷新”按钮，然后重新打开目标 JSON 页面。
- 调试日志：打开 DevTools Console，可看到 `JSON Formatter Content Script Loaded...` 等输出。

## 常见问题

### 1) 本地 `file://` 的 `test.json` 没生效？

在 `chrome://extensions` 打开该扩展的详情页，开启 “Allow access to file URLs / 允许访问文件网址”。

### 2) 某些页面没有被格式化？

本扩展刻意做了“保守检测”以避免误伤普通网页：只有判断为 raw JSON 才会接管页面；如果目标页面是 HTML 外壳里包了一段 JSON（不是 raw JSON），则不会自动格式化。
