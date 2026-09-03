// engines/qimen_engine.js
// 時家奇門（拆補法定局、節氣判定、長生能量與格局名堂）演算核心

// 入墓判定
const isRuMu = (stem, pNum) => {
    if (['乙', '丙', '戊'].includes(stem) && pNum === 6) return true; 
    if (['丁', '己', '庚'].includes(stem) && pNum === 8) return true; 
    if (['辛', '壬'].includes(stem) && pNum === 4) return true; 
    if (stem === '癸' && pNum === 2) return true; 
    return false;
};

// 擊刑判定
const isJiXing = (stem, pNum) => {
    if (stem === '戊' && pNum === 3) return true; 
    if (stem === '己' && pNum === 2) return true; 
    if (stem === '庚' && pNum === 8) return true; 
    if (stem === '辛' && pNum === 9) return true; 
    if (['壬', '癸'].includes(stem) && pNum === 4) return true; 
    return false;
};

// 門迫判定
const isMenPo = (door, pNum) => {
    const fire = pNum===9, water = pNum===1, earth = pNum===2||pNum===8, metal = pNum===6||pNum===7, wood = pNum===3||pNum===4;
    if (door==="休門" && fire) return true; 
    if ((door==="生門"||door==="死門") && water) return true; 
    if ((door==="傷門"||door==="杜門") && earth) return true; 
    if (door==="景門" && metal) return true; 
    if ((door==="驚門"||door==="開門") && wood) return true; 
    return false;
};

// 解析天干十二長生能量
function resolveStemEnergy(stem, pNum, timeBranch) {
    if (!STEM_ENERGY[stem]) return stem;
    let energyPNum = (pNum === 5) ? 2 : pNum;
    
    if (isRuMu(stem, energyPNum)) {
        return '墓';
    }

    let energyStr = STEM_ENERGY[stem][energyPNum];
    if (energyStr && energyStr.includes('/')) {
        const timeIsYang = ['子', '寅', '辰', '午', '申', '戌'].includes(timeBranch);
        const parts = energyStr.split('/');
        if (energyPNum === 8 || energyPNum === 2) {
            return timeIsYang ? parts[1] : parts[0];
        } else if (energyPNum === 4 || energyPNum === 6) {
            return timeIsYang ? parts[0] : parts[1];
        }
    }
    return energyStr;
}

// 取得時辰範圍
function getHourSlotRange(dt) {
    let start = new Date(dt);
    let h = dt.getHours();
    if (h === 23) {
        start.setHours(23, 0, 0, 0);
    } else if (h % 2 === 1) {
        start.setHours(h, 0, 0, 0);
    } else {
        if (h === 0) {
            start.setDate(start.getDate() - 1);
            start.setHours(23, 0, 0, 0);
        } else {
            start.setHours(h - 1, 0, 0, 0);
        }
    }
    let end = new Date(start);
    end.setHours(start.getHours() + 2, 0, 0, -1);
    return { start, end };
}

// 精確節氣計算
function getAccurateJieQi(currentDate) {
    let jieQiName = "未知", timeStr = "";
    let nextJieQiName = "未知", nextTimeStr = "";
    let isCurrentTransition = false, isNextTransition = false;
    try {
        const solar = Solar.fromDate(currentDate);
        const lunar = solar.getLunar();
        
        let prevJ = lunar.getPrevJie(false);
        let prevQ = lunar.getPrevQi(false);
        let nextJ = lunar.getNextJie(false);
        let nextQ = lunar.getNextQi(false);

        const toDate = (jq) => {
            const s = jq.getSolar();
            return new Date(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond());
        };

        let dPrevJ = toDate(prevJ);
        let dPrevQ = toDate(prevQ);
        let dNextJ = toDate(nextJ);
        let dNextQ = toDate(nextQ);

        let targetJQ = (dPrevJ > dPrevQ) ? prevJ : prevQ;
        let dTarget = (dPrevJ > dPrevQ) ? dPrevJ : dPrevQ;
        
        let nextJQ = (dNextJ < dNextQ) ? nextJ : nextQ;
        let dNext = (dNextJ < dNextQ) ? dNextJ : dNextQ;

        jieQiName = TRAD_JIEQI[targetJQ.getName()] || targetJQ.getName();
        timeStr = targetJQ.getSolar().toYmdHms();

        nextJieQiName = TRAD_JIEQI[nextJQ.getName()] || nextJQ.getName();
        nextTimeStr = nextJQ.getSolar().toYmdHms();

        let slot = getHourSlotRange(currentDate);
        if (dTarget >= slot.start && dTarget <= slot.end) isCurrentTransition = true;
        if (dNext >= slot.start && dNext <= slot.end) isNextTransition = true;

    } catch (e) { console.error(e); }
    return { 
        name: jieQiName, 
        time: timeStr, 
        nextName: nextJieQiName, 
        nextTime: nextTimeStr, 
        isCurrentTransition, 
        isNextTransition, 
        isTransitionInHour: isCurrentTransition || isNextTransition 
    };
}

// 宮位格局名堂計算
function calculateGeju(data) {
    let results = [];
    if(!data.hStems || !data.eStems) return results;

    let hasH = (s) => data.hStems.includes(s);
    let hasE = (s) => data.eStems.includes(s);
    let hasA = (s) => hasH(s) || hasE(s); 
    
    let pNum = data.palaceNum;
    let isSanQi = (s) => ['乙', '丙', '丁'].includes(s);

    for (let th of data.hStems) {
        for (let te of data.eStems) {
            let key = `${th}+${te}`;
            if (GEJU_MAP[key]) {
                results.push({
                    name: GEJU_MAP[key].name,
                    type: GEJU_MAP[key].type,
                    desc: GEJU_MAP[key].desc
                });
            }
            
            if (!GEJU_MAP[key] && ((th==='乙'&&te==='庚') || (th==='丙'&&te==='辛') || (th==='丁'&&te==='壬') || (th==='戊'&&te==='癸') || (th==='甲'&&te==='己'))) {
                results.push({ name: '奇儀相合', type: '吉', desc: '和合之象，利合作、謀事、婚姻。' });
            }
        }
    }

    if (data.hStems && data.hStems.includes('庚')) {
        for (let te of data.eStems) {
            if (data.yStemEff && te === data.yStemEff) {
                results.push({ name: '年格', type: '凶', desc: '天盤庚加臨地盤年干。主長輩、上司或官方阻力，官非纏身，不宜求官拜貴。' });
            }
            if (data.mStemEff && te === data.mStemEff) {
                results.push({ name: '月格', type: '凶', desc: '天盤庚加臨地盤月干。主同輩、朋友、同事反目破局，當月財運受阻，同行競爭惡化。' });
            }
            if (data.dStemEff && te === data.dStemEff) {
                results.push({ name: '日格 (伏干格)', type: '凶', desc: '天盤庚加臨地盤日干。主自身受卡關阻礙、疾病災禍、夫妻不和，宜靜不宜動。' });
            }
            if (data.hStemEff && te === data.hStemEff) {
                results.push({ name: '時格', type: '凶', desc: '天盤庚加臨地盤時干。主下屬拖累、子女操心，當前所謀之近事突發阻礙，百事不宜。' });
            }
        }
    }

    if (pNum === 3 && hasA('乙')) results.push({ name: '三奇升殿 / 奇游祿位 (乙)', type: '大吉', desc: '乙奇臨震宮。主有貴人提攜，求財吉利，官職高陞，百事大吉。' });
    if (pNum === 9 && hasA('丙')) results.push({ name: '三奇升殿 (丙)', type: '大吉', desc: '丙奇臨離宮。主有貴人提攜，利見大人，百事大吉。' });
    if (pNum === 7 && hasA('丁')) results.push({ name: '三奇升殿 (丁)', type: '大吉', desc: '丁奇臨兌宮。主有貴人提攜，利見大人，百事大吉。' });
    if (pNum === 4 && hasA('丙')) results.push({ name: '奇游祿位 (丙)', type: '大吉', desc: '丙奇臨巽宮祿位。求財吉利，官職高陞。' });
    if (pNum === 9 && hasA('丁')) results.push({ name: '奇游祿位 (丁)', type: '大吉', desc: '丁奇臨離宮祿位。求財吉利，官職高陞。' });

    let hHasQi = data.hStems.some(s => isSanQi(s)); 
    if (data.isZhiShi && hasE('丁')) results.push({ name: '玉女守門', type: '吉', desc: '利私下謀劃、宴會、和解。' });
    if (data.isZhiShi && hHasQi) results.push({ name: '三奇得使', type: '吉', desc: '奇兵得主將調遣，化險為夷。' });

    let uniqueResults = [];
    let names = new Set();
    for (let r of results) {
        if (!names.has(r.name)) {
            names.add(r.name);
            uniqueResults.push(r);
        }
    }
    return uniqueResults;
}