<script setup lang="ts">
import {onMounted} from "vue";
import router from "@/router.ts";

definePage({
  meta: {
    parent: 'Weltkarte',
    title: 'Esh\'Raen'
  }
});

onMounted(() => {
  router.push('/map?focus=eshraen');
});
</script>

<template>

</template>

<style scoped lang="scss">

</style>