const app = require("./app");
const env = require("./config/env");

app.listen(env.port, () => {
  console.log(`Odoo POS Cafe API running on port ${env.port}`);
});
