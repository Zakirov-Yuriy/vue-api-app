<template>
  <nav>
    <router-link to="/sales">Продажи</router-link> |
    <router-link to="/orders">Заказы</router-link> |
    <router-link to="/stocks">Склады</router-link> |
    <router-link to="/incomes">Доходы</router-link>
  </nav>
</template>

<script>
export default {
  name: "NavBar",
};
</script>

<style scoped>
nav {
  margin-bottom: 1rem;
}
router-link {
  margin-right: 10px;
}
</style>
