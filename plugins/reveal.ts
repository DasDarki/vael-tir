// v-reveal — blendet Elemente beim Scrollen sanft ein.
// Server rendert ohne .reveal (sichtbar → SEO/No-JS-freundlich);
// erst clientseitig wird verborgen + per IntersectionObserver enthüllt.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {
    mounted(el: HTMLElement, binding) {
      if (typeof IntersectionObserver === 'undefined') return
      const delay = Number(binding.value ?? 0)
      if (delay) el.style.transitionDelay = `${delay}ms`
      el.classList.add('reveal')
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              el.classList.add('is-in')
              io.unobserve(el)
            }
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      )
      io.observe(el)
    },
  })
})
