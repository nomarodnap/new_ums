module.exports = {
  apps: [
    {
      name: "new_ums",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: "3", // สามารถเปลี่ยนเป็น 1 หรือจำนวน core ที่ต้องการได้
      exec_mode: "cluster", // ใช้ cluster mode เพื่อรองรับ load ได้ดีขึ้น
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
      // env_production: {
      //   NODE_ENV: "production",
      //   PORT: 3002,
      // }
    },
  ],
};
