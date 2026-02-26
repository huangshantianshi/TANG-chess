// public/js/network.js - 处理所有服务器消息
socket.on('connect', () => { myId = socket.id; });

socket.on('initData', (data) => { 
    zones = data.zones; itemsInfo = data.items; rolesConfig = data.roles; manualInfo = data.manual;
    if (data.mapImage) { mapImage.src = data.mapImage; mapImage.onload = () => { mapLoaded = true; draw(); }; } 
    initChatUI(); 
});

socket.on('gameLog', (msg) => { 
    let d = document.createElement('div'); d.className='log-item'; d.innerText=msg; 
    logsDiv.appendChild(d); logsDiv.scrollTop = logsDiv.scrollHeight; 
});

socket.on('updateState', (state) => {
    players = state.players; currentTurnId = state.currentTurnId; turnPhase = state.turnPhase;
    plantedSeeds = state.plantedSeeds || []; groundItems = state.groundItems || []; traps = state.traps || [];
    takenRoles = state.takenRoles || []; activeGlobalEvents = state.activeGlobalEvents || { invisible: 0, boarsRound: 0, sandstorm: 0, flood: 0 }; 
    boars = state.boars || []; guards = state.guards || []; waterWalls = state.waterWalls || []; dayPhaseIndex = state.dayPhaseIndex || 0;
    updateUI(state); 
    draw(); 
    if (currentTurnId !== myId) cancelTargetSelection();
});

socket.on('chatMessage', (data) => {
    chatHistory.push(data);
    if(chatHistory.length > 50) chatHistory.shift(); 
    renderChat();
});