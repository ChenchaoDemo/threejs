<template>
  <!-- 不需要在 DOM 里显示任何东西 -->
</template>

<script setup>
import { ref } from 'vue'
import * as THREE from 'three'
import Hls from 'hls.js'

const props = defineProps({
  url: { type: String, required: true },
  position: { type: Object, default: () => ({ x: 4, y: 2, z: -5 }) },
  size: { type: Object, default: () => ({ width: 4, height: 2.25 }) }
})

const videoScreenRef = ref(null)

function initMonitor(scene) {
  const video = document.createElement('video')
  video.autoplay = true
  video.muted = true
  video.playsInline = true
  video.crossOrigin = 'anonymous'

  // 使用 HLS
  if (Hls.isSupported()) {
    console.log('HLS 支持')
    const hls = new Hls()
    hls.loadSource(props.url)
    hls.attachMedia(video)
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(err => console.warn('视频自动播放失败:', err))
    })
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    console.log('HLS 不支持，使用 HTML5 播放')
    video.src = props.url
    video.play().catch(err => console.warn('视频自动播放失败:', err))
  }

  // ⚠️ 等待视频可播放后再挂载到 Three.js
  video.addEventListener('canplay', () => {
    console.log('视频已就绪')
    const videoTexture = new THREE.VideoTexture(video)
    videoTexture.minFilter = THREE.LinearFilter
    videoTexture.magFilter = THREE.LinearFilter
    videoTexture.format = THREE.RGBAFormat

    const geometry = new THREE.PlaneGeometry(props.size.width, props.size.height)
    const material = new THREE.MeshBasicMaterial({
      map: videoTexture,
      side: THREE.DoubleSide
    })
    const videoScreen = new THREE.Mesh(geometry, material)
    videoScreen.position.set(props.position.x, props.position.y, props.position.z)

    scene.add(videoScreen)
    videoScreenRef.value = videoScreen
  })
}

// 暴露方法给父组件
defineExpose({
  initMonitor
})
</script>
