<template>
  <main class="login-page">
    <AppHeader light />
    <div class="login-content">
      <div class="login-gallery" aria-hidden="true">
        <div class="decor-arch decor-arch--one">
          <img :src="roomImages[0]" alt="" />
        </div>
        <div class="decor-arch decor-arch--two">
          <img :src="roomImages[2]" alt="" />
        </div>
        <div class="decor-arch decor-arch--three">
          <img :src="roomImages[3]" alt="" />
        </div>
      </div>
      <form class="login-card" @submit.prevent="submitLogin">
        <div class="login-mark">
          <img src="../assets/images/logo.png" alt="SmartCampus" />
        </div>
        <span class="eyebrow">
          Votre espace campus
        </span>
        <h1>
          Connexion
        </h1>
        <p class="login-intro">
          Connectez-vous avec votre e-mail institutionnel
        </p>
        <p v-if="route.query.reset === 'success'" class="success-message" role="status">Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.</p>
        <div class="fields">
          <BaseInput id="login-email" v-model="email" label="E-mail institutionnel" type="email" autocomplete="username" placeholder="prenom.nom@exemple.ma" />
          <BaseInput id="login-password" v-model="password" label="Mot de passe" type="password" autocomplete="current-password" placeholder="Votre mot de passe" :revealable="true" />
        </div>
        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
        <BaseButton type="submit" class="submit-button" :disabled="isSubmitting">
          {{ isSubmitting ? 'Connexion…' : 'Se connecter' }}
          <span>
            ↗
          </span>
        </BaseButton>
        <RouterLink class="forgot" to="/forgot-password">
          Mot de passe oublié ?
        </RouterLink>
        <span class="card-footnote">
          ENSA KHOURIBGA · SMARTCAMPUS
        </span>
      </form>
    </div>
    <p class="login-caption">
      Un espace pensé pour apprendre, partager et créer.
    </p>
  </main>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { login } from '../services/auth'
const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function submitLogin() {
  if (isSubmitting.value) return
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await login(email.value, password.value)
    await router.push('/dashboard')
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 423) {
      errorMessage.value = `${error.message} (15 min)`
    } else {
      errorMessage.value = error instanceof Error ? error.message : 'La connexion a échoué.'
    }
  } finally {
    isSubmitting.value = false
  }
}

const roomImages = ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=85', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85'];
import AppHeader from '../components/AppHeader.vue';
import BaseInput from '../components/BaseInput.vue';
import BaseButton from '../components/BaseButton.vue'
</script>
<style scoped>
.login-page {
  min-height:100vh;
  background:var(--green);
  color:var(--cream);
  overflow:hidden
}
.login-content {
  position:relative;
  display:grid;
  grid-template-columns:minmax(230px,1fr) minmax(370px,470px);
  align-items:center;
  gap:70px;
  width:min(1000px,calc(100% - 80px));
  min-height:calc(100vh - 145px);
  margin:0 auto;
  padding:20px 0 45px
}
.login-gallery {
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:18px;
  height:500px
}
.decor-arch {
  width:29%;
  overflow:hidden;
  border:1px solid var(--gold);
  border-radius:999px;
  aspect-ratio:3/5
}
.decor-arch img {
  width:100%;
  height:100%;
  object-fit:cover
}
.decor-arch--one {
  margin-top:-65px
}
.decor-arch--two {
  width:34%;
  margin-top:65px
}
.decor-arch--three {
  margin-top:-25px
}
.login-card {
  position:relative;
  display:grid;
  gap:17px;
  justify-items:stretch;
  padding:39px 43px 33px;
  border:1px solid var(--gold);
  border-radius:999px 999px 38px 38px;
  background:var(--cream);
  color:var(--text);
  text-align:center;
  box-shadow:0 22px 70px #061a0d40
}
.login-mark {
  display:grid;
  place-items:center;
  width:76px;
  height:76px;
  margin:0 auto 1px;
  border:0;
  color:var(--green);
}
.login-mark img {
  width: 68px;
  height: 68px;
  object-fit: contain;
}
.eyebrow {
  justify-content:center;
  color:#888669;
  font-size:8px
}
.login-card h1 {
  margin:-7px 0 0;
  color:var(--green);
  font-size:52px
}
.login-intro {
  margin:-7px 0 2px;
  color:#666a60;
  font-size:10px
}
.fields {
  display:grid;
  gap:14px;
  text-align:left
}
.fields :deep(.field label) {
  font-size:9px
}
.submit-button {
  width:100%;
  margin-top:3px
}
.submit-button span {
  padding-left:12px
}
.forgot {
  color:#6a6c62;
  font-size:9px;
  text-decoration:underline;
  text-decoration-color:#c9b45899;
  text-underline-offset:4px
}
.card-footnote {
  margin-top:1px;
  color:#9b9b89;
  font-size:7px;
  letter-spacing:.2em
}
.login-caption {
  margin:0;
  padding:0 20px 25px;
  color:#d0d8c9;
  text-align:center;
  font:italic 18px var(--font-display)
}
.error-message {
  margin:0;
  padding:10px 12px;
  border:1px solid #c0392b55;
  border-radius:10px;
  background:#c0392b12;
  color:#9e3025;
  font-size:10px;
  text-align:left
}
.success-message { margin:0; padding:10px 12px; border-radius:10px; background:#2e7d3212; color:#245c31; font-size:10px }
.login-card :deep(.submit-button) {
  font-size:11px
}
@media(max-width:760px) {
  .login-content {
    grid-template-columns:minmax(0,1fr);
    width:min(100% - 32px,460px);
    min-height:calc(100vh - 112px);
    padding:12px 0 24px
  }
.login-gallery {
  display:none
}
.login-card {
  width:100%;
  padding:39px clamp(25px,8vw,45px) 30px
}
.login-caption {
  padding-bottom:18px;
  font-size:15px
}
}
</style>
