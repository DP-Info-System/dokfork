#!/bin/bash
set -e

echo "🚀 Installing DPploy (Docker Swarm Mode)..."

# SECTION 1 — CHECK ROOT
if [ "$(id -u)" != "0" ]; then
    echo "This script must be run as root" >&2
    exit 1
fi

# SECTION 2 — SYSTEM CHECKS
echo "📦 Installing system dependencies..."
apt-get update
apt-get install -u -y curl git

# SECTION 3 — INSTALL DOCKER
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# SECTION 4 — CLONE REPOSITORY
REPO_PATH="/opt/dpploy"
if [ -d "$REPO_PATH" ]; then
    echo "📂 Repository exists, pulling latest changes..."
    cd "$REPO_PATH"
    git pull
else
    echo "📂 Cloning repository..."
    git clone https://github.com/DP-Info-System/dokfork.git "$REPO_PATH"
    cd "$REPO_PATH"
fi

# SECTION 5 — IP DETECTION
get_ip() {
    local ip=$(curl -4s --connect-timeout 5 https://ifconfig.io 2>/dev/null)
    if [ -z "$ip" ]; then
        ip=$(curl -4s --connect-timeout 5 https://icanhazip.com 2>/dev/null)
    fi
    echo "$ip"
}
SERVER_IP=$(get_ip)
ADVERTISE_ADDR="${ADVERTISE_ADDR:-$SERVER_IP}"
echo "📡 Using Advertise Address: $ADVERTISE_ADDR"

# SECTION 6 — SWARM INITIALIZATION
if ! docker info | grep -q "Swarm: active"; then
    echo "🐝 Initializing Docker Swarm..."
    docker swarm init --advertise-addr "$ADVERTISE_ADDR"
fi

# SECTION 7 — NETWORKING & SECRETS
echo "🕸️ Setting up overlay network..."
docker network create --driver overlay --attachable dpploy-network 2>/dev/null || true

echo "🔑 Generating secure database credentials..."
generate_random_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}
POSTGRES_PASSWORD=$(generate_random_password)
echo "$POSTGRES_PASSWORD" | docker secret create dpploy_postgres_password - 2>/dev/null || true

# SECTION 8 — BUILD IMAGE
echo "🏗️ Building DPploy image locally (this may take a few minutes)..."
docker build -t dpploy:latest .

# SECTION 9 — DEPLOY SERVICES
echo "🚀 Deploying services to Swarm..."

# Cleanup existing services to avoid conflicts on re-run
docker service rm dpploy-postgres dpploy-redis dpploy 2>/dev/null || true

# Postgres Service
docker service create \
    --name dpploy-postgres \
    --constraint 'node.role==manager' \
    --network dpploy-network \
    --env POSTGRES_USER=dpploy \
    --env POSTGRES_DB=dpploy \
    --secret source=dpploy_postgres_password,target=/run/secrets/postgres_password \
    --env POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password \
    --mount type=volume,source=dpploy-postgres,target=/var/lib/postgresql/data \
    postgres:16-alpine

# Redis Service
docker service create \
    --name dpploy-redis \
    --constraint 'node.role==manager' \
    --network dpploy-network \
    --mount type=volume,source=dpploy-redis,target=/data \
    redis:7-alpine

# DPploy App Service
docker service create \
    --name dpploy \
    --replicas 1 \
    --network dpploy-network \
    --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
    --mount type=bind,source=/etc/dpploy,target=/etc/dpploy \
    --secret source=dpploy_postgres_password,target=/run/secrets/postgres_password \
    --publish published=3000,target=3000,mode=host \
    --constraint 'node.role == manager' \
    -e ADVERTISE_ADDR="$ADVERTISE_ADDR" \
    -e DATABASE_URL="postgres://dpploy:$POSTGRES_PASSWORD@dpploy-postgres:5432/dpploy" \
    dpploy:latest

# Traefik Setup (Single instance via Docker Run for visibility, matches DPPloy logic)
docker rm -f dpploy-traefik 2>/dev/null || true
docker run -d \
    --name dpploy-traefik \
    --restart always \
    --network dpploy-network \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    -p 80:80 \
    -p 443:443 \
    traefik:v3.6.7

# SECTION 10 — FINAL OUTPUT
echo ""
echo "✅ Congratulations! DPploy is installed on Docker Swarm."
echo "🌐 Access your panel at: http://$SERVER_IP:3000"
echo "➡️ Complete your SaaS onboarding in the web UI."
echo ""
