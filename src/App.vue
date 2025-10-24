<script setup>
import { onMounted } from 'vue';
import HelloWorld from './components/HelloWorld.vue';
import FactoryScene from './components/FactoryScene.vue';


onMounted(() => {
  window.electronAPI.onAppCommand((event, msg) => {
    console.log('来自 APP 的指令:', msg);
    const wrapper = document.querySelector('.wrapper');
    if (msg === 'change-color') {
      wrapper.style.backgroundColor = 'lightblue';
    } else if (msg === 'reset') {
      wrapper.style.backgroundColor = '';
    }
  });
});
</script>

<template>
  <header>
    <div class="wrapper">
      <HelloWorld />
    </div>
  </header>
</template>

<style scoped>
header, .wrapper {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

header {
  line-height: 1.5;
}

@media (min-width: 1024px) {
  header {
    padding: 0;
  }
}

:global(html), :global(body) {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>