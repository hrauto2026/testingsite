// data/constants.js
// 奇門遁甲、五行、八卦、廿四山與相合相沖規則常數庫

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const YI_LIU = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙']; 
const JIA_ZI_ARRAY = []; 
for(let i=0; i<60; i++) JIA_ZI_ARRAY.push(STEMS[i%10] + BRANCHES[i%12]);

const PALACES_HOU = {
    1: { name: "坎一", num: "一", gua: "☵", type: "water", branch: ["子"], baseDoor: "休門" },
    8: { name: "艮八", num: "八", gua: "☶", type: "brown", branch: ["丑", "寅"], baseDoor: "生門" },
    3: { name: "震三", num: "三", gua: "☳", type: "wood", branch: ["卯"], baseDoor: "傷門" },
    4: { name: "巽四", num: "四", gua: "☴", type: "wood", branch: ["辰", "巳"], baseDoor: "杜門" },
    9: { name: "離九", num: "九", gua: "☲", type: "fire", branch: ["午"], baseDoor: "景門" },
    2: { name: "坤二", num: "二", gua: "☷", type: "brown", branch: ["未", "申"], baseDoor: "死門" },
    7: { name: "兌七", num: "七", gua: "☱", type: "metal", branch: ["酉"], baseDoor: "驚門" },
    6: { name: "乾六", num: "六", gua: "☰", type: "metal", branch: ["戌", "亥"], baseDoor: "開門" },
    5: { name: "中五", num: "五", gua: "", type: "brown", branch: [], baseDoor: "死門" }
};

const PALACES_XIAN = {
    1: { name: "坤八", num: "八", gua: "☷", type: "brown", branch: ["子"], baseDoor: "休門" },
    8: { name: "震四", num: "四", gua: "☳", type: "wood", branch: ["丑", "寅"], baseDoor: "生門" },
    3: { name: "離三", num: "三", gua: "☲", type: "fire", branch: ["卯"], baseDoor: "傷門" },
    4: { name: "兌二", num: "二", gua: "☱", type: "metal", branch: ["辰", "巳"], baseDoor: "杜門" },
    9: { name: "乾一", num: "一", gua: "☰", type: "metal", branch: ["午"], baseDoor: "景門" },
    2: { name: "巽五", num: "五", gua: "☴", type: "wood", branch: ["未", "申"], baseDoor: "死門" },
    7: { name: "坎六", num: "六", gua: "☵", type: "water", branch: ["酉"], baseDoor: "驚門" },
    6: { name: "艮七", num: "七", gua: "☶", type: "brown", branch: ["戌", "亥"], baseDoor: "開門" },
    5: { name: "中宮", num: "", gua: "", type: "brown", branch: [], baseDoor: "死門" }
};

const BRANCH_POSITIONS_TEMPLATE = { 1: `子`, 8: `丑寅`, 3: `卯`, 4: `辰巳`, 9: `午`, 2: `未申`, 7: `酉`, 6: `戌亥`, 5: `` };
const STAR_COLORS = { "天蓬": "water", "天任": "brown", "天衝": "wood", "天輔": "wood", "天英": "fire", "天芮": "brown", "天柱": "metal", "天心": "metal", "天禽": "brown" };
const GOD_COLORS = { "值符": "wood", "螣蛇": "fire", "太陰": "metal", "六合": "wood", "白虎": "metal", "玄武": "water", "九地": "brown", "九天": "metal" };
const DOOR_COLORS = { "休門": "water", "生門": "brown", "傷門": "wood", "杜門": "wood", "景門": "fire", "死門": "brown", "驚門": "metal", "開門": "metal" };
const BASE_STARS = { 1: "天蓬", 8: "天任", 3: "天衝", 4: "天輔", 9: "天英", 2: "天芮", 7: "天柱", 6: "天心", 5: "天禽" };
const RING_ORDER = [1, 8, 3, 4, 9, 2, 7, 6];
const GODS_YANG = ["值符", "螣蛇", "太陰", "六合", "白虎", "玄武", "九地", "九天"];
const DOORS_ORDER = ["休門", "生門", "傷門", "杜門", "景門", "死門", "驚門", "開門"];
const TRAD_JIEQI = { "冬至": "冬至", "小寒": "小寒", "大寒": "大寒", "立春": "立春", "雨水": "雨水", "惊蛰": "驚蟄", "驚蟄": "驚蟄", "春分": "春分", "清明": "清明", "谷雨": "穀雨", "穀雨": "穀雨", "立夏": "立夏", "小满": "小滿", "小滿": "小滿", "芒种": "芒種", "芒種": "芒種", "夏至": "夏至", "小暑": "小暑", "大暑": "大暑", "立秋": "立秋", "处暑": "處暑", "處暑": "處暑", "白露": "白露", "秋分": "秋分", "寒露": "寒露", "霜降": "霜降", "立冬": "立冬", "小雪": "小雪", "大雪": "大雪", "DONG_ZHI": "冬至" };
const WUXING_COLORS = { '甲': '#15803d', '乙': '#15803d', '寅': '#15803d', '卯': '#15803d', '丙': '#b91c1c', '丁': '#b91c1c', '巳': '#b91c1c', '午': '#b91c1c', '戊': '#78350f', '己': '#78350f', '辰': '#78350f', '戌': '#78350f', '丑': '#78350f', '未': '#78350f', '庚': '#d97706', '辛': '#d97706', '申': '#d97706', '酉': '#d97706', '壬': '#0369a1', '癸': '#0369a1', '亥': '#0369a1', '子': '#0369a1' };
const CLASH_MAP = { "子":"午", "午":"子", "丑":"未", "未":"丑", "寅":"申", "申":"寅", "卯":"酉", "酉":"卯", "辰":"戌", "戌":"辰", "巳":"亥", "亥":"巳" };

const TIAN_JIANG_LIST = ['貴人', '螣蛇', '朱雀', '六合', '勾陳', '青龍', '天空', '白虎', '太常', '玄武', '太陰', '天后'];
const ZQ_MAP = {"雨水": "亥", "春分": "戌", "谷雨": "酉", "穀雨": "酉", "小满": "申", "小滿": "申", "夏至": "未", "大暑": "午", "处暑": "巳", "處暑": "巳", "秋分": "辰", "霜降": "卯", "小雪": "寅", "冬至": "丑", "大寒": "子"};
const GUI_REN_MAP = {
    '甲': { day: '丑', night: '未' },
    '乙': { day: '子', night: '申' },
    '丙': { day: '亥', night: '酉' },
    '丁': { day: '亥', night: '酉' },
    '戊': { day: '丑', night: '未' },
    '己': { day: '子', night: '申' },
    '庚': { day: '丑', night: '未' },
    '辛': { day: '午', night: '寅' },
    '壬': { day: '巳', night: '卯' },
    '癸': { day: '巳', night: '卯' }
};

const STAR_ENERGY = {
    '天蓬': {1:'相', 8:'囚', 3:'旺', 4:'旺', 9:'休', 2:'囚', 7:'廢', 6:'廢'},
    '天芮': {1:'休', 8:'相', 3:'囚', 4:'囚', 9:'廢', 2:'相', 7:'旺', 6:'旺'},
    '天禽': {1:'休', 8:'相', 3:'囚', 4:'囚', 9:'廢', 2:'相', 7:'旺', 6:'旺'},
    '天任': {1:'休', 8:'相', 3:'囚', 4:'囚', 9:'廢', 2:'相', 7:'旺', 6:'旺'},
    '天衝': {1:'廢', 8:'休', 3:'相', 4:'相', 9:'旺', 2:'休', 7:'囚', 6:'囚'},
    '天輔': {1:'廢', 8:'休', 3:'相', 4:'相', 9:'旺', 2:'休', 7:'囚', 6:'囚'},
    '天心': {1:'旺', 8:'廢', 3:'休', 4:'休', 9:'囚', 2:'廢', 7:'相', 6:'相'},
    '天柱': {1:'旺', 8:'廢', 3:'休', 4:'休', 9:'囚', 2:'廢', 7:'相', 6:'相'},
    '天英': {1:'囚', 8:'旺', 3:'廢', 4:'廢', 9:'相', 2:'旺', 7:'休', 6:'休'}
};

const DOOR_ENERGY = {
    '休門': {1:'旺', 8:'死', 3:'休', 4:'休', 9:'囚', 2:'死', 7:'相', 6:'相'},
    '生門': {1:'囚', 8:'旺', 3:'死', 4:'死', 9:'相', 2:'旺', 7:'休', 6:'休'},
    '死門': {1:'囚', 8:'旺', 3:'死', 4:'死', 9:'相', 2:'旺', 7:'休', 6:'休'},
    '傷門': {1:'相', 8:'囚', 3:'旺', 4:'旺', 9:'休', 2:'囚', 7:'死', 6:'死'},
    '開門': {1:'休', 8:'相', 3:'囚', 4:'囚', 9:'死', 2:'相', 7:'旺', 6:'旺'},
    '杜門': {1:'相', 8:'囚', 3:'旺', 4:'旺', 9:'休', 2:'囚', 7:'死', 6:'死'},
    '景門': {1:'死', 8:'休', 3:'相', 4:'相', 9:'旺', 2:'休', 7:'囚', 6:'囚'},
    '驚門': {1:'休', 8:'相', 3:'囚', 4:'囚', 9:'死', 2:'相', 7:'旺', 6:'旺'}
};

const STEM_ENERGY = {
    '甲': {1:'沐浴', 8:'冠帶/臨官', 3:'帝旺', 4:'衰/病', 9:'死', 2:'墓/絕', 7:'胎', 6:'養/長生'},
    '乙': {1:'病', 8:'衰/帝旺', 3:'臨官', 4:'冠帶/沐浴', 9:'長生', 2:'養/胎', 7:'絕', 6:'墓/死'},
    '丙': {1:'胎', 8:'養/長生', 3:'沐浴', 4:'冠帶/臨官', 9:'帝旺', 2:'衰/病', 7:'死', 6:'墓/絕'},
    '丁': {1:'絕', 8:'墓/死', 3:'病', 4:'衰/帝旺', 9:'臨官', 2:'冠帶/沐浴', 7:'長生', 6:'養/胎'},
    '戊': {1:'胎', 8:'養/長生', 3:'沐浴', 4:'冠帶/臨官', 9:'帝旺', 2:'衰/病', 7:'死', 6:'墓/絕'},
    '己': {1:'絕', 8:'墓/死', 3:'病', 4:'衰/帝旺', 9:'臨官', 2:'冠帶/沐浴', 7:'長生', 6:'養/胎'},
    '庚': {1:'死', 8:'墓/絕', 3:'胎', 4:'養/長生', 9:'沐浴', 2:'冠帶/臨官', 7:'帝旺', 6:'衰/病'},
    '辛': {1:'長生', 8:'養/胎', 3:'絕', 4:'墓/死', 9:'病', 2:'衰/帝旺', 7:'臨官', 6:'冠帶/沐浴'},
    '壬': {1:'帝旺', 8:'衰/病', 3:'死', 4:'墓/絕', 9:'胎', 2:'養/長生', 7:'沐浴', 6:'冠帶/臨官'},
    '癸': {1:'臨官', 8:'冠帶/沐浴', 3:'長生', 4:'養/胎', 9:'絕', 2:'墓/死', 7:'病', 6:'衰/帝旺'}
};

const RELATION_RULES = {
    tianganWuhe: {
        title: "天干五合", type: "stem", min: 2,
        items: [
            { chars: ['甲', '己'], label: "甲己合化土" },
            { chars: ['乙', '庚'], label: "乙庚合化金" },
            { chars: ['丙', '辛'], label: "丙辛合化水" },
            { chars: ['丁', '壬'], label: "丁壬合化木" },
            { chars: ['戊', '癸'], label: "戊癸合化火" }
        ]
    },
    tianganChong: {
        title: "天干相沖", type: "stem", min: 2,
        items: [
            { chars: ['甲', '庚'], label: "甲庚相沖" },
            { chars: ['乙', '辛'], label: "乙辛相沖" },
            { chars: ['丙', '壬'], label: "丙壬相沖" },
            { chars: ['丁', '癸'], label: "丁癸相沖" }
        ]
    },
    dizhiSanhe: {
        title: "地支三合", type: "branch", min: 2,
        items: [
            { chars: ['申', '子', '辰'], label: "申子辰合成水局" },
            { chars: ['亥', '卯', '未'], label: "亥卯未合成木局" },
            { chars: ['寅', '午', '戌'], label: "寅午戌合成火局" },
            { chars: ['巳', '酉', '丑'], label: "巳酉丑合成金局" }
        ]
    },
    dizhiLiuhe: {
        title: "地支六合", type: "branch", min: 2,
        items: [
            { chars: ['子', '丑'], label: "子丑合化土" },
            { chars: ['寅', '亥'], label: "寅亥合化木" },
            { chars: ['卯', '戌'], label: "卯戌合化火" },
            { chars: ['辰', '酉'], label: "辰酉合化金" },
            { chars: ['巳', '申'], label: "巳申合化水" },
            { chars: ['午', '未'], label: "午未合化土" }
        ]
    },
    dizhiFangju: {
        title: "地支方局", type: "branch", min: 3,
        items: [
            { chars: ['寅', '卯', '辰'], label: "寅卯辰(木)" },
            { chars: ['巳', '午', '未'], label: "巳午未(火)" },
            { chars: ['申', '酉', '戌'], label: "申酉戌(金)" },
            { chars: ['亥', '子', '丑'], label: "亥子丑(水)" }
        ]
    },
    dizhiLiuchong: {
        title: "地支六沖", type: "branch", min: 2,
        items: [
            { chars: ['子', '午'], label: "子午沖" },
            { chars: ['丑', '未'], label: "丑未沖" },
            { chars: ['寅', '申'], label: "寅申沖" },
            { chars: ['卯', '酉'], label: "卯酉沖" },
            { chars: ['辰', '戌'], label: "辰戌沖" },
            { chars: ['巳', '亥'], label: "巳亥沖" }
        ]
    },
    dizhiXing: {
        title: "地支相刑", type: "branch", min: 2,
        items: [
            { chars: ['子', '卯'], label: "子卯相刑(無禮之刑)" },
            { chars: ['未', '戌'], label: "未戌相刑(恃勢之刑)" },
            { chars: ['寅', '申'], label: "寅申相刑(無恩之刑)" },
            { chars: ['寅', '巳'], label: "寅巳相刑(無恩之刑)" },
            { chars: ['辰', '辰'], label: "辰辰自刑", isZiXing: true },
            { chars: ['午', '午'], label: "午午自刑", isZiXing: true },
            { chars: ['酉', '酉'], label: "酉酉自刑", isZiXing: true },
            { chars: ['亥', '亥'], label: "亥亥自刑", isZiXing: true }
        ]
    },
    dizhiHai: {
        title: "地支相害", type: "branch", min: 2,
        items: [
            { chars: ['子', '未'], label: "子未相害" },
            { chars: ['丑', '午'], label: "丑午相害" },
            { chars: ['寅', '巳'], label: "寅巳相害" },
            { chars: ['卯', '辰'], label: "卯辰相害" },
            { chars: ['申', '亥'], label: "申亥相害" },
            { chars: ['酉', '戌'], label: "酉戌相害" }
        ]
    }
};

const MOUNTAINS_24 = [
    { name: "子", gua: "坎", center: 0, start: 352.5, end: 7.5, color: "#38bdf8", isMajor: true },
    { name: "癸", gua: "坎", center: 15, start: 7.5, end: 22.5, color: "#bae6fd" },
    { name: "丑", gua: "艮", center: 30, start: 22.5, end: 37.5, color: "#fde68a" },
    { name: "艮", gua: "艮", center: 45, start: 37.5, end: 52.5, color: "#fbbf24", isMajor: true },
    { name: "寅", gua: "艮", center: 60, start: 52.5, end: 67.5, color: "#fde68a" },
    { name: "甲", gua: "震", center: 75, start: 67.5, end: 82.5, color: "#86efac" },
    { name: "卯", gua: "震", center: 90, start: 82.5, end: 97.5, color: "#4ade80", isMajor: true },
    { name: "乙", gua: "震", center: 105, start: 97.5, end: 112.5, color: "#86efac" },
    { name: "辰", gua: "巽", center: 120, start: 112.5, end: 127.5, color: "#86efac" },
    { name: "巽", gua: "巽", center: 135, start: 127.5, end: 142.5, color: "#4ade80", isMajor: true },
    { name: "巳", gua: "巽", center: 150, start: 142.5, end: 157.5, color: "#86efac" },
    { name: "丙", gua: "離", center: 165, start: 157.5, end: 172.5, color: "#fca5a5" },
    { name: "午", gua: "離", center: 180, start: 172.5, end: 187.5, color: "#f87171", isMajor: true },
    { name: "丁", gua: "離", center: 195, start: 187.5, end: 202.5, color: "#fca5a5" },
    { name: "未", gua: "坤", center: 210, start: 202.5, end: 217.5, color: "#fde68a" },
    { name: "坤", gua: "坤", center: 225, start: 217.5, end: 232.5, color: "#fbbf24", isMajor: true },
    { name: "申", gua: "坤", center: 240, start: 232.5, end: 247.5, color: "#fde68a" },
    { name: "庚", gua: "兌", center: 255, start: 247.5, end: 262.5, color: "#e2e8f0" },
    { name: "酉", gua: "兌", center: 270, start: 262.5, end: 277.5, color: "#f1f5f9", isMajor: true },
    { name: "辛", gua: "兌", center: 285, start: 277.5, end: 292.5, color: "#e2e8f0" },
    { name: "戌", gua: "乾", center: 300, start: 292.5, end: 307.5, color: "#e2e8f0" },
    { name: "乾", gua: "乾", center: 315, start: 307.5, end: 322.5, color: "#f1f5f9", isMajor: true },
    { name: "亥", gua: "乾", center: 330, start: 322.5, end: 337.5, color: "#e2e8f0" },
    { name: "壬", gua: "坎", center: 345, start: 337.5, end: 352.5, color: "#bae6fd" }
];

const WUXIANG_BRANCH_FUTOU = {
    '子': '戊', '丑': '戊', '寅': '癸', '卯': '己',
    '辰': '壬', '巳': '庚', '午': '辛', '未': '辛',
    '申': '庚', '酉': '壬', '戌': '己', '亥': '癸'
};

const WUXIANG_XIU_MAP = {
    '子': 1, '丑': 9, '寅': 3, '卯': 8,
    '辰': 6, '巳': 4, '午': 9, '未': 3,
    '申': 9, '酉': 9, '戌': 4, '亥': 9
};

const WUXIANG_BRANCH_PALACE = {
    '子': 1, '丑': 8, '寅': 8, '卯': 3,
    '辰': 4, '巳': 4, '午': 9, '未': 2,
    '申': 2, '酉': 7, '戌': 6, '亥': 6
};