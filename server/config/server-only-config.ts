import { LinterRules } from "../../shared/system/linter-rules";
import { Timetable } from "../../shared/system/timetable/timetable";
import { GtfsConfig } from "./gtfs-config";
import { PlatformRules } from "./platform-rules";
import { PtvConfig } from "./ptv-config";

/** The config properties used by the server and never sent to the frontend. */
export class ServerOnlyConfig {
  constructor(
    /** Static timetables. */
    readonly timetables: Timetable[],
    /** Static rules for which trains use which platforms. */
    readonly platformRules: PlatformRules,
    /** Configuration for a GTFS data source, if applicable. */
    readonly gtfs: GtfsConfig<true> | GtfsConfig<false> | null,
    /** Configuration for a PTV API data source, if applicable. */
    readonly ptv: PtvConfig | null,
    /** Rules for the linter. */
    readonly linter: LinterRules,
    /**
     * The markdown code for the about page. Stored in server config so it's
     * only sent to the client when the about page is requested.
     */
    readonly aboutMarkdown: string,
  ) {}
}
