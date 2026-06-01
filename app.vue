<script setup lang="ts">
// Globale SEO-Grundlage; einzelne Seiten verfeinern via useSeoMeta().
useSeoMeta({
  ogImage: '/logo.png',
  description:
    'Vael Tir — der Atlas des Luminoxischen Zeitalters. Weltkarte, Kompendium der Flora & Fauna, Kalender und Werkzeuge für den Spieltisch.',
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
