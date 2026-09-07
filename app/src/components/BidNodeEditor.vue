<script setup>
import { formatBid, formatBmlText } from '../utils/formatText'

// `node` and `siblings` are reactive references into the editor's own data
// tree (see SystemEditor.vue) -- mutating them here (splice, property
// assignment) updates that tree directly, same pattern BidNode.vue's
// read-only recursion uses for rendering.
const props = defineProps({
  node: { type: Object, required: true },
  siblings: { type: Array, required: true },
  index: { type: Number, required: true },
})

function addChild() {
  props.node.children.push({ bid: '', desc: '', export: true, children: [] })
}

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
</script>

<template>
  <li class="bid-node-editor">
    <div class="row">
      <div class="reorder">
        <button type="button" title="Move up" :disabled="index === 0" @click="moveUp">&uarr;</button>
        <button type="button" title="Move down" :disabled="index === siblings.length - 1" @click="moveDown">&darr;</button>
      </div>

      <div class="fields">
        <div class="field-row">
          <input
            v-model="node.bid"
            class="bid-input"
            type="text"
            placeholder="bid (e.g. 1C, P, D)"
          />
          <span class="preview bid-preview" v-html="formatBid(node.bid || '?')"></span>

          <label class="export-toggle" title="Include this bid when rendering/exporting">
            <input v-model="node.export" type="checkbox" />
            export
          </label>

          <button type="button" class="danger" title="Delete this bid and its rebids" @click="removeSelf">
            Delete
          </button>
        </div>

        <div class="field-row">
          <textarea
            v-model="node.desc"
            class="desc-input"
            rows="2"
            placeholder="description -- use !c !d !h !s for suits, *bold*, /italic/, \n for a line break"
          ></textarea>
          <div class="preview desc-preview" v-html="formatBmlText(node.desc)"></div>
        </div>

        <button type="button" class="add-child" @click="addChild">+ Add rebid under {{ node.bid || '(this bid)' }}</button>
      </div>
    </div>

    <ul v-if="node.children.length" class="children">
      <BidNodeEditor
        v-for="(child, i) in node.children"
        :key="i"
        :node="child"
        :siblings="node.children"
        :index="i"
      />
    </ul>
  </li>
</template>

<style scoped>
.bid-node-editor {
  list-style: none;
  margin: 0.35rem 0;
}

.row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.reorder {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reorder button {
  width: 1.5rem;
  line-height: 1;
  padding: 0.15rem 0;
}

.fields {
  flex: 1;
  min-width: 0;
  background: var(--row-hover);
  border: 1px solid var(--tree-line);
  border-radius: 6px;
  padding: 0.5rem;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.bid-input {
  width: 7rem;
  font-weight: 600;
}

.desc-input {
  flex: 1;
  font-family: inherit;
  resize: vertical;
}

.preview {
  font-size: 0.9rem;
  color: var(--text-muted);
  min-width: 2rem;
}

.desc-preview {
  flex: 1;
  padding: 0.25rem 0.4rem;
  background: var(--bg);
  border-radius: 4px;
  border: 1px dashed var(--tree-line);
}

.export-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
}

button.danger {
  color: var(--suit-heart);
  border-color: var(--suit-heart);
  background: transparent;
}

.add-child {
  font-size: 0.85rem;
  background: transparent;
  color: var(--accent);
  border-color: var(--accent);
}

ul.children {
  margin: 0;
  padding-left: 1.5rem;
  border-left: 1px solid var(--tree-line);
}

input,
textarea {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--tree-line);
  border-radius: 4px;
  padding: 0.25rem 0.4rem;
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
</style>
