<script setup lang="ts">
import {onMounted} from "vue";
import router from "@/router.ts";

definePage({
  meta: {
    parent: 'Weltkarte',
    title: 'Calythar'
  }
});

onMounted(() => {
  router.push('/map?focus=calythar');
});
</script>

<template>

</template>

<style scoped lang="scss">

</style>