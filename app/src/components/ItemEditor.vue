<script setup>
import BidNodeEditor from './BidNodeEditor.vue'
import { formatBmlText } from '../utils/formatText'

const props = defineProps({
  item: { type: Object, required: true },
  siblings: { type: Array, required: true },
  index: { type: Number, required: true },
})

function removeSelf() {
  props.siblings.splice(props.index, 1)
}

function moveUp() {
  if (props.index === 0) return
  const arr = props.siblings
  ;[arr[props.index - 1], arr[props.index]] = [arr[props.index], arr[props.index - 1]]
}

function moveDown() {
  const arr = props.siblings
  if (props.index === arr.length - 1) return
  ;[arr[props.index], arr[props.index + 1]] = [arr[props.index + 1], arr[props.index]]
}

function addListEntry() {
  props.item.items.push('')
}

function removeListEntry(i) {
  props.item.items.splice(i, 1)
}

function addTopBid() {
  props.item.children.push({ bid: '', desc: '', export: true, children: [] })
}
</script>

<template>
  <section class="item-editor">
    <div class="item-toolbar">
      <span class="item-type">{{ item.type }}</span>
      <div class="spacer"></div>
      <button type="button" title="Move up" :disabled="index === 0" @click="moveUp">&uarr;</button>
      <button type="button" title="Move down" :disabled="index === siblings.length - 1" @click="moveDown">&darr;</button>
      <button type="button" class="danger" title="Delete this item" @click="removeSelf">Delete</button>
    </div>

    <div v-if="item.type === 'heading'" class="heading-editor">
      <select v-model.number="item.level">
        <option :value="1">H1</option>
        <option :value="2">H2</option>
        <option :value="3">H3</option>
        <option :value="4">H4</option>
      </select>
      <input v-model="item.text" type="text" class="grow" />
      <span class="preview" v-html="formatBmlText(item.text)"></span>
    </div>

    <div v-else-if="item.type === 'paragraph'" class="paragraph-editor">
      <textarea v-model="item.text" rows="3"></textarea>
      <div class="preview block" v-html="formatBmlText(item.text)"></div>
    </div>

    <div v-else-if="item.type === 'list' || item.type === 'enum'" class="list-editor">
      <div v-for="(entry, i) in item.items" :key="i" class="list-row">
        <input :value="entry" type="text" class="grow" @input="item.items[i] = $event.target.value" />
        <span class="preview" v-html="formatBmlText(entry)"></span>
        <button type="button" class="danger" @click="removeListEntry(i)">&times;</button>
      </div>
      <button type="button" @click="addListEntry">+ Add entry</button>
    </div>

    <ul v-else-if="item.type === 'bidtable'" class="bidtable-editor">
      <BidNodeEditor
        v-for="(child, i) in item.children"
        :key="i"
        :node="child"
        :siblings="item.children"
        :index="i"
      />
      <button type="button" @click="addTopBid">+ Add top-level bid</button>
    </ul>
  </section>
</template>

<style scoped>
.item-editor {
  border: 1px solid var(--tree-line);
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.item-toolbar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
}

.item-type {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.spacer {
  flex: 1;
}

.heading-editor,
.paragraph-editor,
.list-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.paragraph-editor {
  flex-direction: column;
  align-items: stretch;
}

.grow {
  flex: 1;
}

textarea,
input,
select {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--tree-line);
  border-radius: 4px;
  padding: 0.3rem 0.5rem;
  font-family: inherit;
}

.preview {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.preview.block {
  border: 1px dashed var(--tree-line);
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
}

.list-editor {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

ul.bidtable-editor {
  margin: 0;
  padding: 0;
}

button {
  cursor: pointer;
  border: 1px solid var(--tree-line);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text);
  padding: 0.2rem 0.5rem;
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

button.danger {
  color: var(--suit-heart);
  border-color: var(--suit-heart);
}
</style>
