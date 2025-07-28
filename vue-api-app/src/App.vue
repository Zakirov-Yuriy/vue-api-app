<template>
  <div>
    <nav>
      <router-link to="/sales">Продажи</router-link> |
      <router-link to="/orders">Заказы</router-link> |
      <router-link to="/stocks">Склады</router-link> |
      <router-link to="/incomes">Доходы</router-link>
    </nav>
    <router-view />
  </div>
</template>
