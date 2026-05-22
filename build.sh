#!/bin/bash

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${YELLOW}开始构建 Plasmo Chrome 扩展...${NC}"

mkdir -p build
pnpm build
pnpm package

echo -e "${GREEN}构建完成！${NC}"
echo -e "${YELLOW}构建结果:${NC}"
if [ -d "build/chrome-mv3-prod" ]; then
    echo "build/chrome-mv3-prod"
fi

if [ -f "build/chrome-mv3-prod.zip" ]; then
    echo "build/chrome-mv3-prod.zip"
fi

echo -e "\n${YELLOW}安装说明:${NC}"
echo -e "1. 打开 Chrome 浏览器，访问 chrome://extensions/"
echo -e "2. 启用'开发者模式'"
echo -e "3. 点击'加载已解压的扩展程序'"
echo -e "4. 选择 build/chrome-mv3-prod 目录"
echo -e "5. 如需商店上传，使用 build 目录下生成的 zip 文件"

echo -e "\n${GREEN}构建脚本执行完毕！${NC}"
