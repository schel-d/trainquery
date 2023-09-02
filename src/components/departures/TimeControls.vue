<script setup lang="ts">
import { ref } from "vue";
import NumberWheel from "../common/NumberWheel.vue";
import { posMod } from "@schel-d/js-utils";
import Picker from "../common/Picker.vue";
import SimpleButton from "../common/SimpleButton.vue";

const hours = ref(7);
const minutes = ref(10);
const ampm = ref("am");
</script>

<template>
  <div class="time-controls">
    <h5>Set departure time</h5>
    <SimpleButton
      :content="{ text: 'Now', icon: 'uil:clock' }"
      theme="filled-neutral"
      class="now"
      layout="traditional-wide"
    ></SimpleButton>
    <div class="time">
      <NumberWheel
        v-model="hours"
        :next="(c) => posMod(c, 12) + 1"
        :prev="(c) => posMod(c - 2, 12) + 1"
        :stringify="(c) => c.toFixed()"
      ></NumberWheel>
      <p class="time-colon">:</p>
      <NumberWheel
        v-model="minutes"
        :next="(c) => posMod(c + 1, 60)"
        :prev="(c) => posMod(c - 1, 60)"
        :stringify="(c) => c.toFixed().padStart(2, '0')"
      ></NumberWheel>
      <Picker
        class="ampm-picker"
        group="ampm"
        :options="['am', 'pm']"
        :keyify="(x) => x"
        v-model="ampm"
        theme="subtle"
      >
        <template v-slot="slotProps">
          <p>{{ slotProps.data.toUpperCase() }}</p>
        </template>
      </Picker>
    </div>
    <SimpleButton
      :content="{ text: 'Set', icon: 'uil:check' }"
      theme="filled"
      class="submit"
      layout="traditional-wide"
    ></SimpleButton>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/css-template/import" as template;
.time-controls {
  padding: 1rem;
}
h5,
h6 {
  font-weight: bold;
  color: var(--color-ink-100);
}
h5 {
  font-size: 1rem;
  margin-bottom: 1rem;
}
h6 {
  margin-bottom: 0.5rem;
}
.time {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  align-items: center;
  border-top: 1px solid var(--color-ink-20);
  border-bottom: 1px solid var(--color-ink-20);
  margin-bottom: 1rem;
}
.time-colon {
  font-size: 2.5rem;
  font-weight: bold;
}
.ampm-picker {
  :deep(.content) {
    @include template.content-text;
    padding: 0.5rem 1rem;
    p {
      font-weight: bold;
      font-size: 1rem;
    }
  }
}
.now {
  align-self: flex-start;
  margin-bottom: 1rem;
}
.submit {
  align-self: flex-end;
}
</style>