// const { contextBridge, ipcRenderer } = require('electron');
//
// contextBridge.exposeInMainWorld('electronAPI', {
//     onAppCommand: (callback) => ipcRenderer.on('app-command', callback),
//     sendCommand: (msg) => ipcRenderer.send('app-command', msg)
// });

// const { contextBridge } = require('electron')
// const path = require('path')
//
// contextBridge.exposeInMainWorld('electronAPI', {
//     getModelPath: (fileName) => path.join(__dirname, '../public/models', fileName)
// })
//
// console.log('✅ preload.js 已加载')  // 用于调试


// preload.js
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getModelPath: (fileName) => `./models/${fileName}`  // 相对路径
})
