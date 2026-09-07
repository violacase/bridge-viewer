<script setup>
import { computed } from 'vue'
import BidNode from './BidNode.vue'
import { formatBmlText } from '../utils/formatText'

const props = defineProps({
  data: { type: Object, required: true },
})

// Human-readable names for the LaTeX-only content types bml2json.py can't
// render (see its own skipped_types comment); falls back to the raw type
// name for anything not listed here, so an unrecognized future type still
// shows *something* rather than silently vanishing from this notice too.
const SKIPPED_TYPE_LABELS = {
  DIAGRAM: 'hand diagram',
  TABLE: 'table',
  BIDDING: 'bidding record',
  DESCRIPTION: 'formatted description block',
}

// data.skipped_types is a flat list with one entry per skipped item (so a
// file with three diagrams lists "DIAGRAM" three times) -- group it into
// counts so the notice reads as "2 hand diagrams, 1 table" instead of a
// repeated list.
const skippedSummary = computed(() => {
  const counts = new Map()
  for (const type of props.data.skipped_types || []) {
    counts.set(type, (counts.get(type) || 0) + 1)
  }
  return [...counts.entries()].map(([type, count]) => ({
    type,
    count,
    label: SKIPPED_TYPE_LABELS[type] || type.toLowerCase(),
  }))
})
</script>

<template>
  <header class="system-header">
    <h1 class="title">{{ data.meta.TITLE || 'Untitled system' }}</h1>
    <p v-if="data.meta.AUTHOR" class="author">{{ data.meta.AUTHOR }}</p>
    <p
      v-if="data.meta.DESCRIPTION"
      class="description prose"
      v-html="formatBmlText(data.meta.DESCRIPTION)"
    ></p>
    <p v-if="skippedSummary.length" class="skipped-notice">
      Not shown here:
      <template v-for="(s, i) in skippedSummary" :key="s.type">
        <template v-if="i > 0">, </template>{{ s.count }} {{ s.label }}<template v-if="s.count > 1">s</template>
      </template>
      -- this content only exists in the original .bml/PDF.
    </p>
  </header>

  <template v-for="(item, i) in data.items" :key="i">
    <component
      v-if="item.type === 'heading'"
      :is="`h${item.level}`"
      :class="`level-${item.level}`"
      v-html="formatBmlText(item.text)"
    />
    <p v-else-if="item.type === 'paragraph'" class="prose" v-html="formatBmlText(item.text)"></p>
    <ul v-else-if="item.type === 'list'" class="prose">
      <li v-for="(li, j) in item.items" :key="j" v-html="formatBmlText(li)"></li>
    </ul>
    <ol v-else-if="item.type === 'enum'" class="prose">
      <li v-for="(li, j) in item.items" :key="j" v-html="formatBmlText(li)"></li>
    </ol>
    <ul v-else-if="item.type === 'bidtable'" class="bidtable">
      <BidNode v-for="(child, k) in item.children" :key="k" :node="child" :depth="1" />
    </ul>
  </template>
</template>

<style scoped>
.system-header {
  margin-bottom: 2rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--tree-line);
}

.title {
  margin: 0 0 0.3rem;
  font-size: 2rem;
}

.author {
  color: var(--text-muted);
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.description {
  color: var(--text-muted);
  margin: 0;
}

.skipped-notice {
  margin: 0.75rem 0 0;
  padding-left: 0.6rem;
  border-left: 2px solid var(--suit-diamond);
  color: var(--text-muted);
  font-size: 0.85rem;
  max-width: 42rem;
}

/* Running prose stays within a comfortable reading measure; the bid tree
   below is tabular data, not prose, so it's exempt and uses full width. */
.prose {
  max-width: 42rem;
}

:deep(.level-1) {
  margin: 2.5rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--tree-line);
  font-size: 1.5rem;
}

:deep(.level-2) {
  margin: 1.75rem 0 0.75rem;
  font-size: 1.2rem;
}

:deep(.level-3),
:deep(.level-4) {
  margin: 1.25rem 0 0.5rem;
  font-size: 1.05rem;
  color: var(--text-muted);
}

ul.bidtable {
  margin: 0 0 1.5rem;
  padding: 0;
}
</style>
