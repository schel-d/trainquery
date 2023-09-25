import { parseIntNull } from "@schel-d/js-utils";
import {
  type DirectionID,
  type LineID,
  type PlatformID,
  type ServiceTypeID,
  isDirectionID,
  isLineID,
  isPlatformID,
  isServiceTypeID,
} from "../ids";
import { z } from "zod";

export class DepartureFilter {
  static readonly default = new DepartureFilter(null, null, null, null, false, false);

  constructor(
    readonly lines: LineID[] | null,
    readonly directions: DirectionID[] | null,
    readonly platforms: PlatformID[] | null,
    readonly serviceTypes: ServiceTypeID[] | null,
    readonly arrivals: boolean,
    readonly setDownOnly: boolean
  ) { }

  with({ lines = undefined, directions = undefined, platforms = undefined, serviceTypes = undefined, arrivals = undefined, setDownOnly = undefined }: { lines?: LineID[] | null, directions?: DirectionID[] | null, platforms?: PlatformID[] | null, serviceTypes?: ServiceTypeID[] | null, arrivals?: boolean, setDownOnly?: boolean }): DepartureFilter {
    return new DepartureFilter(
      lines === undefined ? this.lines : lines,
      directions === undefined ? this.directions : directions,
      platforms === undefined ? this.platforms : platforms,
      serviceTypes === undefined ? this.serviceTypes : serviceTypes,
      arrivals === undefined ? this.arrivals : arrivals,
      setDownOnly === undefined ? this.setDownOnly : setDownOnly,
    );
  }

  static json = z.string().transform((x, ctx) => {
    const result = DepartureFilter.parse(x);
    if (result == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Not a departure filter",
      });
      return z.NEVER;
    }
    return result;
  });

  toJSON(): z.input<typeof DepartureFilter.json> {
    return this.asString();
  }

  asString() {
    const filters: string[] = [];
    if (this.lines != null) {
      filters.push(...this.lines.map((l) => `line-${l.toFixed()}`));
    }
    if (this.directions != null) {
      filters.push(...this.directions.map((d) => `direction-${d}`));
    }
    if (this.platforms != null) {
      filters.push(...this.platforms.map((d) => `platform-${d}`));
    }
    if (this.serviceTypes != null) {
      filters.push(...this.serviceTypes.map((d) => `service-${d}`));
    }
    if (this.arrivals) {
      filters.push("arr");
    }
    if (this.setDownOnly) {
      filters.push("sdo");
    }
    return filters.join(" ");
  }

  static parse(input: string): DepartureFilter | null {
    const lines: LineID[] = [];
    const directions: DirectionID[] = [];
    const platforms: PlatformID[] = [];
    const serviceTypes: ServiceTypeID[] = [];
    let arrivals = false;
    let setDownOnly = false;

    for (const term of input.split(" ").filter((f) => f.trim().length != 0)) {
      if (term.startsWith("line-")) {
        const line = parseIntNull(term.replace("line-", ""));
        if (line == null || !isLineID(line)) {
          return null;
        }
        lines.push(line);
      } else if (term.startsWith("direction-")) {
        const direction = term.replace("direction-", "");
        if (!isDirectionID(direction)) {
          return null;
        }
        directions.push(direction);
      } else if (term.startsWith("platform-")) {
        const platform = term.replace("platform-", "");
        if (!isPlatformID(platform)) {
          return null;
        }
        platforms.push(platform);
      } else if (term.startsWith("service-")) {
        const service = term.replace("service-", "");
        if (!isServiceTypeID(service)) {
          return null;
        }
        serviceTypes.push(service);
      } else if (term == "arr") {
        arrivals = true;
      } else if (term == "sdo") {
        setDownOnly = true;
      } else {
        return null;
      }
    }

    return new DepartureFilter(
      lines.length == 0 ? null : lines,
      directions.length == 0 ? null : directions,
      platforms.length == 0 ? null : platforms,
      serviceTypes.length == 0 ? null : serviceTypes,
      arrivals,
      setDownOnly
    );
  }
}
