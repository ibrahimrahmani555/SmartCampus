<template>
  <aside class="sidebar" aria-label="Navigation principale">
    <RouterLink class="sidebar__brand" to="/" aria-label="SmartCampus, accueil">
      <img src="../assets/images/logo.png" alt="" />
      <span>SmartCampus</span>
    </RouterLink>

    <nav class="sidebar__nav">
      <RouterLink class="sidebar__link" to="/dashboard">
        <span aria-hidden="true">⌂</span>
        Tableau de bord
      </RouterLink>
      <RouterLink class="sidebar__link" to="/rooms">
        <span aria-hidden="true">□</span>
        Salles
      </RouterLink>
    </nav>

    <button class="sidebar__logout" type="button" @click="signOut">
      Déconnexion
    </button>
  </aside>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
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
.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  width: 240px;
  height: 100vh;
  max-height: 100vh;
  flex-shrink: 0;
  padding: 28px 18px;
  background: var(--green, #173b32);
  color: var(--cream, #f8f6ed);
  overflow-y: auto;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px 32px;
  color: inherit;
  font-family: var(--font-display, inherit);
  font-size: 1.05rem;
  font-weight: 700;
}

.sidebar__brand img {
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.sidebar__nav {
  display: grid;
  gap: 8px;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  color: var(--cream, #f8f6ed);
  font-size: 0.9rem;
}

.sidebar__link span {
  width: 18px;
  color: var(--yellow, #d9b84f);
  font-size: 1.1rem;
  text-align: center;
}

.sidebar__link.router-link-active {
  background: var(--yellow, #d9b84f);
  color: var(--green, #173b32);
}

.sidebar__link.router-link-active span {
  color: inherit;
}

.sidebar__logout {
  margin-top: auto;
  padding: 12px 14px;
  border: 1px solid var(--yellow, #d9b84f);
  border-radius: 12px;
  background: transparent;
  color: var(--cream, #f8f6ed);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.sidebar__logout:hover,
.sidebar__logout:focus-visible {
  background: var(--yellow, #d9b84f);
  color: var(--green, #173b32);
}

@media (max-width: 760px) {
  .sidebar {
    position: static;
    width: 100%;
    height: auto;
    max-height: none;
    padding: 14px;
  }

  .sidebar__brand {
    padding: 0 6px 12px;
  }

  .sidebar__nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sidebar__logout {
    margin-top: 10px;
    text-align: center;
  }
}
</style>
