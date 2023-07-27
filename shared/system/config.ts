import { z } from "zod";
import {
  FrontendOnlyConfig,
  ServerOnlyConfig,
  SharedConfig,
} from "./config-elements";
import { JsonLoader } from "./populate";

/** The server's config object, which includes the shared properties. */
export class ServerConfig {
  constructor(
    /** Shared config properties. */
    readonly shared: SharedConfig,
    /** Server exclusive config properties. */
    readonly server: ServerOnlyConfig,
    /**
     * Frontend config properties, available here for SSR and to enable
     * distribution to the client.
     */
    readonly frontend: FrontendOnlyConfig
  ) {
    this.shared = shared;
    this.server = server;
    this.frontend = frontend;
  }

  static readonly json = z
    .object({
      shared: SharedConfig.json,
      server: ServerOnlyConfig.json,
      frontend: FrontendOnlyConfig.json,
    })
    .transform((x) => new ServerConfig(x.shared, x.server, x.frontend));

  toJSON(): z.input<typeof ServerConfig.json> {
    return {
      shared: this.shared.toJSON(),
      server: this.server.toJSON(),
      frontend: this.frontend.toJSON(),
    };
  }

  /** Parse from file (some props reference other files instead of providing data). */
  static async fromFile(
    json: unknown,
    loader: JsonLoader
  ): Promise<ServerConfig> {
    const data = z
      .object({
        shared: z.any(),
        server: z.any(),
        frontend: z.any(),
      })
      .parse(json);

    const shared = await SharedConfig.fromFile(data.shared, loader);
    const server = await ServerOnlyConfig.fromFile(data.server, loader);
    const frontend = await FrontendOnlyConfig.fromFile(data.frontend, loader);

    return new ServerConfig(shared, server, frontend);
  }

  forFrontend(): FrontendConfig {
    return new FrontendConfig(this.shared, this.frontend);
  }
}

/** The frontend's config object, which includes the shared properties. */
export class FrontendConfig {
  constructor(
    /** Shared config properties. */
    readonly shared: SharedConfig,
    /** Frontend config properties. */
    readonly frontend: FrontendOnlyConfig
  ) {
    this.shared = shared;
    this.frontend = frontend;
  }

  static readonly json = z
    .object({
      shared: SharedConfig.json,
      frontend: FrontendOnlyConfig.json,
    })
    .transform((x) => new FrontendConfig(x.shared, x.frontend));

  toJSON(): z.input<typeof FrontendConfig.json> {
    return {
      shared: this.shared.toJSON(),
      frontend: this.frontend.toJSON(),
    };
  }
}