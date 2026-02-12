// ====================================
// Mistakery Backend - PM2 Ecosystem 配置
// 用于进程管理和日志监控
// ====================================

module.exports = {
  apps: [
    {
      name: 'mistakery-backend',
      script: './dist/main.js',
      instances: 1, // 单实例，可使用 'max' 启用集群模式
      exec_mode: 'cluster', // 'fork' 或 'cluster'

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
      },

      // 自动重启配置
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',

      // 日志配置
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // 进程管理
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,

      // 优雅关闭
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // 其他配置
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      pmx: true, // PM2 监控
    },
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/mistakery.git',
      path: '/var/www/mistakery',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': 'apt-get install git',
    },
    staging: {
      user: 'node',
      host: 'your-staging-server-ip',
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/mistakery.git',
      path: '/var/www/mistakery-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env staging',
    },
  },
};
