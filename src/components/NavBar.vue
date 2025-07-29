<template>
  <nav class="navbar">
    <router-link
        v-for="link in links"
        :key="link.path"
        :to="link.path"
        active-class="active"
        class="nav-link"
    >
      {{ link.title }}
    </router-link>
  </nav>
</template>

<script setup>
const links = [
  {path: '/sales', title: 'Продажи'},
  {path: '/orders', title: 'Заказы'},
  {path: '/stocks', title: 'Склады'},
  {path: '/incomes', title: 'Поступления'}
]
</script>

<style scoped>
.navbar {
  background: #2c3e50;
  padding: 1rem;
  margin-bottom: 2rem;
}

.nav-link {
  color: white;
  margin: 0 1rem;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  background: #42b983;
}
</style>
