import { unique } from "@schel-d/js-utils";
import { QDate } from "../../shared/qtime/qdate";
import { QTimetableTime } from "../../shared/qtime/qtime";
import { QWeekdayRange } from "../../shared/qtime/qweekdayrange";
import {
  DirectionID,
  DirectionIDJson,
  LineID,
  LineIDJson,
  RouteVariantID,
  RouteVariantIDJson,
} from "../../shared/system/ids";
import { GtfsParsingReport } from "./gtfs-parsing-report";
import { QUtcDateTime } from "../../shared/qtime/qdatetime";
import { z } from "zod";
import { nowUTCLuxon } from "../../shared/qtime/luxon-conversions";
import { QDayOfWeek } from "../../shared/qtime/qdayofweek";

export class GtfsData {
  constructor(
    readonly calendars: GtfsCalendar[],
    readonly trips: GtfsTrip[],
    readonly configHash: string,
    readonly parsingReport: GtfsParsingReport,
    readonly age: QUtcDateTime,
  ) {}

  static merge(feeds: GtfsData[], subfeedIDs: string[]): GtfsData {
    if (feeds.length < 0) {
      throw new Error("Cannot merge, no feeds provided.");
    }
    if (feeds.length !== subfeedIDs.length) {
      throw new Error("Mismatch between feed count and subfeed ID count.");
    }
    if (!unique(subfeedIDs)) {
      throw new Error("Subfeed IDs must be unique.");
    }
    if (!feeds.every((f) => f.configHash === feeds[0].configHash)) {
      throw new Error("Cannot merge feeds created from differing configs.");
    }

    const calendars = subfeedIDs
      .map((subfeedID, i) =>
        feeds[i].calendars.map((c) => c.withSubfeedID(subfeedID)),
      )
      .flat();
    const trips = subfeedIDs
      .map((subfeedID, i) =>
        feeds[i].trips.map((c) => c.withSubfeedID(subfeedID)),
      )
      .flat();

    const reporting = GtfsParsingReport.merge(
      feeds.map((f) => f.parsingReport),
    );

    // As they say, "a feed is only as old as it's oldest subfeed".
    const age = feeds
      .map((f) => f.age)
      .sort((a, b) => a.asDecimal() - b.asDecimal())[0];

    return new GtfsData(calendars, trips, feeds[0].configHash, reporting, age);
  }

  static readonly metadataJson = z.object({
    configHash: z.string(),
    parsingReport: GtfsParsingReport.json,
    age: QUtcDateTime.json,
  });

  metadataToJSON(): z.input<typeof GtfsData.metadataJson> {
    return {
      configHash: this.configHash,
      parsingReport: this.parsingReport.toJSON(),
      age: this.age.toJSON(),
    };
  }

  isOld(refreshSeconds: number) {
    return this.age.isBeforeOrEqual(nowUTCLuxon().add({ s: -refreshSeconds }));
  }
}

export class GtfsCalendar {
  constructor(
    readonly gtfsCalendarID: string,
    readonly gtfsSubfeedID: string | null,
    readonly wdr: QWeekdayRange,
    readonly start: QDate,
    readonly end: QDate,
    readonly additionalDates: QDate[],
    readonly exceptions: QDate[],
  ) {}

  static readonly json = z
    .object({
      gtfsCalendarID: z.string(),
      gtfsSubfeedID: z.string().nullable(),
      wdr: QWeekdayRange.json,
      start: QDate.json,
      end: QDate.json,
      additionalDates: QDate.json.array(),
      exceptions: QDate.json.array(),
    })
    .transform(
      (x) =>
        new GtfsCalendar(
          x.gtfsCalendarID,
          x.gtfsSubfeedID,
          x.wdr,
          x.start,
          x.end,
          x.additionalDates,
          x.exceptions,
        ),
    );

  withSubfeedID(subfeedID: string): GtfsCalendar {
    return new GtfsCalendar(
      this.gtfsCalendarID,
      subfeedID,
      this.wdr,
      this.start,
      this.end,
      this.additionalDates,
      this.exceptions,
    );
  }

  toJSON(): z.input<typeof GtfsCalendar.json> {
    return {
      gtfsCalendarID: this.gtfsCalendarID,
      gtfsSubfeedID: this.gtfsSubfeedID,
      wdr: this.wdr.toJSON(),
      start: this.start.toJSON(),
      end: this.end.toJSON(),
      additionalDates: this.additionalDates.map((d) => d.toJSON()),
      exceptions: this.exceptions.map((d) => d.toJSON()),
    };
  }

  appliesOn(date: QDate) {
    if (this.exceptions.find((d) => d.equals(date))) {
      return false;
    }
    if (this.additionalDates.find((d) => d.equals(date))) {
      return true;
    }

    const dowIncluded = this.wdr.includes(QDayOfWeek.fromDate(date));
    const withinDates = date.isWithin(this.start, this.end, {
      maxInclusive: true,
    });
    return withinDates && dowIncluded;
  }
}

export type GtfsTripIDPair = {
  gtfsTripID: string;
  gtfsCalendarID: string;
  continuationIndex: number;
};

export class GtfsTrip {
  constructor(
    /**
     * This trip might be multiple duplicated trips from different calendars
     * combined.
     */
    readonly idPairs: GtfsTripIDPair[],
    readonly gtfsSubfeedID: string | null,
    readonly vetoedCalendars: Set<string>,
    readonly line: LineID,
    readonly route: RouteVariantID,
    readonly direction: DirectionID,
    readonly times: (QTimetableTime | null)[],
  ) {}

  static readonly json = z
    .object({
      idPairs: z
        .object({
          gtfsTripID: z.string(),
          gtfsCalendarID: z.string(),
          continuationIndex: z.number(),
        })
        .array(),
      gtfsSubfeedID: z.string().nullable(),
      vetoedCalendars: z.string().array(),
      line: LineIDJson,
      route: RouteVariantIDJson,
      direction: DirectionIDJson,
      times: QTimetableTime.json.nullable().array(),
    })
    .transform(
      (x) =>
        new GtfsTrip(
          x.idPairs,
          x.gtfsSubfeedID,
          new Set(x.vetoedCalendars),
          x.line,
          x.route,
          x.direction,
          x.times,
        ),
    );

  withSubfeedID(subfeedID: string): GtfsTrip {
    return new GtfsTrip(
      this.idPairs,
      subfeedID,
      this.vetoedCalendars,
      this.line,
      this.route,
      this.direction,
      this.times,
    );
  }

  addIDPair(idPair: GtfsTripIDPair): GtfsTrip {
    return this.withIDPairs([...this.idPairs, idPair]);
  }

  withIDPairs(idPairs: GtfsTripIDPair[]): GtfsTrip {
    return new GtfsTrip(
      idPairs,
      this.gtfsSubfeedID,
      this.vetoedCalendars,
      this.line,
      this.route,
      this.direction,
      this.times,
    );
  }

  addVetoedCalendars(vetoedCalendars: string[]): GtfsTrip {
    return new GtfsTrip(
      this.idPairs,
      this.gtfsSubfeedID,
      new Set([...this.vetoedCalendars, ...vetoedCalendars]),
      this.line,
      this.route,
      this.direction,
      this.times,
    );
  }

  toJSON(): z.input<typeof GtfsTrip.json> {
    return {
      idPairs: this.idPairs,
      gtfsSubfeedID: this.gtfsSubfeedID,
      vetoedCalendars: Array.from(this.vetoedCalendars.values()),
      line: this.line,
      route: this.route,
      direction: this.direction,
      times: this.times.map((t) => t?.toJSON() ?? null),
    };
  }

  computeHashKey() {
    return JSON.stringify({
      line: this.line,
      route: this.route,
      direction: this.direction,
      times: this.times.map((t) => t?.toJSON() ?? null),
    });
  }

  requireIDPair(gtfsCalendarID: string): GtfsTripIDPair {
    const pair = this.idPairs.find((p) => p.gtfsCalendarID === gtfsCalendarID);
    if (pair == null) {
      throw new Error(
        `Trip did not have an ID under calendar "${gtfsCalendarID}".`,
      );
    }
    return pair;
  }

  logIDPairs(name: string, log: (message: string) => void) {
    log(name);
    this.idPairs.forEach((p) => {
      log(` -  ${p.gtfsCalendarID}: ${p.gtfsTripID} (${p.continuationIndex})`);
    });
    this.vetoedCalendars.forEach((c) => {
      log(` -  VETOED: ${c}`);
    });
  }

  hasIDPair(gtfsTripID: string, continuationIndex: number) {
    return this.idPairs.some(
      (p) =>
        p.gtfsTripID === gtfsTripID &&
        p.continuationIndex === continuationIndex,
    );
  }

  static oneIs(
    gtfsTripID: string,
    continuationIndex: number,
    ...trips: GtfsTrip[]
  ) {
    return trips.some((t) => t.hasIDPair(gtfsTripID, continuationIndex));
  }
}
