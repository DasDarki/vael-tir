<template>
  <div class="layout">
    <AppHeader />
    <main class="layout__main">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.layout__main {
  flex: 1;
}
</style>
