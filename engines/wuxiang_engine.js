// engines/wuxiang_engine.js
// 屋向奇門（三元九運四十八局）排盤演算核心

function calculateWuxiangData(yun, housePalace, doorBranch) {
    const LUOSHU_FLY = [5, 6, 7, 8, 9, 1, 2, 3, 4];
    const STEMS_9 = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
    const STAR_RING = ['天蓬', '天任', '天衝', '天輔', '天英', '天芮', '天柱', '天心'];
    const STAR_BASE = { '天蓬':1, '天任':8, '天衝':3, '天輔':4, '天英':9, '天芮':2, '天柱':7, '天心':6 };
    const CHINESE_NUMS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

    // 1. 地盤洛書數與地盤干
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

    // 2. 依十二地支查符頭與值符星
    const fuTouStem = WUXIANG_BRANCH_FUTOU[doorBranch] || '戊';
    let originPalace = 5;
    if (fuTouStem === centerStem) {
        originPalace = 2;
    } else {
        for (let p of RING_ORDER) {
            if (earthStem[p].includes(fuTouStem)) {
                originPalace = p;
                break;
            }
        }
    }

    const starLeader = (PALACES_HOU[originPalace].baseDoor === "天禽" || originPalace === 5) ? '天芮' : BASE_STARS[originPalace];

    // 3. 天盤九星與天盤干旋轉至屋向宮
    const starPan = {};
    const heavenStemPan = {};
    const starOriginIdx = STAR_RING.indexOf(starLeader);
    const houseRingIdx = RING_ORDER.indexOf(housePalace);

    for (let k = 0; k < 8; k++) {
        const targetP = RING_ORDER[(houseRingIdx + k) % 8];
        const currStar = STAR_RING[(starOriginIdx + k) % 8];
        starPan[targetP] = currStar;
        heavenStemPan[targetP] = earthStem[STAR_BASE[currStar]];
    }

    // 4. 八神排布（值符加臨屋向宮）
    const godPan = {};
    for (let k = 0; k < 8; k++) {
        godPan[RING_ORDER[(houseRingIdx + k) % 8]] = GODS_YANG[k];
    }

    // 5. 八門排布（依地支門向查休門宮位）
    let xiuPalace = WUXIANG_XIU_MAP[doorBranch] || 1;
    if (yun === 8 && (doorBranch === '辰' || doorBranch === '子')) xiuPalace = 1;

    const doorPan = {};
    const xiuRingIdx = RING_ORDER.indexOf(xiuPalace);
    for (let k = 0; k < 8; k++) {
        doorPan[RING_ORDER[(xiuRingIdx + k) % 8]] = DOORS_ORDER[k];
    }

    return {
        yun, housePalace, doorMountain: doorBranch,
        doorPalace: WUXIANG_BRANCH_PALACE[doorBranch],
        earthNum, earthStem, starPan, heavenStemPan, godPan, doorPan,
        centerStem, fuTouStem, starLeader, CHINESE_NUMS
    };
}