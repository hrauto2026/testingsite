// ==========================================
// js/engine-wuxiang.js
// 屋向奇門（三元九運）演算法與快取模組
// ==========================================

let compassPanMode = 'shijia'; // 'shijia' (時家盤) 或 'wuxiang' (屋向盤)

// 十二地支門向對應之符頭六儀天干
const WUXIANG_BRANCH_FUTOU = {
    '子': '戊', '丑': '戊',
    '寅': '癸', '卯': '己',
    '辰': '壬', '巳': '庚',
    '午': '辛', '未': '辛',
    '申': '庚', '酉': '壬',
    '戌': '己', '亥': '癸'
};

// 十二地支所屬之八卦宮位
const WUXIANG_BRANCH_PALACE = {
    '子': 1, '丑': 8, '寅': 8, '卯': 3,
    '辰': 4, '巳': 4, '午': 9, '未': 2,
    '申': 2, '酉': 7, '戌': 6, '亥': 6
};

// 九運十二局寫死盤（由巽宮推理至八宮，神盤採用白虎／玄武）
const WX_RING_ORDER = [1, 8, 3, 4, 9, 2, 7, 6];
const WX_GODS_YANG = ["值符", "螣蛇", "太陰", "六合", "白虎", "玄武", "九地", "九天"];
const WX_STAR_RING = ['天蓬', '天任', '天衝', '天輔', '天英', '天芮', '天柱', '天心'];
const WX_DOORS_ORDER = ["休門", "生門", "傷門", "杜門", "景門", "死門", "驚門", "開門"];
const WX_EARTH_STEMS_YUN9 = ['己', '乙', '辛', '壬', '戊', '庚癸', '丙', '丁'];

const YUN9_XUN_CONFIGS = {
    '子_1': { door: '子', house: 1, god: '六合', star: '天心', doorName: '杜門', stem: '丁', fuTou: '戊', starLeader: '天英' },
    '丑_8': { door: '丑', house: 8, god: '太陰', star: '天柱', doorName: '開門', stem: '丙', fuTou: '戊', starLeader: '天英' },
    '亥_6': { door: '亥', house: 6, god: '白虎', star: '天任', doorName: '開門', stem: '乙', fuTou: '癸', starLeader: '天芮' },
    '寅_8': { door: '寅', house: 8, god: '太陰', star: '天心', doorName: '生門', stem: '丁', fuTou: '癸', starLeader: '天芮' },
    '卯_3': { door: '卯', house: 3, god: '螣蛇', star: '天任', doorName: '傷門', stem: '乙', fuTou: '己', starLeader: '天蓬' },
    '戌_6': { door: '戌', house: 6, god: '白虎', star: '天英', doorName: '休門', stem: '戊', fuTou: '己', starLeader: '天蓬' },
    '辰_4': { door: '辰', house: 4, god: '值符', star: '天輔', doorName: '景門', stem: '壬', fuTou: '壬', starLeader: '天輔' },
    '巳_4': { door: '巳', house: 4, god: '值符', star: '天芮', doorName: '休門', stem: '庚癸', fuTou: '庚', starLeader: '天芮' },
    '午_9': { door: '午', house: 9, god: '九天', star: '天任', doorName: '開門', stem: '乙', fuTou: '辛', starLeader: '天任' },
    '未_2': { door: '未', house: 2, god: '九地', star: '天蓬', doorName: '生門', stem: '己', fuTou: '辛', starLeader: '天任' },
    '申_2': { door: '申', house: 2, god: '九地', star: '天輔', doorName: '開門', stem: '壬', fuTou: '庚', starLeader: '天芮' },
    '酉_7': { door: '酉', house: 7, god: '玄武', star: '天蓬', doorName: '開門', stem: '己', fuTou: '壬', starLeader: '天輔' },
};

const YUN9_PRESET_CACHE = {};
(function initYun9Presets() {
    for (const key in YUN9_XUN_CONFIGS) {
        const conf = YUN9_XUN_CONFIGS[key];
        const gIdx = WX_GODS_YANG.indexOf(conf.god);
        const sIdx = WX_STAR_RING.indexOf(conf.star);
        const dIdx = WX_DOORS_ORDER.indexOf(conf.doorName);
        const tIdx = WX_EARTH_STEMS_YUN9.indexOf(conf.stem);

        const godPan = {};
        const starPan = {};
        const doorPan = {};
        const heavenStemPan = {};

        // 巽宮在 WX_RING_ORDER 索引為 3
        for (let r = 0; r < 8; r++) {
            const p = WX_RING_ORDER[r];
            const offset = r - 3;
            godPan[p] = WX_GODS_YANG[(gIdx + offset + 16) % 8];
            starPan[p] = WX_STAR_RING[(sIdx + offset + 16) % 8];
            doorPan[p] = WX_DOORS_ORDER[(dIdx + offset + 16) % 8];
            heavenStemPan[p] = WX_EARTH_STEMS_YUN9[(tIdx + offset + 16) % 8];
        }

        YUN9_PRESET_CACHE[key] = {
            godPan, starPan, doorPan, heavenStemPan,
            fuTouStem: conf.fuTou, starLeader: conf.starLeader
        };
    }
})();

function calculateWuxiangData(yun, housePalace, doorBranch) {
    const LUOSHU_FLY = [5, 6, 7, 8, 9, 1, 2, 3, 4];
    const STEMS_9 = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
    const CHINESE_NUMS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

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

    // 九運直接調用寫死預設盤
    if (yun === 9) {
        const lookupKey = `${doorBranch}_${housePalace}`;
        const fallbackKey = Object.keys(YUN9_PRESET_CACHE).find(k => k.startsWith(doorBranch + '_')) || '子_1';
        const preset = YUN9_PRESET_CACHE[lookupKey] || YUN9_PRESET_CACHE[fallbackKey];

        return {
            yun, housePalace, doorMountain: doorBranch, doorPalace: WUXIANG_BRANCH_PALACE[doorBranch],
            earthNum, earthStem, starPan: preset.starPan, heavenStemPan: preset.heavenStemPan,
            godPan: preset.godPan, doorPan: preset.doorPan, centerStem,
            fuTouStem: preset.fuTouStem, starLeader: preset.starLeader, CHINESE_NUMS
        };
    }

    // 非九運後續計算備用結構 (擴充用)
    let effHousePalace = housePalace === 5 ? 2 : housePalace;
    const fuTouStem = WUXIANG_BRANCH_FUTOU[doorBranch] || '戊';
    
    let originPalace = 5;
    if (fuTouStem === centerStem) {
        originPalace = 2;
    } else {
        for (let p of WX_RING_ORDER) {
            if (earthStem[p].includes(fuTouStem)) { originPalace = p; break; }
        }
    }
    
    const starLeader = (PALACES_HOU[originPalace].baseDoor === "天禽" || originPalace === 5) ? '天芮' : BASE_STARS[originPalace];
    const zhiShiDoor = PALACES_HOU[originPalace === 5 ? 2 : originPalace].baseDoor;

    const heavenStemPan = {}; const starPan = {}; const godPan = {}; const doorPan = {};
    const earthOuterStems = WX_RING_ORDER.map(p => earthStem[p]);
    const fuTouEarthIdx = earthOuterStems.findIndex(s => s.includes(fuTouStem));
    const houseRingIdx = WX_RING_ORDER.indexOf(effHousePalace);
    const starOriginIdx = WX_STAR_RING.indexOf(starLeader);
    
    for (let k = 0; k < 8; k++) {
        const targetP = WX_RING_ORDER[(houseRingIdx + k) % 8];
        const sourceIdx = (fuTouEarthIdx + k) % 8;
        heavenStemPan[targetP] = earthOuterStems[sourceIdx];
        starPan[targetP] = WX_STAR_RING[(starOriginIdx + k) % 8];
        godPan[targetP] = WX_GODS_YANG[k];
        doorPan[targetP] = WX_DOORS_ORDER[k];
    }

    return {
        yun, housePalace, doorMountain: doorBranch, doorPalace: WUXIANG_BRANCH_PALACE[doorBranch],
        earthNum, earthStem, starPan, heavenStemPan, godPan, doorPan, centerStem, fuTouStem, starLeader, CHINESE_NUMS
    };
}