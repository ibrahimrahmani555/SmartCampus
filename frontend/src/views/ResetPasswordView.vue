<template>
  <main class="reset-page">
    <AppHeader light />
    <form class="reset-card" @submit.prevent="submitReset">
      <h1>Nouveau mot de passe</h1>
      <p>Choisissez un mot de passe d’au moins 8 caractères contenant un chiffre.</p>
      <BaseInput id="new-password" v-model="newPassword" label="Nouveau mot de passe" type="password" autocomplete="new-password" placeholder="Votre nouveau mot de passe" :revealable="true" />
      <BaseInput id="confirm-password" v-model="confirmation" label="Confirmer le mot de passe" type="password" autocomplete="new-password" placeholder="Saisissez-le à nouveau" :revealable="true" />
      <p v-if="errorMessage" class="feedback" role="alert">{{ errorMessage }}</p>
      <BaseButton type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Enregistrement…' : 'Réinitialiser le mot de passe' }}</BaseButton>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import { confirmPasswordReset } from '../services/auth'
const route = useRoute()
const router = useRouter()
const token = typeof route.query.token === 'string' ? route.query.token : ''
const newPassword = ref('')
const confirmation = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)
async function submitReset() {
  errorMessage.value = ''
  if (!token) { errorMessage.value = 'Le lien de réinitialisation est invalide.'; return }
  if (newPassword.value !== confirmation.value) { errorMessage.value = 'Les deux mots de passe ne correspondent pas.'; return }
  isSubmitting.value = true
  try {
    await confirmPasswordReset(token, newPassword.value)
    await router.push({ path: '/login', query: { reset: 'success' } })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'La réinitialisation a échoué.'
  } finally { isSubmitting.value = false }
}
</script>

<style scoped>
.reset-page { min-height:100vh; padding-bottom:60px; background:var(--green); color:var(--cream) }
.reset-card { display:grid; gap:20px; width:min(440px,calc(100% - 32px)); margin:60px auto; padding:40px; border:1px solid var(--gold); border-radius:32px; background:var(--cream); color:var(--text) }
h1 { margin:0; color:var(--green); font:500 36px var(--font-display) }
p { margin:0; color:#666a60; font-size:13px }
.feedback { padding:12px; border-radius:10px; color:#9e3025; background:#c0392b12 }
</style>
