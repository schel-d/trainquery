import { type StopID, StopIDJson } from "shared/system/ids";
import { DepartureFilter } from "shared/system/timetable/departure-filter";
import { z } from "zod";
import type { Settings } from "./settings";

export class PinnedWidget {
  constructor(readonly stop: StopID, readonly filter: DepartureFilter) {}

  static readonly json = z
    .object({
      // The "as any" is there to stop a weird error... I tried!
      stop: StopIDJson as any,
      filter: DepartureFilter.json,
    })
    .transform((x) => new PinnedWidget(x.stop, x.filter));

  toJSON(): z.input<typeof PinnedWidget.json> {
    return {
      stop: this.stop,
      filter: this.filter.toJSON(),
    };
  }
}

export function isPinned(
  settings: Settings,
  stop: StopID,
  filter: DepartureFilter
) {
  return settings.pinnedWidgets.some(
    (w) => w.stop == stop && w.filter.equals(filter)
  );
}

export function togglePinnedWidget(
  settings: Settings,
  stop: StopID,
  filter: DepartureFilter
): Settings {
  if (isPinned(settings, stop, filter)) {
    return settings.with({
      pinnedWidgets: settings.pinnedWidgets.filter(
        (w) => w.stop != stop || !w.filter.equals(filter)
      ),
    });
  } else {
    return settings.with({
      pinnedWidgets: [
        ...settings.pinnedWidgets,
        new PinnedWidget(stop, filter),
      ],
    });
  }
}
