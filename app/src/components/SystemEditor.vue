<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import ItemEditor from './ItemEditor.vue'
import { saveSystem, downloadJson } from '../utils/dataApi'

const props = defineProps({
  data: { type: Object, required: true },
  filename: { type: String, required: true },
})

const emit = defineEmits(['saved'])

const local = ref(structuredClone(props.data))
const dirty = ref(false)
const status = ref(null) // { kind: 'ok' | 'error', message: string }
const newItemType = ref('paragraph')

// Reload the working copy whenever a different file is opened for editing.
// (Deliberately NOT watching props.data's contents -- that would clobber
// in-progress edits if the underlying import ever changes.)
watch(
  () => props.filename,
  () => {
    local.value = structuredClone(props.data)
    dirty.value = false
    status.value = null
  },
)

watch(
  local,
  () => {
    dirty.value = true
  },
  { deep: true },
)

function addItem() {
  const templates = {
    heading: { type: 'heading', level: 2, text: '' },
    paragraph: { type: 'paragraph', text: '' },
    list: { type: 'list', items: [''] },
    enum: { type: 'enum', items: [''] },
    bidtable: { type: 'bidtable', children: [] },
  }
  local.value.items.push(structuredClone(templates[newItemType.value]))
}

async function onSave() {
  status.value = null
  try {
    await saveSystem(props.filename, local.value)
    dirty.value = false
    status.value = { kind: 'ok', message: `Saved to src/data/${props.filename}` }
    emit('saved', props.filename)
  } catch (err) {
    status.value = {
      kind: 'error',
      message: `${err.message} -- is "npm run dev" running (the save API is dev-only)?`,
    }
  }
}

function onDownload() {
  downloadJson(props.filename, local.value)
}

function beforeUnload(e) {
  if (dirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
</script>

<template>
  <div class="system-editor">
    <div class="meta-editor">
      <label>
        Title
        <input v-model="local.meta.TITLE" type="text" />
      </label>
      <label>
        Author
        <input v-model="local.meta.AUTHOR" type="text" />
      </label>
      <label>
        Description
        <textarea v-model="local.meta.DESCRIPTION" rows="2"></textarea>
      </label>
    </div>

    <ItemEditor
      v-for="(item, i) in local.items"
      :key="i"
      :item="item"
      :siblings="local.items"
      :index="i"
    />

    <div class="add-item-bar">
      <select v-model="newItemType">
        <option value="heading">Heading</option>
        <option value="paragraph">Paragraph</option>
        <option value="list">Bulleted list</option>
        <option value="enum">Numbered list</option>
        <option value="bidtable">Bid table</option>
      </select>
      <button type="button" @click="addItem">+ Add item</button>
    </div>

    <div class="save-bar">
      <button type="button" class="primary" :disabled="!dirty" @click="onSave">
        {{ dirty ? 'Save changes' : 'Saved' }}
      </button>
      <button type="button" @click="onDownload">Download JSON</button>
      <span v-if="status" :class="['status', status.kind]">{{ status.message }}</span>
    </div>
  </div>
</template>

<style scoped>
.system-editor {
  padding-bottom: 3rem;
}

.meta-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  border: 1px solid var(--tree-line);
  border-radius: 8px;
}

.meta-editor label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.meta-editor input,
.meta-editor textarea {
  font-size: 1rem;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--tree-line);
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
  font-family: inherit;
}

.add-item-bar,
.save-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.save-bar {
  position: sticky;
  bottom: 0;
  background: var(--bg);
  padding: 0.75rem 0;
  border-top: 1px solid var(--tree-line);
}

select,
button {
  cursor: pointer;
  border: 1px solid var(--tree-line);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text);
  padding: 0.3rem 0.6rem;
}

button.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

button.primary:disabled {
  background: var(--row-hover);
  border-color: var(--tree-line);
  color: var(--text-muted);
  cursor: default;
}

.status {
  font-size: 0.85rem;
}

.status.ok {
  color: var(--suit-club);
}

.status.error {
  color: var(--suit-heart);
}
</style>
