module.exports = {
  apps: [
    {
      name: "asset-management",
      script: "npm",
      args: "start",
      cwd: "/var/www/app/asset-management",
      exec_mode: "fork",
    },
  ],
};
