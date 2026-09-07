<script setup>
import { ref, computed } from 'vue'
import { formatBid, formatBmlText } from '../utils/formatText'

const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 1 },
})

const hasChildren = computed(() => props.node.children && props.node.children.length > 0)
// Expand the first couple of levels by default; deep rebids stay collapsed
// until clicked, since real systems nest 5-6 levels deep.
const expanded = ref(props.depth <= 2)

function toggle() {
  if (hasChildren.value) expanded.value = !expanded.value
}
</script>

<template>
  <li class="bid-node">
    <div class="bid-row" :class="{ clickable: hasChildren }" @click="toggle">
      <span class="toggle" aria-hidden="true">{{ hasChildren ? (expanded ? '−' : '+') : '' }}</span>
      <span class="bid" v-html="formatBid(node.bid)"></span>
      <span class="desc" v-html="formatBmlText(node.desc)"></span>
    </div>
    <ul v-if="hasChildren && expanded" class="children">
      <BidNode v-for="(child, i) in node.children" :key="i" :node="child" :depth="depth + 1" />
    </ul>
  </li>
</template>

<style scoped>
.bid-node {
  list-style: none;
}

.bid-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.15rem 0.25rem;
  border-radius: 4px;
}

.bid-row.clickable {
  cursor: pointer;
}

.bid-row.clickable:hover {
  background: var(--row-hover);
}

.toggle {
  width: 1rem;
  flex: none;
  color: var(--text-muted);
  font-family: monospace;
}

.bid {
  flex: none;
  min-width: 3.5rem;
  font-weight: 600;
}

.desc {
  color: var(--text);
}

ul.children {
  margin: 0;
  padding-left: 1.25rem;
  border-left: 1px solid var(--tree-line);
}
</style>
