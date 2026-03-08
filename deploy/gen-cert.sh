#!/usr/bin/env bash
# 生成自签名 SSL 证书（用于备案前临时 HTTPS）
# 用法：bash deploy/gen-cert.sh <服务器公网IP或域名>
# 示例：bash deploy/gen-cert.sh 123.123.123.123

set -euo pipefail

CN="${1:-ev-inventory.sdd.asia}"               # 第一个参数为 IP 或域名
DEST="/etc/nginx/ssl"
DAYS=825                                        # 证书有效期（天）

echo "→ 创建目录 $DEST"
mkdir -p "$DEST"

# 判断 CN 是否为 IP（简单正则）
if [[ "$CN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    SAN="IP:$CN"
else
    SAN="DNS:$CN"
fi

echo "→ 生成私钥和证书 (CN=$CN, SAN=$SAN, 有效期 ${DAYS}天)"
openssl req -x509 \
    -newkey rsa:2048 \
    -keyout "$DEST/ev-inventory.key" \
    -out    "$DEST/ev-inventory.crt" \
    -days   "$DAYS" \
    -nodes \
    -subj   "/CN=$CN" \
    -addext "subjectAltName=$SAN"

chmod 600 "$DEST/ev-inventory.key"
chmod 644 "$DEST/ev-inventory.crt"

echo ""
echo "✓ 证书已生成："
echo "  证书: $DEST/ev-inventory.crt"
echo "  私钥: $DEST/ev-inventory.key"
echo ""
echo "→ 重载 nginx："
echo "  nginx -t && systemctl reload nginx"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "备案通过后切换 Let's Encrypt 正式证书："
echo "  apt install certbot python3-certbot-nginx   # Ubuntu/Debian"
echo "  certbot --nginx -d ev-inventory.sdd.asia"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
