<template>
  <div class="dashboard-page">
    <AppHeader />
    <main class="dashboard-content">
      <span class="eyebrow">Votre espace SmartCampus</span>
      <h1>Bienvenue sur votre tableau de bord</h1>
      <p>Votre session est active. Vous pouvez vous déconnecter à tout moment.</p>
      <BaseButton type="button" @click="signOut">Se déconnecter</BaseButton>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BaseButton from '../components/BaseButton.vue'
import { logout } from '../services/auth'

const router = useRouter()

async function signOut() {
  try {
    await logout()
  } finally {
    await router.push('/login')
  }
}
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: var(--cream);
}

.dashboard-content {
  display: grid;
  justify-items: start;
  gap: 18px;
  width: min(1000px, calc(100% - 48px));
  margin: 70px auto;
  color: var(--green);
}

.dashboard-content h1 {
  margin: 0;
  font-size: clamp(38px, 6vw, 64px);
}

.dashboard-content p {
  color: #63675d;
}
</style>
