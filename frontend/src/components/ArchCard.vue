<template>
  <article class="arch-card">
    <div class="arch-card__image">
      <slot />
    </div>
    <div class="arch-card__text">
      <h3>
        {{ title }}
      </h3>
      <p>
        {{ subtitle }}
      </p>
    </div>
  </article>
</template>
<script setup lang="ts">
defineProps<{ title: string;
subtitle: string }>()
</script>
<style scoped>
.arch-card {
  min-width:0;
  color:inherit
}
.arch-card__image {
  overflow:hidden;
  border:1px solid var(--gold);
  border-radius:999px;
  aspect-ratio:3/5;
  background:linear-gradient(145deg,#d8d7c9,#87947f)
}
.arch-card__image :deep(img) {
  width:100%;
  height:100%;
  object-fit:cover
}
.arch-card__text {
  padding:15px 3px
}
.arch-card h3 {
  margin:0 0 5px;
  font:500 24px var(--font-display)
}
.arch-card p {
  margin:0;
  font-size:10px;
  opacity:.78
}
</style>
