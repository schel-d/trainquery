<script setup lang="ts">
import { getConfig } from "@/utils/get-config";
import { requireStop } from "shared/system/config-utils";
import { computed } from "vue";
import { getStopPageRoute } from "shared/system/config-utils";
import type { AdditionalServedData } from "./get-diagram-for-service";
import { type LineDiagramStop } from "shared/system/routes/line-routes";
import { formatRelativeTime } from "@/utils/format-qtime";
import { toLocalDateTimeLuxon } from "shared/qtime/luxon-conversions";
import OneLineP from "../common/OneLineP.vue";
import { getPlatformString } from "../departures/helpers/utils";
import { useNow } from "@/utils/now-provider";

const props = defineProps<{
  stopData: LineDiagramStop<AdditionalServedData, null>;
}>();

const now = useNow().local;

const stop = computed(() => requireStop(getConfig(), props.stopData.stop));
const time = computed(() => {
  if (props.stopData.express || props.stopData.data.scheduledTime == null) {
    return null;
  }
  return toLocalDateTimeLuxon(getConfig(), props.stopData.data.scheduledTime);
});
const platformString = computed(() => {
  if (props.stopData.express || props.stopData.data.platform == null) {
    return null;
  }
  return getPlatformString(props.stopData.data.platform, props.stopData.stop);
});
</script>

<template>
  <div class="row">
    <OneLineP class="stop-name" :class="{ express: stopData.express }">
      <RouterLink
        class="link"
        :to="getStopPageRoute(getConfig(), stop.id, null, null)"
        >{{ stopData.express ? "Skips " : "" }}{{ stop.name }}</RouterLink
      >
    </OneLineP>
    <p v-if="time != null" class="dot">•</p>
    <OneLineP v-if="time != null" class="time">
      <RouterLink
        class="link"
        :to="getStopPageRoute(getConfig(), stop.id, time, null)"
        >{{
          formatRelativeTime(time, now, { suppressEarlierToday: true })
        }}</RouterLink
      >
    </OneLineP>
    <div class="platform" v-if="platformString != null">
      <p>Plat.&nbsp;</p>
      <p class="platform-number">{{ platformString }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/css-template/import" as template;
.stop-name {
  --color-accent: var(--color-ink-100);
  font-weight: bold;

  &.express {
    --color-accent: var(--color-ink-80);
    font-weight: normal;
    font-style: italic;
    :deep(p) {
      font-size: 0.8rem;
    }
  }
}
.dot {
  margin: 0 0.4rem;
}
.time {
  --color-accent: var(--color-ink-80);
  min-width: 0;
  flex-shrink: 1;
}
.row {
  @include template.row;
}
.flex-grow {
  @include template.flex-grow;
}
.platform {
  flex-direction: row;
  align-items: baseline;
  margin-left: 1rem;

  // Slightly arbitrary, but this is just to stop platform labels impacting the
  // height of the row.
  margin-top: -0.5rem;
  margin-bottom: -0.5rem;

  padding: 0.2rem 0.4rem;
  justify-items: center;

  border: 2px solid var(--color-ink-20);
  border-radius: 0.25rem;

  :nth-child(1) {
    font-size: 0.6rem;
    font-stretch: semi-condensed;
  }
  .platform-number {
    font-weight: bold;
  }
}
</style>
