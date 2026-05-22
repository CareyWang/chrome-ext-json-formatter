# 构建说明

本项目使用 Plasmo 和 pnpm 构建 Chrome MV3 扩展。

## 环境要求

- Node.js 18+
- pnpm 11+

## 安装依赖

```bash
pnpm install
```

## 开发构建

```bash
pnpm dev
```

## 生产构建

```bash
pnpm build
```

输出目录：

```text
build/chrome-mv3-prod/
```

这个目录可以在 `chrome://extensions` 中通过“加载已解压的扩展程序”直接加载。

## 打包 ZIP

```bash
pnpm package
```

或使用脚本：

```bash
bash build.sh
```

输出文件：

```text
build/chrome-mv3-prod.zip
```

## 构建内容

Plasmo 会根据以下入口自动生成 manifest 和产物：

- `src/content.ts`
- `src/options.tsx`
- `src/background.ts`
- `assets/icon.png`

最终 manifest 会包含 content script、options page、background service worker、图标和 HTTP/HTTPS host permissions。
