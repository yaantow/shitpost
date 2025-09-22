# Self-Hosted Setup Guide

This guide shows how to deploy your tweet scheduling app on your own server with automatic cron processing.

## 🚀 Deployment Options

### **Option 1: Simple Cron Job (Easiest)**

1. **Deploy your app** to your server
2. **Set up a cron job**:

```bash
# Edit crontab
crontab -e

# Add this line (replace with your actual path and domain)
* * * * * cd /path/to/your/project && curl -X GET "https://yourdomain.com/api/cron/process-tweets" >/dev/null 2>&1
```

3. **Save and exit** - cron will run every minute

### **Option 2: PM2 Process Manager (Recommended for Production)**

1. **Install PM2**:
```bash
npm install -g pm2
```

2. **Update the ecosystem config**:
```javascript
// ecosystem.config.js - Update the paths
module.exports = {
  apps: [
    {
      name: 'shitpost-app',
      script: 'npm',
      args: 'start',
      cwd: '/actual/path/to/your/project', // ← Update this
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'shitpost-cron',
      script: 'scripts/cron-runner.js',
      cwd: '/actual/path/to/your/project', // ← Update this
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
```

3. **Start both processes**:
```bash
# Start the app
pm2 start ecosystem.config.js

# Or start individually
pm2 start npm --name "shitpost-app" -- start 3005
pm2 start scripts/cron-runner.js --name "shitpost-cron"
```

4. **Save PM2 configuration**:
```bash
pm2 save
pm2 startup
```

### **Option 3: Docker with Cron (Advanced)**

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Install cron
RUN apk add --no-cache dcron

# Copy cron script
COPY scripts/cron-runner.js ./
RUN chmod +x scripts/cron-runner.js

# Start both the app and cron
CMD sh -c "npm start & node scripts/cron-runner.js"
```

## 🔧 Configuration

### **Environment Variables**
Make sure these are set on your server:

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Twitter API
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret

# App URL
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### **Nginx Configuration** (if using Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring

### **Check if cron is working**:
```bash
# Check PM2 processes
pm2 status

# Check logs
pm2 logs shitpost-cron

# Check cron job manually
curl -X GET "https://yourdomain.com/api/cron/process-tweets"
```

### **Debug tweets**:
```bash
# Check tweet status
curl -X GET "https://yourdomain.com/api/debug/tweets"

# Reset failed tweets
curl -X POST "https://yourdomain.com/api/debug/tweets" \
  -H "Content-Type: application/json" \
  -d '{"action": "reset-failed"}'
```

## 🛠️ Troubleshooting

### **Common Issues**:

1. **Cron not running**:
   - Check if cron service is running: `systemctl status cron`
   - Check cron logs: `tail -f /var/log/cron`
   - Test cron job manually: `curl -X GET "https://yourdomain.com/api/cron/process-tweets"`

2. **PM2 not starting**:
   - Check PM2 logs: `pm2 logs`
   - Restart PM2: `pm2 restart all`
   - Check if ports are available: `netstat -tulpn | grep :3000`

3. **Database connection issues**:
   - Verify environment variables are set
   - Check Supabase connection
   - Test with: `node scripts/check-tweets.js`

## 🎯 **Recommended Setup**

For production, I recommend **Option 2 (PM2)** because:
- ✅ **Process management** - Auto-restart on crashes
- ✅ **Logging** - Built-in log management
- ✅ **Monitoring** - Easy to check status
- ✅ **Scalable** - Can run multiple instances
- ✅ **Reliable** - Better than simple cron jobs

## 📝 Quick Start Commands

```bash
# 1. Deploy your app
git clone your-repo
cd your-repo
npm install
npm run build

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# 3. Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 4. Check status
pm2 status
pm2 logs shitpost-cron
```

Your tweet scheduling system is now running on your own server! 🎉

