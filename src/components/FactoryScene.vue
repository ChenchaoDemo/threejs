<template>
  <div class="factory-container">
    <canvas ref="renderCanvas" class="babylon-canvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

// Babylon 模块化导入
import { Engine } from '@babylonjs/core/Engines/engine'
import { Scene } from '@babylonjs/core/scene'
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera'
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader'
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder'
import '@babylonjs/core/Helpers/sceneHelpers' // 支持 createDefaultEnvironment
import '@babylonjs/loaders/glTF' // 支持 glb/gltf

const renderCanvas = ref(null)
let engine = null
let scene = null

onMounted(async () => {
  engine = new Engine(renderCanvas.value, true)
  scene = new Scene(engine)

  // 摄像机
  const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 3,
      30,
      new Vector3(0, 5, 0),
      scene
  )
  camera.attachControl(renderCanvas.value, true)

  // 灯光
  const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene)
  light.intensity = 1.2

  // 环境（地面 + 天空盒）
  scene.createDefaultEnvironment({
    createGround: true,
    createSkybox: true,
    skyboxSize: 1000
  })

  // ✅ 加载 GLB 模型
  try {
    const result = await SceneLoader.ImportMeshAsync(
        '',          // 导入所有 mesh
        '/models/',  // public/models/ 目录
        'demo4.glb', // 模型文件名
        scene
    )
    console.log('模型加载成功：', result)

    // 缩放和定位模型
    const root = result.meshes[0]
    root.scaling = new Vector3(1, 1, 1)
    root.position = Vector3.Zero()
  } catch (err) {
    console.error('模型加载失败：', err)
  }

  // 渲染循环
  engine.runRenderLoop(() => scene.render())

  // 窗口自适应
  window.addEventListener('resize', () => engine.resize())
})

onBeforeUnmount(() => {
  if (engine) engine.dispose()
})
</script>

<style scoped>
.factory-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #1e1e1e;
}
.babylon-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
