import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { SAVE_API_AVAILABLE } from './utils/dataApi'

// TEMPORARY debug hook -- remove after diagnosing the env.DEV mismatch.
window.__DEBUG = { SAVE_API_AVAILABLE, DEV: import.meta.env.DEV, PROD: import.meta.env.PROD, MODE: import.meta.env.MODE }

createApp(App).mount('#app')
