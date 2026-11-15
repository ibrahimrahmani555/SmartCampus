<template>
  <main class="rooms-page">
    <AppHeader />
    <section class="rooms-content" aria-labelledby="rooms-title">
      <div class="rooms-heading">
        <p class="eyebrow">{{ roomsText.title }}</p>
        <h1 id="rooms-title">{{ roomsText.title }}</h1>
        <p class="subtitle">{{ roomsText.subtitle }}</p>
      </div>

      <p v-if="loading" class="state-message" role="status">{{ roomsText.loading }}</p>
      <p v-else-if="errorMessage" class="state-message state-message--error" role="alert">
        {{ errorMessage }}
      </p>
      <p v-else-if="rooms.length === 0" class="state-message">{{ roomsText.empty }}</p>
      <div v-else class="rooms-grid">
        <article v-for="room in rooms" :key="room.id" class="room-card">
          <div class="room-card__topline">
            <span class="room-card__building">{{ room.building }}</span>
            <span v-if="room.floor !== null" class="room-card__floor">{{ roomsText.floor }} {{ room.floor }}</span>
          </div>
          <h2>{{ room.name }}</h2>
          <p class="room-card__capacity">
            {{ roomsText.capacity }} : {{ room.capacity }} {{ roomsText.seats }}
          </p>
          <div class="room-card__equipment">
            <span class="room-card__label">{{ roomsText.equipment }}</span>
            <ul v-if="room.equipment.length > 0">
              <li v-for="equipment in room.equipment" :key="equipment">{{ equipment }}</li>
            </ul>
            <p v-else class="room-card__empty">{{ roomsText.noEquipment }}</p>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppHeader from '../components/AppHeader.vue'
import { roomsText } from '../constants/rooms'
import { listRooms, RoomsRequestError, type Room } from '../services/rooms'

const rooms = ref<Room[]>([])
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    rooms.value = await listRooms()
  } catch (error) {
    errorMessage.value = error instanceof RoomsRequestError ? error.message : roomsText.error
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.rooms-page {
  min-height: 100vh;
  background: var(--cream, #f8f6ed);
  color: var(--green, #173b32);
}

.rooms-content {
  width: min(1120px, calc(100% - 40px));
  margin: 0 auto;
  padding: 48px 0 72px;
}

.rooms-heading {
  max-width: 650px;
  margin-bottom: 34px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--gold, #ad8b3a);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2.2rem, 6vw, 4.5rem);
  line-height: 0.98;
}

.subtitle {
  margin: 18px 0 0;
  color: var(--text-muted, #686b61);
  font-size: 1rem;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 18px;
}

.room-card {
  min-width: 0;
  padding: 22px;
  border: 1px solid var(--border, #dedecf);
  border-radius: 18px;
  background: var(--surface, #fffdf7);
  box-shadow: 0 10px 24px #173b3210;
}

.room-card__topline {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  color: var(--gold, #ad8b3a);
  font-size: 0.75rem;
  font-weight: 700;
}

.room-card__floor {
  color: var(--text-muted, #686b61);
  font-weight: 500;
}

h2 {
  margin: 14px 0 8px;
  font-size: 1.35rem;
  overflow-wrap: anywhere;
}

.room-card__capacity,
.room-card__empty {
  margin: 0;
  color: var(--text-muted, #686b61);
  font-size: 0.9rem;
}

.room-card__equipment {
  margin-top: 20px;
}

.room-card__label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.78rem;
  font-weight: 700;
}

ul {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--green, #173b32);
  color: var(--cream, #f8f6ed);
  font-size: 0.72rem;
}

.state-message {
  padding: 24px;
  border: 1px solid var(--border, #dedecf);
  border-radius: 18px;
  background: var(--surface, #fffdf7);
}

.state-message--error {
  border-color: var(--busy, #b85c52);
  color: var(--busy, #b85c52);
}

@media (max-width: 400px) {
  .rooms-content {
    width: calc(100% - 28px);
    padding-top: 28px;
  }

  .room-card {
    padding: 18px;
  }
}
</style>
