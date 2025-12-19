# 构建说明

## 使用 build.sh 脚本

本项目包含一个自动化构建脚本 `build.sh`，用于将 Chrome 扩展打包成可分发的 ZIP 文件。

### 运行构建

```bash
./build.sh
```

### 构建过程

1. **清理**：删除之前的构建文件
2. **复制文件**：
   - 必需文件：`manifest.json`、`content.js`、`formatter.html`、`formatter.js`、`formatter.css`
   - 文档文件：`README.md`、`USER_GUIDE.md`
   - 版本信息：`VERSION.txt`
3. **验证**：检查必要文件是否完整
4. **打包**：创建 ZIP 压缩包
5. **输出**：显示构建结果和安装说明

### 输出文件

构建完成后，在 `build/` 目录下生成：

```
build/
├── json-formatter-chrome-extension-YYYYMMDD-HHMMSS/
│   ├── manifest.json           # 扩展配置
│   ├── content.js              # 主要脚本
│   ├── formatter.html          # 选项页面
│   ├── formatter.js            # 选项页面脚本
│   ├── formatter.css           # 选项页面样式
│   ├── README.md               # 项目说明
│   ├── USER_GUIDE.md           # 用户指南
│   └── VERSION.txt             # 版本信息
└── json-formatter-chrome-extension-YYYYMMDD-HHMMSS.zip  # 分发包
```

### 安装扩展

1. 解压缩 ZIP 文件
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择解压后的文件夹

### 脚本特性

- ✅ 自动版本命名（时间戳）
- ✅ 文件完整性验证
- ✅ 彩色输出和进度提示
- ✅ 自动清理和错误处理
- ✅ 详细的构建报告
- ✅ 安装指导说明

### 系统要求

- Unix-like 系统（Linux/macOS）
- `zip` 命令行工具
- Bash shell

### 注意事项

- 脚本会自动排除测试文件（`test.json`）
- 保留所有必要的运行时文件
- 生成带有时间戳的版本目录，确保版本控制