// data/zones.js
const ZONES = {
    'female_dorm':{range:[0,4,0,4],name:'女生宿舍',color:'rgba(255,183,178,0.5)',shop:['warmer', 'phone', 'flashlight'], desc:'【安全区】休息充沛，在此掷骰子点数必定 +1。Lds 可在此发动傀儡操控。'}, 
    'male_dorm_n':{range:[15,19,0,4],name:'北方男寝',color:'rgba(178,216,255,0.5)',shop:['warmer', 'phone', 'flashlight'], desc:'【安全区】休息充沛，在此掷骰子点数必定 +1。Lds 可在此发动傀儡操控。'},
    'male_dorm_s':{range:[0,4,15,19],name:'南方男寝',color:'rgba(178,216,255,0.5)',shop:['warmer', 'phone', 'flashlight'], desc:'【安全区】休息充沛，在此掷骰子点数必定 +1。Lds 可在此发动傀儡操控。'}, 
    'intl_dorm':{range:[15,19,15,19],name:'留学生寝',color:'rgba(224,187,228,0.5)',shop:['warmer', 'phone', 'flashlight'], desc:'【安全区】休息充沛，在此掷骰子点数必定 +1。Lds 可在此发动傀儡操控。'},
    'canteen':{range:[8,11,8,11],name:'大食堂',color:'rgba(255,223,186,0.5)',shop:['energy_drink','water', 'flashlight'], desc:'【安全区】停留在此结束回合可打工赚取积分（体力×2 + 智力×2）。'}, 
    'office':{range:[9,10,0,2],name:'校长室',color:'rgba(44,62,80,0.8)',fontColor:'white', desc:'【禁闭室】因逃课、被举报或被保安抓获，会被强制关押至此并扣除大量积分。'},
    'class_n':{range:[6,8,2,4],name:'北方教室',color:'rgba(255,255,186,0.5)',drop:{id:'chair',rate:0.17}, shop:['flashlight'], desc:'【安全区】早晨概率触发上课点名任务，按时到达可获得高额积分。'}, 
    'class_s':{range:[11,13,15,17],name:'南方教室',color:'rgba(255,255,186,0.5)',drop:{id:'chair',rate:0.17}, shop:['flashlight'], desc:'【安全区】早晨概率触发上课点名任务，按时到达可获得高额积分。'},
    'playground_b':{range:[5,14,5,7],name:'大操场',color:'rgba(186,225,255,0.5)',drop:{id:'frisbee',rate:0.17}, desc:'【露天】极其空旷。yyj 在此处掷骰子步数 +2。'}, 
    'playground_s':{range:[5,7,12,14],name:'小操场',color:'rgba(186,225,255,0.5)',drop:{id:'frisbee',rate:0.17}, desc:'【露天】极其空旷。yyj 在此处掷骰子步数 +2。'},
    'farm':{range:[0,3,8,11],name:'农场花园',color:'rgba(186,255,201,0.5)',shop:['seed'], desc:'【露天】停留结束回合可打工赚分。可在此购买并种下种子，2回合后收获大量积分。'}, 
    'stables':{range:[16,19,8,11],name:'马厩',color:'rgba(210,145,188,0.5)', desc:'【露天】经过时可点击【牵马】消耗当前所有剩余步数获得一匹马（下回合掷出3-9步）。'},
    'church':{range:[12,14,2,4],name:'教堂',color:'rgba(226,240,203,0.5)',drop:{id:'chair',rate:0.17}, shop:['flashlight'], desc:'【安全区】移动中可点击【祈祷】按钮，将当回合剩余的所有步数按 1:3 的比例兑换成积分。'}, 
    'fountain':{range:[8,11,12,14],name:'喷泉花园',color:'rgba(186,255,201,0.5)',drop:{id:'cheat_sheet',rate:0.1}, desc:'【露天】可点击【许愿】花费5积分抽奖，概率获得小抄、冰水，极小概率爆出50积分。'}
};

module.exports = ZONES;