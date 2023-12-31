import express, { Express } from "express";
import path from "path";
import { createSsrServer } from "vite-ssr/dev";
import { ConfigProvider, TrainQuery, trainQuery } from "./trainquery";
import { OnlineConfigProvider } from "./config/online-config-provider";
import { ExpressServer } from "./express-server";
import { ConsoleLogger } from "./console-logger";
import { parseIntThrow } from "@schel-d/js-utils";
import "dotenv/config";
import { OfflineConfigProvider } from "./config/offline-config-provider";
import { ssrAppPropsApi } from "./api/ssr-props-api";
import { TrainQueryDB } from "./trainquery-db";
import { createSitemapXml } from "./sitemap-xml";

createServer();

async function createServer() {
  const isProd = process.env.NODE_ENV === "production";
  const isOffline = process.argv.includes("offline");
  const useOfflineData =
    process.argv.includes("offline-data") ||
    process.argv.includes("data-offline");
  const port = process.env.PORT ?? "3000";

  const serveFrontend = async (ctx: TrainQuery, app: Express) => {
    if (isProd) {
      await setupProdServer(ctx, app);
    } else {
      await setupDevServer(ctx, app);
    }
  };

  await trainQuery(
    () => new ExpressServer(parseIntThrow(port), serveFrontend),
    getConfigProvider(isOffline || useOfflineData),
    getDatabase(isOffline),
    new ConsoleLogger(),
    isOffline,
    isProd,
  );
}

function getConfigProvider(useOfflineData: boolean): ConfigProvider {
  const canonicalUrl = requireEnv("URL");
  if (useOfflineData) {
    const zipOrFolderPath = requireEnv("CONFIG_OFFLINE");
    return new OfflineConfigProvider(zipOrFolderPath, canonicalUrl);
  } else {
    const configUrl = requireEnv("CONFIG");
    return new OnlineConfigProvider(configUrl, canonicalUrl);
  }
}

function getDatabase(isOffline: boolean): TrainQueryDB | null {
  if (isOffline) {
    return null;
  }

  const domain = process.env.MONGO_DOMAIN;
  if (domain == null) {
    return null;
  }
  const username = requireEnv("MONGO_USERNAME");
  const password = requireEnv("MONGO_PASSWORD");
  return new TrainQueryDB(domain, username, password);
}

async function setupDevServer(ctx: TrainQuery, app: Express) {
  serveSitemapXml(app, ctx);

  // Create vite-ssr server in middleware mode.
  const viteServer = await createSsrServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(viteServer.middlewares);
}

async function setupProdServer(ctx: TrainQuery, app: Express) {
  serveSitemapXml(app, ctx);

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
      request: req,
      response: res,
      initialState: { props: await ssrAppPropsApi(ctx) },
    });

    res.type("html");
    res.writeHead(status || 200, statusText || headers, headers);
    res.end(html);
  });
}

function requireEnv(variable: string): string {
  const value = process.env[variable];
  if (value == null) {
    throw new Error(`"${variable}" environment variable not provided.`);
  }
  return value;
}

function serveSitemapXml(app: Express, ctx: TrainQuery) {
  app.get("/sitemap.xml", (_req, res) => {
    const xml = createSitemapXml(ctx.getConfig());
    res.set("Content-Type", "text/xml").send(xml);
  });
}
