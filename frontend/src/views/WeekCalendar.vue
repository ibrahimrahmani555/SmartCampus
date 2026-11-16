<template>
  <main class="calendar-page">
    <AppSidebar />
    <div class="calendar-main">
      <AppHeader />
      <section class="calendar-content" aria-labelledby="calendar-title">
        <div class="calendar-heading">
          <p class="eyebrow">{{ calendarText.eyebrow }}</p>
          <h1 id="calendar-title">{{ calendarText.title }}</h1>
          <p class="subtitle">{{ calendarText.subtitle }}</p>
        </div>

        <div class="calendar-toolbar">
          <label>
            {{ calendarText.room }}
            <select v-model="selectedRoomId" @change="selectRoom">
              <option v-for="room in rooms" :key="room.id" :value="room.id">
                {{ room.name }} · {{ room.building }}
              </option>
            </select>
          </label>
          <div class="week-actions" aria-label="Navigation de la semaine">
            <button type="button" @click="shiftWeek(-7)">{{ calendarText.previous }}</button>
            <button type="button" @click="goToToday">{{ calendarText.today }}</button>
            <button type="button" @click="shiftWeek(7)">{{ calendarText.next }}</button>
          </div>
        </div>

        <p v-if="loading" class="state-message" role="status">{{ calendarText.loading }}</p>
        <p v-else-if="errorMessage" class="state-message state-message--error" role="alert">
          {{ errorMessage }}
        </p>
        <div v-else-if="calendar" class="calendar-days">
          <article v-for="day in calendar.days" :key="day.date" class="calendar-day">
            <h2>{{ formatDay(day.date) }}</h2>
            <div class="calendar-slots">
              <button
                v-for="slot in day.slots"
                :key="`${day.date}-${slot.start}`"
                class="calendar-slot"
                :class="`calendar-slot--${slot.status}`"
                type="button"
                :disabled="slot.status !== 'free'"
                @click="openBooking(day.date, slot.start, slot.status)"
              >
                <span class="slot-time">{{ slot.start }} – {{ slot.end }}</span>
                <span class="slot-status">{{ calendarText.status[slot.status] }}</span>
              </button>
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
import { listRooms, getRoomCalendar, RoomsRequestError, type Room, type RoomCalendar, type RoomAvailabilityStatus } from '../services/rooms'

const calendarText = {
  eyebrow: 'Disponibilité',
  title: 'Calendrier hebdomadaire',
  subtitle: 'Consultez les créneaux d’une salle sur la semaine.',
  room: 'Salle',
  previous: 'Semaine précédente',
  next: 'Semaine suivante',
  today: 'Aujourd’hui',
  loading: 'Chargement du calendrier…',
  error: 'Le calendrier ne peut pas être chargé pour le moment.',
  status: {
    free: 'Libre',
    occupied: 'Occupé',
    closed: 'Fermé',
  },
} as const

const route = useRoute()
const router = useRouter()
const rooms = ref<Room[]>([])
const selectedRoomId = ref(String(route.params.id))
const weekStart = ref(getMonday(todayInCasablanca()))
const calendar = ref<RoomCalendar | null>(null)
const loading = ref(true)
const errorMessage = ref('')

function todayInCasablanca() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(new Date())
}

function getMonday(date: string) {
  const value = new Date(`${date}T00:00:00Z`)
  const day = value.getUTCDay()
  value.setUTCDate(value.getUTCDate() - (day === 0 ? 6 : day - 1))
  return value.toISOString().slice(0, 10)
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function formatDay(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

async function loadCalendar() {
  loading.value = true
  errorMessage.value = ''
  try {
    calendar.value = await getRoomCalendar(selectedRoomId.value, weekStart.value)
  } catch (error) {
    errorMessage.value = error instanceof RoomsRequestError ? error.message : calendarText.error
    calendar.value = null
  } finally {
    loading.value = false
  }
}

async function updateRoute() {
  await router.replace({
    name: 'room-calendar',
    params: { id: selectedRoomId.value },
    query: { weekStart: weekStart.value },
  })
}

async function selectRoom() {
  await updateRoute()
  await loadCalendar()
}

async function shiftWeek(days: number) {
  weekStart.value = addDays(weekStart.value, days)
  await updateRoute()
  await loadCalendar()
}

async function goToToday() {
  weekStart.value = getMonday(todayInCasablanca())
  await updateRoute()
  await loadCalendar()
}

async function openBooking(date: string, start: string, status: RoomAvailabilityStatus) {
  if (status !== 'free') return
  await router.push({
    name: 'booking-new',
    query: { roomId: selectedRoomId.value, date, start },
  })
}

onMounted(async () => {
  const queryWeekStart = typeof route.query.weekStart === 'string' ? route.query.weekStart : ''
  if (queryWeekStart) weekStart.value = queryWeekStart

  try {
    rooms.value = await listRooms()
    if (!rooms.value.some((room) => room.id === selectedRoomId.value)) {
      selectedRoomId.value = rooms.value[0]?.id ?? ''
      if (selectedRoomId.value) await updateRoute()
    }
    if (selectedRoomId.value) await loadCalendar()
    else loading.value = false
  } catch (error) {
    errorMessage.value = error instanceof RoomsRequestError ? error.message : calendarText.error
    loading.value = false
  }
})
</script>

<style scoped>
.calendar-page {
  display: flex;
  min-height: 100vh;
  background: var(--cream, #f8f6ed);
  color: var(--green, #173b32);
}

.calendar-main {
  flex: 1;
  min-width: 0;
}

.calendar-content {
  width: min(1280px, calc(100% - 40px));
  margin: 0 auto;
  padding: 48px 0 72px;
}

.calendar-heading {
  margin-bottom: 28px;
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
}

.subtitle {
  margin: 14px 0 0;
  color: var(--text-muted, #686b61);
}

.calendar-toolbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 24px;
}

.calendar-toolbar label {
  display: grid;
  gap: 7px;
  min-width: min(100%, 340px);
  color: var(--text-muted, #686b61);
  font-size: 0.78rem;
  font-weight: 700;
}

select {
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid var(--border, #dedecf);
  border-radius: 9px;
  background: var(--surface, #fffdf7);
  color: var(--green, #173b32);
  font: inherit;
}

.week-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.week-actions button {
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--green, #173b32);
  border-radius: 9px;
  background: var(--green, #173b32);
  color: var(--cream, #f8f6ed);
  cursor: pointer;
  font: inherit;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
}

.calendar-day {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--border, #dedecf);
  border-radius: 14px;
  background: var(--surface, #fffdf7);
}

.calendar-day h2 {
  margin: 0 0 12px;
  font-size: 0.9rem;
  text-transform: capitalize;
}

.calendar-slots {
  display: grid;
  gap: 6px;
}

.calendar-slot {
  display: grid;
  gap: 3px;
  min-height: 52px;
  padding: 7px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.calendar-slot:disabled {
  cursor: default;
}

.calendar-slot--free {
  background: #d7edda;
  color: #216b2c;
}

.calendar-slot--occupied {
  background: #f7d8d5;
  color: #a2362d;
}

.calendar-slot--closed {
  background: #e0e0e0;
  color: #5d5d5d;
}

.calendar-slot:not(:disabled):hover,
.calendar-slot:not(:disabled):focus-visible {
  border-color: var(--gold, #ad8b3a);
  outline: 2px solid var(--gold, #ad8b3a);
}

.slot-time {
  font-size: 0.7rem;
  font-weight: 700;
}

.slot-status {
  font-size: 0.7rem;
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
  .calendar-page {
    display: block;
  }

  .calendar-content {
    width: calc(100% - 28px);
    padding-top: 28px;
  }

  .calendar-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .calendar-toolbar label {
    min-width: 0;
  }

  .week-actions {
    justify-content: space-between;
  }

  .calendar-days {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
  }

  .calendar-day {
    flex: 0 0 calc(100vw - 56px);
    scroll-snap-align: start;
  }
}
</style>
