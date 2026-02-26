// server.js - v26.0: 增加私密图片防盗链接口
const express = require('express'); 
const app = express(); 
const http = require('http'); 
const server = http.createServer(app); 
const { Server } = require("socket.io"); 
const io = new Server(server); 
const path = require('path'); // 新增：用于处理文件路径

const gameEngine = require('./core/gameEngine');

// 静态文件目录 (只能放 index.html, css, js，不能放私密图片)
app.use(express.static('public')); 

// === 核心安全升级：私密头像专属请求接口 ===
app.get('/api/avatar/:imgName', (req, res) => {
    // 检查请求网址后面有没有带正确的密钥 ?key=tuxiangtian
    if (req.query.key === 'tuxiangtian') {
        // 密码正确，从私密文件夹发送图片
        res.sendFile(path.join(__dirname, 'private_assets', req.params.imgName));
    } else {
        // 密码错误，直接拒绝访问，返回 403 (禁止访问)
        res.status(403).send('🔒 访问被拒绝：密钥错误！');
    }
});

gameEngine.init(io);

io.on('connection', (socket) => {
    gameEngine.onPlayerConnect(socket);
});

server.listen(3000, () => {
    console.log('✅ v26.0 服务器已启动！(含服务器级图片加密)');
});