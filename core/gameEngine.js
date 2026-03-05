// core/gameEngine.js - v26.1: 单机 PVE 融合模式支持
const ROLES = require('../data/roles'); const ITEMS = require('../data/items'); const ZONES = require('../data/zones'); const MANUAL = require('../data/manual');

let io; const GRID_SIZE = 20;

let players = {}; let playerIds = []; let traps = []; let plantedSeeds = []; let groundItems = [];
let currentTurnIndex = 0; let turnPhase = 'WAITING'; let TIME_PHASES = ['早晨', '早晨', '正午', '下午', '下午', '傍晚', '午夜'];
let globalRound = 1; let dayCount = 1; let dayPhaseIndex = 0; let weatherEffect = null; let classMission = null; let activeSideQuests = [];
let activeGlobalEvents = { invisible: 0, boarsRound: 0, sandstorm: 0, flood: 0 }; let boars = []; let guards = []; let waterWalls = []; let isAutoRun = false; let autoPlayInterval = null;
let targetScore = 0; let gameOver = false; let winner = null;

function getZoneKey(x, y) { for (let key in ZONES) { let r = ZONES[key].range; if (x >= r[0] && x <= r[1] && y >= r[2] && y <= r[3]) return key; } return null; }
function getRealPlayer(p) { return p.isSummon ? players[p.ownerId] : p; }
function giveItem(p, itemId) { let rp = getRealPlayer(p); let c = rp.inventory[itemId] || 0; if (c < 3 && (c > 0 || Object.keys(rp.inventory).length < 5)) { rp.inventory[itemId] = c + 1; return true; } return false; }
function initYnqBlocks(pid) { for(let i=1; i<=3; i++) { let bx, by; while(true) { bx = Math.floor(Math.random()*GRID_SIZE); by = Math.floor(Math.random()*GRID_SIZE); if (getZoneKey(bx, by)) break; } groundItems.push({ x: bx, y: by, itemId: 'star_block_'+i, ownerId: pid }); } }
function isSafeZone(x, y) { let z = getZoneKey(x, y); return z && (z.includes('dorm') || z.includes('class') || z === 'canteen' || z === 'church'); }
function isMyTurn(id) { return playerIds[currentTurnIndex] === id; }

function resetGameState() {
    players = {}; playerIds = []; traps = []; plantedSeeds = []; groundItems = []; currentTurnIndex = 0; turnPhase = 'WAITING'; globalRound = 1; dayCount = 1; dayPhaseIndex = 0; weatherEffect = null; classMission = null; activeSideQuests = []; activeGlobalEvents = { invisible: 0, boarsRound: 0, sandstorm: 0, flood: 0 }; boars = []; guards = []; waterWalls = []; isAutoRun = false; if (autoPlayInterval) { clearInterval(autoPlayInterval); autoPlayInterval = null; } gameOver = false; winner = null;
}

function init(socketIoInstance) { io = socketIoInstance; }

function onPlayerConnect(socket) {
    socket.emit('initData', { zones: ZONES, items: ITEMS, mapImage: 'map_bg.jpg', roles: ROLES, manual: MANUAL }); broadcastState();
    socket.on('restartGame', () => { resetGameState(); io.emit('gameLog', `🔄 游戏已被强制重置，所有人进度清空，请重新选择角色！`); broadcastState(); });
    socket.on('chatMessage', (text) => { if (!players[socket.id] || typeof text !== 'string') return; let p = players[socket.id]; let safeText = text.trim().substring(0, 150); if (safeText) { io.emit('chatMessage', { role: p.role, name: p.name, color: p.color, text: safeText }); } });
    socket.on('setTargetScore', (score) => { let s = parseInt(score); if (!isNaN(s) && s > 0) { targetScore = s; io.emit('gameLog', `🏆 获胜目标分数已被设定为：${s} 分！`); broadcastState(); } });

    // === 核心修改：无缝插入 AI 的单机模式接口 ===
    socket.on('addBots', (count) => {
        if (gameOver) return;
        let c = parseInt(count) || 3;
        // 过滤掉不可选角色（zjy）和已经被真人选走的角色
        const roleKeys = Object.keys(ROLES).filter(k => k !== 'zjy' && !Object.values(players).some(p => p.role === k));
        
        let added = 0;
        for (let i = 0; i < c; i++) {
            if (roleKeys.length === 0) break; // 角色池被抽空了
            let rKey = roleKeys.splice(Math.floor(Math.random() * roleKeys.length), 1)[0]; 
            let r = ROLES[rKey]; 
            let sx, sy; while(true) { sx = Math.floor(Math.random()*GRID_SIZE); sy = Math.floor(Math.random()*GRID_SIZE); if (!getZoneKey(sx, sy)) break; }
            let botId = 'BOT_' + Math.random().toString(36).substr(2, 5);
            
            players[botId] = { x: sx, y: sy, playerId: botId, role: rKey, name: r.name.split(' ')[0]+'(AI)', gender: r.gender, str: r.str, int: r.int, color: r.color, score: 50, movesLeft: 0, lastRoll: 0, isJailed: false, isTrapped: false, inventory: {}, buffs: [], questProgress: { visitedStables: [], fruitCount: 0 }, isControlling: null, isBot: true, activeEntity: 'self', movedThisTurn: false, horseBuff: false, minRoll: 1, flashlightRounds: 0, drinksUsedThisTurn: 0, cyxForm: 1, cyxExtraTurns: 2, eggReady: false };
            playerIds.push(botId); 
            if (rKey === 'ynq') initYnqBlocks(botId);
            added++;
        }
        
        isAutoRun = true; 
        if (autoPlayInterval) clearInterval(autoPlayInterval); 
        // 稍微放慢心跳速度(800ms)，让你能看清 AI 的动作，否则瞬间闪现
        autoPlayInterval = setInterval(botLogicTick, 800); 
        
        io.emit('gameLog', `🤖 成功加入了 ${added} 名 AI 玩家！PVE 单机模式启动！`); 
        broadcastState(); 
    });

    socket.on('selectRole', (roleKey) => {
        if (!ROLES[roleKey] || Object.values(players).some(p => p.role === roleKey) || players[socket.id]) return; 
        let r = ROLES[roleKey]; let sx, sy; while(true) { sx = Math.floor(Math.random()*GRID_SIZE); sy = Math.floor(Math.random()*GRID_SIZE); if (!getZoneKey(sx, sy)) break; }
        players[socket.id] = { x: sx, y: sy, playerId: socket.id, role: roleKey, name: r.name, gender: r.gender, str: r.str, int: r.int, color: r.color, score: 50, movesLeft: 0, lastRoll: 0, isJailed: false, isTrapped: false, inventory: {}, buffs: [], questProgress: { visitedStables: [], fruitCount: 0 }, isControlling: null, isBot: false, activeEntity: 'self', movedThisTurn: false, horseBuff: false, minRoll: 1, flashlightRounds: 0, drinksUsedThisTurn: 0, cyxForm: 1, cyxExtraTurns: 2, eggReady: false };
        playerIds.push(socket.id); io.emit('gameLog', `✨ ${r.name} 降临了校园！`); if (roleKey === 'ynq') initYnqBlocks(socket.id); broadcastState();
    });

    socket.on('disconnect', () => { if (players[socket.id]) { if (players[socket.id].zjyId) delete players[players[socket.id].zjyId]; io.emit('gameLog', `👋 ${players[socket.id].name} 退出了游戏。`); delete players[socket.id]; playerIds = playerIds.filter(id => id !== socket.id); if (currentTurnIndex >= playerIds.length) currentTurnIndex = 0; } broadcastState(); });
    socket.on('buyItem', (itemId) => { if (gameOver || !isMyTurn(socket.id)) return; const p = players[socket.id]; if (!ZONES[getZoneKey(p.x, p.y)]?.shop?.includes(itemId) || p.score < ITEMS[itemId].cost) return; if (giveItem(p, itemId)) { p.score -= ITEMS[itemId].cost; io.emit('gameLog', `🛒 ${p.name} 购买了 [${ITEMS[itemId].name}]`); broadcastState(); } else { socket.emit('gameLog', '❌ 堆叠上限或背包已满！'); } });
    socket.on('makeWish', () => { if (gameOver || !isMyTurn(socket.id)) return; const p = getRealPlayer(players[socket.id]); if (getZoneKey(p.x, p.y) !== 'fountain' || p.score < 5) return; p.score -= 5; let r = Math.random(); if (r < 0.1) { giveItem(p, 'cheat_sheet'); io.emit('gameLog', `⛲ ${p.name} 许愿获得 [作弊小抄]！`); } else if (r < 0.3) { giveItem(p, 'water'); io.emit('gameLog', `⛲ ${p.name} 许愿获得 [冰水]！`); } else if (r < 0.31) { p.score += 50; io.emit('gameLog', `⛲ 奇迹！${p.name} 许愿获得了 50 积分！`); } else { io.emit('gameLog', `⛲ 喷泉冒泡：感谢游玩此游戏！`); } broadcastState(); });
    
    socket.on('cyxEvolve', () => { if (gameOver || !isMyTurn(socket.id) || turnPhase !== 'WAITING') return; let p = players[socket.id]; if (!p || p.role !== 'cyx') return; let oldName = p.name.split(' ')[0]; if (p.cyxForm === 1 && p.score >= 125) { p.cyxForm = 2; p.str = 5; p.int = 3; p.score += 20; p.name = oldName + ' (黄鳝天师)'; p.cyxExtraTurns = 0; io.emit('gameLog', `✨ ${oldName}长大了，成为了“黄鳝天师”！(奖励20分)`); broadcastState(); } else if (p.cyxForm === 2 && p.score >= 225) { p.cyxForm = 3; p.str = 3; p.int = 4; p.score += 20; p.name = oldName + ' (荷包蛋)'; p.eggReady = false; io.emit('gameLog', `🍳 ${oldName}长大了，成为了“荷包蛋”！(奖励20分)`); broadcastState(); } });
    socket.on('cyxTeleport', (targetId) => { if (gameOver || !isMyTurn(socket.id) || turnPhase !== 'WAITING') return; let p = players[socket.id]; if (p.role !== 'cyx' || p.cyxForm !== 2 || p.score < 15) return; let target = players[targetId]; if (!target) return; let validSpots = []; for (let dx=-1; dx<=1; dx++) { for (let dy=-1; dy<=1; dy++) { if (dx===0 && dy===0) continue; let nx = target.x + dx, ny = target.y + dy; if (nx>=0 && nx<GRID_SIZE && ny>=0 && ny<GRID_SIZE && !isInvalidBoarZone(nx, ny)) { validSpots.push({x: nx, y: ny}); } } } if (validSpots.length === 0) { socket.emit('gameLog', '❌ 目标周围拥挤，无法传送！'); return; } let spot = validSpots[Math.floor(Math.random() * validSpots.length)]; p.score -= 15; p.x = spot.x; p.y = spot.y; io.emit('gameLog', `🐍 遁地之术！${p.name} 消耗15分瞬间出现在了 ${target.name} 身旁！`); broadcastState(); });
    socket.on('useAbility', () => { if (gameOver || !isMyTurn(socket.id)) return; const p = players[socket.id]; if (p.role !== 'jzx' || p.zjyId || p.score < 25) return; let cost = Math.max(25, Math.floor(p.score / 2)); p.score -= cost; let zjyId = 'ZJY_' + socket.id; players[zjyId] = { x: p.x, y: p.y, playerId: zjyId, role: 'zjy', name: 'zjy(召唤物)', gender: 'female', str: 3, int: 3, color: '#ff9ff3', score: 0, movesLeft: 0, lastRoll: 0, isJailed: false, isTrapped: false, inventory: p.inventory, buffs: p.buffs, questProgress: p.questProgress, isControlling: null, isBot: false, isSummon: true, ownerId: socket.id, createRound: globalRound, refundAmount: Math.floor(cost / 2), movedThisTurn: false, horseBuff: false, minRoll: 1, flashlightRounds: 0, drinksUsedThisTurn: 0 }; p.zjyId = zjyId; io.emit('gameLog', `🌟 魔法闪耀！${p.name} 献祭 ${cost} 分，召唤了 [zjy]！`); broadcastState(); });
    socket.on('pray', () => { if (gameOver || !isMyTurn(socket.id) || turnPhase !== 'MOVING') return; let c = players[socket.id]; let m = c.activeEntity === 'zjy' ? players[c.zjyId] : (c.role === 'lds' && c.isControlling ? players[c.isControlling] || c : c); let spender = (c.role === 'lds' && c.isControlling) ? c : m; if (getZoneKey(m.x, m.y) !== 'church' || spender.movesLeft <= 0) return; let rp = getRealPlayer(m); let earn = spender.movesLeft * 3; rp.score += earn; io.emit('gameLog', `⛪ ${m.name} 虔诚祈祷，将 ${spender.movesLeft} 步转化为 ${earn} 积分！`); spender.movesLeft = 0; broadcastState(); });
    socket.on('getHorse', () => { if (gameOver || !isMyTurn(socket.id) || turnPhase !== 'MOVING') return; let c = players[socket.id]; let m = c.activeEntity === 'zjy' ? players[c.zjyId] : (c.role === 'lds' && c.isControlling ? players[c.isControlling] || c : c); let spender = (c.role === 'lds' && c.isControlling) ? c : m; if (getZoneKey(m.x, m.y) !== 'stables' || spender.movesLeft <= 0 || m.movedThisTurn) return; if (giveItem(m, 'horse')) { io.emit('gameLog', `🐴 ${m.name} 消耗剩余步数，牵走了一匹马！`); spender.movesLeft = 0; broadcastState(); } else socket.emit('gameLog', '❌ 背包满'); });

    socket.on('useItem', (data) => {
        if (gameOver || !isMyTurn(socket.id)) return; const p = players[socket.id].activeEntity === 'zjy' ? players[players[socket.id].zjyId] : players[socket.id]; const itemId = data.itemId;
        let rp = getRealPlayer(p); if (!rp.inventory[itemId] || rp.inventory[itemId] <= 0) return; let used = false; const item = ITEMS[itemId];
        
        if (item.type === 'attack') {
            if (!players[data.targetId]) return; let target = players[data.targetId]; if (Math.abs(p.x - target.x) + Math.abs(p.y - target.y) > item.range) return;
            getRealPlayer(target).score = Math.max(0, getRealPlayer(target).score - item.dmg); io.emit('gameLog', `💥 ${p.name} 攻击了 ${target.name}！`); used = true;
        } else if (item.type === 'steal') {
            if (!players[data.targetId]) return; let target = players[data.targetId]; if (target.gender !== 'male' || Math.abs(p.x - target.x) + Math.abs(p.y - target.y) > item.range) return;
            let rt = getRealPlayer(target); let stealVal = Math.min(rt.score, item.stealAmount); rt.score -= stealVal; rp.score += stealVal; io.emit('gameLog', `💋 ${p.name} 偷走了 ${target.name} ${stealVal} 分！`); used = true;
        } else if (item.type === 'report') {
            if (!players[data.targetId]) return; let target = players[data.targetId]; let rt = getRealPlayer(target);
            if (rt.score <= rp.score) { socket.emit('gameLog', `❌ 目标积分没有你高！`); return; }
            rt.x = 9; rt.y = 1; rt.isJailed = true; rt.score = Math.max(0, rt.score - 30); io.emit('gameLog', `🚨 举报生效！${rp.name} 举报了 ${target.name}！关禁闭扣30分！`); used = true;
        } else if (item.type === 'phone') {
            if (TIME_PHASES[dayPhaseIndex] !== '下午') { socket.emit('gameLog', `❌ 电话只能在【下午】使用！`); return; }
            if (!players[data.targetId]) return; let target = players[data.targetId]; let validSpots = [];
            for(let dx=-4; dx<=4; dx++) { for(let dy=-4; dy<=4; dy++) { if(Math.abs(dx)+Math.abs(dy) === 4) { let gx = target.x + dx; let gy = target.y + dy; if(gx>=0 && gx<GRID_SIZE && gy>=0 && gy<GRID_SIZE && !isInvalidBoarZone(gx, gy)) validSpots.push({x:gx, y:gy}); } } }
            if(validSpots.length > 0) { let spot = validSpots[Math.floor(Math.random()*validSpots.length)]; guards.push({x: spot.x, y: spot.y}); io.emit('gameLog', `☎️ ${rp.name} 拨打了保卫科电话！保安出现了！`); used = true; } else { socket.emit('gameLog', `❌ 目标周围没有空地！`); return; }
        } else if (itemId.startsWith('star_block_')) {
            rp.score += 5; rp.questProgress.usedStarBlocks = (rp.questProgress.usedStarBlocks || 0) + 1; used = true; io.emit('gameLog', `⭐ ${rp.name} 使用星块，获得 5 分！`);
            if (rp.questProgress.usedStarBlocks === 3) { rp.buffs.push('star_upgraded'); io.emit('gameLog', `✨ 奇迹绽放！${rp.name} 永久升级！`); }
        } else if (item.type === 'seed') { 
            if (getZoneKey(p.x, p.y) !== 'farm') return; plantedSeeds.push({ x: p.x, y: p.y, harvestRound: globalRound + 2, mature: false }); io.emit('gameLog', `🌱 ${p.name} 种下了种子。`); used = true; 
        } else if (itemId === 'energy_drink') { 
            if ((rp.drinksUsedThisTurn || 0) >= 6) { socket.emit('gameLog', '❌ 肚子撑不下了！一回合最多只能喝 6 罐功能饮料！'); return; }
            rp.drinksUsedThisTurn = (rp.drinksUsedThisTurn || 0) + 1; p.movesLeft += 3; used = true; io.emit('gameLog', `🥤 喝下饮料，步数+3 (本回合已喝 ${rp.drinksUsedThisTurn}/6 罐)`); 
        } else if (itemId === 'water') { 
            p.buffs.push('immune_heat'); used = true; io.emit('gameLog', `🧊 免疫炎热！`); if (weatherEffect === 'HEAT' && turnPhase === 'MOVING' && p.lastRoll > 3) p.movesLeft = p.lastRoll; 
        } else if (itemId === 'warmer') { 
            p.buffs.push('immune_cold'); used = true; io.emit('gameLog', `🔥 免疫寒冷！`); if (weatherEffect === 'COLD' && turnPhase === 'MOVING' && p.lastRoll > 3) p.movesLeft = p.lastRoll; 
        } else if (itemId === 'bicycle') { 
            if (getZoneKey(p.x, p.y) !== null) return; io.emit('gameLog', `🚲 ${p.name} 骑车获额外回合！`); turnPhase = 'WAITING'; used = true; 
        } else if (itemId === 'horse') { 
            let z = getZoneKey(p.x, p.y); if (z !== null && z !== 'stables') { socket.emit('gameLog', '❌ 只能在马厩或校道使用！'); return; } p.horseBuff = true; turnPhase = 'WAITING'; used = true; io.emit('gameLog', `🐴 翻身上马，获额外回合！`); 
        } else if (itemId === 'fruit') { 
            rp.score += 3; used = true; io.emit('gameLog', `🍒 吃掉果实，+3 分！`); 
        } else if (itemId === 'flashlight') { 
            rp.flashlightRounds = 3; if(!rp.buffs.includes('bright')) rp.buffs.push('bright'); used = true; io.emit('gameLog', `🔦 ${rp.name} 打开了手电筒，照亮了迷雾！`); 
        }
        
        if (used) { rp.inventory[itemId]--; if (rp.inventory[itemId] <= 0) delete rp.inventory[itemId]; broadcastState(); }
    });

    socket.on('placeTrap', () => { if (gameOver || !isMyTurn(socket.id)) return; const p = players[socket.id]; if (p.role !== 'xsm' || p.score < 10) return; p.score -= 10; traps.push({ x: p.x, y: p.y, ownerId: socket.id }); io.emit('gameLog', `🤫 ${p.name} 埋设陷阱。`); broadcastState(); });
    socket.on('startControl', (targetId) => { if (gameOver || !isMyTurn(socket.id)) return; const p = players[socket.id]; if (p.role !== 'lds' || !getZoneKey(p.x, p.y)?.includes('dorm')) return; p.isControlling = targetId; io.emit('gameLog', `🔮 ${p.name} 操控 ${players[targetId].name}...`); broadcastState(); });
    
    socket.on('endTurn', () => {
        if (gameOver || !isMyTurn(socket.id)) return; 
        let controller = players[socket.id]; let mover = controller;
        if (controller.activeEntity === 'zjy') { mover = players[controller.zjyId]; } 
        else if (controller.role === 'lds' && controller.isControlling) { mover = players[controller.isControlling] || controller; }
        
        controller.movesLeft = 0; if(mover) mover.movesLeft = 0; 
        controller.isControlling = null; handleCombat(mover); handleTileEvent(mover);
        
        if (controller.role === 'jzx' && controller.zjyId && players[controller.zjyId]) { 
            if (controller.activeEntity !== 'zjy') { 
                controller.activeEntity = 'zjy'; let z = players[controller.zjyId]; z.movesLeft = z.isTrapped ? 0 : controller.lastRoll; 
                io.emit('gameLog', `✨ 轮到 zjy 行动！(${z.movesLeft}步)`); broadcastState(); return; 
            } else { controller.activeEntity = 'self'; } 
        }
        endTurn();
    });
    socket.on('rollDice', () => { if (gameOver || !isMyTurn(socket.id) || turnPhase !== 'WAITING') return; doRollDice(socket.id); });
    socket.on('playerMovement', (moveData) => { if (gameOver || !isMyTurn(socket.id) || turnPhase !== 'MOVING') return; doMove(socket.id, moveData.axis, moveData.dir); });
}

function doRollDice(playerId) {
    const p = players[playerId]; p.movedThisTurn = false;
    if (p.isJailed) { p.isJailed = false; io.emit('gameLog', `👮 ${p.name} 禁闭结束。`); endTurn(); return; }
    if (p.isTrapped) { p.isTrapped = false; io.emit('gameLog', `🕸️ ${p.name} 挣脱陷阱。`); endTurn(); return; }
    if (p.zjyId && players[p.zjyId]) { players[p.zjyId].isTrapped = false; players[p.zjyId].movedThisTurn = false; }

    let val = Math.floor(Math.random() * 6) + 1; 
    let z = getZoneKey(p.x, p.y); let phase = TIME_PHASES[dayPhaseIndex];
    if (p.role === 'cyx' && p.cyxForm === 1) { val = Math.floor(Math.random() * 2) + 1; }
    if (p.horseBuff) { val = Math.floor(Math.random() * 7) + 3; p.horseBuff = false; }
    val = Math.max(p.minRoll || 1, val); 
    
    if (p.role === 'yyj' && z && z.includes('playground')) val += 2;
    if (p.role === 'wt' && (val === 5 || val === 6)) { if (giveItem(p, 'bicycle')) io.emit('gameLog', `🎉 车神获得 [自行车]！`); }
    if (p.role === 'lds' && p.isControlling && val > 4) val = 4;
    if (z && z.includes('dorm')) { val += 1; io.emit('gameLog', `🛏️ 寝室休息充沛，${p.name} 掷骰点数额外 +1！`); }

    let corey = Object.values(players).find(pl => pl.role === 'corey');
    if (corey && p.role !== 'corey' && p.role !== 'zjy' && corey.lastRoll > 0 && val > 0 && val < corey.lastRoll) {
        val = 2; io.emit('gameLog', `⚠️ 受 Corey 威压影响，${p.name} 被压制为 2 步！`);
    }

    if (p.role === 'zlh') { 
        if (phase === '早晨' || phase === '正午') { val = 0; io.emit('gameLog', `😴 ${p.name} 补觉中。`); } 
        else { val *= 2; io.emit('gameLog', `🦇 夜晚降临！步数翻倍(${val}步)！`); } 
    }

    p.lastRoll = val; let finalMoves = val; 
    if (weatherEffect === 'HEAT' && val > 3 && !p.buffs.includes('immune_heat') && p.role !== 'syq') finalMoves = 3;
    if (weatherEffect === 'COLD' && val > 3 && !p.buffs.includes('immune_cold') && p.role !== 'syq') finalMoves = 3;
    if (p.buffs.includes('star_upgraded')) finalMoves += 1;

    p.movesLeft = finalMoves; turnPhase = 'MOVING'; io.emit('diceRolled', { playerId: playerId, val: finalMoves }); broadcastState();
}

function doMove(playerId, axis, dir) {
    let controller = players[playerId]; let mover = controller; let spender = controller;
    if (controller.activeEntity === 'zjy') { mover = players[controller.zjyId]; spender = mover; } else if (controller.role === 'lds' && controller.isControlling) { mover = players[controller.isControlling] || controller; spender = controller; }
    if (spender.movesLeft <= 0) return false;
    let nx = mover.x + (axis === 'x' ? dir : 0); let ny = mover.y + (axis === 'y' ? dir : 0); if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return false;
    let tz = getZoneKey(nx, ny); let can = true; let isLock = (dayPhaseIndex >= 5); 
    if (tz === 'female_dorm' && isLock && mover.gender === 'male' && mover.role !== 'yyj') can = false; else if ((tz === 'male_dorm_n' || tz === 'male_dorm_s') && isLock && mover.gender === 'female' && mover.role !== 'myj') can = false; if (!can) return false; 
    if (activeGlobalEvents.flood > 0 && activeGlobalEvents.flood < 3 && mover.role !== 'zxw') { if (waterWalls.find(w => w.x === nx && w.y === ny)) return false; }

    mover.x = nx; mover.y = ny; spender.movesLeft--; mover.movedThisTurn = true;
    
    if (activeGlobalEvents.sandstorm > 0 && !isSafeZone(mover.x, mover.y) && mover.role !== 'zxw') { let rp = getRealPlayer(mover); rp.score = Math.max(0, rp.score - 2); io.emit('gameLog', `🌪️ ${rp.name} 在沙尘暴中跋涉，扣除 2 分！`); }
    let bi = boars.findIndex(b => b.x === mover.x && b.y === mover.y); if (bi !== -1) { let rp = getRealPlayer(mover); if (rp.role === 'zxw') { io.emit('gameLog', `🐗 野猪从末日行者 ${rp.name} 身边穿过！`); } else { rp.score = Math.max(0, rp.score - 10); io.emit('gameLog', `💥 撞上野猪！扣10分！`); boars.splice(bi, 1); } }
    let gi = guards.findIndex(g => g.x === mover.x && g.y === mover.y); if (gi !== -1) { let rp = getRealPlayer(mover); if (dayPhaseIndex === 6) { rp.x = 9; rp.y = 1; rp.isJailed = true; io.emit('gameLog', `🚨 午夜被保安抓获关禁闭！`); } else { rp.score = Math.max(0, rp.score - 5); io.emit('gameLog', `🚨 撞上保安！扣5分！`); } }
    
    checkTraps(mover); checkSeeds(mover); checkGroundItems(mover); checkQuestProgress(mover); broadcastState(); return true; 
}


// === 核心：拥有“地狱级老六思维”与“主动技能释放”的 AI 完全体大脑 ===
// === 核心：拥有“地狱级老六思维”、“主动技能释放”与“支线任务/叛逆追踪”的 AI 终极完全体 ===
function botLogicTick() {
    if (!isAutoRun || playerIds.length === 0 || gameOver) return; 
    let cid = playerIds[currentTurnIndex]; 
    let p = players[cid]; 
    
    // 如果是真人或被操控状态，挂起等待
    if (!p || !p.isBot || p.isControlling) return; 
    let rp = getRealPlayer(p);

    if (turnPhase === 'WAITING') { 
        // 🤖 思考 1：CYX 自动进化
        if (p.role === 'cyx') {
            let oldName = p.name.split(' ')[0];
            if (p.cyxForm === 1 && p.score >= 125) {
                p.cyxForm = 2; p.str = 5; p.int = 3; p.score += 20; p.name = oldName + ' (黄鳝天师)'; p.cyxExtraTurns = 0;
                io.emit('gameLog', `✨ AI ${oldName} 自动进化为“黄鳝天师”！`); broadcastState();
            } else if (p.cyxForm === 2 && p.score >= 225) {
                p.cyxForm = 3; p.str = 3; p.int = 4; p.score += 20; p.name = oldName + ' (荷包蛋)'; p.eggReady = false;
                io.emit('gameLog', `🍳 AI ${oldName} 自动进化为“荷包蛋”！`); broadcastState();
            }
        }

        // 🤖 思考 2：专属主动技能释放！(JZX, LDS, CYX二阶)
        if (p.role === 'jzx' && !p.zjyId && p.score >= 40 && Math.random() < 0.6) {
            let cost = Math.max(25, Math.floor(p.score / 2)); p.score -= cost; 
            let zjyId = 'ZJY_' + cid; 
            players[zjyId] = { x: p.x, y: p.y, playerId: zjyId, role: 'zjy', name: 'zjy(AI召唤)', gender: 'female', str: 3, int: 3, color: '#ff9ff3', score: 0, movesLeft: 0, lastRoll: 0, isJailed: false, isTrapped: false, inventory: p.inventory, buffs: p.buffs, questProgress: p.questProgress, isControlling: null, isBot: true, isSummon: true, ownerId: cid, createRound: globalRound, refundAmount: Math.floor(cost / 2), movedThisTurn: false, horseBuff: false, minRoll: 1, flashlightRounds: 0, drinksUsedThisTurn: 0 }; 
            p.zjyId = zjyId; 
            io.emit('gameLog', `🌟 魔法闪耀！AI ${p.name} 献祭 ${cost} 分，召唤了 [zjy] 帮自己跑腿！`); 
            broadcastState();
        }
        
        if (p.role === 'lds' && getZoneKey(p.x, p.y)?.includes('dorm') && !p.isControlling && Math.random() < 0.7) {
            let potentialTargets = Object.values(players).filter(t => t.playerId !== cid && !t.isSummon && !t.isJailed);
            if (potentialTargets.length > 0) {
                let target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                p.isControlling = target.playerId;
                io.emit('gameLog', `🔮 细思极恐！躲在寝室的 AI ${p.name} 远距离强行操控了 ${target.name} 的身体！`);
                broadcastState();
            }
        }

        if (p.role === 'cyx' && p.cyxForm === 2 && p.score >= 30 && Math.random() < 0.5) {
            let target = Object.values(players).find(t => t.playerId !== cid && !t.isSummon && t.str < p.str); 
            if (target) {
                let validSpots = []; 
                for (let dx=-1; dx<=1; dx++) { for (let dy=-1; dy<=1; dy++) { 
                    if (dx===0 && dy===0) continue; 
                    let nx = target.x + dx, ny = target.y + dy; 
                    if (nx>=0 && nx<GRID_SIZE && ny>=0 && ny<GRID_SIZE && !isInvalidBoarZone(nx, ny)) validSpots.push({x: nx, y: ny}); 
                } }
                if (validSpots.length > 0) {
                    let spot = validSpots[Math.floor(Math.random() * validSpots.length)]; 
                    p.score -= 15; p.x = spot.x; p.y = spot.y; 
                    io.emit('gameLog', `🐍 遁地之术！AI ${p.name} 消耗15分瞬间闪现到了 ${target.name} 身旁准备打劫！`); 
                    broadcastState();
                }
            }
        }

        // 🤖 思考 3：老六偷偷放陷阱 (专属 xsm)
        if (p.role === 'xsm' && p.score >= 20 && Math.random() < 0.3 && !traps.find(t => t.x===p.x && t.y===p.y)) {
            p.score -= 10; traps.push({ x: p.x, y: p.y, ownerId: cid });
            io.emit('gameLog', `🤫 AI ${p.name} 悄悄在脚下埋设了陷阱...`); broadcastState();
        }

        // 🤖 思考 4：天气预警与自我保护
        if (weatherEffect === 'HEAT' && rp.inventory['water'] && !p.buffs.includes('immune_heat')) {
            rp.inventory['water']--; if (rp.inventory['water'] <= 0) delete rp.inventory['water'];
            p.buffs.push('immune_heat'); io.emit('gameLog', `🧊 AI ${p.name} 吨吨吨喝下冰水，免疫炎热！`);
        }
        if (weatherEffect === 'COLD' && rp.inventory['warmer'] && !p.buffs.includes('immune_cold')) {
            rp.inventory['warmer']--; if (rp.inventory['warmer'] <= 0) delete rp.inventory['warmer'];
            p.buffs.push('immune_cold'); io.emit('gameLog', `🔥 AI ${p.name} 贴上了暖宝宝，免疫寒冷！`);
        }

        // 🤖 思考 5：使用攻击/偷窃/举报道具
        for (let itemId in rp.inventory) {
            let item = ITEMS[itemId];
            if (!item) continue;
            
            if (item.type === 'attack' || item.type === 'steal' || item.type === 'report') {
                let target = Object.values(players).find(t => t.playerId !== cid && !t.isSummon && (Math.abs(t.x - p.x) + Math.abs(t.y - p.y) <= item.range));
                
                if (target) {
                    if (item.type === 'attack') {
                        target.score = Math.max(0, target.score - item.dmg);
                        io.emit('gameLog', `💥 老六预警！AI ${p.name} 突然掏出 [${item.name}] 砸向了 ${target.name}！`);
                    } else if (item.type === 'steal' && target.gender === 'male' && target.score > 0) {
                        let stealVal = Math.min(target.score, item.stealAmount);
                        target.score -= stealVal; rp.score += stealVal;
                        io.emit('gameLog', `💋 防不胜防！AI ${p.name} 对 ${target.name} 使用了 [${item.name}]，偷走 ${stealVal} 分！`);
                    } else if (item.type === 'report' && target.score > rp.score) {
                        target.x = 9; target.y = 1; target.isJailed = true; target.score = Math.max(0, target.score - 30);
                        io.emit('gameLog', `🚨 铁面无私！AI ${p.name} 提交举报信！${target.name} 被关禁闭并扣30分！`);
                    } else {
                        continue; 
                    }
                    rp.inventory[itemId]--; if (rp.inventory[itemId] <= 0) delete rp.inventory[itemId];
                    broadcastState(); break; 
                }
            }
        }

        doRollDice(cid); 
    } 
    else if (turnPhase === 'MOVING') {
        if (p.movesLeft <= 0) { handleCombat(p); handleTileEvent(p); endTurn(); return; }
        
        let zKey = getZoneKey(p.x, p.y);
        
        if (zKey === 'church' && Math.random() < 0.6 && !classMission && activeGlobalEvents.sandstorm === 0) { 
            rp.score += p.movesLeft * 3; io.emit('gameLog', `⛪ AI ${p.name} 虔诚祈祷，将剩余步数换成了积分！`); 
            p.movesLeft = 0; handleCombat(p); handleTileEvent(p); endTurn(); return; 
        }
        if (zKey && ZONES[zKey].shop && p.score >= 50 && Math.random() < 0.4) {
            let buyId = ZONES[zKey].shop[Math.floor(Math.random() * ZONES[zKey].shop.length)];
            if (ITEMS[buyId].cost <= p.score && giveItem(p, buyId)) {
                p.score -= ITEMS[buyId].cost; io.emit('gameLog', `🛒 AI ${p.name} 花钱购买了 [${ITEMS[buyId].name}]`); broadcastState();
            }
        }
        if (zKey === 'fountain' && p.score >= 5 && Math.random() < 0.3) {
            p.score -= 5; let r = Math.random(); 
            if (r < 0.1) giveItem(p, 'cheat_sheet'); else if (r < 0.3) giveItem(p, 'water'); else if (r < 0.31) p.score += 50;
            io.emit('gameLog', `⛲ AI ${p.name} 向喷泉抛出了硬币许愿！`); broadcastState();
        }

        if (rp.inventory['fruit'] && p.score < 50) {
            rp.score += 3; rp.inventory['fruit']--; if (rp.inventory['fruit'] <= 0) delete rp.inventory['fruit'];
            io.emit('gameLog', `🍒 AI ${p.name} 啃掉了一颗果实 (+3分)`);
        }
        ['star_block_1','star_block_2','star_block_3'].forEach(sb => {
            if(rp.inventory[sb]) {
                rp.score += 5; rp.questProgress.usedStarBlocks = (rp.questProgress.usedStarBlocks || 0) + 1;
                rp.inventory[sb]--; if (rp.inventory[sb] <= 0) delete rp.inventory[sb];
                io.emit('gameLog', `⭐ AI ${p.name} 拼接了星块 (+5分)`);
                if (rp.questProgress.usedStarBlocks === 3) { rp.buffs.push('star_upgraded'); io.emit('gameLog', `✨ 奇迹绽放！AI ${p.name} 永久升级！`); }
            }
        });

        // 🤖 思考 6：判定是否在“叛逆期”（故意逃课）
        let isSkippingClass = activeSideQuests.find(q => q.type === 'skip_class');

        if (rp.inventory['energy_drink'] && p.movesLeft === 1 && classMission && !isSkippingClass && (rp.drinksUsedThisTurn || 0) < 6) {
            rp.drinksUsedThisTurn = (rp.drinksUsedThisTurn || 0) + 1; p.movesLeft += 3;
            rp.inventory['energy_drink']--; if (rp.inventory['energy_drink'] <= 0) delete rp.inventory['energy_drink'];
            io.emit('gameLog', `🥤 卷王 AI ${p.name} 发现上课快迟到了，猛喝一罐功能饮料狂奔 (步数+3)！`); broadcastState();
        }

       // 🤖 思考 7：终极寻路目标（包含支线精准坐标）
        let targetZones = ['canteen', 'farm']; 
        let targetPoints = []; 

        if (activeGlobalEvents.sandstorm > 0 && !isSafeZone(p.x, p.y)) {
            targetZones = ['female_dorm', 'male_dorm_n', 'male_dorm_s', 'intl_dorm', 'class_n', 'class_s', 'canteen', 'church'];
        } else if (classMission && !isSkippingClass) {
            targetZones = [classMission.target]; // 乖乖上课
        } else {
            // 没有紧急灾难，且不上课（或者正在故意逃课）
            if (p.score >= 80 && p.score < 150) targetZones = ['supermarket', 'fountain', 'grocery', 'canteen'];
            
            // 🌟 支线任务雷达扫描
            activeSideQuests.forEach(q => {
                if (q.type === 'run') targetZones.push('stables');
                if (q.type === 'panty') {
                    if (rp.inventory['panty']) targetZones.push('intl_dorm');
                    else { let it = groundItems.find(g => g.itemId === 'panty'); if(it) targetPoints.push({x: it.x, y: it.y}); }
                }
                if (q.type === 'mens_panty') {
                    if (rp.inventory['mens_panty']) targetZones.push('male_dorm_n', 'male_dorm_s');
                    else { let it = groundItems.find(g => g.itemId === 'mens_panty'); if(it) targetPoints.push({x: it.x, y: it.y}); }
                }
                if (q.type === 'harvest') {
                    targetZones.push('farm');
                    let fruits = groundItems.filter(g => g.itemId === 'fruit');
                    fruits.forEach(f => targetPoints.push({x: f.x, y: f.y}));
                }
            });
        }

        let bestMove = null; let minScore = 999999;
        const dirs = [ {axis: 'x', dir: 1}, {axis: 'x', dir: -1}, {axis: 'y', dir: 1}, {axis: 'y', dir: -1} ].sort(() => Math.random() - 0.5);

        // 【新增变量】记录去目标的最佳格子，不考虑玩家
        let bestPathMove = null; 
        let minPathDistance = 999999;

        for (let m of dirs) {
            let nx = p.x + (m.axis === 'x' ? m.dir : 0); let ny = p.y + (m.axis === 'y' ? m.dir : 0);
            if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
            let tz = getZoneKey(nx, ny); let isLock = (dayPhaseIndex >= 5); let can = true;
            if (tz === 'female_dorm' && isLock && p.gender === 'male' && p.role !== 'yyj') can = false;
            else if ((tz === 'male_dorm_n' || tz === 'male_dorm_s') && isLock && p.gender === 'female' && p.role !== 'myj') can = false;
            if (activeGlobalEvents.flood > 0 && activeGlobalEvents.flood < 3 && p.role !== 'zxw') { if (waterWalls.find(w => w.x === nx && w.y === ny)) can = false; }
            if (!can) continue;

            let dangerPenalty = 0;
            if (boars.find(b => b.x === nx && b.y === ny)) dangerPenalty += 1000;
            if (guards.find(g => g.x === nx && g.y === ny)) dangerPenalty += 800;
            if (traps.find(t => t.x === nx && t.y === ny && t.ownerId !== p.playerId)) dangerPenalty += 500;

            let minDistToTarget = 999;
            // 距离评估：区域
            for (let z of targetZones) {
                if (!ZONES[z]) continue; let r = ZONES[z].range;
                if (nx >= r[0] && nx <= r[1] && ny >= r[2] && ny <= r[3]) { minDistToTarget = 0; break; }
                let cx = Math.floor((r[0]+r[1])/2); let cy = Math.floor((r[2]+r[3])/2);
                let dist = Math.abs(nx - cx) + Math.abs(ny - cy);
                if (dist < minDistToTarget) minDistToTarget = dist;
            }
            // 距离评估：精准点位
            for (let pt of targetPoints) {
                let dist = Math.abs(nx - pt.x) + Math.abs(ny - pt.y);
                if (dist < minDistToTarget) minDistToTarget = dist;
            }

            // 【专注赶路逻辑】：先纯粹寻找离目标最近的路，不受玩家干扰
            let pathScore = minDistToTarget + dangerPenalty;
            if (pathScore < minPathDistance) {
                minPathDistance = pathScore;
                bestPathMove = m;
            }
        }

        // 决定最终怎么走
        if (bestPathMove) {
            let nextX = p.x + (bestPathMove.axis === 'x' ? bestPathMove.dir : 0);
            let nextY = p.y + (bestPathMove.axis === 'y' ? bestPathMove.dir : 0);
            
            // 检查这唯一一条“必经之路”上有没有人
            let targetPlayerOnPath = Object.values(players).find(e => e.x === nextX && e.y === nextY && e.playerId !== p.playerId && !e.isSummon);
            
            if (targetPlayerOnPath) {
                // 如果有人挡路，判断打不打得过
                if (p.str > targetPlayerOnPath.str) {
                    // 打得过，顺手揍他，路线不变！
                    bestMove = bestPathMove;
                    io.emit('gameLog', `👊 AI ${p.name} 在赶路途中顺手揍了挡路的 ${targetPlayerOnPath.name}！`);
                } else {
                    // 打不过，被迫选择其他安全的路线绕开
                    // 这里简化处理：直接从 dir 数组里找一个没有强敌且安全的次优解
                    for (let altMove of dirs) {
                        if(altMove === bestPathMove) continue; // 跳过刚才那条有强敌的路
                        let ax = p.x + (altMove.axis === 'x' ? altMove.dir : 0);
                        let ay = p.y + (altMove.axis === 'y' ? altMove.dir : 0);
                        let altEnemy = Object.values(players).find(e => e.x === ax && e.y === ay && e.playerId !== p.playerId && !e.isSummon);
                        // 寻找一条没有比自己强的敌人，且不踩陷阱野猪的路
                        if (!altEnemy || p.str > altEnemy.str) {
                             bestMove = altMove;
                             break;
                        }
                    }
                }
            } else {
                // 必经之路上没人，专心走最优路线
                bestMove = bestPathMove;
            }
        }


        if (bestMove && doMove(cid, bestMove.axis, bestMove.dir)) {
            // 移动成功
        } else {
            p.movesLeft = 0; handleCombat(p); handleTileEvent(p); endTurn();
        }
    }
}

function isInvalidBoarZone(x, y) { let z = getZoneKey(x, y); return z && (z.includes('dorm') || z.includes('class') || z === 'office'); }

function moveBoars() {
    for (let i = boars.length - 1; i >= 0; i--) {
        let b = boars[i]; let cp = null; let minD = 999;
        for (let pid in players) { if (players[pid].role === 'zxw') continue; let d = Math.abs(players[pid].x - b.x) + Math.abs(players[pid].y - b.y); if (d < minD) { minD = d; cp = players[pid]; } }
        if (!cp) continue;
        for (let s = 0; s < 3; s++) {
            if (b.x === cp.x && b.y === cp.y) break; let dx = cp.x > b.x ? 1 : (cp.x < b.x ? -1 : 0); let dy = cp.y > b.y ? 1 : (cp.y < b.y ? -1 : 0); let m = false;
            if (dx !== 0 && b.x+dx >= 0 && b.x+dx < GRID_SIZE && !isInvalidBoarZone(b.x+dx, b.y)) { b.x += dx; m = true; } else if (dy !== 0 && b.y+dy >= 0 && b.y+dy < GRID_SIZE && !isInvalidBoarZone(b.x, b.y+dy)) { b.y += dy; m = true; }
            if (!m) break;
            let hit = Object.keys(players).find(pid => players[pid].x === b.x && players[pid].y === b.y);
            if (hit) { let rp = getRealPlayer(players[hit]); if (rp.role !== 'zxw') { rp.score = Math.max(0, rp.score - 10); io.emit('gameLog', `💥 ${rp.name} 被野猪拱翻扣10分！`); boars.splice(i, 1); break; } }
        }
    }
}

function moveGuards() {
    for (let i = guards.length - 1; i >= 0; i--) {
        let g = guards[i]; let cp = null; let minD = 999;
        for (let pid in players) { let d = Math.abs(players[pid].x - g.x) + Math.abs(players[pid].y - g.y); if (d < minD) { minD = d; cp = players[pid]; } }
        if (!cp) continue;
        for (let s = 0; s < 3; s++) {
            if (g.x === cp.x && g.y === cp.y) break; let dx = cp.x > g.x ? 1 : (cp.x < g.x ? -1 : 0); let dy = cp.y > g.y ? 1 : (cp.y < g.y ? -1 : 0); let m = false;
            if (dx !== 0 && g.x+dx >= 0 && g.x+dx < GRID_SIZE && !isInvalidBoarZone(g.x+dx, g.y)) { g.x += dx; m = true; } else if (dy !== 0 && g.y+dy >= 0 && g.y+dy < GRID_SIZE && !isInvalidBoarZone(g.x, g.y+dy)) { g.y += dy; m = true; }
            if (!m) break;
            let hit = Object.keys(players).find(pid => players[pid].x === g.x && players[pid].y === g.y);
            if (hit) { let rp = getRealPlayer(players[hit]); if (dayPhaseIndex === 6) { rp.x = 9; rp.y = 1; rp.isJailed = true; io.emit('gameLog', `🚨 ${rp.name} 午夜被保安关禁闭！`); } else { rp.score = Math.max(0, rp.score - 5); io.emit('gameLog', `🚨 ${rp.name} 被保安逮到扣5分！`); } break; }
        }
    }
}

function checkTraps(p) { let t = traps.findIndex(x => x.x === p.x && x.y === p.y && x.ownerId !== p.ownerId && x.ownerId !== p.playerId); if (t !== -1) { let tr = traps[t]; traps.splice(t, 1); if (Math.random() < p.int * 0.05) { io.emit('gameLog', `😎 ${p.name} 识破了陷阱！`); } else { io.emit('gameLog', `💥 ${p.name} 踩中陷阱被定身！`); p.movesLeft = 0; p.isTrapped = true; if (players[tr.ownerId]) getRealPlayer(players[tr.ownerId]).score += 15; } } }

function spawnGlobalEvent() {
    let rand = Math.random() * 100;
    if (rand < 40) { if (activeGlobalEvents.invisible <= 0) { activeGlobalEvents.invisible = 3; io.emit('gameLog', `🌫️ 突发：迷雾降临！3回合互相隐身！`); } } 
    else if (rand < 80) { if (activeGlobalEvents.boarsRound <= 0) { activeGlobalEvents.boarsRound = 4; boars = []; while(boars.length < 3) { let rx = Math.floor(Math.random()*20); let ry = Math.floor(Math.random()*20); if (!isInvalidBoarZone(rx, ry)) boars.push({x: rx, y: ry}); } io.emit('gameLog', `🐗 突发：失控的野猪冲入校园！`); } } 
    else if (rand < 90) { if (activeGlobalEvents.sandstorm <= 0) { activeGlobalEvents.sandstorm = 3; io.emit('gameLog', `🌪️ 突发：沙尘暴来袭！持续3回合！在外移动将疯狂扣分！`); } } 
    else { if (activeGlobalEvents.flood <= 0) { activeGlobalEvents.flood = 3; io.emit('gameLog', `🌊 突发：校园突发洪水！室外区域全部淹没！`); Object.keys(players).forEach(pid => { let p = players[pid]; if (!p.isSummon && !isSafeZone(p.x, p.y) && p.role !== 'zxw') { p.score = Math.max(0, p.score - 5); io.emit('gameLog', `🌊 ${p.name} 在室外被洪水卷走 5 分！`); } }); } }
}

function startNewRound() {
    globalRound++; dayPhaseIndex = (globalRound - 1) % 7; let phase = TIME_PHASES[dayPhaseIndex]; if (dayPhaseIndex === 0) dayCount++;
    playerIds.forEach(id => { 
        let p = players[id]; p.buffs = p.buffs.filter(b=>b==='star_upgraded' || b==='bright'); 
        if (p.flashlightRounds > 0) { p.flashlightRounds--; if (p.flashlightRounds === 0) { p.buffs = p.buffs.filter(b => b !== 'bright'); io.emit('gameLog', `🔦 ${p.name} 的手电筒没电了。`); } }
    }); 
    
    weatherEffect = (phase === '正午' ? 'HEAT' : (phase === '午夜' ? 'COLD' : null));
    io.emit('gameLog', `=== Day ${dayCount} [${phase}] ===`); if(weatherEffect) io.emit('gameLog', weatherEffect==='HEAT'?'☀️ 炎热(限速3)':'🌙 寒冷(限速3)');
    
    if (activeGlobalEvents.invisible > 0) { activeGlobalEvents.invisible--; if (activeGlobalEvents.invisible === 0) io.emit('gameLog', `🌫️ 迷雾散去。`); }
    if (activeGlobalEvents.boarsRound > 0) { activeGlobalEvents.boarsRound--; if (activeGlobalEvents.boarsRound === 0) { boars = []; io.emit('gameLog', `🐗 野猪群跑出了校园。`); } else moveBoars(); }
    if (activeGlobalEvents.sandstorm > 0) { activeGlobalEvents.sandstorm--; if (activeGlobalEvents.sandstorm === 0) io.emit('gameLog', `🌪️ 沙尘暴终于平息了。`); }
    if (activeGlobalEvents.flood > 0) {
        activeGlobalEvents.flood--;
        if (activeGlobalEvents.flood === 2) { waterWalls = []; for(let i=0; i<30; i++) { let wx = Math.floor(Math.random()*GRID_SIZE); let wy = Math.floor(Math.random()*GRID_SIZE); if (getZoneKey(wx, wy) === null) waterWalls.push({x: wx, y: wy}); } io.emit('gameLog', `🌊 洪水退去一部分，但校道上留下了深水坑（障碍物）！`); } 
        else if (activeGlobalEvents.flood === 1) { waterWalls = waterWalls.slice(0, Math.floor(waterWalls.length / 2)); io.emit('gameLog', `🌊 积水进一步消退，障碍物减半。`); } 
        else if (activeGlobalEvents.flood === 0) { waterWalls = []; io.emit('gameLog', `🌊 洪水完全退去了。`); }
    }

    if (dayPhaseIndex === 0 && guards.length > 0) { guards = []; io.emit('gameLog', `🌅 天亮了，保安下班了。`); } else if (guards.length > 0) moveGuards();
    
    if (Math.random() < 0.1) spawnGlobalEvent(); 
    plantedSeeds.forEach(s => { if (globalRound >= s.harvestRound) s.mature = true; });
    for(let pid in players) { let p = players[pid]; if(p.isSummon && globalRound - p.createRound >= 14) { let o = players[p.ownerId]; if(o) { o.score += p.refundAmount; o.zjyId = null; o.activeEntity = 'self'; io.emit('gameLog', `💨 14回合期限已到，zjy 消失。`); } delete players[pid]; } }
    
    if (dayPhaseIndex === 0 && classMission) {
        if (activeGlobalEvents.sandstorm > 0 || activeGlobalEvents.flood > 0) {
            io.emit('gameLog', `📢 广播：因极端灾害天气正在肆虐，本次上课点名紧急取消！大家注意安全！`);
            classMission = null; let skipIdx = activeSideQuests.findIndex(q => q.type === 'skip_class'); if (skipIdx !== -1) activeSideQuests.splice(skipIdx, 1);
        } else {
            checkClassAttendance();
        }
    }
    
    if (dayPhaseIndex === 1) { 
        classMission = { target: Math.random() > 0.5 ? 'class_n' : 'class_s', deadline: globalRound + 6 }; 
        io.emit('gameLog', `🔔 上课铃！明早前前往【${ZONES[classMission.target].name}】`); 
        
        let eggPlayer = Object.values(players).find(p => p.role === 'cyx' && p.cyxForm === 3);
        if (eggPlayer) {
            eggPlayer.eggReady = true; 
            let bx, by; while(true) { bx = Math.floor(Math.random()*GRID_SIZE); by = Math.floor(Math.random()*GRID_SIZE); if (getZoneKey(bx, by)) break; }
            groundItems.push({ x: bx, y: by, itemId: 'cyx_star', ownerId: eggPlayer.playerId });
            io.emit('gameLog', `🌟 天降异象！地图上生成了一颗【荷包蛋】的专属星星！`);
        }
    }
    
    if (Math.random() < 0.3) spawnSideQuest();
}
function checkSeeds(p) { let rp = getRealPlayer(p); for (let i = plantedSeeds.length - 1; i >= 0; i--) { let s = plantedSeeds[i]; if (s.x === p.x && s.y === p.y && s.mature) { let score = (Math.floor(Math.random() * 3) + 1) * 6; rp.score += score; plantedSeeds.splice(i, 1); io.emit('gameLog', `🌾 收获了果实！+${score}分`); } } }

function checkGroundItems(p) { 
    let rp = getRealPlayer(p); 
    for (let i = groundItems.length - 1; i >= 0; i--) { 
        let it = groundItems[i]; 
        if (it.x === p.x && it.y === p.y) { 
            if (it.itemId.startsWith('star_block_')) { if (it.ownerId !== rp.playerId) continue; let req = parseInt(it.itemId.split('_')[2]) - 1; if ((rp.questProgress.starBlockStage || 0) !== req) continue; }
            if (it.itemId === 'cyx_star') { if (rp.role !== 'cyx' || rp.cyxForm !== 3) continue; }

            if (giveItem(rp, it.itemId)) { 
                groundItems.splice(i, 1); io.emit('gameLog', `🎁 捡到 [${ITEMS[it.itemId].name}]`); 
                if(it.itemId==='fruit') { rp.questProgress.fruitCount = (rp.questProgress.fruitCount || 0) + 1; io.emit('gameLog', `🍒 收集果实 (${rp.questProgress.fruitCount}/3)`); } 
                else if (it.itemId.startsWith('star_block_')) { rp.questProgress.starBlockStage = (rp.questProgress.starBlockStage || 0) + 1; if (rp.questProgress.starBlockStage === 3) { rp.score += 30; io.emit('gameLog', `🌟 追星族觉醒！`); } }
                else if (it.itemId === 'panty' || it.itemId === 'mens_panty') io.emit('gameLog', `👉 请将内裤送到指定寝室！`);
            } 
        } 
    } 
}

function checkQuestProgress(p) {
    let rp = getRealPlayer(p);
    for (let i = activeSideQuests.length - 1; i >= 0; i--) { let q = activeSideQuests[i]; let done = false;
        if (q.type === 'panty' && getZoneKey(p.x, p.y) === 'intl_dorm' && rp.inventory['panty']) { rp.score += 50; rp.inventory['panty']--; if(!rp.inventory['panty']) delete rp.inventory['panty']; io.emit('gameLog', `🎉 完成偷内裤任务！+50分`); done = true; }
        if (q.type === 'mens_panty' && (getZoneKey(p.x, p.y) === 'male_dorm_n' || getZoneKey(p.x, p.y) === 'male_dorm_s') && rp.inventory['mens_panty']) { rp.score += 30; rp.inventory['mens_panty']--; if(!rp.inventory['mens_panty']) delete rp.inventory['mens_panty']; io.emit('gameLog', `🎉 归还男士内裤！+30分`); done = true; }
        if (q.type === 'run' && getZoneKey(p.x, p.y) === 'stables') { let k = `${p.x},${p.y}`; if (!rp.questProgress.visitedStables.includes(k)) { rp.questProgress.visitedStables.push(k); if (rp.questProgress.visitedStables.length >= 16) { rp.score += 40; io.emit('gameLog', `🎉 完成跑操任务！+40分`); done = true; } } }
        if (q.type === 'harvest' && rp.questProgress.fruitCount >= 3) { rp.score += 10; io.emit('gameLog', `🎉 完成采果子任务！+10分`); groundItems = groundItems.filter(item => item.itemId !== 'fruit'); done = true; }
        if (done) { activeSideQuests.splice(i, 1); if (rp.role === 'ljh') { if(giveItem(rp, 'report_letter')) io.emit('gameLog', `✉️ 获得举报信！`); } }
    }
}

function spawnSideQuest() {
    let r = Math.random(); let type = r < 0.25 ? 'panty' : (r < 0.5 ? 'run' : (r < 0.75 ? 'harvest' : 'mens_panty')); if (activeSideQuests.find(q => q.type === type)) return;
    if (type === 'panty') { groundItems.push({ x: 2, y: 2, itemId: 'panty' }); activeSideQuests.push({ type: 'panty', desc: '去女寝偷内裤送去留学生寝' }); io.emit('gameLog', `📜 新支线：偷内裤！`); } 
    else if (type === 'run') { playerIds.forEach(id => players[id].questProgress.visitedStables = []); activeSideQuests.push({ type: 'run', desc: '踩遍马厩所有格子' }); io.emit('gameLog', `📜 新支线：马厩跑操！`); } 
    else if (type === 'harvest') { for(let i=0; i<5; i++) { groundItems.push({ x: Math.floor(Math.random()*4), y: Math.floor(Math.random()*4) + 8, itemId: 'fruit' }); } playerIds.forEach(id => players[id].questProgress.fruitCount = 0); activeSideQuests.push({ type: 'harvest', desc: '在农场收集3个任务果实' }); io.emit('gameLog', `📜 新支线：农场采摘！`); } 
    else if (type === 'mens_panty') { groundItems.push({ x: 17, y: 17, itemId: 'mens_panty' }); activeSideQuests.push({ type: 'mens_panty', desc: '将留学生寝室男士内裤送去任意男寝' }); io.emit('gameLog', `📜 新支线：这是谁的内裤？`); }
    if (!activeSideQuests.find(q => q.type === 'skip_class') && Math.random() < 0.2) { activeSideQuests.push({ type: 'skip_class', desc: '逃课挑战：被抓进校长室 (+50分)' }); io.emit('gameLog', `😈 叛逆时刻：逃课挑战开启！`); }
}

function checkClassAttendance() {
    io.emit('gameLog', `📝 点名时间！`); let skipIdx = activeSideQuests.findIndex(q => q.type === 'skip_class');
    
    playerIds.forEach(id => {
        let p = players[id]; if(p.isSummon) return; let z = getZoneKey(p.x, p.y);
        
        if (p.role === 'cyx' && p.cyxForm === 3) {
            if (p.eggReady) {
                if (p.inventory['cyx_star'] && p.inventory['cyx_star'] > 0) {
                    p.inventory['cyx_star']--; p.score += 50; io.emit('gameLog', `🍳 荷包蛋成功吞噬了星星！+50分！`);
                } else {
                    p.score = Math.max(0, p.score - 35); io.emit('gameLog', `🍳 荷包蛋错失了星星，被扣除了 35 分！`);
                }
            }
            return; 
        }

        if (classMission && z === classMission.target) { 
            let rew = 20 + (p.int * 5); 
            if (p.inventory['cheat_sheet']) { rew += 20; delete p.inventory['cheat_sheet']; io.emit('gameLog', `📄 作弊成功`); } 
            if (p.role === 'xsm') rew += 20; 
            p.score += rew; 
            io.emit('gameLog', `✅ 准时上课 +${rew}分`); 
            if (p.role === 'hedi') { p.minRoll = Math.min(3, (p.minRoll || 1) + 1); io.emit('gameLog', `📖 全知者骰子保底升至 ${p.minRoll} 点！`); }
        } else if (classMission) { 
            p.x = 9; p.y = 1; p.isJailed = true; 
            if (skipIdx !== -1) { p.score += 50; io.emit('gameLog', `😈 完成逃课挑战！+50分！`); } 
            else { p.score = Math.max(0, p.score - 30); io.emit('gameLog', `👮 扣除30分并关禁闭。`); } 
        }
    }); 
    classMission = null; if (skipIdx !== -1) activeSideQuests.splice(skipIdx, 1); 
    groundItems = groundItems.filter(item => item.itemId !== 'cyx_star');
}

function handleCombat(attacker) {
    let ra = getRealPlayer(attacker);
    Object.keys(players).forEach(eid => {
        if (eid === attacker.playerId || eid === attacker.ownerId) return; let enemy = players[eid]; let re = getRealPlayer(enemy);
        if (enemy.x === attacker.x && enemy.y === attacker.y) {
            let win = (attacker.str + Math.random()*6) > (enemy.str + Math.random()*6);
            if (win) { let loot = Math.floor(re.score * 0.1); re.score -= loot; ra.score += loot; io.emit('gameLog', `⚔️ ${attacker.name} 抢了 ${enemy.name} ${loot}分`); } 
            else { ra.score = Math.max(0, ra.score - 10); io.emit('gameLog', `🛡️ ${enemy.name} 反击成功扣除10分`); }
        }
    });
}

function handleTileEvent(p) {
    let rp = getRealPlayer(p); let z = getZoneKey(p.x, p.y);
    if (activeGlobalEvents.sandstorm > 0 && !isSafeZone(p.x, p.y) && p.role !== 'zxw') {
        rp.score = Math.max(0, rp.score - 2); io.emit('gameLog', `🌪️ ${rp.name} 停留在沙尘暴中，扣除 2 分！`);
    }

    if (!z) return;
    if (ZONES[z].drop && Math.random() < ZONES[z].drop.rate) { if(giveItem(rp, ZONES[z].drop.id)) io.emit('gameLog', `🎁 捡到 [${ITEMS[ZONES[z].drop.id].name}]`); }
    if (p.role === 'myj' && z.includes('dorm') && Math.random() < 0.5) { if(giveItem(rp, 'lipstick')) io.emit('gameLog', `💄 在寝室翻到了魅惑口红！`); }
    if (['canteen', 'farm'].includes(z)) { 
        let earn = p.str*2 + p.int*2; 
        
        // 🍜 检查是否为 cyx 且处于面条形态(阶段1)
        if (rp.role === 'cyx' && rp.cyxForm === 1) {
            earn = Math.floor(earn / 2); // 收益直接减半，向下取整
            io.emit('gameLog', `🍜 面条软弱无力...打工收益减半！`); // 顺便加个趣味提示
        }
        
        rp.score += earn; 
        io.emit('gameLog', `💰 打工 +${earn}分`); 
    }
}

function checkWinCondition() {
    if (targetScore <= 0 || gameOver) return;
    for (let pid in players) {
        let p = players[pid];
        if (!p.isSummon && p.score >= targetScore) {
            gameOver = true; winner = p; io.emit('gameLog', `🎉 比赛结束！【${p.name}】赢得了比赛！`); break;
        }
    }
}

function checkCyxForcedEvolution() {
    let realPlayers = Object.values(players).filter(p => !p.isSummon);
    if (realPlayers.length === 0) return;

    let allReach125 = realPlayers.every(p => p.score >= 125);
    let allReach225 = realPlayers.every(p => p.score >= 225);

    Object.values(players).forEach(p => {
        if (p.role === 'cyx') {
            let oldName = p.name.split(' ')[0];
            if (p.cyxForm === 1 && allReach125) {
                p.cyxForm = 2; p.str = 5; p.int = 3;
                p.name = oldName + ' (黄鳝天师)';
                p.cyxExtraTurns = 0;
                io.emit('gameLog', `✨ ${oldName}长大了，被迫成为了“黄鳝天师”！(无进化奖励)`);
            } 
            if (p.cyxForm === 2 && allReach225) {
                p.cyxForm = 3; p.str = 3; p.int = 4;
                p.name = oldName + ' (荷包蛋)';
                p.eggReady = false;
                io.emit('gameLog', `🍳 ${oldName}长大了，被迫成为了“荷包蛋”！(无进化奖励)`);
            }
        }
    });
}

function broadcastState() { 
    checkWinCondition(); 
    checkCyxForcedEvolution(); 
    let taken = Object.values(players).map(p => p.role); 
    io.emit('updateState', { players, currentTurnId: playerIds[currentTurnIndex], turnPhase, globalRound, classMission, traps, plantedSeeds, groundItems, activeSideQuests, takenRoles: taken, activeGlobalEvents, boars, guards, waterWalls, dayPhaseIndex, timeOfDay: TIME_PHASES[dayPhaseIndex] || '早晨', weatherEffect, targetScore, gameOver, winnerName: winner ? winner.name : null }); 
}

function endTurn() { 
    if (playerIds.length === 0) return; 
    
    let currentPlayer = players[playerIds[currentTurnIndex]];
    if (currentPlayer && currentPlayer.role === 'cyx' && currentPlayer.cyxForm === 1) {
        if (currentPlayer.cyxExtraTurns > 0) {
            currentPlayer.cyxExtraTurns--;
            Object.values(players).forEach(pl => { pl.drinksUsedThisTurn = 0; });
            turnPhase = 'WAITING'; 
            io.emit('gameLog', `🍜 面条蠕动！${currentPlayer.name.split(' ')[0]} 连续行动 (剩余 ${currentPlayer.cyxExtraTurns+1} 次额外行动)`);
            broadcastState();
            return; 
        } else {
            currentPlayer.cyxExtraTurns = 2; 
        }
    }

    Object.values(players).forEach(pl => { pl.drinksUsedThisTurn = 0; });
    turnPhase = 'WAITING'; 
    currentTurnIndex++; 
    if (currentTurnIndex >= playerIds.length) { currentTurnIndex = 0; startNewRound(); } 
    broadcastState(); 
}

module.exports = { init, onPlayerConnect };