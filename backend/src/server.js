process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

async function startServer() {
  try {
    const [{ default: app }, { default: env }] = await Promise.all([
      import("./app.js"),
      import("./config/env.js"),
    ]);

    const server = app.listen(env.port, () => {
      console.log(`Odoo POS Cafe API running on port ${env.port}`);
    });

    server.on("error", (error) => {
      console.error("HTTP server error:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Fatal startup error:", error);
    process.exit(1);
  }
}

void startServer();
