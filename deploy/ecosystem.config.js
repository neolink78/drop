// PM2 process definitions for the dropshipping store.
// Backend (Express API) on port 4100, frontend (Next.js) on port 3100,
// to avoid clashing with other apps already using 4000/3000 on this VPS.
//
// Usage (from the project root on the VPS):
//   pm2 start deploy/ecosystem.config.js
//   pm2 save
//   pm2 startup   # then run the printed command once, to survive reboots

module.exports = {
  apps: [
    {
      name: 'drop-backend',
      cwd: './functions',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: '4100',
      },
    },
    {
      name: 'drop-frontend',
      cwd: './',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: '3100',
      },
    },
  ],
};
