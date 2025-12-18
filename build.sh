#!/bin/bash

# JSON Formatter Chrome Extension Build Script
# 打包必要的扩展文件为 zip 格式

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="json-formatter-chrome-extension"
VERSION=$(date +%Y%m%d-%H%M%S)
BUILD_DIR="build"
DIST_DIR="${BUILD_DIR}/${PROJECT_NAME}-${VERSION}"

echo -e "${YELLOW}开始构建 Chrome 扩展...${NC}"

# 清理之前的构建
if [ -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}清理之前的构建文件...${NC}"
    rm -rf "$BUILD_DIR"
fi

# 创建构建目录
mkdir -p "$DIST_DIR"

echo -e "${YELLOW}复制必要文件...${NC}"

# 复制核心扩展文件（必需）
if [ -f "manifest.json" ]; then
    cp "manifest.json" "$DIST_DIR/"
    echo -e "${GREEN}✓ manifest.json${NC}"
else
    echo -e "${RED}✗ manifest.json 不存在${NC}"
    exit 1
fi

if [ -f "content.js" ]; then
    cp "content.js" "$DIST_DIR/"
    echo -e "${GREEN}✓ content.js${NC}"
else
    echo -e "${RED}✗ content.js 不存在${NC}"
    exit 1
fi

# 复制说明文档（可选但推荐）
if [ -f "README.md" ]; then
    cp "README.md" "$DIST_DIR/"
    echo -e "${GREEN}✓ README.md (说明文档)${NC}"
fi

# 复制用户指南（可选）
if [ -f "USER_GUIDE.md" ]; then
    cp "USER_GUIDE.md" "$DIST_DIR/"
    echo -e "${GREEN}✓ USER_GUIDE.md (用户指南)${NC}"
fi

# 创建版本信息文件
cat > "$DIST_DIR/VERSION.txt" << EOF
JSON Formatter Chrome Extension
构建时间: $(date '+%Y-%m-%d %H:%M:%S')
版本: ${VERSION}
构建脚本: build.sh

包含文件:
$(ls -la "$DIST_DIR" | grep -E '\.(js|json|md|txt)$' | awk '{print "- " $9 " (" $5 " bytes)"}')
EOF

echo -e "${GREEN}✓ VERSION.txt${NC}"

# 验证必要文件
echo -e "${YELLOW}验证文件完整性...${NC}"

required_files=("manifest.json" "content.js")
for file in "${required_files[@]}"; do
    if [ ! -f "$DIST_DIR/$file" ]; then
        echo -e "${RED}✗ 缺少必要文件: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ 文件验证通过${NC}"

# 创建 zip 包
cd "$BUILD_DIR"
echo -e "${YELLOW}创建 ZIP 压缩包...${NC}"

if command -v zip >/dev/null 2>&1; then
    zip -r "${PROJECT_NAME}-${VERSION}.zip" "${PROJECT_NAME}-${VERSION}/" >/dev/null
    echo -e "${GREEN}✓ ZIP 文件创建成功${NC}"
    
    # 显示文件信息
    zip_file="${PROJECT_NAME}-${VERSION}.zip"
    zip_size=$(du -h "$zip_file" | cut -f1)
    echo -e "${GREEN}压缩包: $zip_file${NC}"
    echo -e "${GREEN}大小: $zip_size${NC}"
    
    # 列出压缩包内容
    echo -e "${YELLOW}压缩包内容:${NC}"
    unzip -l "$zip_file" | grep -E '\.(js|json|md|txt)$' | awk '{print "  " $4 " (" $1 " bytes)"}'
    
else
    echo -e "${RED}✗ zip 命令未找到，请安装 zip 工具${NC}"
    exit 1
fi

# 返回根目录
cd ..

# 显示构建结果
echo -e "${GREEN}构建完成！${NC}"
echo -e "${YELLOW}构建结果:${NC}"
echo -e "  📦 压缩包: ${BUILD_DIR}/${PROJECT_NAME}-${VERSION}.zip"
echo -e "  📁 源文件: ${DIST_DIR}/"
echo -e "  📏 总大小: $(du -sh "$DIST_DIR" | cut -f1)"
echo -e "  🕒 构建时间: $(date '+%Y-%m-%d %H:%M:%S')"

echo -e "\n${YELLOW}安装说明:${NC}"
echo -e "1. 解压缩 ${PROJECT_NAME}-${VERSION}.zip"
echo -e "2. 打开 Chrome 浏览器，访问 chrome://extensions/"
echo -e "3. 启用'开发者模式'"
echo -e "4. 点击'加载已解压的扩展程序'"
echo -e "5. 选择解压后的文件夹"

echo -e "\n${GREEN}构建脚本执行完毕！${NC}"