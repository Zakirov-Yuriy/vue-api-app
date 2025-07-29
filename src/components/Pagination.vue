<!-- src/components/Pagination.vue -->
<template>
  <div class="pagination" v-if="totalPages > 1">
    <button
      :disabled="currentPage === 1"
      @click="$emit('prev')"
      class="pagination-button"
    >
      ←
    </button>
    <span class="pagination-info">Страница {{ currentPage }} из {{ totalPages }}</span>
    <button
      :disabled="currentPage === totalPages"
      @click="$emit('next')"
      class="pagination-button"
    >
      →
    </button>
  </div>
</template>

<script setup>
defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
})

defineEmits(['prev', 'next'])
</script>

<style scoped>
.pagination {
  margin-top: 1rem;
  display: flex;
  gap: 10px;
  align-items: center;
}

.pagination-button {
  padding: 0.25rem 0.5rem;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.9rem;
}
</style>