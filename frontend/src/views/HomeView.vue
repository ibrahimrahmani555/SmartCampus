<template>
  <AppHeader />
  <main>
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow"> Le campus, à votre rythme </span>
        <h1>
          Réservez votre salle
          <br />
          <em> en quelques clics </em>
        </h1>
        <p>
          Consultez les salles du campus, vérifiez leur disponibilité et
          réservez un créneau sans conflit.
        </p>
        <BaseButton @click="scrollTo('rooms')">
          Voir les salles
          <span aria-hidden="true"> ↗ </span>
        </BaseButton>
        <div class="hero-note">
          <span> 01 — 04 </span>
          <span> Des espaces pour vos idées </span>
        </div>
      </div>
      <div class="hero-gallery">
        <div class="hero-arch hero-arch--small">
          <img :src="roomImages[0]" alt="Salle de travail lumineuse" />
        </div>
        <div class="hero-arch hero-arch--large">
          <img :src="roomImages[1]" alt="Espace de cours du campus" />
        </div>
        <div class="hero-arch hero-arch--small hero-arch--third">
          <img :src="roomImages[2]" alt="Salle de réunion" />
        </div>
        <span class="gallery-caption"> ENSA KHOURIBGA · 2026 </span>
      </div>
      <span class="hero-index"> 01 </span>
    </section>
    <section class="featured" id="rooms">
      <div class="section-shell">
        <div class="featured-heading">
          <div>
            <span class="eyebrow"> Des espaces inspirants </span>
            <h2 class="section-title">Trouvez la salle idéale</h2>
          </div>
          <a class="text-link" href="#search">
            Voir toutes les salles
            <span> ↗ </span>
          </a>
        </div>
        <div class="featured-grid">
          <ArchCard
            v-for="room in featuredRooms"
            :key="room.name"
            :title="room.name"
            :subtitle="room.subtitle"
          >
            <img :src="room.image" :alt="room.alt" />
          </ArchCard>
        </div>
      </div>
    </section>
    <section class="how" id="how">
      <div class="section-shell how-layout">
        <div class="how-copy">
          <span class="eyebrow"> Simple comme bonjour </span>
          <h2 class="section-title">Comment ça marche</h2>
          <p class="section-copy">
            Un espace pour votre idée, quelques gestes pour le trouver.
          </p>
          <div class="steps">
            <button
              v-for="(step, index) in steps"
              :key="step.title"
              type="button"
              class="step"
              :class="{ 'step--active': activeStep === index }"
              @click="activeStep = index"
            >
              <span> 0{{ index + 1 }} </span>
              {{ step.title }}
              <b> ↗ </b>
            </button>
          </div>
        </div>
        <div class="how-detail">
          <div class="how-image">
            <img :src="activeStepData.image" :alt="activeStepData.alt" />
          </div>
        </div>
      </div>
    </section>
    <section class="audience">
      <div class="section-shell">
        <div class="audience-intro">
          <span class="eyebrow">Un campus, mille idées</span>
          <h2 class="section-title">Pour qui ?</h2>
        </div>
        <div class="audience-grid">
          <ArchCard
            v-for="group in audiences"
            :key="group.title"
            :title="group.title"
            :subtitle="group.description"
          >
            <img :src="group.image" :alt="group.alt" />
          </ArchCard>
        </div>
      </div>
    </section>
    <section class="search" id="search">
      <div class="section-shell search-layout">
        <div>
          <span class="eyebrow">Le bon espace vous attend</span>
          <h2 class="section-title">
            Rechercher
            <br />
            une salle
          </h2>
          <p>
            Quelques détails, et votre prochain espace n'est plus qu'à portée de
            clic.
          </p>
          <img class="search-mark" src="../assets/images/logo.png" alt="SmartCampus" />
        </div>
        <form class="search-form" @submit.prevent>
          <label>
            Bâtiment
            <select>
              <option value="">Tous les bâtiments</option>
              <option>Bâtiment A</option>
              <option>Bâtiment B</option>
            </select>
          </label>
          <label>
            Date
            <input type="date" />
          </label>
          <div class="form-row">
            <label>
              Heure de début
              <input type="time" />
            </label>
            <label>
              Heure de fin
              <input type="time" />
            </label>
          </div>
          <label>
            Capacité minimale
            <input type="number" min="1" placeholder="Nombre de personnes" />
          </label>
          <BaseButton type="submit">
            Rechercher
            <span aria-hidden="true"> ↗ </span>
          </BaseButton>
        </form>
      </div>
    </section>
  </main>
  <AppFooter />
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import AppHeader from "../components/AppHeader.vue";
import AppFooter from "../components/AppFooter.vue";
import ArchCard from "../components/ArchCard.vue";
import BaseButton from "../components/BaseButton.vue";
import RoomCard from "../components/RoomCard.vue";
const roomImages = [
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85",
];
const activeStep = ref(0);
const activeStepData = computed(() => steps[activeStep.value]!);
const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
const featuredRooms = [
  {
    name: "Salle A12",
    subtitle: "Bâtiment A · 40 places",
    image: roomImages[0],
    alt: "Salle A12 lumineuse",
  },
  {
    name: "Studio B04",
    subtitle: "Bâtiment B · 18 places",
    image: roomImages[1],
    alt: "Studio de travail",
  },
  {
    name: "Amphi C01",
    subtitle: "Bâtiment C · 80 places",
    image: roomImages[2],
    alt: "Amphithéâtre du campus",
  },
  {
    name: "Salle A08",
    subtitle: "Bâtiment A · 24 places",
    image: roomImages[3],
    alt: "Salle de réunion",
  },
];
const steps = [
  {
    title: "Se connecter",
    description:
      "Accédez à votre espace avec votre adresse e-mail institutionnelle.",
    image: roomImages[1],
    alt: "Entrée lumineuse du campus",
  },
  {
    title: "Chercher une salle",
    description:
      "Choisissez un bâtiment, une date et la capacité qui vous convient.",
    image: roomImages[0],
    alt: "Salle de travail disponible",
  },
  {
    title: "Réserver",
    description:
      "Sélectionnez votre créneau et gardez votre espace pour le jour J.",
    image: roomImages[2],
    alt: "Espace prêt à accueillir un groupe",
  },
  {
    title: "Annuler",
    description:
      "Vos plans changent ? Libérez votre salle en quelques instants.",
    image: roomImages[3],
    alt: "Salle claire du campus",
  },
];
const rooms = [
  {
    name: "Salle A12",
    building: "Bâtiment A",
    capacity: 40,
    available: true,
    image: roomImages[0],
  },
  {
    name: "Studio B04",
    building: "Bâtiment B",
    capacity: 18,
    available: true,
    image: roomImages[1],
  },
  {
    name: "Salle C08",
    building: "Bâtiment C",
    capacity: 24,
    available: false,
    image: roomImages[2],
  },
  {
    name: "Atelier A03",
    building: "Bâtiment A",
    capacity: 12,
    available: true,
    image: roomImages[3],
  },
];
const audiences = [
  {
    title: "Étudiants",
    description: "Consulter, réserver, annuler",
    image: roomImages[2],
    alt: "Espace d’étude",
  },
  {
    title: "Personnel",
    description: "Salles de cours et de réunion",
    image: roomImages[3],
    alt: "Salle de cours",
  },
  {
    title: "Administrateurs",
    description: "Gérer les salles et suivre les événements de sécurité",
    image: roomImages[1],
    alt: "Salle de réunion",
  },
];
</script>
<style scoped>
.hero {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  min-height: 610px;
  padding: 30px max(7vw, calc((100vw - 1180px) / 2));
  background: var(--cream);
  overflow: hidden;
}
.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 530px;
  padding: 42px 0 68px;
}
.hero h1 {
  margin: 24px 0 20px;
  color: var(--green);
  font-size: clamp(52px, 6.2vw, 82px);
  letter-spacing: -0.035em;
}
.hero h1 em {
  color: #839174;
  font-weight: 400;
}
.hero-copy > p {
  max-width: 405px;
  margin-bottom: 25px;
  color: #63675d;
  font-size: 12px;
}
.hero .button span,
.search .button span {
  padding-left: 15px;
}
.hero-note {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 62px;
  color: #858778;
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.hero-note span:first-child {
  color: var(--gold);
}
.hero-gallery {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 490px;
  padding-top: 12px;
}
.hero-arch {
  overflow: hidden;
  border: 1px solid var(--gold);
  border-radius: 999px;
  aspect-ratio: 3/5;
  background: #d1d4c5;
}
.hero-arch img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-arch--small {
  width: 28%;
  height: auto;
  margin-top: 75px;
}
.hero-arch--large {
  width: 38%;
  height: auto;
}
.hero-arch--third {
  margin-top: -65px;
}
.gallery-caption {
  position: absolute;
  right: 0;
  bottom: 26px;
  color: #8a8c7e;
  font-size: 8px;
  letter-spacing: 0.18em;
}
.hero-index {
  position: absolute;
  bottom: 24px;
  left: max(32px, calc((100vw - 1180px) / 2));
  color: var(--gold);
  font: italic 24px var(--font-display);
}
.featured {
  padding: 100px 0 90px;
  background: var(--green);
  color: var(--cream);
}
.featured-heading,
.available-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 38px;
}
.featured-heading > p {
  max-width: 290px;
  color: #d0d8c9;
  font-size: 11px;
}
.featured-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 23px;
}
.featured-grid :deep(.arch-card__image) {
  aspect-ratio: 3/5;
}
.featured-grid :deep(.arch-card__text) {
  padding-top: 17px;
}
.featured-grid :deep(.arch-card h3) {
  font-size: 25px;
}
.text-link {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 5px;
  border-bottom: 1px solid var(--gold);
  font-size: 10px;
}
.text-link span {
  color: var(--gold);
}
.featured .text-link {
  margin-top: 30px;
}
.how {
  padding: 105px 0;
  background: var(--cream);
}
.how-layout {
  display: grid;
  grid-template-columns: 0.92fr 1.08fr;
  gap: 90px;
  align-items: center;
}
.how-copy .section-copy {
  margin-bottom: 34px;
}
.steps {
  border-top: 1px solid #d9dacd;
}
.step {
  display: grid;
  grid-template-columns: 40px 1fr 25px;
  align-items: center;
  width: 100%;
  padding: 17px 0;
  border: 0;
  border-bottom: 1px solid #d9dacd;
  background: transparent;
  color: #73766d;
  text-align: left;
  font: 500 23px var(--font-display);
  cursor: pointer;
  transition: color 0.2s;
}
.step span,
.step b {
  font: 10px var(--font-body);
  color: #aaa995;
}
.step b {
  text-align: right;
}
.step--active {
  color: var(--green);
}
.step--active span,
.step--active b {
  color: var(--gold);
}
.how-detail {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 160px;
  align-items: end;
  gap: 20px;
}
.how-image {
  overflow: hidden;
  width: 74%;
  margin-left: auto;
  border: 1px solid var(--gold);
  border-radius: 999px;
  aspect-ratio: 3/5;
}
.how-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.how-detail-copy {
  position: absolute;
  left: 0;
  bottom: 34px;
  width: 49%;
  padding: 23px 21px;
  border: 1px solid var(--gold);
  background: var(--cream);
}
.how-detail-copy > span {
  color: #8b8d7e;
  font-size: 8px;
  letter-spacing: 0.16em;
}
.how-detail-copy h3 {
  margin: 12px 0 8px;
  color: var(--green);
  font-size: 30px;
}
.how-detail-copy p {
  margin: 0;
  color: #696c62;
  font-size: 10px;
}
.available {
  padding: 95px 0;
  background: var(--green);
  color: var(--cream);
}
.available-heading {
  align-items: center;
}
.available-heading .section-title {
  margin-bottom: 0;
}
.room-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.audience {
  padding: 95px 0 110px;
  background: var(--green);
  color: var(--cream);
}
.audience-intro {
  margin-bottom: 34px;
  text-align: center;
}
.audience-intro .eyebrow {
  justify-content: center;
}
.audience-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 230px));
  justify-content: center;
  gap: 40px;
}
.audience-grid :deep(.arch-card__text) {
  text-align: center;
}
.audience-grid :deep(.arch-card h3) {
  font-size: 27px;
}
.search {
  padding: 90px 0;
  background: var(--cream);
  color: var(--green);
}
.search-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 90px;
  align-items: center;
}
.search .section-title {
  font-size: clamp(48px, 6vw, 72px);
}
.search-layout > div > p {
  max-width: 340px;
  color: #63675d;
  font-size: 11px;
}
.search-mark {
  display: block;
  margin-top: 30px;
  width: 100px;
  height: 100px;
  object-fit: contain;
}
.search-form {
  display: grid;
  gap: 18px;
  padding: 31px;
  border: 1px solid #c9b45866;
  border-radius: 22px;
  background: var(--green);
}
.search-form label {
  display: grid;
  gap: 7px;
  color: #e4e8dc;
  font-size: 9px;
  letter-spacing: 0.04em;
}
.search-form input,
.search-form select {
  width: 100%;
  min-height: 45px;
  padding: 0 13px;
  border: 1px solid #c9b4587a;
  border-radius: 10px;
  background: var(--cream);
  color: var(--text);
  font: inherit;
  font-size: 11px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
.search-form > .button {
  justify-self: start;
  min-width: 155px;
}
@media (max-width: 900px) {
  .hero {
    padding-inline: 6vw;
    min-height: 550px;
  }
  .hero-gallery {
    height: 390px;
    gap: 10px;
  }
  .hero h1 {
    font-size: 58px;
  }
  .how-layout {
    gap: 35px;
  }
  .featured-grid {
    gap: 15px;
  }
  .how-detail {
    grid-template-columns: 1fr;
  }
  .how-detail-copy {
    width: 60%;
  }
}
@media (max-width: 640px) {
  .hero {
    grid-template-columns: 1fr;
    min-height: unset;
    padding: 26px 20px 48px;
  }
  .hero-copy {
    padding: 35px 0 0;
  }
  .hero h1 {
    font-size: 54px;
  }
  .hero-note {
    margin-top: 33px;
  }
  .hero-gallery {
    height: 340px;
    margin-top: 5px;
  }
  .hero-arch--small {
    width: 27%;
    margin-top: 50px;
  }
  .hero-arch--large {
    width: 36%;
  }
  .hero-arch--third {
    margin-top: -35px;
  }
  .gallery-caption {
    bottom: 3px;
  }
  .hero-index {
    display: none;
  }
  .featured,
  .how,
  .available,
  .featured-heading,
  .available-heading {
    display: block;
  }
  .featured-heading > p {
    margin-bottom: 0;
  }
  .featured-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 16px;
  }
  .featured-grid :deep(.arch-card h3) {
    font-size: 22px;
  }
  .featured-grid :deep(.arch-card__text) {
    padding: 12px 2px;
  }
  .how-layout {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  .how-detail {
    min-height: 390px;
    grid-template-columns: 1fr 120px;
  }
  .how-image {
    width: 70%;
    margin-right: 5%;
  }
  .how-detail-copy {
    width: 65%;
    bottom: 13px;
  }
  .step {
    font-size: 22px;
  }
  .available-heading .text-link {
    margin: 15px 0 25px;
  }
  .audience {
    padding: 68px 0;
  }
  .audience-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 20px;
  }
  .audience-grid :deep(.arch-card:last-child) {
    grid-column: 1 / -1;
    width: 55%;
    justify-self: center;
  }
  .audience-grid :deep(.arch-card h3) {
    font-size: 23px;
  }
  .room-grid {
    grid-template-columns: 1fr;
  }
  .search {
    padding: 68px 0;
  }
  .search-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .search-mark {
    display: none;
  }
  .search-form {
    padding: 22px;
  }
  .form-row {
    gap: 10px;
  }
}
</style>
