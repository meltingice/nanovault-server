module.exports = {
  apps: [
    {
      name: "nanovault-server",
      script: "index.js",
      instances: 4,
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
};
