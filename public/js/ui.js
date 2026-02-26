// public/js/ui.js - v26.1: 所有的界面操作与按钮事件 (安全加载头像)
const restartBtn = document.createElement('button');
restartBtn.innerHTML = '🔄 重置游戏';
restartBtn.style.cssText = 'position:absolute; top:20px; right:20px; padding:10px 15px; background:#c0392b; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; z-index:999999; box-shadow:0 4px 10px rgba(0,0,0,0.5); transition:0.2s;';
restartBtn.onmouseover = () => restartBtn.style.background = '#e74c3c';
restartBtn.onmouseout = () => restartBtn.style.background = '#c0392b';
restartBtn.onclick = () => { if(confirm('⚠️ 警告：确定要直接重置当前对局吗？')) socket.emit('restartGame'); };
document.body.appendChild(restartBtn);

const cyxEvolveBtn = document.createElement('button');
cyxEvolveBtn.id = 'cyx-evolve-btn';
cyxEvolveBtn.style.cssText = 'padding:10px 15px; background:linear-gradient(45deg, #f39c12, #e67e22); color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-right:8px; display:none; box-shadow:0 0 10px rgba(243, 156, 18, 0.5);';
cyxEvolveBtn.onclick = () => { if(confirm('确定要进化吗？此操作不可逆！(立刻获得20分)')) socket.emit('cyxEvolve'); };

const cyxTeleportBtn = document.createElement('button');
cyxTeleportBtn.id = 'cyx-teleport-btn';
cyxTeleportBtn.style.cssText = 'padding:10px 15px; background:linear-gradient(45deg, #9b59b6, #8e44ad); color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; margin-right:8px; display:none; box-shadow:0 0 10px rgba(155, 89, 182, 0.5);';
cyxTeleportBtn.innerHTML = '🐍 黄鳝传送 (-15分)';
cyxTeleportBtn.onclick = () => startTargetSelection(null, 999, 'cyxTeleport');

abilityBtn.parentNode.insertBefore(cyxEvolveBtn, abilityBtn.nextSibling);
abilityBtn.parentNode.insertBefore(cyxTeleportBtn, cyxEvolveBtn.nextSibling);

btnSetScore.onclick = () => { let s = parseInt(targetScoreInput.value); if (!isNaN(s) && s > 0) socket.emit('setTargetScore', s); };
unlockDevBtn.onclick = () => { if(devCodeInput.value === '114514') { devControls.style.display = 'block'; devCodeInput.style.display = 'none'; unlockDevBtn.style.display = 'none'; } };
startAutoBtn.onclick = () => { socket.emit('startAutoRun', { code: '114514', count: parseInt(document.getElementById('bot-count').value) || 4 }); };

rollBtn.onclick = () => socket.emit('rollDice'); endBtn.onclick = () => socket.emit('endTurn');
trapBtn.onclick = () => socket.emit('placeTrap'); controlBtn.onclick = () => startControlSelection(); abilityBtn.onclick = () => socket.emit('useAbility');
prayBtn.onclick = () => { if(confirm('要将剩余的所有步数转换为三倍积分吗？')) socket.emit('pray'); };
if(horseBtn) horseBtn.onclick = () => { if(confirm('确定消耗剩余步数牵走一匹马吗？')) socket.emit('getHorse'); };

function requestMove(axis, dir) { if (!players[myId] || currentTurnId !== myId || turnPhase !== 'MOVING') return; socket.emit('playerMovement', { axis: axis, dir: dir }); }
document.addEventListener('keydown', (e) => { 
    if(document.activeElement.id === 'chat-input') return;
    const k = {'ArrowLeft':{x:'x',d:-1},'ArrowRight':{x:'x',d:1},'ArrowUp':{x:'y',d:-1},'ArrowDown':{x:'y',d:1}}; 
    if (k[e.key]) requestMove(k[e.key].x, k[e.key].d); 
});
document.getElementById('btn-up').onclick = () => requestMove('y', -1); document.getElementById('btn-down').onclick = () => requestMove('y', 1);
document.getElementById('btn-left').onclick = () => requestMove('x', -1); document.getElementById('btn-right').onclick = () => requestMove('x', 1);

document.getElementById('btn-codex').onclick = () => {
    const modal = document.getElementById('codex-modal'); modal.style.display = 'flex';
    modal.innerHTML = `
        <div style="background:#2c3e50; width:85%; height:85%; max-width:800px; border-radius:10px; display:flex; overflow:hidden; color:white; box-shadow: 0 0 20px black; flex-direction: row;">
            <div style="width:28%; background:#1a252f; padding:20px 10px; display:flex; flex-direction:column; gap:8px; border-right:2px solid #34495e;">
                <h2 style="margin:0; text-align:center; border-bottom:1px solid #7f8c8d; padding-bottom:10px; font-size:20px;">📖 校园指南</h2>
                <button class="man-tab" onclick="renderManualTab('rules')">🏆 获胜规则</button>
                <button class="man-tab" onclick="renderManualTab('zones')">🗺️ 区域效果</button>
                <button class="man-tab" onclick="renderManualTab('items')">🎒 道具图鉴</button>
                <button class="man-tab" onclick="renderManualTab('roles')">🧑‍🎓 人物图鉴</button>
                <button class="man-tab" onclick="renderManualTab('events')">🌪️ 事件效果</button>
                <button style="margin-top:auto; padding:12px; background:#e74c3c; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; font-size:16px;" onclick="document.getElementById('codex-modal').style.display='none'">❌ 关闭指南</button>
            </div>
            <div id="manual-content" style="width:72%; padding:25px; overflow-y:auto; line-height:1.6; font-size:15px; background:#2c3e50;"></div>
        </div>
        <style>.man-tab{padding:12px 10px;background:#34495e;color:white;border:none;border-radius:5px;cursor:pointer;font-size:15px;text-align:left;transition:0.2s;}.man-tab:hover{background:#2980b9;}.man-item{background:rgba(0,0,0,0.25);padding:12px;border-radius:6px;margin-bottom:12px;display:flex;align-items:center;gap:15px;}</style>
    `;
    renderManualTab('rules');
};

window.renderManualTab = function(tabName) {
    const content = document.getElementById('manual-content'); let html = '';
    if (tabName === 'rules') { html = manualInfo.rules || ''; } else if (tabName === 'events') { html = manualInfo.events || ''; } 
    else if (tabName === 'zones') {
        html = '<h3 style="color:#f1c40f; margin-top:0;">🗺️ 区域效果一览</h3>';
        for (let k in zones) {
            let z = zones[k]; let shopTxt = z.shop ? `🛍️ 商店: ${z.shop.map(id => itemsInfo[id].name).join(', ')}` : ''; let dropTxt = z.drop ? `🎁 掉落: ${itemsInfo[z.drop.id].name} (概率 ${Math.round(z.drop.rate*100)}%)` : ''; let descTxt = z.desc ? `<div style="color:#ecf0f1; font-size:14px; margin-bottom:6px;">✨ 效果: ${z.desc}</div>` : '';
            html += `<div class="man-item" style="border-left: 5px solid ${z.color}; align-items:flex-start; flex-direction:column; gap:4px;"><div style="width:100%;"><h4 style="margin:0 0 6px 0; color:${z.color}; text-shadow: 1px 1px 2px black; font-size:17px;">${z.name}</h4>${descTxt}<div style="font-size:12px; color:#bdc3c7; display:flex; flex-direction:column; gap:2px; background:rgba(0,0,0,0.2); padding:5px; border-radius:4px;">${shopTxt ? `<span>${shopTxt}</span>` : ''} ${dropTxt ? `<span>${dropTxt}</span>` : ''} ${!shopTxt && !dropTxt && !z.desc ? '<span>普通区域。</span>' : ''}</div></div></div>`;
        }
    } else if (tabName === 'items') {
        html = '<h3 style="color:#f1c40f; margin-top:0;">🎒 道具图鉴</h3>';
        for (let k in itemsInfo) {
            let i = itemsInfo[k]; html += `<div class="man-item"><div style="font-size: 32px; width:40px; text-align:center;">${i.icon}</div><div style="flex:1;"><h4 style="margin:0 0 5px 0; color:#fff;">${i.name} <span style="font-size:11px; float:right; background:#e67e22; padding:2px 6px; border-radius:3px;">${i.cost > 0 ? i.cost+'分' : '不可购买'}</span></h4><span style="font-size:13px; color:#bdc3c7;">${i.desc}</span></div></div>`;
        }
    } else if (tabName === 'roles') {
        html = '<h3 style="color:#f1c40f; margin-top:0;">🧑‍🎓 人物图鉴 (点击查看详情)</h3><div style="display:flex; flex-wrap:wrap; gap:15px;">';
        for (let key in rolesConfig) {
            let r = rolesConfig[key]; 
            // === 核心修改：图鉴小头像带上密钥 ===
            let bg = (unlockAvatars && r.img) ? `url('/api/avatar/${r.img}?key=${currentSecretKey}')` : 'none'; 
            let txt = (!unlockAvatars || !r.img) ? r.name[0].toUpperCase() : '';
            html += `<div onclick="renderRoleDetail('${key}')" title="${unlockAvatars ? r.name : '???'}" style="width:70px; height:70px; border-radius:10px; background-color:${r.color}; background-image:${bg}; background-size:cover; background-position:center; cursor:pointer; border:3px solid rgba(255,255,255,0.8); display:flex; justify-content:center; align-items:center; font-size:30px; font-weight:bold; color:white; transition:0.2s;" onmouseover="this.style.transform='scale(1.1)'; this.style.borderColor='gold';" onmouseout="this.style.transform='scale(1)'; this.style.borderColor='rgba(255,255,255,0.8)';">${txt}</div>`;
        }
        html += '</div>';
    }
    content.innerHTML = html;
};

window.renderRoleDetail = function(key) {
    let r = rolesConfig[key]; 
    // === 核心修改：图鉴大头像带上密钥 ===
    let bg = (unlockAvatars && r.img) ? `url('/api/avatar/${r.img}?key=${currentSecretKey}')` : 'none'; 
    let txt = (!unlockAvatars || !r.img) ? r.name[0].toUpperCase() : '';
    document.getElementById('manual-content').innerHTML = `<button onclick="renderManualTab('roles')" style="margin-bottom:20px; padding:8px 15px; background:#7f8c8d; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; transition:0.2s;" onmouseover="this.style.background='#95a5a6'" onmouseout="this.style.background='#7f8c8d'">⬅ 返回角色列表</button><div style="display:flex; gap:25px; align-items:flex-start; background:rgba(0,0,0,0.3); padding:25px; border-radius:10px; box-shadow:inset 0 0 20px rgba(0,0,0,0.5);"><div style="min-width:120px; height:120px; border-radius:15px; background-color:${r.color}; background-image:${bg}; background-size:cover; background-position:center; border:4px solid #fff; display:flex; justify-content:center; align-items:center; font-size:50px; font-weight:bold; color:white; box-shadow: 0 0 15px ${r.color};">${txt}</div><div style="flex:1;"><h2 style="margin:0 0 10px 0; color:${r.color}; font-size:26px; text-shadow: 1px 1px 3px black;">${r.name}</h2><div style="font-size:16px; color:#2ecc71; margin-bottom:15px; font-weight:bold; background:#1a252f; display:inline-block; padding:8px 12px; border-radius:5px; border-left:4px solid #2ecc71;">❤️ 体力: ${r.str} &nbsp;&nbsp;|&nbsp;&nbsp; 🧠 智力: ${r.int}</div><p style="color:#ecf0f1; line-height:1.7; font-size:16px; margin:0; background:rgba(255,255,255,0.05); padding:15px; border-radius:8px;">${r.desc}</p></div></div>`;
};

function renderScoreboard() {
    if (Object.keys(players).length > 0) {
        spectatorScoreboard.style.display = 'block'; scoreboardList.innerHTML = '';
        Object.values(players).filter(p=>!p.isSummon).sort((a,b) => b.score - a.score).forEach(p => {
            let row = document.createElement('div'); row.style.display = 'flex'; row.style.justifyContent = 'space-between'; row.style.padding = '5px'; row.style.background = 'rgba(0,0,0,0.2)'; row.style.borderRadius = '3px'; row.style.borderLeft = `4px solid ${p.color || '#fff'}`;
            row.innerHTML = `<span>${p.name}</span> <span style="color:gold; font-weight:bold;">${p.score} 分</span>`; scoreboardList.appendChild(row);
        });
    } else { spectatorScoreboard.style.display = 'none'; }
}

function updateUI(state) {
    weatherBadge.className = (state.weatherEffect==='HEAT'?'w-heat':(state.weatherEffect==='COLD'?'w-cold':'w-none')); weatherBadge.innerText = `${state.timeOfDay} (R${state.globalRound})`;
    if (state.classMission) { missionBar.style.display = 'block'; missionBar.innerText = `🔔 上课铃！${state.classMission.deadline - state.globalRound}回合内前往 [${zones[state.classMission.target].name}]`; } else { missionBar.style.display = 'none'; }
    if (state.activeSideQuests && state.activeSideQuests.length > 0) { sideQuestBar.style.display = 'block'; sideQuestBar.innerHTML = state.activeSideQuests.map(q => `📜 ${q.desc}`).join('<br>'); } else { sideQuestBar.style.display = 'none'; }
    currentTargetScore.innerText = state.targetScore > 0 ? `${state.targetScore} 分` : '无限制';
    if (state.gameOver) { gameOverOverlay.style.display = 'flex'; gameOverOverlay.style.zIndex = '1000'; winnerText.innerText = `👑 恭喜 ${state.winnerName} 赢得了比赛！`; } else { gameOverOverlay.style.display = 'none'; }

    if (players[myId]) {
        const p = players[myId]; roleSelectionDiv.style.display = 'none'; dpadContainer.style.display = 'flex'; 
        if (p.role === 'hedi') { renderScoreboard(); } else { spectatorScoreboard.style.display = 'none'; }
        
        let displayP = p.activeEntity === 'zjy' ? players[p.zjyId] : p; let rConfig = rolesConfig[displayP.role];
        let customImg = (displayP.role === 'cyx') ? `cyx_${displayP.cyxForm}.png` : rConfig.img;

        playerAvatarDiv.style.display = 'flex'; playerAvatarDiv.style.justifyContent = 'center'; playerAvatarDiv.style.alignItems = 'center'; playerAvatarDiv.style.fontSize = '36px'; playerAvatarDiv.style.fontWeight = 'bold'; playerAvatarDiv.style.color = 'white'; playerAvatarDiv.style.borderColor = displayP.color;
        
        // === 核心修改：左上角玩家大头像带上密钥 ===
        if (unlockAvatars && customImg) { 
            playerAvatarDiv.style.backgroundImage = `url('/api/avatar/${customImg}?key=${currentSecretKey}')`; 
            playerAvatarDiv.style.backgroundColor = 'transparent'; 
            playerAvatarDiv.innerText = ''; 
        } else { 
            playerAvatarDiv.style.backgroundImage = 'none'; 
            playerAvatarDiv.style.backgroundColor = displayP.color || '#333'; 
            playerAvatarDiv.innerText = displayP.name[0].toUpperCase(); 
        }
        
        playerAvatarName.innerText = displayP.name; playerAvatarName.style.color = displayP.color; roleName.innerText = `我: ${p.name}`; roleName.style.color = p.color || '#fff'; roleStats.innerText = `体:${p.str} 智:${p.int} 💰:${p.score}`;
        
        let isMyTurn = currentTurnId === myId && !state.gameOver;
        if (p.isControlling) { statusText.innerText = `🔮 操控中: 剩 ${p.movesLeft} 步`; statusText.style.color = '#9b59b6'; } else if (p.activeEntity === 'zjy') { statusText.innerText = `✨ 控制zjy中: 剩 ${displayP.movesLeft} 步`; statusText.style.color = displayP.color; } else { statusText.innerText = isMyTurn ? (turnPhase==='WAITING' ? "请掷骰子" : `剩 ${p.movesLeft} 步`) : "等待中..."; statusText.style.color = 'white'; }
        if (activeGlobalEvents.invisible > 0) { statusText.innerText += ` (🌫️ 隐身)`; } if (activeGlobalEvents.sandstorm > 0) { statusText.innerText += ` (🌪️ 沙暴)`; }

        rollBtn.classList.toggle('hidden', !(isMyTurn && turnPhase === 'WAITING')); endBtn.classList.toggle('hidden', !(isMyTurn && turnPhase === 'MOVING')); prayBtn.classList.toggle('hidden', !(isMyTurn && turnPhase === 'MOVING' && displayP.movesLeft > 0 && getMyZone(displayP) === 'church')); if(horseBtn) horseBtn.classList.toggle('hidden', !(isMyTurn && turnPhase === 'MOVING' && displayP.movesLeft > 0 && !displayP.movedThisTurn && getMyZone(displayP) === 'stables')); trapBtn.classList.toggle('hidden', !(isMyTurn && turnPhase === 'WAITING' && p.role === 'xsm')); abilityBtn.classList.toggle('hidden', !(isMyTurn && turnPhase === 'WAITING' && p.role === 'jzx' && !p.zjyId && p.score >= 25)); controlBtn.classList.toggle('hidden', !(isMyTurn && turnPhase === 'WAITING' && p.role === 'lds' && getMyZone(p)?.includes('dorm')));

        if (p.role === 'cyx' && isMyTurn && turnPhase === 'WAITING') {
            if (p.cyxForm === 1 && p.score >= 125) { cyxEvolveBtn.style.display = 'inline-block'; cyxEvolveBtn.innerHTML = '✨ 进化: 黄鳝天师 (+20分)'; } 
            else if (p.cyxForm === 2 && p.score >= 225) { cyxEvolveBtn.style.display = 'inline-block'; cyxEvolveBtn.innerHTML = '🍳 进化: 荷包蛋 (+20分)'; } 
            else { cyxEvolveBtn.style.display = 'none'; }
            if (p.cyxForm === 2 && p.score >= 15) { cyxTeleportBtn.style.display = 'inline-block'; } 
            else { cyxTeleportBtn.style.display = 'none'; }
        } else { cyxEvolveBtn.style.display = 'none'; cyxTeleportBtn.style.display = 'none'; }

        renderInventory(p.inventory, isMyTurn); renderShop(displayP, isMyTurn); updateBuffs(p);
    } else {
        roleSelectionDiv.style.display = 'flex'; playerAvatarDiv.style.display = 'none'; dpadContainer.style.display = 'none'; playerAvatarName.innerText = ''; roleName.innerText = '观战中...'; roleName.style.color = '#ccc'; roleStats.innerText = ''; statusText.innerText = '请在右侧选择角色';
        rollBtn.classList.add('hidden'); endBtn.classList.add('hidden'); trapBtn.classList.add('hidden'); controlBtn.classList.add('hidden'); abilityBtn.classList.add('hidden'); prayBtn.classList.add('hidden'); if(horseBtn) horseBtn.classList.add('hidden'); cyxEvolveBtn.style.display = 'none'; cyxTeleportBtn.style.display = 'none';
        shopArea.innerHTML = ''; invContainer.innerHTML = ''; buffContainer.innerHTML = ''; renderRoleSelection(); renderScoreboard();
    }
}

function renderRoleSelection() {
    roleButtonsContainer.innerHTML = '';
    for (let key in rolesConfig) {
        if(key === 'zjy') continue; 
        let r = rolesConfig[key]; let isTaken = takenRoles.includes(key); let btn = document.createElement('button');
        btn.className = 'role-btn'; btn.innerHTML = `<span style="color:${r.color}; font-weight:bold;">${r.name}</span><br><span style="font-size:11px;">${r.desc}</span>`;
        if (isTaken) { btn.disabled = true; btn.innerHTML = `已占用: ${r.name}`; } else { btn.onclick = () => { socket.emit('selectRole', key); }; }
        roleButtonsContainer.appendChild(btn);
    }
}

function updateBuffs(p) { buffContainer.innerHTML = ''; if (p.buffs?.includes('immune_heat')) { let d = document.createElement('div'); d.className = 'buff-icon'; d.innerText = '🧊'; d.title = '免疫炎热'; buffContainer.appendChild(d); } if (p.buffs?.includes('immune_cold')) { let d = document.createElement('div'); d.className = 'buff-icon'; d.innerText = '🔥'; d.title = '免疫寒冷'; buffContainer.appendChild(d); } if (p.buffs?.includes('star_upgraded')) { let d = document.createElement('div'); d.className = 'buff-icon'; d.innerText = '✨'; d.title = '永远+1'; buffContainer.appendChild(d); } if (p.buffs?.includes('bright')) { let d = document.createElement('div'); d.className = 'buff-icon'; d.innerText = '🔦'; d.title = '明亮(破除迷雾)'; buffContainer.appendChild(d); } }
function renderInventory(inv, isMyTurn) { invContainer.innerHTML = ''; for(let i=0; i<5; i++) { let id = Object.keys(inv)[i]; let d = document.createElement('div'); d.className = 'inv-slot'; if (id) { let info = itemsInfo[id]; d.innerHTML = `<div style="font-size:20px">${info.icon}</div><div class="inv-count">x${inv[id]}</div>`; d.title = info.desc; if (isMyTurn) d.onclick = () => handleItemClick(id, info); } invContainer.appendChild(d); } }
function handleItemClick(id, info) { if (info.type === 'attack' || info.type === 'steal' || info.type === 'report' || info.type === 'phone') startTargetSelection(id, info.range, 'item'); else if (info.type === 'passive') alert('被动道具，自动生效'); else if(confirm(`使用 ${info.name}?`)) socket.emit('useItem', { itemId: id }); }

function startTargetSelection(idOrType, range, mode) {
    selectionMode = mode; targetOverlay.innerHTML = ''; targetOverlay.style.display = 'block'; targetTip.style.display = 'block'; targetTip.innerText = mode === 'control' ? '🔮 选择操控的傀儡' : `👀 选择目标`;
    let me = players[myId]; if(me.activeEntity === 'zjy') me = players[me.zjyId]; let amI_bright = me.buffs?.includes('bright');
    targetOverlay.style.position = 'absolute'; targetOverlay.style.top = canvas.offsetTop + 'px'; targetOverlay.style.left = canvas.offsetLeft + 'px'; targetOverlay.style.width = canvas.offsetWidth + 'px'; targetOverlay.style.height = canvas.offsetHeight + 'px'; targetOverlay.style.pointerEvents = 'auto';
    let cellWidth = canvas.offsetWidth / 20; let cellHeight = canvas.offsetHeight / 20; let targetsByTile = {};

    Object.keys(players).forEach(pid => {
        if (pid === myId || (me.isSummon && pid === me.ownerId) || (activeGlobalEvents.invisible > 0 && !amI_bright)) return; 
        let p = players[pid]; let dist = Math.abs(me.x - p.x) + Math.abs(me.y - p.y);
        if (mode === 'control' || mode === 'cyxTeleport' || dist <= range) { let key = p.x + ',' + p.y; if (!targetsByTile[key]) targetsByTile[key] = []; targetsByTile[key].push({ id: pid, player: p }); }
    });

    targetOverlay.onclick = (e) => { if (e.target === targetOverlay) cancelTargetSelection(); };

    for (let key in targetsByTile) {
        let list = targetsByTile[key]; let px = list[0].player.x; let py = list[0].player.y;
        let div = document.createElement('div'); div.className = 'target-indicator'; if (mode === 'control') div.classList.add('control-indicator');
        div.style.position = 'absolute'; div.style.left = (px * cellWidth) + 'px'; div.style.top = (py * cellHeight) + 'px'; div.style.width = cellWidth + 'px'; div.style.height = cellHeight + 'px'; div.style.boxSizing = 'border-box'; div.style.border = '3px dashed #f1c40f'; div.style.backgroundColor = 'rgba(241, 196, 15, 0.3)'; div.style.cursor = 'pointer'; div.style.zIndex = '100'; div.style.pointerEvents = 'auto'; 
        if (list.length > 1) { div.innerHTML = `<div style="position:absolute; top:-8px; right:-8px; background:#e74c3c; color:white; border-radius:50%; width:20px; height:20px; font-size:14px; display:flex; justify-content:center; align-items:center; font-weight:bold; box-shadow: 0 0 5px black; pointer-events:none;">${list.length}</div>`; }
        div.onmouseover = () => { div.style.backgroundColor = 'rgba(231, 76, 60, 0.6)'; div.style.borderColor = '#e74c3c'; }; div.onmouseout = () => { div.style.backgroundColor = 'rgba(241, 196, 15, 0.3)'; div.style.borderColor = '#f1c40f'; };

        div.onclick = (e) => { 
            e.stopPropagation(); 
            if (list.length === 1) {
                let target = list[0]; let action = mode === 'control' ? '操控' : (mode === 'cyxTeleport' ? '传送至' : '选中'); 
                if(confirm(`${action} ${target.player.name}?`)) { 
                    if (mode === 'control') socket.emit('startControl', target.id); 
                    else if (mode === 'cyxTeleport') socket.emit('cyxTeleport', target.id);
                    else socket.emit('useItem', { itemId: idOrType, targetId: target.id }); 
                    cancelTargetSelection(); 
                } 
            } else {
                let oldMenu = document.getElementById('multi-target-menu'); if(oldMenu) oldMenu.remove();
                let menu = document.createElement('div'); menu.id = 'multi-target-menu'; menu.style.position = 'absolute'; menu.style.left = (px * cellWidth + cellWidth) + 'px'; menu.style.top = (py * cellHeight) + 'px'; menu.style.background = 'rgba(44, 62, 80, 0.95)'; menu.style.border = '2px solid #f1c40f'; menu.style.padding = '8px'; menu.style.borderRadius = '8px'; menu.style.zIndex = '99999'; menu.style.display = 'flex'; menu.style.flexDirection = 'column'; menu.style.gap = '6px'; menu.style.boxShadow = '0 4px 15px rgba(0,0,0,0.8)'; menu.style.pointerEvents = 'auto';
                if (px > 12) { menu.style.left = 'auto'; menu.style.right = ((20 - px) * cellWidth) + 'px'; }

                list.forEach(target => {
                    let btn = document.createElement('button'); btn.innerHTML = `<span style="color:${target.player.color}; font-weight:bold; font-size:15px; pointer-events:none;">${target.player.name}</span>`; btn.style.padding = '8px 16px'; btn.style.cursor = 'pointer'; btn.style.background = '#34495e'; btn.style.border = '1px solid #7f8c8d'; btn.style.borderRadius = '4px'; btn.style.pointerEvents = 'auto'; btn.onmouseover = () => btn.style.background = '#2980b9'; btn.onmouseout = () => btn.style.background = '#34495e';
                    btn.onclick = (ev) => { ev.stopPropagation(); let action = mode === 'control' ? '操控' : (mode === 'cyxTeleport' ? '传送至' : '选中'); if(confirm(`${action} ${target.player.name}?`)) { if (mode === 'control') socket.emit('startControl', target.id); else if (mode === 'cyxTeleport') socket.emit('cyxTeleport', target.id); else socket.emit('useItem', { itemId: idOrType, targetId: target.id }); cancelTargetSelection(); } else { menu.remove(); } };
                    menu.appendChild(btn);
                });
                let cancelBtn = document.createElement('button'); cancelBtn.innerText = '取消选择'; cancelBtn.style.padding = '6px 12px'; cancelBtn.style.cursor = 'pointer'; cancelBtn.style.background = '#e74c3c'; cancelBtn.style.color = 'white'; cancelBtn.style.border = 'none'; cancelBtn.style.borderRadius = '4px'; cancelBtn.style.marginTop = '4px'; cancelBtn.style.fontWeight = 'bold'; cancelBtn.onclick = (ev) => { ev.stopPropagation(); menu.remove(); }; menu.appendChild(cancelBtn);
                menu.onclick = (ev) => ev.stopPropagation(); targetOverlay.appendChild(menu);
            }
        };
        targetOverlay.appendChild(div);
    }
}
function startControlSelection() { startTargetSelection(null, 999, 'control'); }
function cancelTargetSelection() { targetOverlay.style.display = 'none'; targetOverlay.innerHTML = ''; targetTip.style.display = 'none'; selectionMode = null; }

function renderShop(p, isMyTurn) { 
    shopArea.innerHTML = ''; let zKey = getMyZone(p); 
    if (isMyTurn && zKey && zones[zKey].shop) { zones[zKey].shop.forEach(iid => { let info = itemsInfo[iid]; let b = document.createElement('button'); b.className = 'btn btn-buy'; b.innerHTML = `买${info.name} -${info.cost}`; b.onclick = () => socket.emit('buyItem', iid); shopArea.appendChild(b); }); } 
    if (isMyTurn && zKey === 'fountain') { let b = document.createElement('button'); b.className = 'btn btn-buy'; b.innerHTML = `⛲ 许愿 -5分`; b.onclick = () => socket.emit('makeWish'); shopArea.appendChild(b); }
}

function initChatUI() {
    if (document.getElementById('chat-container')) return; 
    const chatUI = document.createElement('div'); chatUI.id = 'chat-container';
    chatUI.innerHTML = `<div style="display:flex; justify-content:space-between; margin-bottom:8px;"><span style="color:white; font-size:14px; font-weight:bold; text-shadow:1px 1px 2px black;">💬 校园频道</span><button id="btn-unlock-avatar" style="padding:3px 8px; font-size:11px; font-weight:bold; background:#e67e22; color:white; border:none; border-radius:3px; cursor:pointer;">👁️ 解锁头像</button></div><div id="chat-messages" style="height:160px; overflow-y:auto; margin-bottom:8px; font-size:13px; display:flex; flex-direction:column; gap:6px; padding-right:5px;"></div><div style="display:flex; gap:5px;"><input type="text" id="chat-input" placeholder="按 Enter 发送战术..." maxlength="100" style="flex:1; padding:6px; background:rgba(0,0,0,0.6); color:white; border:1px solid #7f8c8d; border-radius:4px; outline:none;"><button id="chat-send" style="padding:6px 12px; background:#2980b9; font-weight:bold; color:white; border:none; border-radius:4px; cursor:pointer;">发送</button></div>`;
    chatUI.style.cssText = "position:absolute; bottom:20px; left:20px; width:320px; background:rgba(44,62,80,0.85); padding:12px; border-radius:10px; border:2px solid #34495e; z-index:100; box-shadow: 0 4px 15px rgba(0,0,0,0.5);"; document.body.appendChild(chatUI);
    document.getElementById('chat-send').onclick = sendChat; document.getElementById('chat-input').addEventListener('keypress', (e) => { if(e.key === 'Enter') sendChat(); });
    
    // === 核心修改：记录与清除密码逻辑 ===
    document.getElementById('btn-unlock-avatar').onclick = () => { 
        if (unlockAvatars) { 
            unlockAvatars = false; 
            currentSecretKey = ''; // 清除密码
            alert('🔒 已恢复隐私模式。'); 
        } else { 
            let key = prompt('请输入图鉴与头像解锁密钥:'); 
            if(key === 'tuxiangtian') { 
                unlockAvatars = true; 
                currentSecretKey = key; // 保存密码
                alert('✅ 验证成功，世界已对你敞开！'); 
            } else if(key !== null) { 
                alert('❌ 密钥错误'); 
            } 
        } 
        renderChat(); 
        updateUI({ players, currentTurnId, turnPhase, globalRound, classMission, traps, plantedSeeds, groundItems, activeSideQuests, takenRoles, activeGlobalEvents, boars, guards, waterWalls, dayPhaseIndex, timeOfDay: TIME_PHASES[dayPhaseIndex] || '早晨', weatherEffect, targetScore, gameOver, winnerName: winner ? winner.name : null }); 
        let modal = document.getElementById('codex-modal'); 
        if (modal && modal.style.display === 'flex') renderManualTab('roles'); 
    };
}

function sendChat() { let input = document.getElementById('chat-input'); let val = input.value.trim(); if(val) { socket.emit('chatMessage', val); input.value = ''; } }

function renderChat() {
    let msgs = document.getElementById('chat-messages'); msgs.innerHTML = '';
    chatHistory.forEach(data => {
        let r = rolesConfig[data.role]; 
        // === 核心修改：聊天记录小头像带上密钥 ===
        let bg = (unlockAvatars && r && r.img) ? `url('/api/avatar/${r.img}?key=${currentSecretKey}')` : 'none'; 
        let txt = (!unlockAvatars || !r || !r.img) ? data.name[0].toUpperCase() : '';
        msgs.innerHTML += `<div style="display:flex; gap:8px; align-items:flex-start;"><div style="min-width:30px; height:30px; border-radius:5px; background-color:${data.color}; background-image:${bg}; background-size:cover; background-position:center; border:2px solid rgba(255,255,255,0.8); display:flex; justify-content:center; align-items:center; font-size:16px; font-weight:bold; color:white;">${txt}</div><div style="background:rgba(0,0,0,0.5); padding:6px 10px; border-radius:6px; color:white; word-break:break-all; flex:1;"><span style="color:${data.color}; font-weight:bold; font-size:12px;">${data.name}</span><br><span style="font-size:13px; line-height:1.4;">${data.text}</span></div></div>`;
    }); msgs.scrollTop = msgs.scrollHeight; 
}