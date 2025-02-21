<script lang="ts">
  import '../app.css'
  let { children } = $props()
</script>

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Overpass+Mono:wght@300..700&family=Overpass:ital,wght@0,100..900;1,100..900&display=swap"
  rel="stylesheet"
/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

{@render children()}
