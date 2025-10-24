<template>
  <div ref="container" class="three-container"></div>
  <select @change="onCameraChange" style="position:absolute;top:20px;left:20px;z-index:10;">
    <option value="bird">鸟瞰视角</option>
    <option value="roam">漫游视角</option>
  </select>
  <!-- 表格组件 -->
  <ChartTable v-if="showTable" />
  <!-- 监控组件 -->
  <MonitorVideo
      ref="monitorRef"
      url="https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/hls/xgplayer-demo.m3u8"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import ChartTable from './ChartTable.vue'
import MonitorVideo from './MonitorVideo.vue'

// 组件 ref
const monitorRef = ref(null)
const container = ref(null)

// three.js 变量
let cameraMixer = null
let cameraAction = null
let mainCamera = null
let controls = null
let initialCameraPos = new THREE.Vector3()
let initialCameraQuat = new THREE.Quaternion()
const showTable = ref(false)

const onCameraChange = (event) => {
  const value = event.target.value
  if (value === 'roam') {
    if (cameraAction && cameraMixer) {
      controls.enabled = false
      cameraAction.reset()
      cameraAction.play()
      showTable.value = false

      // 改成 20 秒后显示
      setTimeout(() => {
        if (cameraAction.isRunning()) {
          showTable.value = true
        }
      }, 20000)

      cameraMixer.addEventListener('finished', () => {
        controls.enabled = true
        showTable.value = false
      })
    }
  } else if (value === 'bird') {
    if (cameraAction) cameraAction.stop()
    if (cameraMixer) cameraMixer.stopAllAction()
    controls.enabled = true
    mainCamera.position.copy(initialCameraPos)
    mainCamera.quaternion.copy(initialCameraQuat)
    controls.update()
    showTable.value = false
  }
}


onMounted(() => {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xeeeeee)

  mainCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.value.appendChild(renderer.domElement)

  controls = new OrbitControls(mainCamera, renderer.domElement)
  controls.enableDamping = true

  // 灯光
// 环境光（整体亮度，避免阴影太黑）
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
  scene.add(ambientLight)

// 主太阳光（模拟太阳）
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.2)
  sunLight.position.set(50, 100, 50) // 模拟太阳在天空的位置
  sunLight.castShadow = true

// 阴影参数优化
  sunLight.shadow.mapSize.width = 4096
  sunLight.shadow.mapSize.height = 4096
  sunLight.shadow.camera.near = 1
  sunLight.shadow.camera.far = 200
  sunLight.shadow.camera.left = -50
  sunLight.shadow.camera.right = 50
  sunLight.shadow.camera.top = 50
  sunLight.shadow.camera.bottom = -50

  scene.add(sunLight)

// （可选）辅助观察光源位置
// const helper = new THREE.DirectionalLightHelper(sunLight, 5)
// scene.add(helper)


  //加载 glTF 模型并支持动画
  const mixers = []
  const loader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
  loader.setDRACOLoader(dracoLoader)
  // const modelPath = `file://${window.electronAPI.getModelPath('demo4.glb')}`
  const modelPath = window.electronAPI.getModelPath('demo.glb')

  loader.load(
      modelPath,
      (gltf) => {
        const model = gltf.scene
        model.scale.set(1, 1, 1)
        scene.add(model)

        // 计算模型包围盒中心
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())

        // 优化俯视 45° 相机位置
        const distance = Math.max(size.x, size.y, size.z) * 0.8
        const angle = THREE.MathUtils.degToRad(45)
        mainCamera.position.set(
            center.x + distance * Math.sin(angle),
            center.y + distance * Math.sin(angle),
            center.z + distance * Math.cos(angle)
        )
        mainCamera.lookAt(center)
        controls.target.copy(center)
        controls.update()

        // 保存初始鸟瞰视角
        initialCameraPos.copy(mainCamera.position)
        initialCameraQuat.copy(mainCamera.quaternion)

        // 遍历动画
        if (gltf.animations && gltf.animations.length) {
          gltf.animations.forEach((clip) => {
            if (clip.name === '摄像机Action') {
              cameraMixer = new THREE.AnimationMixer(mainCamera)
              cameraAction = cameraMixer.clipAction(clip)
              cameraAction.clampWhenFinished = true
              cameraAction.loop = THREE.LoopOnce
            } else {
              const mixer = new THREE.AnimationMixer(model)
              const action = mixer.clipAction(clip)
              action.play()
              mixers.push(mixer)
            }
          })
        }
      },
      (xhr) => console.log(`加载进度: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`),
      (error) => console.error('❌ 模型加载失败:', error)
  )

  const clock = new THREE.Clock()
  function render() {
    requestAnimationFrame(render)
    const delta = clock.getDelta()
    mixers.forEach((mixer) => mixer.update(delta))
    if (cameraMixer) cameraMixer.update(delta)
    if (controls.enabled) controls.update()
    renderer.render(scene, mainCamera)
  }
  render()

  // 初始化监控
  if (monitorRef.value && typeof monitorRef.value.initMonitor === 'function') {
    console.log('🎥 初始化监控...')
    monitorRef.value.initMonitor(scene)
  }

  window.addEventListener('resize', () => {
    mainCamera.aspect = window.innerWidth / window.innerHeight
    mainCamera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
})
</script>
