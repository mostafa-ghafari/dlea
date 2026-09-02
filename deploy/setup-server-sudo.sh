#!/bin/bash
# Run this ONCE on the server with sudo to enable automatic deploys
# Usage: sudo bash deploy/setup-server-sudo.sh
echo "Granting ghafari passwordless sudo for deploy commands..."
cat > /etc/sudoers.d/dlea-deploy << 'SUDOERS'
ghafari ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx, /bin/systemctl restart nginx, /bin/systemctl status nginx
SUDOERS
chmod 440 /etc/sudoers.d/dlea-deploy
echo "Done! ghafari can now run nginx commands without password."
