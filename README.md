# TANG-chess
TANG-chess is a real-time multiplayer web board game built with Node.js, Socket.io &amp; Canvas. Use unique character abilities and items to survive map disasters and outsmart opponents. It features a modular MVC architecture, real-time chat, dynamic codex, and AI bots.
如何在本地运行与游玩 / How to Run Locally
1. 准备环境 / Prerequisites

CN: 在运行游戏之前，请确保你的电脑上已经安装了 Node.js。

EN: Ensure you have Node.js installed on your machine before running the game.

2. 下载代码 / Download the Code

CN: 将本项目克隆到本地，或者直接点击绿色的 Code 按钮下载 ZIP 压缩包并解压。

EN: Clone this repository to your local machine, or download and extract the ZIP file.

Bash
git clone https://github.com/huangshantianshi/TANG-chess.git
cd TANG-chess

3. 安装依赖 / Install Dependencies

CN: 在项目根目录下打开终端 / 命令行，运行以下命令来安装所有的第三方库（这会自动生成 node_modules 文件夹）：

EN: Open your terminal in the project root directory and run the following command to install required packages:

Bash
npm install

4. 配置私密头像（可选） / Configure Private Avatars (Optional)

CN: 由于本项目内置了隐私保护机制，角色头像并未上传至 GitHub。如果不配置，游戏内将默认显示角色名字首字母。如果想显示图片，请在项目根目录下手动创建一个名为 private_assets 的文件夹，并将图片（如 xsm.png, cyx_1.png）放入其中。在游戏中点击“解锁头像”并输入你的专属密钥即可。

EN: Due to privacy features, character avatars are not included in this repository. By default, characters will display their initials. To enable custom images, create a folder named private_assets in the root directory and place your image files there. In the game, click "Unlock Avatars" and enter your secret key to render them.

5. 启动服务器 / Start the Server

CN: 在终端中运行以下命令启动游戏后端引擎：

EN: Start the backend game engine by running:

Bash
node server.js
(看到提示 ✅ v26.0 服务器已启动！ 即代表成功 / You should see a success message in the console)

6. 开始游戏 / Start Playing!

🖥️ 单机测试 / Single Player:
打开浏览器，访问 (Open your browser and visit) http://localhost:3000

🏠 局域网联机 / LAN Multiplayer:
如果你和朋友连着同一个 Wi-Fi，让他们在浏览器输入你的局域网 IP 地址即可加入房间 (If friends are on the same Wi-Fi, have them visit your local IP address, e.g., http://192.168.1.100:3000).

🌍 异地联机 / Online Multiplayer:
你可以使用 ngrok 等内网穿透工具，或者将代码部署到云服务器（如 Render, Vercel, 阿里云等） (Use a tunneling tool like ngrok or deploy the source code to a cloud server for online play).
