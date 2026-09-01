#!/bin/bash
set -e

echo "Dlea Server Setup Script"
echo "========================"

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Install Python 3.12
apt install -y python3.12 python3.12-venv python3-pip

# Install Docker
apt install -y docker.io docker-compose-plugin
systemctl enable docker
systemctl start docker
usermod -aG docker ghafari

# Install Nginx
apt install -y nginx
systemctl enable nginx

# Install certbot
apt install -y certbot python3-certbot-nginx

# Create directories
mkdir -p /opt/dlea/shared /opt/dlea/releases
chown -R ghafari:ghafari /opt/dlea

# Copy deploy files to shared
cp /opt/dlea/current/deploy/dlea-backend.service /etc/systemd/system/
cp /opt/dlea/current/deploy/dlea-frontend.service /etc/systemd/system/
systemctl daemon-reload

# Copy nginx config
cp /opt/dlea/current/deploy/nginx-dlea.conf /etc/nginx/sites-available/dlea
ln -sf /etc/nginx/sites-available/dlea /etc/nginx/sites-enabled/dlea
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "Server setup complete!"
