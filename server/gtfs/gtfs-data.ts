import { unique } from "@schel-d/js-utils";
import { QDate } from "../../shared/qtime/qdate";
import { QTimetableTime } from "../../shared/qtime/qtime";
import { QWeekdayRange } from "../../shared/qtime/qweekdayrange";
import { DirectionID, LineID, RouteVariantID } from "../../shared/system/ids";
import { GtfsParsingReport } from "./gtfs-parsing-report";
import { QUtcDateTime } from "../../shared/qtime/qdatetime";

export class GtfsData {
  constructor(
    readonly calendars: GtfsCalendar[],
    readonly trips: GtfsTrip[],
    readonly parsingReport: GtfsParsingReport,
    readonly age: QUtcDateTime
  ) { }

  static merge(feeds: GtfsData[], subfeedIDs: string[]): GtfsData {
    if (feeds.length != subfeedIDs.length || !unique(subfeedIDs)) {
      throw new Error("Invalid arguments, cannot merge GTFS feeds.");
    }

    const calendars = subfeedIDs
      .map((subfeedID, i) =>
        feeds[i].calendars.map((c) => c.withSubfeedID(subfeedID))
      )
      .flat();
    const trips = subfeedIDs
      .map((subfeedID, i) =>
        feeds[i].trips.map((c) => c.withSubfeedID(subfeedID))
      )
      .flat();

    const reporting = GtfsParsingReport.merge(
      feeds.map((f) => f.parsingReport)
    );

    // As they say, "a feed is only as old as it's oldest subfeed".
    const age = feeds.map(f => f.age).sort((a, b) => a.asDecimal() - b.asDecimal())[0];

    return new GtfsData(calendars, trips, reporting, age);
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
    readonly exceptions: QDate[]
  ) { }

  withSubfeedID(subfeedID: string): GtfsCalendar {
    return new GtfsCalendar(
      this.gtfsCalendarID,
      subfeedID,
      this.wdr,
      this.start,
      this.end,
      this.additionalDates,
      this.exceptions
    );
  }
}

export class GtfsTrip {
  constructor(
    readonly gtfsTripID: string,
    readonly gtfsSubfeedID: string | null,
    readonly gtfsCalendarID: string,
    readonly line: LineID,
    readonly associatedLines: LineID[],
    readonly route: RouteVariantID,
    readonly direction: DirectionID,
    readonly times: (QTimetableTime | null)[]
  ) { }

  withSubfeedID(subfeedID: string): GtfsTrip {
    return new GtfsTrip(
      this.gtfsTripID,
      subfeedID,
      this.gtfsCalendarID,
      this.line,
      this.associatedLines,
      this.route,
      this.direction,
      this.times
    );
  }
}
