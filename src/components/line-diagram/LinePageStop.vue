<script setup lang="ts">
import { getConfig } from "@/utils/get-config";
import { requireStop } from "shared/system/config-utils";
import { computed } from "vue";
import { getStopPageRoute } from "shared/system/config-utils";
import type { LineDiagramStop } from "shared/system/routes/line-routes";
import { useSettings } from "@/settings/settings";

const props = defineProps<{
  stopData: LineDiagramStop<null, null>;
}>();

const stop = computed(() => requireStop(getConfig(), props.stopData.stop));

const { settings } = useSettings();
const developerMode = computed(() => settings.value?.developerMode ?? false);
</script>

<template>
  <div>
    <p>
      <RouterLink
        class="link"
        :class="{ express: stopData.express }"
        :to="getStopPageRoute(getConfig(), stop.id, null, null)"
      >
        {{ stopData.express ? "Skips " : "" }}{{ stop.name }}
      </RouterLink>
    </p>
    <p v-if="developerMode" class="stop-id">
      <code>#{{ stop.id }}</code>
    </p>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/css-template/import" as template;
div {
  @include template.row;
}
.link {
  --color-accent: var(--color-ink-100);
  font-weight: bold;

  &.express {
    --color-accent: var(--color-ink-80);
    font-weight: normal;
    font-size: 0.8rem;
    font-style: italic;
  }
}
.stop-id {
  margin-left: 0.5rem;
}
</style>
