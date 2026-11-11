<!-- 加減與手動輸入數量，統一處理上下限 -->
<script setup lang="ts">
import { useId } from "vue";

// 支援 v-model，並讓呼叫端依商品庫存設定可購買的上下限。
const props = withDefaults(
  defineProps<{ modelValue: number; min?: number; max?: number }>(),
  { min: 1, max: Infinity },
);
const emit = defineEmits<{ "update:modelValue": [value: number] }>();
const inputId = useId();

// 手動輸入與加減按鈕共用此入口：先轉成整數，再限制於合法範圍。
const update = (value: number) => {
  const next = Math.min(
    Math.max(Math.trunc(value) || props.min, props.min),
    props.max,
  );
  if (next !== props.modelValue) emit("update:modelValue", next);
};
</script>

<template>
  <div class="quantity-control">
    <button
      type="button"
      aria-label="減少數量"
      :disabled="modelValue <= min"
      @click="update(modelValue - 1)"
    >
      −
    </button>
    <label class="sr-only" :for="inputId">數量</label>
    <input
      :id="inputId"
      type="number"
      inputmode="numeric"
      :value="modelValue"
      :min="min"
      :max="max"
      @change="update(Number(($event.target as HTMLInputElement).value))"
    />
    <button
      type="button"
      aria-label="增加數量"
      :disabled="modelValue >= max"
      @click="update(modelValue + 1)"
    >
      +
    </button>
  </div>
</template>

<style scoped>
.quantity-control {
  display: inline-grid;
  grid-template-columns: 2.75rem 3rem 2.75rem;
  align-items: stretch;
  border: 1px solid var(--color-field-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--color-surface);
}
button,
input {
  min-width: 0;
  min-height: 44px;
  border: 0;
  color: var(--color-ink);
  background: transparent;
  text-align: center;
}
button {
  font-size: 1.25rem;
  transition:
    background-color var(--transition),
    opacity var(--transition);
}
button:hover:not(:disabled) {
  background: var(--color-sand);
}
button:disabled {
  opacity: 0.35;
}
input {
  border-inline: 1px solid var(--color-field-border);
  font-variant-numeric: tabular-nums;
}
input::-webkit-inner-spin-button,
input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}
</style>
