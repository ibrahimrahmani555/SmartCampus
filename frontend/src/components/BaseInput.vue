<template>
  <div class="field">
    <label :for="inputId">
      {{ label }}
    </label>
    <div class="input-wrap">
      <input :id="inputId" :type="revealed ? 'text' : type" :placeholder="placeholder" :aria-invalid="Boolean(error)" :aria-describedby="error ? `${inputId}-error` : undefined" :autocomplete="autocomplete" />
      <button v-if="revealable" class="reveal" type="button" :aria-label="revealed ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" @click="revealed = !revealed">
        {{ revealed ? 'Masquer' : 'Afficher' }}
      </button>
    </div>
    <small v-if="error" :id="`${inputId}-error`" class="field-error">
      {{ error }}
    </small>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    type?: string
    placeholder?: string
    error?: string
    id?: string
    autocomplete?: string
    revealable?: boolean
  }>(),
  {
    type: 'text',
    placeholder: '',
    error: '',
    id: '',
    autocomplete: 'off',
    revealable: false,
  },
)

const inputId = props.id || `field-${Math.random().toString(36).slice(2, 9)}`
const revealed = ref(false)
</script>
<style scoped>
.field {
  display:grid;
  gap:7px
}
.field label {
  font-size:10px;
  font-weight:600;
  letter-spacing:.07em
}
.input-wrap {
  position:relative
}
input {
  width:100%;
  min-height:48px;
  padding:0 15px;
  border:1px solid #d5d5c8;
  border-radius:12px;
  background:var(--cream);
  color:var(--text);
  font:inherit;
  font-size:12px
}
input:focus {
  border-color:var(--yellow);
  outline:2px solid var(--yellow);
  outline-offset:1px
}
.input-wrap:has(.reveal) input {
  padding-right:76px
}
.reveal {
  position:absolute;
  top:50%;
  right:12px;
  transform:translateY(-50%);
  padding:4px;
  border:0;
  background:none;
  color:var(--green);
  font-size:9px;
  cursor:pointer
}
.field-error {
  color:var(--busy);
  font-size:10px
}
</style>
