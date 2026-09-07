<script setup>
import { ref, computed } from 'vue'
import SystemDocument from './components/SystemDocument.vue'
import SystemEditor from './components/SystemEditor.vue'
import { saveSystem } from './utils/dataApi'

// Vite triggers a full page reload whenever a file matching this glob is
// added or removed (e.g. the editor's "New system" or "Save" writing into
// src/data/), so this list stays in sync with the folder without any extra
// wiring -- see https://vitejs.dev/guide/features.html#glob-import.
const modules = import.meta.glob('./data/*.json', { eager: true, import: 'default' })

function keyFor(path) {
  return path.replace('./data/', '').replace(/\.json$/, '')
}

const systems = {}
for (const [path, data] of Object.entries(modules)) {
  systems[keyFor(path)] = data
}

const currentKey = ref(Object.keys(systems)[0])
const current = computed(() => systems[currentKey.value])
const mode = ref('view') // 'view' | 'edit'

const creatingNew = ref(false)
const newSystemName = ref('')
const createError = ref(null)

async function createSystem() {
  const name = newSystemName.value.trim()
  if (!/^[A-Za-z0-9._-]+$/.test(name)) {
    createError.value = 'Use letters, digits, dots, dashes and underscores only.'
    return
  }
  createError.value = null
  const template = {
    meta: { TITLE: name, AUTHOR: '', DESCRIPTION: '' },
    items: [],
    skipped_types: [],
  }
  try {
    await saveSystem(`${name}.json`, template)
    // Vite will full-reload once it notices the new file; nothing else to do.
  } catch (err) {
    createError.value = `${err.message} -- is "npm run dev" running?`
  }
}
</script>

<template>
  <div class="app">
    <div class="toolbar">
      <nav v-if="Object.keys(systems).length" class="system-picker">
        <button
          v-for="key in Object.keys(systems)"
          :key="key"
          :class="{ active: key === currentKey }"
          @click="currentKey = key"
        >
          {{ systems[key].meta.TITLE || key }}
        </button>
        <button class="new-system" title="Create a new system" @click="creatingNew = !creatingNew">+ New</button>
      </nav>

      <div class="mode-toggle">
        <button :class="{ active: mode === 'view' }" @click="mode = 'view'">View</button>
        <button :class="{ active: mode === 'edit' }" @click="mode = 'edit'">Edit</button>
      </div>
    </div>

    <div v-if="creatingNew" class="new-system-form">
      <input v-model="newSystemName" type="text" placeholder="system-XY-GJP" @keyup.enter="createSystem" />
      <button type="button" @click="createSystem">Create</button>
      <span v-if="createError" class="error">{{ createError }}</span>
    </div>

    <main v-if="current">
      <SystemDocument v-if="mode === 'view'" :data="current" />
      <SystemEditor v-else :data="current" :filename="`${currentKey}.json`" />
    </main>
    <p v-else class="empty">No systems found in src/data/. Use "+ New" to create one.</p>
  </div>
</template>

<style scoped>
.app {
  max-width: 60rem;
  margin: 0 auto;
  padding: 1.5rem 1rem 4rem;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.system-picker,
.mode-toggle {
  display: flex;
  gap: 0.5rem;
}

.system-picker button,
.mode-toggle button {
  background: var(--row-hover);
  border: 1px solid var(--tree-line);
  border-radius: 6px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  color: var(--text);
}

.system-picker button.active,
.mode-toggle button.active {
  border-color: var(--accent);
  color: var(--accent);
}

.new-system {
  color: var(--text-muted);
  border-style: dashed;
}

.new-system-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.new-system-form input {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--tree-line);
  border-radius: 4px;
  padding: 0.3rem 0.5rem;
}

.error {
  color: var(--suit-heart);
  font-size: 0.85rem;
}

.empty {
  color: var(--text-muted);
}
</style>
