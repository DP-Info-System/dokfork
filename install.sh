#!/bin/bash
set -e

echo "🚀 Installing DPploy..."

# SECTION 4 — CHECK ROOT
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# SECTION 5 — INSTALL DEPENDENCIES
echo "📦 Installing system dependencies..."
apt-get update
apt-get install -y curl git

# Install docker (if not installed)
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# SECTION 6 — INSTALL DOCKER COMPOSE
# If docker compose not available
if ! docker compose version &> /dev/null; then
    echo "🐳 Installing Docker Compose..."
    apt-get update
    apt-get install -y docker-compose
fi

# SECTION 7 — CLONE REPOSITORY
# If folder exists: /opt/dpploy
if [ -d "/opt/dpploy" ]; then
    echo "📂 Repository already exists at /opt/dpploy, pulling latest changes..."
    cd /opt/dpploy
    git pull
else
    echo "📂 Cloning repository..."
    git clone https://github.com/DP-Info-System/dokfork.git /opt/dpploy
    # SECTION 8 — CHANGE DIRECTORY
    cd /opt/dpploy
fi

# SECTION 9 — ENV SETUP
if [ ! -f .env ]; then
    echo "📄 Creating production .env file..."
    echo "DATABASE_URL=postgres://dokploy:dokploypassword@localhost:5432/dokploy" > .env
    echo "PORT=3000" >> .env
    echo "NODE_ENV=production" >> .env
else
    echo "📄 .env file already exists, skipping creation..."
fi

# SECTION 10 — START SERVICES
echo "🚀 Starting services using Docker Compose..."
docker compose up -d

# SECTION 1 — WAIT FOR CONTAINERS
echo "⏳ Waiting for services to start..."
sleep 10

# SECTION 2 — VERIFY CONTAINERS
if [ -z "$(docker ps -q)" ]; then
  echo "❌ Failed to start containers"
  exit 1
fi

# SECTION 3 — GET SERVER IP
SERVER_IP=$(curl -s ifconfig.me)

# SECTION 4 — DETECT PORT
PORT=3000

# SECTION 5 — FINAL OUTPUT
echo ""
echo "✅ DPploy installed successfully!"
echo ""
echo "🌐 Access your panel:"
echo "http://$SERVER_IP:$PORT"
echo ""
echo "➡️ Open this URL in your browser"
echo "➡️ Complete signup and subscription inside UI"
echo ""

# SECTION 6 — OPTIONAL (BETTER UX)
echo "⚠️ If not accessible:"
echo "- Check firewall (port 3000 open)"
echo "- Run: docker ps"
