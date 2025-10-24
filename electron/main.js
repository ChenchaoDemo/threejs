// Electron 主进程入口 electron/main.js

const { app, BrowserWindow, Menu, shell, dialog, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const os = require('os');
const WebSocket = require('ws');
const net = require('net');

// 替换 robotjs 为 @nut-tree/nut-js
const { mouse, left, right, keyboard, Key, screen, Point } = require('@nut-tree/nut-js');

// 静态引入 Jimp 所有模块，避免动态 require
const Jimp = require('jimp');                  // 核心 Jimp 模块
const JimpBmp = require('@jimp/js-bmp');       // 如果你用到 bmp
// 如果以后还用到其他 jimp 插件，可以这里静态 require

let win;

async function createWindow() {
    win = new BrowserWindow({
        width: 1000,
        height: 800,
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
    });

    if (process.env.NODE_ENV === 'development') {
        win.loadURL('http://localhost:5173');
        console.log('正在启动开发服务器...');
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
        console.log('正在加载打包文件...');
    }

    win.webContents.openDevTools();

    const menuTemplate = [
        {
            label: '📂 文件',
            submenu: [
                { label: '🔄 重新加载页面', accelerator: 'Ctrl+R', click: () => win.reload() },
                { type: 'separator' },
                { label: '❌ 关闭窗口', accelerator: 'Ctrl+W', click: () => win.close() }
            ]
        },
        {
            label: '❓ 帮助',
            submenu: [
                { label: '🌐 打开官网', click: async () => await shell.openExternal('https://yanjiyukeji.com/') },
                { type: 'separator' },
                { label: 'ℹ️ 关于本软件', click: () => {
                        dialog.showMessageBox({
                            type: 'info',
                            title: '关于本软件',
                            message: '数字孪生查看器',
                            detail: '版本：v1.0.0',
                            buttons: ['确定']
                        });
                    }}
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
}

// 检查端口是否可用
function checkPort(port) {
    return new Promise(resolve => {
        const tester = net.createServer()
            .once('error', () => resolve(false))
            .once('listening', () => tester.once('close', () => resolve(true)).close())
            .listen(port);
    });
}

// 获取局域网 IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return '127.0.0.1';
}

// 启动 WebSocket 服务
async function startWebSocket(startPort = 3000) {
    let port = startPort;
    while (!(await checkPort(port))) {
        console.log(`端口 ${port} 被占用，尝试下一个端口`);
        port++;
    }
    const wss = new WebSocket.Server({ port });
    const localIP = getLocalIP();
    console.log(`WebSocket 服务启动，ws://${localIP}:${port}`);

    wss.on('connection', ws => {
        console.log('APP 已连接');
        ws.on('message', async message => {
            const data = JSON.parse(message);
            console.log('收到 APP 指令：', data);

            // 使用 nut-js 控制鼠标、键盘
            if (data.action === 'moveMouse') {
                await mouse.move(new Point(data.x, data.y));
            } else if (data.action === 'mouseClick') {
                await mouse.click(left);
            } else if (data.action === 'type') {
                await keyboard.type(data.text);
            }

            // 如果有截图或图像处理需要用 Jimp
            if (data.action === 'processImage' && data.imageBuffer) {
                // 静态 require Jimp 模块
                const image = await Jimp.read(Buffer.from(data.imageBuffer));
                image.resize(200, 200);
                const outBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
                ws.send(JSON.stringify({ type: 'imageProcessed', data: outBuffer.toString('base64') }));
            }

            if (win) win.webContents.send('app-command', message.toString());
        });
        ws.send('连接成功');

        // 发送桌面截图给手机端
        setInterval(async () => {
            try {
                const capture = await screen.capture();
                ws.send(JSON.stringify({ type: 'screenshot', image: capture.image.toPNG() }));
            } catch (err) {
                console.error('截图失败:', err);
            }
        }, 1000 / 5);
    });

    ipcMain.handle('get-local-ip', () => `ws://${localIP}:${port}`);
}

app.whenReady().then(async () => {
    await createWindow();
    await startWebSocket();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
});
