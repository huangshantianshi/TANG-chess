// data/items.js
const ITEMS = {
    'energy_drink': { name: '功能饮料', icon: '🥤', desc: '步数+3', cost: 5, type: 'active' }, 
    'cheat_sheet': { name: '作弊小抄', icon: '📄', desc: '上课自动+20分并销毁', cost: 0, type: 'passive' },
    'seed': { name: '神奇种子', icon: '🌱', desc: '种在花园可摘', cost: 5, type: 'seed' }, 
    'frisbee': { name: '飞盘', icon: '🥏', desc: '5格内敌人(-8分)', cost: 0, type: 'attack', range: 5, dmg: 8 },
    'chair': { name: '折叠椅', icon: '🪑', desc: '2格内敌人(-10分)', cost: 0, type: 'attack', range: 2, dmg: 10 }, 
    'water': { name: '冰水', icon: '🧊', desc: '免疫炎热', cost: 5, type: 'active' },
    'warmer': { name: '暖宝宝', icon: '🔥', desc: '免疫寒冷', cost: 5, type: 'active' }, 
    'panty': { name: '原味内裤', icon: '👙', desc: '任务物品', cost: 0, type: 'quest' },
    'fruit': { name: '任务果实', icon: '🍒', desc: '食用+3分', cost: 0, type: 'active' }, 
    'bicycle': { name: '自行车', icon: '🚲', desc: '校道用:额外回合', cost: 0, type: 'active' },
    'lipstick': { name: '口红', icon: '💄', desc: '对1格内男生偷8分', cost: 0, type: 'steal', range: 1, stealAmount: 8 }, 
    'mens_panty': { name: '男士内裤', icon: '🩲', desc: '任务物品', cost: 0, type: 'quest' },
    'report_letter': { name: '举报信', icon: '✉️', desc: '举报高分目标使其关禁闭', cost: 0, type: 'report', range: 999 },
    'star_block_1': { name: '星块①', icon: '1️⃣', desc: '使用+5分。集齐3个可升级', cost: 0, type: 'active' }, 
    'star_block_2': { name: '星块②', icon: '2️⃣', desc: '使用+5分。集齐3个可升级', cost: 0, type: 'active' }, 
    'star_block_3': { name: '星块③', icon: '3️⃣', desc: '使用+5分。集齐3个可升级', cost: 0, type: 'active' },
    'horse': { name: '马', icon: '🐴', desc: '马厩/校道用:额外回合(掷3-9)', cost: 0, type: 'active' }, 
    'phone': { name: '电话', icon: '☎️', desc: '下午召唤保安', cost: 15, type: 'phone', range: 999 },
    'flashlight': { name: '手电筒', icon: '🔦', desc: '无视大雾迷盲效果，持续3回合', cost: 5, type: 'active' },
    // === 新增：荷包蛋专属星星 ===
    'cyx_star': { name: '专属星星', icon: '🌟', desc: '荷包蛋专属任务物品，外人无法拾取', cost: 0, type: 'quest' }
};
module.exports = ITEMS;