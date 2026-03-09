#!/usr/bin/env bash
# 一键构建并部署 H5 到服务器
# 用法：bash deploy/deploy.sh
set -euo pipefail

REMOTE_HOST="ev-inventory"
REMOTE_DIR="/var/www/ev-inventory/dist/h5/"
LOCAL_DIR="dist/build/h5/"

echo "▶ 构建 H5..."
npm run build:h5

echo "▶ 清空服务器旧文件..."
ssh "${REMOTE_HOST}" "rm -rf ${REMOTE_DIR} && mkdir -p ${REMOTE_DIR}"

echo "▶ 上传新文件..."
scp -r "${LOCAL_DIR}." "${REMOTE_HOST}:${REMOTE_DIR}"

echo "✓ 部署完成 → ${REMOTE_HOST}:${REMOTE_DIR}"
