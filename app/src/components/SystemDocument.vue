<script setup>
import BidNode from './BidNode.vue'
import { formatBmlText } from '../utils/formatText'

defineProps({
  data: { type: Object, required: true },
})
</script>

<template>
  <header class="system-header">
    <h1>{{ data.meta.TITLE || 'Untitled system' }}</h1>
    <p v-if="data.meta.AUTHOR" class="author">{{ data.meta.AUTHOR }}</p>
    <p
      v-if="data.meta.DESCRIPTION"
      class="description"
      v-html="formatBmlText(data.meta.DESCRIPTION)"
    ></p>
  </header>

  <template v-for="(item, i) in data.items" :key="i">
    <component
      v-if="item.type === 'heading'"
      :is="`h${item.level}`"
      v-html="formatBmlText(item.text)"
    />
    <p v-else-if="item.type === 'paragraph'" v-html="formatBmlText(item.text)"></p>
    <ul v-else-if="item.type === 'list'">
      <li v-for="(li, j) in item.items" :key="j" v-html="formatBmlText(li)"></li>
    </ul>
    <ol v-else-if="item.type === 'enum'">
      <li v-for="(li, j) in item.items" :key="j" v-html="formatBmlText(li)"></li>
    </ol>
    <ul v-else-if="item.type === 'bidtable'" class="bidtable">
      <BidNode v-for="(child, k) in item.children" :key="k" :node="child" :depth="1" />
    </ul>
  </template>
</template>

<style scoped>
.system-header {
  margin-bottom: 1.5rem;
}

.author {
  color: var(--text-muted);
  margin: 0.1rem 0;
}

.description {
  color: var(--text-muted);
}

ul.bidtable {
  margin: 0 0 1.5rem;
  padding: 0;
}
</style>
