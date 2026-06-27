#!/bin/bash
set -e

DOMAIN="amdaani.v1.admin.amptechnology.in"   # ✅ correct domain
EMAIL="devs.amptechnology@gmail.com"
CERT_PATH="./certbot/conf/live/$DOMAIN/fullchain.pem"

echo "=== Starting SSL setup for $DOMAIN ==="

mkdir -p ./nginx/conf.d
mkdir -p ./certbot/www/.well-known/acme-challenge
mkdir -p ./certbot/conf
chmod -R 755 ./certbot

# ─── Write HTTPS nginx config ──────────────────────────────
write_https_config() {
cat > ./nginx/conf.d/app.conf << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # ✅ API → backend
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # ✅ Everything else → Next.js
    location / {
        proxy_pass http://nextjs-app:4010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF
}

# ─── CASE 1: Cert exists → redeploy ───────────────────────
if [ -f "$CERT_PATH" ]; then
  echo "Certificate already exists — redeploying..."
  write_https_config                          # ✅ always rewrite config
  docker compose up -d --build --remove-orphans
  sleep 5
  docker compose exec nginx nginx -s reload || true
  echo "=== Redeploy complete! https://$DOMAIN ==="
  exit 0
fi

# ─── CASE 2: First time → get cert ────────────────────────
echo "No certificate found — first-time setup..."

# Temp HTTP-only config for ACME challenge
cat > ./nginx/conf.d/app.conf << NGINXEOF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
NGINXEOF

docker compose down || true
docker compose up -d --no-deps nginx
sleep 8

if ! docker ps --format '{{.Names}}' | grep -q 'nginx'; then
  echo "ERROR: nginx failed to start!"
  docker logs nginx
  exit 1
fi

curl -sf http://localhost:80 > /dev/null && echo "Port 80 OK" || {
  echo "ERROR: port 80 not responding"
  exit 1
}

# Request cert
docker run --rm \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  -d "$DOMAIN"

chmod -R 755 ./certbot

if [ ! -f "$CERT_PATH" ]; then
  echo "ERROR: Certificate not found at $CERT_PATH"
  ls -la ./certbot/conf/live/ 2>/dev/null || echo "live/ folder missing"
  exit 1
fi

echo "Certificate obtained!"

# ✅ Write real HTTPS config (no git checkout needed)
write_https_config

docker compose down || true
docker compose up -d --build --remove-orphans
sleep 8
docker compose exec nginx nginx -s reload || true

echo "=== SSL setup complete! https://$DOMAIN ==="