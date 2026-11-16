<template>
  <div class="dashboard-page">
    <AppSidebar />
    <div class="dashboard-main">
      
      <main class="dashboard-content">
        <span class="eyebrow">Votre espace SmartCampus</span>
        <h1>Bienvenue sur votre tableau de bord</h1>
        <p>Votre session est active. Utilisez le menu pour consulter les salles.</p>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '../components/AppHeader.vue'
import AppSidebar from '../components/AppSidebar.vue'
</script>

<style scoped>
.dashboard-page {
  display: flex;
  min-height: 100vh;
  background: var(--cream);
}

.dashboard-main {
  flex: 1;
  min-width: 0;
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

@media (max-width: 760px) {
  .dashboard-page {
    display: block;
  }
}
</style>
