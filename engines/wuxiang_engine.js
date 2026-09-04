// engines/wuxiang_engine.js
// 屋向奇門（三元九運四十八局）排盤演算核心

// 防衝突全域定義
window.WUXIANG_BRANCH_FUTOU = window.WUXIANG_BRANCH_FUTOU || {
    '子': '戊', '丑': '戊',
    '寅': '癸', '亥': '癸',
    '卯': '己', '戌': '己',
    '辰': '壬', '酉': '壬',
    '巳': '庚', '申': '庚',
    '午': '辛', '未': '辛'
};

window.WUXIANG_BRANCH_PALACE = window.WUXIANG_BRANCH_PALACE || {
    '子': 1, '丑': 8, '寅': 8, '卯': 3,
    '辰': 4, '巳': 4, '午': 9, '未': 2,
    '申': 2, '酉': 7, '戌': 6, '亥': 6
};

function calculateWuxiangData(yun, housePalace, doorBranch) {
    const LUOSHU_FLY = [5, 6, 7, 8, 9, 1, 2, 3, 4];
    const STEMS_9 = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
    const CHINESE_NUMS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const STEMS_LOOKUP = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    
    // 區域宣告，安全不污染全域
    const ringOrder = [1, 8, 3, 4, 9, 2, 7, 6];
    const doorsOrder = ["休門", "生門", "傷門", "杜門", "景門", "死門", "驚門", "開門"];
    const godsYang = ["值符", "螣蛇", "太陰", "六合", "白虎", "玄武", "九地", "九天"];
    const starRing = ['天蓬', '天任', '天衝', '天輔', '天英', '天芮', '天柱', '天心'];
    const baseStars = { 1: "天蓬", 8: "天任", 3: "天衝", 4: "天輔", 9: "天英", 2: "天芮", 7: "天柱", 6: "天心", 5: "天禽" };
    const baseDoors = { 1: "休門", 8: "生門", 3: "傷門", 4: "杜門", 9: "景門", 2: "死門", 7: "驚門", 6: "開門", 5: "死門" };

    // 1. 地盤洛書數與陽遁排地盤
    const earthNum = {};
    const earthStem = {};
    for (let i = 0; i < 9; i++) {
        earthNum[LUOSHU_FLY[i]] = ((yun - 1 + i) % 9) + 1;
    }

    const yunIndex = LUOSHU_FLY.indexOf(yun);
    for (let k = 0; k < 9; k++) {
        const p = LUOSHU_FLY[(yunIndex + k) % 9];
        earthStem[p] = STEMS_9[k];
    }

    const centerStem = earthStem[5];
    earthStem[2] = earthStem[2] + centerStem; // 中五寄坤二

    // 2. 定宅干與六甲旬符首
    let effHousePalace = housePalace === 5 ? 2 : housePalace;
    const fuTouStem = window.WUXIANG_BRANCH_FUTOU[doorBranch] || '戊';

    let zhaiGan = earthStem[effHousePalace].charAt(0);
    if (earthStem[effHousePalace].includes(fuTouStem)) {
        zhaiGan = fuTouStem;
    }

    let originPalace = 5;
    if (fuTouStem === centerStem) {
        originPalace = 2;
    } else {
        for (let p of ringOrder) {
            if (earthStem[p].includes(fuTouStem)) {
                originPalace = p;
                break;
            }
        }
    }

    const starLeader = (originPalace === 5 || (originPalace === 2 && fuTouStem === centerStem)) ? '天芮' : baseStars[originPalace];
    const zhiShiDoor = baseDoors[originPalace === 5 ? 2 : originPalace];

    // 3. 天盤奇儀、九星與八神排布
    const heavenStemPan = {};
    const starPan = {};
    const godPan = {};

    const earthOuterStems = ringOrder.map(p => earthStem[p]);
    const fuTouEarthIdx = earthOuterStems.findIndex(s => s.includes(fuTouStem));
    const houseRingIdx = ringOrder.indexOf(effHousePalace);
    const starOriginIdx = starRing.indexOf(starLeader);

    for (let k = 0; k < 8; k++) {
        const targetP = ringOrder[(houseRingIdx + k) % 8];
        const sourceIdx = (fuTouEarthIdx + k) % 8;
        heavenStemPan[targetP] = earthOuterStems[sourceIdx];
        starPan[targetP] = starRing[(starOriginIdx + k) % 8];
        godPan[targetP] = godsYang[k];
    }

    // 4. 八門排布
    let step = STEMS_LOOKUP.indexOf(zhaiGan);
    if (step === -1) step = 0;

    let currentP = ((originPalace - 1 + step) % 9) + 1;
    if (currentP === 5) currentP = 2;

    const doorPan = {};
    const zhiShiRingIdx = ringOrder.indexOf(currentP);
    const zhiShiDoorIdx = doorsOrder.indexOf(zhiShiDoor);
    const doorOffset = (zhiShiRingIdx - zhiShiDoorIdx + 8) % 8;

    for (let k = 0; k < 8; k++) {
        doorPan[ringOrder[(k + doorOffset) % 8]] = doorsOrder[k];
    }

    return {
        yun,
        housePalace,
        doorMountain: doorBranch,
        doorPalace: window.WUXIANG_BRANCH_PALACE[doorBranch],
        earthNum,
        earthStem,
        starPan,
        heavenStemPan,
        godPan,
        doorPan,
        centerStem,
        fuTouStem,
        starLeader,
        CHINESE_NUMS
    };
}

window.calculateWuxiangData = calculateWuxiangData;
