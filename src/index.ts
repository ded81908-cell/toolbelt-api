import { buildServer } from "./server.js";
import { loadConfig } from "./config.js";

const config = loadConfig();

const app = await buildServer(config);

try {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`Toolbelt API listening on http://${config.host}:${config.port}`);
  app.log.info(`Docs at http://${config.host}:${config.port}/docs`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
