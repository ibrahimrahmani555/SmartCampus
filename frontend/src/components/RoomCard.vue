<template>
  <article class="room-card">
    <div class="room-photo">
      <slot />
    </div>
    <div class="room-info">
      <span class="status" :class="available ? 'status--available' : 'status--busy'">
        <i />
        {{ available ? 'Libre' : 'Occupée' }}
      </span>
      <h3>
        {{ name }}
      </h3>
      <p>
        {{ building }} · {{ capacity }} places
      </p>
      <BaseButton variant="outline">
        Réserver
      </BaseButton>
    </div>
  </article>
</template>
<script setup lang="ts">
import BaseButton from './BaseButton.vue';
withDefaults(defineProps<{ name: string;
building: string;
capacity: number;
available?: boolean }>(), { available: true })
</script>
<style scoped>
.room-card {
  display:grid;
  grid-template-columns:112px 1fr;
  align-items:center;
  gap:17px;
  padding:14px;
  border:1px solid #dedecf;
  border-radius:18px;
  background:#fffdf7;
  color:var(--text)
}
.room-photo {
  overflow:hidden;
  border:1px solid var(--gold);
  border-radius:999px;
  aspect-ratio:3/5;
  background:linear-gradient(150deg,#d9d7c8,#86947e)
}
.room-photo :deep(img) {
  width:100%;
  height:100%;
  object-fit:cover
}
.room-info h3 {
  margin:9px 0 2px;
  font-size:25px
}
.room-info p {
  margin:0 0 13px;
  color:#686b61;
  font-size:10px
}
.status {
  display:flex;
  align-items:center;
  gap:6px;
  font-size:9px;
  font-weight:600
}
.status i {
  width:7px;
  height:7px;
  border-radius:50%;
  background:var(--available)
}
.status--busy i {
  background:var(--busy)
}
.room-info :deep(.button) {
  min-height:34px;
  padding-inline:16px;
  font-size:9px
}
</style>
