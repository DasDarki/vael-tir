<script setup lang="ts">
import {onMounted} from "vue";
import router from "@/router.ts";

definePage({
  meta: {
    parent: 'Weltkarte',
    title: 'Varkuun'
  }
});

onMounted(() => {
  router.push('/map?focus=varkuun');
});
</script>

<template>

</template>

<style scoped lang="scss">

</style>