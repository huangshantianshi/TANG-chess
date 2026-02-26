// data/roles.js
const ROLES = {
    'xsm': { name: 'xsm (女)', gender: 'female', str: 2, int: 5, color: '#e74c3c', desc: '陷阱大师 | 使用10积分放置陷阱，定身除了自己以外踩到陷阱的角色一个回合。命中概率为(100-5*智力)%。学霸 (上课分+20)', img: 'xsm.png' },
    'syq': { name: 'syq (男)', gender: 'male', str: 4, int: 4, color: '#2ecc71', desc: '全天候行者 | 均衡 (无视寒冷与炎热的限速)', img: 'syq.png' },
    'lds': { name: 'lds (男)', gender: 'male', str: 1, int: 5, color: '#9b59b6', desc: '操偶师 | 宅男 (在寝室可放弃自己回合选择空告知其他人，控人时上限4步)', img: 'lds.png' },
    'yyj': { name: 'yyj (男)', gender: 'male', str: 5, int: 3, color: '#3498db', desc: '妇女之友 | 运动健将 (在操场掷出的步数+2)', img: 'yyj.png' },
    'wt': { name: 'wt (男)', gender: 'male', str: 4, int: 3, color: '#f39c12', desc: '车神 | 欧皇 (投5或6获自行车,只能在非区域的校道用)', img: 'wt.png' },
    'zlh': { name: 'zlh (男)', gender: 'male', str: 3, int: 4, color: '#34495e', desc: '夜猫子 | 早午停滞，下午及晚间步数翻倍', img: 'zlh.png' },
    'myj': { name: 'myj (女)', gender: 'female', str: 3, int: 4, color: '#e84393', desc: '交际花 | 晚上进男寝。寝室有50%概率捡口红，对短距离内男生使用可以偷取8分。', img: 'myj.png' },
    'jzx': { name: 'jzx (女)', gender: 'female', str: 2, int: 3, color: '#f368e0', desc: '召唤师 | 消耗一半积分(至少25)召唤zjy。拥有独立控制回合，分数共享。', img: 'jzx.png' },
    'zjy': { name: 'zjy (召唤物)', gender: 'female', str: 3, int: 3, color: '#ff9ff3', desc: '附属物 | 替jzx收集资源与战斗，14回合后消失返还一半积分，不参与上课，不能买道具。', img: 'zjy.png' },
    'ljh': { name: 'ljh (女)', gender: 'female', str: 2, int: 4, color: '#d35400', desc: '纪检委 | 完成支线获一封举报信。可无视距离举报比自己分数高的玩家令其关禁闭。', img: 'ljh.png' },
    'ynq': { name: 'ynq (女)', gender: 'female', str: 5, int: 2, color: '#00cec9', desc: '追星族 | 收集三个星块后永久升级，立刻获得30分。掷骰点数永远+1。', img: 'ynq.png' },
    'hedi': { name: 'hedi (女)', gender: 'female', str: 5, int: 5, color: '#9b59b6', desc: '全知者 | 知晓所有人积分。每次成功上课，骰子保底点数+1(最高保底3点)。', img: 'hedi.png' },
    'corey': { name: 'Corey (男)', gender: 'male', str: 4, int: 4, color: '#5e3d93', desc: '绝对威压 | 掷骰后至下回合间，所有点数小于他原始点数的角色(除zjy外)点数恒定压制为2点。', img: 'corey.png' },
    'zxw': { name: 'zxw (男)', gender: 'male', str: 5, int: 4, color: '#16a085', desc: '末日行者 | 无视沙尘暴、洪水和野猪的任何影响，但在大雾中依然会致盲。', img: 'zxw.png' },
    'cyx': { 
        name: 'cyx (面条)', 
        gender: 'male', 
        str: 4, 
        int: 2, 
        color: '#f1c40f', 
        desc: '<b>【阶段1：面条】</b>掷骰1~3，每回合可连动3次。<br>达到125分可自选进化。若全员达125分将被迫进化且无奖励。<br><b>【阶段2：黄鳝天师】</b>体5智3。花15分传送。<br>达到225分可终极进化。若全员达225分被迫进化且无奖励。<br><b>【阶段3：荷包蛋】</b>体3智4。免上课，拾取专属星星+50分，漏捡-35分。', 
        img: 'cyx_1.png' 
    }
};
module.exports = ROLES;