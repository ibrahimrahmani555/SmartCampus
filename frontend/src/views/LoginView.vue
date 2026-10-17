<template>
  <main class="login-page">
    <form class="login-card" @submit.prevent="submitLogin">
      <h1>Connexion</h1>
      <p class="intro">Connectez-vous à votre espace SmartCampus.</p>

      <label for="email">E-mail</label>
      <input
        id="email"
        v-model.trim="email"
        type="email"
        name="email"
        autocomplete="username"
        required
      />

      <label for="password">Mot de passe</label>
      <input
        id="password"
        v-model="password"
        type="password"
        name="password"
        autocomplete="current-password"
        required
      />

      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
      <button type="submit" :disabled="submitting">
        {{ submitting ? 'Connexion…' : 'Se connecter' }}
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
const submitting = ref(false)

async function submitLogin() {
  errorMessage.value = ''
  submitting.value = true

  try {
    await login(email.value, password.value)
    await router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error
      ? error.message
      : 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
}

.login-card {
  width: min(100%, 26rem);
  display: grid;
  gap: 0.8rem;
  padding: 2rem;
  border: 1px solid #d8deea;
  border-radius: 1rem;
  background: white;
  box-shadow: 0 1rem 3rem rgb(25 42 70 / 10%);
}

h1,
.intro {
  margin: 0;
}

.intro {
  margin-bottom: 0.8rem;
  color: #566176;
}

label {
  font-weight: 600;
}

input {
  width: 100%;
  min-height: 2.8rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid #aab4c5;
  border-radius: 0.45rem;
  font: inherit;
}

button {
  min-height: 2.8rem;
  margin-top: 0.4rem;
  border: 0;
  border-radius: 0.45rem;
  background: #174ea6;
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.error {
  margin: 0;
  color: #a3212b;
}
</style>
