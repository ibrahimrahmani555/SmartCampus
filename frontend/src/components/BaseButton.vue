<template>
  <button :type="type" class="button" :class="{ 'button--outline': variant === 'outline' }">
    <slot />
  </button>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'primary' | 'outline';
type?: 'button' | 'submit' }>(), { variant: 'primary', type: 'button' })
</script>
