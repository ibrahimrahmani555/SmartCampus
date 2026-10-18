<template>
  <main class="reset-page">
    <AppHeader light />
    <form class="reset-card" @submit.prevent="submitRequest">
      <h1>Mot de passe oublié ?</h1>
      <p>Indiquez l’adresse e-mail associée à votre compte SmartCampus.</p>
      <BaseInput id="reset-email" v-model="email" label="E-mail institutionnel" type="email" autocomplete="email" placeholder="prenom.nom@exemple.ma" />
      <p v-if="submitted" class="feedback success" role="status">{{ passwordResetRequestMessage }}</p>
      <p v-if="errorMessage" class="feedback error" role="alert">{{ errorMessage }}</p>
      <BaseButton type="submit" :disabled="isSubmitting">{{ isSubmitting ? 'Envoi…' : 'Envoyer le lien' }}</BaseButton>
      <RouterLink to="/login">Retour à la connexion</RouterLink>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseInput from '../components/BaseInput.vue'
import { passwordResetRequestMessage, requestPasswordReset } from '../services/auth'
const email = ref('')
const isSubmitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')
async function submitRequest() {
  isSubmitting.value = true
  submitted.value = false
  errorMessage.value = ''
  try { await requestPasswordReset(email.value) } catch { /* Always show the same response for account privacy. */ }
  submitted.value = true
  isSubmitting.value = false
}
</script>

<style scoped>
.reset-page { min-height:100vh; padding-bottom:60px; background:var(--green); color:var(--cream) }
.reset-card { display:grid; gap:20px; width:min(440px,calc(100% - 32px)); margin:60px auto; padding:40px; border:1px solid var(--gold); border-radius:32px; background:var(--cream); color:var(--text) }
h1 { margin:0; color:var(--green); font:500 36px var(--font-display) }
p { margin:0; color:#666a60; font-size:13px }
a { color:var(--green); text-align:center }
.feedback { padding:12px; border-radius:10px }
.error { color:#9e3025; background:#c0392b12 }
.success { color:#245c31; background:#2e7d3212 }
</style>
