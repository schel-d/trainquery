import { z } from "zod";
import {
  PinnedWidget,
  validatePinnedWidgetsAgainstConfig,
} from "./pinned-widgets";
import { type InjectionKey, inject, type Ref, ref } from "vue";
import { SignificantStop } from "./significant-stops";

const settingsV1 = z.object({
  // Note that theme is not stored here. It is a separate localStorage entry so
  // a lightweight script can load it fast.
  version: z.literal("v1"),
  pinnedWidgets: PinnedWidget.json.array(),
  significantStops: SignificantStop.json.array(),
  enableContinuations: z.boolean(),
  limitMapFPS: z.boolean(),
});

const settingsV2 = z.object({
  // Note that theme is not stored here. It is a separate localStorage entry so
  // a lightweight script can load it fast.
  version: z.literal("v2"),
  pinnedWidgets: PinnedWidget.json.array(),
  significantStops: SignificantStop.json.array(),
  enableContinuations: z.boolean(),
  limitMapFPS: z.boolean(),
  developerMode: z.boolean(),
});

function migrateToV2(
  s: z.infer<typeof settingsV1>,
): z.infer<typeof settingsV2> {
  return {
    version: "v2",
    pinnedWidgets: s.pinnedWidgets,
    significantStops: s.significantStops,
    enableContinuations: s.enableContinuations,
    limitMapFPS: s.limitMapFPS,
    developerMode: false,
  };
}

export class Settings {
  constructor(
    readonly pinnedWidgets: PinnedWidget[],
    readonly significantStops: SignificantStop[],
    readonly enableContinuations: boolean,
    readonly limitMapFPS: boolean,
    readonly developerMode: boolean,
  ) {}

  static default = new Settings([], [], false, false, false);

  static json = z
    .union([settingsV1.transform((s) => migrateToV2(s)), settingsV2])
    .transform(
      (x) =>
        new Settings(
          x.pinnedWidgets,
          x.significantStops,
          x.enableContinuations,
          x.limitMapFPS,
          x.developerMode,
        ),
    );

  toJSON(): z.input<typeof settingsV2> {
    return {
      version: "v2",
      pinnedWidgets: this.pinnedWidgets.map((p) => p.toJSON()),
      significantStops: this.significantStops.map((s) => s.toJSON()),
      enableContinuations: this.enableContinuations,
      limitMapFPS: this.limitMapFPS,
      developerMode: this.developerMode,
    };
  }

  with({
    pinnedWidgets,
    significantStops,
    enableContinuations,
    limitMapFPS,
    developerMode,
  }: {
    pinnedWidgets?: PinnedWidget[];
    significantStops?: SignificantStop[];
    enableContinuations?: boolean;
    limitMapFPS?: boolean;
    developerMode?: boolean;
  }) {
    return new Settings(
      pinnedWidgets ?? this.pinnedWidgets,
      significantStops ?? this.significantStops,
      enableContinuations ?? this.enableContinuations,
      limitMapFPS ?? this.limitMapFPS,
      developerMode ?? this.developerMode,
    );
  }

  validateAgainstConfig(logger: (msg: string) => void) {
    return this.with({
      pinnedWidgets: validatePinnedWidgetsAgainstConfig(
        this.pinnedWidgets,
        logger,
      ),
    });
  }
}

export const settingsInjectionKey = Symbol() as InjectionKey<{
  settings: Ref<Settings | null>;
  updateSettings: (newSettings: Settings) => void;
}>;

export function useSettings() {
  return inject(settingsInjectionKey, {
    settings: ref(null),
    updateSettings: () => {
      throw new Error("Update settings not injected correctly.");
    },
  });
}
