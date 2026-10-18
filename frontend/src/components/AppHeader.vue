<template>
  <header class="header" :class="{ 'header--light': light }">
    <a class="wordmark" href="/" aria-label="SmartCampus, accueil">
      <img class="mark" src="../assets/images/logo.png" alt="" />
    </a>
    <button
      class="menu-toggle"
      type="button"
      :aria-expanded="menuOpen"
      aria-label="Ouvrir le menu"
      @click="menuOpen = !menuOpen"
    >
      <i> </i>
      <i> </i>
    </button>
    <nav :class="{ 'nav--open': menuOpen }">
      <div class="nav-left">
        <a href="#rooms"> Salles </a>
        <a href="#how"> Comment ça marche </a>
      </div>
      <div class="nav-right">
        <button v-if="isAuthenticated" class="login-link logout-link" type="button" @click="signOut">
          Se déconnecter
        </button>
        <RouterLink v-else class="login-link" to="/login">
          Se connecter
          <span> ↗ </span>
        </RouterLink>
      </div>
    </nav>
  </header>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from 'vue-router'
import { getCurrentUser, logout } from '../services/auth'
defineProps<{ light?: boolean }>();
const menuOpen = ref(false);
const isAuthenticated = ref(false)
const router = useRouter()
onMounted(async () => { isAuthenticated.value = Boolean(await getCurrentUser().catch(() => null)) })
async function signOut() {
  try {
    await logout()
  } finally {
    isAuthenticated.value = false
    await router.push('/login')
  }
}
</script>
<style scoped>
.header {
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 94px;
  width: min(1280px, calc(100% - 80px));
  margin: auto;
  color: var(--green);
}
nav {
  display: contents;
}
.wordmark {
  grid-column: 2;
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.mark {
  width: 72px;
  height: 72px;
  object-fit: contain;
}
.nav-left,
.nav-right {
  display: flex;
  align-items: center;
  gap: 27px;
  font-size: 10px;
}
.nav-left {
  grid-column: 1;
  grid-row: 1;
  justify-self: start;
}
.nav-right {
  grid-column: 3;
  grid-row: 1;
  justify-self: end;
}
.nav-left a,
.nav-right > a:first-child {
  opacity: 0.8;
}
.login-link {
  padding: 11px 18px;
  border-radius: 999px;
  background: var(--green);
  color: var(--cream);
}
.logout-link {
  border: 0;
  font: inherit;
  cursor: pointer;
}
.login-link span {
  padding-left: 8px;
  color: var(--yellow);
}
.menu-toggle {
  display: none;
}
.header--light {
  color: var(--cream);
}
.header--light .login-link {
  background: var(--yellow);
  color: var(--green);
}
@media (max-width: 760px) {
  .header {
    width: calc(100% - 40px);
    min-height: 76px;
    grid-template-columns: 1fr auto;
  }
  .wordmark {
    grid-column: 1;
    grid-row: 1;
  }
  .menu-toggle {
    display: grid;
    gap: 5px;
    grid-column: 2;
    grid-row: 1;
    padding: 9px;
    border: 0;
    background: transparent;
  }
  .menu-toggle i {
    width: 22px;
    height: 1px;
    background: currentColor;
  }
  nav {
    display: none;
    position: absolute;
    top: 65px;
    left: 0;
    right: 0;
    padding: 20px;
    background: var(--cream);
    color: var(--green);
    border: 1px solid var(--gold);
    border-radius: 18px;
    box-shadow: 0 12px 30px #0002;
  }
  .header--light nav {
    background: var(--green);
    color: var(--cream);
  }
  nav.nav--open {
    display: grid;
    gap: 18px;
  }
  .nav-left,
  .nav-right {
    display: grid;
    gap: 14px;
    justify-self: stretch;
  }
  .nav-left,
  .nav-right {
    grid-column: 1;
    grid-row: auto;
  }
  .login-link {
    text-align: center;
  }
}
</style>
