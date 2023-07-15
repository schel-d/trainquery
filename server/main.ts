import express, { Express } from "express";
import path from "path";
import { createSsrServer } from "vite-ssr/dev";

createServer();

async function createServer() {
  const app = express();

  const isProd = process.env.NODE_ENV == "production";
  if (isProd) {
    await setupProdServer(app);
  }
  else {
    await setupDevServer(app);
  }

  const port = 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

async function setupDevServer(app: Express) {
  // Create vite-ssr server in middleware mode.
  const viteServer = await createSsrServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(viteServer.middlewares);
}

async function setupProdServer(app: Express) {
  const dist = `../dist`;

  // Serve static assets.
  const { ssr } = require(`${dist}/server/package.json`);
  for (const asset of ssr.assets || []) {
    const serverEndpoint = "/" + asset;
    const distFolderPath = path.join(__dirname, `${dist}/client/` + asset);
    app.use(serverEndpoint, express.static(distFolderPath));
  }

  // Render the pages, as generated by vite-ssr.
  const manifest = require(`${dist}/client/ssr-manifest.json`);
  const renderPage = (await import(`${dist}/server/main.js`)).default.default;
  app.get("*", async (req, res) => {
    const url = req.protocol + "://" + req.get("host") + req.originalUrl;

    const { html, status, statusText, headers } = await renderPage(url, {
      manifest,
      preload: true,
      // Anything passed here will be available in the main hook
      request: req,
      response: res,
      // initialState: { ... } // <- This would also be available
    });

    res.type("html");
    res.writeHead(status || 200, statusText || headers, headers);
    res.end(html);
  });
}
