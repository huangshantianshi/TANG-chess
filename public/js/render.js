// public/js/render.js - v26.2: 游戏场景渲染引擎 (支持卡通/真人双重头像)
const nameCache = {}; 

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mapLoaded) { ctx.globalAlpha = 0.8; ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height); ctx.globalAlpha = 1.0; }
    
    if (zones) for (let k in zones) { 
        let z = zones[k], r = z.range; ctx.fillStyle = z.color; 
        ctx.fillRect(r[0]*32, r[2]*32, (r[1]-r[0]+1)*32, (r[3]-r[2]+1)*32); 
        ctx.fillStyle = z.fontColor || "#333"; ctx.font="bold 12px Arial"; ctx.textAlign="center"; ctx.strokeStyle = "white"; ctx.lineWidth = 3; 
        let tx = (r[0]*32)+((r[1]-r[0]+1)*32)/2; let ty = (r[2]*32)+((r[3]-r[2]+1)*32)/2; 
        ctx.strokeText(z.name, tx, ty); ctx.fillText(z.name, tx, ty); 
    }
    
    if (activeGlobalEvents.invisible > 0) { ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    if (activeGlobalEvents.sandstorm > 0) { ctx.fillStyle = 'rgba(218, 165, 32, 0.5)'; for (let x=0; x<20; x++) { for (let y=0; y<20; y++) { if (!isSafeZoneClient(x, y)) ctx.fillRect(x*32, y*32, 32, 32); } } }
    if (activeGlobalEvents.flood === 3) { ctx.fillStyle = 'rgba(0, 50, 150, 0.5)'; for (let x=0; x<20; x++) { for (let y=0; y<20; y++) { if (!isSafeZoneClient(x, y)) ctx.fillRect(x*32, y*32, 32, 32); } } }
    if (activeGlobalEvents.flood > 0 && activeGlobalEvents.flood < 3 && waterWalls.length > 0) { ctx.fillStyle = 'rgba(135, 206, 235, 0.7)'; waterWalls.forEach(w => { ctx.fillRect(w.x*32, w.y*32, 32, 32); }); }

    traps.forEach(t => { if(t.ownerId===myId) { ctx.fillStyle="purple"; ctx.beginPath(); ctx.arc(t.x*32+16, t.y*32+16, 8, 0, 6.28); ctx.fill(); } });
    plantedSeeds.forEach(s => { ctx.font="20px Arial"; ctx.fillText(s.mature?"🍅":"🌱", s.x*32+8, s.y*32+24); });
    groundItems.forEach(i => { let icon = itemsInfo[i.itemId].icon; ctx.font="20px Arial"; ctx.fillText(icon, i.x*32+8, i.y*32+24); });
    
    ctx.strokeStyle="rgba(0,0,0,0.15)"; ctx.lineWidth = 1; for(let i=0;i<=20;i++){ctx.beginPath();ctx.moveTo(i*32,0);ctx.lineTo(i*32,640);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*32);ctx.lineTo(640,i*32);ctx.stroke();}
    boars.forEach(b => { ctx.font="24px Arial"; ctx.fillText("🐗", b.x*32+16, b.y*32+24); });
    guards.forEach(g => { ctx.font="24px Arial"; ctx.fillText("💂", g.x*32+16, g.y*32+24); });

    let hl = currentTurnId; if (players[currentTurnId] && players[currentTurnId].activeEntity === 'zjy') hl = players[currentTurnId].zjyId;
    Object.keys(players).forEach(id => {
        let amI_bright = players[myId] && players[myId].buffs && players[myId].buffs.includes('bright');
        if (activeGlobalEvents.invisible > 0 && id !== myId && !players[id].isBot && !amI_bright) return;
        
        let p = players[id]; let px = p.x * 32; let py = p.y * 32;
        if(id === hl) { ctx.strokeStyle="#f1c40f"; ctx.lineWidth=3; ctx.strokeRect(px, py, 32, 32); }
        if (p.isSummon) { ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.fillRect(px+4, py+4, 24, 24); }

        // 绘制底色背景（如果卡通图是透明的，底色会透出来）
        ctx.fillStyle = p.color || '#fff'; if (p.isJailed) ctx.fillStyle="#7f8c8d"; ctx.fillRect(px+4, py+4, 24, 24);
        
        let r = rolesConfig[p.role];
        let realImgPath = (p.role === 'cyx') ? `cyx_${p.cyxForm}.png` : r?.img;
        // === 核心修改：双重头像判断逻辑 ===
        let finalImgUrl = null;

        if (unlockAvatars && realImgPath) {
            // 情况1：已解锁，显示私密真人照
            finalImgUrl = `/api/avatar/${realImgPath}?key=${currentSecretKey}`;
        } else if (r && r.cartoonImg) {
            // 情况2：未解锁，但配置了卡通照，显示卡通照
            finalImgUrl = `/cartoon_avatars/${r.cartoonImg}`;
        }

        if (finalImgUrl) {
            // 绘制图片（这里为了简化使用了低性能的即时加载，生产环境建议预加载）
            let imgObj = new Image(); 
            imgObj.src = finalImgUrl;
            ctx.drawImage(imgObj, px+4, py+4, 24, 24);
        } else {
            // 情况3：既没解锁也没卡通照（保底），显示色块首字母
            ctx.fillStyle="white"; ctx.font="bold 10px Arial"; ctx.textAlign="center"; ctx.strokeStyle="black"; ctx.lineWidth=2;
            let shortName = p.name.split(' ')[0];
            ctx.strokeText(shortName, px+16, py+32); ctx.fillText(shortName, px+16, py+32);
        }
        
        if (players[currentTurnId] && players[currentTurnId].isControlling === id) { ctx.strokeStyle = "purple"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px+16, py); ctx.lineTo(px+16, py-20); ctx.stroke(); ctx.font="12px Arial"; ctx.fillText("🔮", px+16, py-22); }
    });
}