<template>
  <div class="data-table">
    <table>
      <thead>
      <tr>
        <th>指标</th>
        <th>数值</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="(item, index) in data" :key="index">
        <td>{{ item.name }}</td>
        <td>{{ item.value }}</td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => [
      { name: '温度', value: '25°C' },
      { name: '湿度', value: '60%' },
      { name: '压力', value: '101.3 kPa' },
      { name: '速度', value: '5 m/s' },
      { name: '电流', value: '1.2 A' }
    ]
  }
})
</script>

<style scoped>
.data-table {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 220px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ccc;
  padding: 10px;
  z-index: 999; /* 确保高于 three-container */
}
.data-table table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  border: 1px solid #aaa;
  padding: 4px;
  text-align: center;
  font-size: 12px;
}
</style>
