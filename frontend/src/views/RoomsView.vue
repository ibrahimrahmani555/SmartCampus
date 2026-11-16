<template>
  <main class="rooms-page">
    <AppSidebar />
    <div class="rooms-main">
      
      <section class="rooms-content" aria-labelledby="rooms-title">
        <div class="rooms-heading">
          <p class="eyebrow">{{ roomsText.title }}</p>
          <h1 id="rooms-title">{{ roomsText.title }}</h1>
          <p class="subtitle">{{ roomsText.subtitle }}</p>
        </div>

        <form class="availability-form" @submit.prevent="loadAvailability">
          <label>
            {{ availabilityText.date }}
            <input v-model="availabilityDate" type="date" required />
          </label>
          <label>
            {{ availabilityText.start }}
            <input v-model="availabilityStart" type="time" required />
          </label>
          <label>
            {{ availabilityText.end }}
            <input v-model="availabilityEnd" type="time" required />
          </label>
          <button type="submit">{{ availabilityText.check }}</button>
        </form>

        <form class="room-filters" @submit.prevent="applyFilters">
          <label>
            {{ filtersText.building }}
            <select v-model="building">
              <option value="">{{ filtersText.allBuildings }}</option>
              <option v-for="option in buildingOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
          <label>
            {{ filtersText.minCapacity }}
            <input v-model="minCapacity" type="number" min="1" step="1" :placeholder="filtersText.minCapacityPlaceholder" />
          </label>
          <fieldset>
            <legend>{{ filtersText.equipment }}</legend>
            <label v-for="option in equipmentOptions" :key="option" class="equipment-option">
              <input v-model="selectedEquipment" type="checkbox" :value="option" />
              {{ option }}
            </label>
          </fieldset>
          <div class="filter-actions">
            <button type="submit">{{ filtersText.apply }}</button>
            <button type="button" class="filter-reset" @click="resetFilters">{{ filtersText.reset }}</button>
          </div>
        </form>

        <p v-if="loading" class="state-message" role="status">{{ roomsText.loading }}</p>
        <p v-else-if="errorMessage" class="state-message state-message--error" role="alert">
          {{ errorMessage }}
        </p>
        <p v-else-if="rooms.length === 0" class="state-message">{{ filtersText.noResults }}</p>
        <div v-else class="rooms-grid">
          <article v-for="room in rooms" :key="room.id" class="room-card">
            <div class="room-card__image">
              <img v-if="room.image_url" :src="room.image_url" :alt="room.name" loading="lazy" />
              <span v-else aria-hidden="true"></span>
            </div>
            <div class="room-card__topline">
              <span class="room-card__building">{{ room.building }}</span>
              <span v-if="room.floor !== null" class="room-card__floor">{{ roomsText.floor }} {{ room.floor }}</span>
            </div>
            <h2>{{ room.name }}</h2>
            <span class="availability-badge" :class="`availability-badge--${room.status}`">
              {{ availabilityText.status[room.status] }}
            </span>
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
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
import { roomsText } from '../constants/rooms'
import { getRoomAvailability, listRooms, RoomsRequestError, type Room, type RoomAvailabilityStatus } from '../services/rooms'

const filtersText = {
  building: 'Bâtiment',
  allBuildings: 'Tous les bâtiments',
  minCapacity: 'Capacité minimale',
  minCapacityPlaceholder: 'Ex. 30',
  equipment: 'Équipements',
  apply: 'Filtrer',
  reset: 'Réinitialiser',
  noResults: 'Aucune salle trouvée',
} as const
const availabilityText = {
  date: 'Date',
  start: 'Heure de début',
  end: 'Heure de fin',
  check: 'Vérifier la disponibilité',
  status: {
    free: 'Libre',
    occupied: 'Occupée',
    closed: 'Fermée',
  },
} as const
const buildingOptions = ['Bâtiment A', 'Bâtiment B']
const equipmentOptions = ['wifi', 'projecteur', 'tableau', 'prises', 'visioconférence']
const route = useRoute()
const router = useRouter()
const rooms = ref<Array<Room & { status: RoomAvailabilityStatus }>>([])
const loading = ref(true)
const errorMessage = ref('')
const building = ref('')
const minCapacity = ref('')
const selectedEquipment = ref<string[]>([])
const availabilityDate = ref(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(new Date()))
const availabilityStart = ref('08:00')
const availabilityEnd = ref('10:00')

function readFiltersFromUrl() {
  building.value = typeof route.query.building === 'string' ? route.query.building : ''
  minCapacity.value = typeof route.query.minCapacity === 'string' ? route.query.minCapacity : ''
  const equipmentQuery = route.query.equipment
  selectedEquipment.value = Array.isArray(equipmentQuery)
    ? equipmentQuery.filter((value): value is string => typeof value === 'string')
    : typeof equipmentQuery === 'string'
      ? [equipmentQuery]
      : []
}

async function loadRooms() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [filteredRooms, availability] = await Promise.all([
      listRooms({
      building: building.value || undefined,
      minCapacity: minCapacity.value ? Number(minCapacity.value) : undefined,
      equipment: selectedEquipment.value,
      }),
      getRoomAvailability(availabilityDate.value, availabilityStart.value, availabilityEnd.value),
    ])
    const statusByRoomId = new Map(availability.map((room) => [room.id, room.status]))
    rooms.value = filteredRooms.map((room) => ({
      ...room,
      status: statusByRoomId.get(room.id) ?? 'free',
    }))
  } catch (error) {
    errorMessage.value = error instanceof RoomsRequestError ? error.message : roomsText.error
  } finally {
    loading.value = false
  }
}

async function loadAvailability() {
  await loadRooms()
}

async function applyFilters() {
  const query: Record<string, string | string[]> = {}
  if (building.value) query.building = building.value
  if (minCapacity.value) query.minCapacity = minCapacity.value
  if (selectedEquipment.value.length > 0) query.equipment = selectedEquipment.value
  await router.replace({ query })
  await loadRooms()
}

async function resetFilters() {
  building.value = ''
  minCapacity.value = ''
  selectedEquipment.value = []
  await router.replace({ query: {} })
  await loadRooms()
}

onMounted(() => {
  readFiltersFromUrl()
  void loadRooms()
})
</script>

<style scoped>
.rooms-page {
  display: flex;
  min-height: 100vh;
  background: var(--cream, #f8f6ed);
  color: var(--green, #173b32);
}

.rooms-main {
  flex: 1;
  min-width: 0;
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

.availability-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(140px, 1fr)) auto;
  align-items: end;
  gap: 12px;
  margin-bottom: 18px;
  padding: 18px;
  border: 1px solid var(--border, #dedecf);
  border-radius: 18px;
  background: var(--surface, #fffdf7);
}

.availability-form label {
  color: var(--text-muted, #686b61);
  font-size: 0.78rem;
  font-weight: 700;
}

.availability-form input {
  display: block;
  width: 100%;
  min-height: 38px;
  margin-top: 7px;
  padding: 8px 10px;
  border: 1px solid var(--border, #dedecf);
  border-radius: 9px;
  background: var(--cream, #f8f6ed);
  color: var(--green, #173b32);
  font: inherit;
}

.availability-form button {
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid var(--green, #173b32);
  border-radius: 9px;
  background: var(--green, #173b32);
  color: var(--cream, #f8f6ed);
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
}

.room-filters {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(150px, 1fr) minmax(240px, 2fr) auto;
  align-items: end;
  gap: 16px;
  margin-bottom: 30px;
  padding: 18px;
  border: 1px solid var(--border, #dedecf);
  border-radius: 18px;
  background: var(--surface, #fffdf7);
}

.room-filters label,
.room-filters legend {
  color: var(--text-muted, #686b61);
  font-size: 0.78rem;
  font-weight: 700;
}

.room-filters select,
.room-filters input[type='number'] {
  display: block;
  width: 100%;
  min-height: 38px;
  margin-top: 7px;
  padding: 8px 10px;
  border: 1px solid var(--border, #dedecf);
  border-radius: 9px;
  background: var(--cream, #f8f6ed);
  color: var(--green, #173b32);
  font: inherit;
}

.room-filters fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.room-filters fieldset legend {
  width: 100%;
  margin-bottom: 3px;
}

.equipment-option {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem !important;
  font-weight: 500 !important;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-actions button {
  flex: 1;
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid var(--green, #173b32);
  border-radius: 9px;
  background: var(--green, #173b32);
  color: var(--cream, #f8f6ed);
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
}

.filter-actions .filter-reset {
  border-color: var(--gold, #ad8b3a);
  background: transparent;
  color: var(--green, #173b32);
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

.room-card__image {
  height: 150px;
  margin: -22px -22px 18px;
  overflow: hidden;
  border-radius: 18px 18px 0 0;
  background: linear-gradient(150deg, #d9d7c8, #86947e);
}

.room-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.availability-badge {
  display: inline-block;
  margin-bottom: 2px;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
}

.availability-badge--free {
  background: #d7edda;
  color: #216b2c;
}

.availability-badge--occupied {
  background: #f7d8d5;
  color: #a2362d;
}

.availability-badge--closed {
  background: #e0e0e0;
  color: #5d5d5d;
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

@media (max-width: 760px) {
  .rooms-page {
    display: block;
  }

  .room-filters {
    grid-template-columns: 1fr;
  }

  .availability-form {
    grid-template-columns: 1fr;
  }

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
