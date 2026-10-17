<template>
  <main class="login-page">
    <form class="login-card" @submit.prevent="submit">
      <h1>SmartCampus</h1>
      <p class="intro">Connectez-vous à votre compte</p>

      <label for="email">Adresse e-mail</label>
      <input id="email" v-model="email" type="email" autocomplete="username" required />

      <label for="password">Mot de passe</label>
      <input id="password" v-model="password" type="password" autocomplete="current-password" required />

      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Connexion…' : 'Se connecter' }}
      </button>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../services/auth'

const router = useRouter()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

async function submit() {
  errorMessage.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    await router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'La connexion a échoué.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: #f4f7fb;
}

.login-card {
  width: min(100%, 24rem);
  display: grid;
  gap: 0.8rem;
  padding: 2rem;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 12px 40px #17324d14;
}

h1, .intro { margin: 0; text-align: center; }
.intro { margin-bottom: 0.8rem; color: #596579; }
label { font-weight: 600; }
input { padding: 0.75rem; border: 1px solid #cbd3df; border-radius: 0.5rem; font: inherit; }
button { margin-top: 0.5rem; padding: 0.8rem; border: 0; border-radius: 0.5rem; background: #176b57; color: white; font: inherit; font-weight: 700; cursor: pointer; }
button:disabled { opacity: 0.65; cursor: wait; }
.error { margin: 0; color: #a32323; }
</style>
