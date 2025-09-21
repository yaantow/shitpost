module.exports = {
  apps: [
    {
      name: 'shitpost-app',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/your/project',
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
      cwd: '/path/to/your/project',
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

