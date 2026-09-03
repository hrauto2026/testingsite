// engines/filter_engine.js
// 奇門遁甲：四柱反查、180 天全時辰複合條件篩選引擎

// 篩選條件互斥防呆聯動
function syncSpecialConditions(idx) {
    const pNum = document.getElementById(`filter-target-palace-${idx}`).value;
    if (pNum === "0") return;

    const pairs = [
        { pos: `chk-kong-${idx}`, neg: `chk-nokong-${idx}`, allowed: pNum !== '5' },
        { pos: `chk-ma-${idx}`, neg: `chk-noma-${idx}`, allowed: ['8','4','2','6'].includes(pNum) && pNum !== '5' },
        { pos: `chk-jixing-${idx}`, neg: `chk-nojixing-${idx}`, allowed: ['8','3','4','9','2'].includes(pNum) && pNum !== '5' },
        { pos: `chk-rumu-${idx}`, neg: `chk-norumu-${idx}`, allowed: ['8','4','2','6'].includes(pNum) && pNum !== '5' },
        { pos: `chk-menpo-${idx}`, neg: `chk-nomenpo-${idx}`, allowed: pNum !== '5' },
        { pos: `chk-chong-${idx}`, neg: `chk-nochong-${idx}`, allowed: pNum !== '5' }
    ];

    pairs.forEach(pair => {
        const posEl = document.getElementById(pair.pos);
        const negEl = document.getElementById(pair.neg);

        if (!posEl || !negEl) return;

        if (!pair.allowed) {
            posEl.checked = false;
            negEl.checked = false;
            posEl.disabled = true;
            negEl.disabled = true;
            posEl.parentElement.classList.add('chk-label-disabled');
            negEl.parentElement.classList.add('chk-label-disabled');
        } else {
            if (posEl.checked) {
                negEl.disabled = true;
                negEl.parentElement.classList.add('chk-label-disabled');
                posEl.disabled = false;
                posEl.parentElement.classList.remove('chk-label-disabled');
            } else if (negEl.checked) {
                posEl.disabled = true;
                posEl.parentElement.classList.add('chk-label-disabled');
                negEl.disabled = false;
                negEl.parentElement.classList.remove('chk-label-disabled');
            } else {
                posEl.disabled = false;
                negEl.disabled = false;
                posEl.parentElement.classList.remove('chk-label-disabled');
                negEl.parentElement.classList.remove('chk-label-disabled');
            }
        }
    });
}

function handleFilterPalaceChange(idx) {
    const pNum = document.getElementById(`filter-target-palace-${idx}`).value;
    
    if (idx === 2) {
        const c2Elems = document.getElementById('condition-2-elements');
        const logicOp = document.getElementById('logic-op-container');
        if (pNum === "0") {
            c2Elems.classList.add('hidden');
            logicOp.classList.add('hidden');
        } else {
            c2Elems.classList.remove('hidden');
            logicOp.classList.remove('hidden');
        }
    }

    if (pNum !== "0") {
        syncSpecialConditions(idx);
    }
}

function toggleFilterPanel() {
    const filterPanel = document.getElementById('filter-panel');
    const mainPanel = document.getElementById('main-panel');

    const dateInput = document.getElementById('filter-start-date');
    if (!dateInput.value) {
        const t = new Date();
        dateInput.value = `${t.getFullYear()}/${(t.getMonth()+1).toString().padStart(2,'0')}/${t.getDate().toString().padStart(2,'0')}`;
    }

    isFilterPanelOpen = !isFilterPanelOpen;

    if (isFilterPanelOpen) {
        filterPanel.classList.remove('hidden');
        mainPanel.classList.replace('lg:col-span-12', 'lg:col-span-8');
        document.getElementById('btn-toggle-filter').classList.replace('bg-amber-500', 'bg-amber-700');
        
        if (window.innerWidth < 1024) {
            setTimeout(() => {
                filterPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
        }
    } else {
        filterPanel.classList.add('hidden');
        mainPanel.classList.replace('lg:col-span-8', 'lg:col-span-12');
        document.getElementById('btn-toggle-filter').classList.replace('bg-amber-700', 'bg-amber-500');
    }
}

// 四柱反查日期
function searchBaziDates(tgtY, tgtM, tgtD, tgtH) {
    let results = [];
    let start = new Date(1930, 0, 1);
    let end = new Date(2050, 11, 31);
    let firstMatch = null;

    for (let i = 0; i < 60; i++) {
        let d = new Date(start);
        d.setDate(start.getDate() + i);
        let noonS = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, 0);
        if (noonS.getLunar().getDayInGanZhiExact() === tgtD) {
            firstMatch = d;
            break;
        }
    }

    if (firstMatch) {
        const targetHBranch = tgtH.charAt(1);
        const targetHIdx = BRANCHES.indexOf(targetHBranch);
        if (targetHIdx === -1) return results;

        let slotsToCheck = (targetHBranch === '子') 
            ? [{ h: 0, min: 30 }, { h: 23, min: 30 }]
            : [{ h: targetHIdx * 2, min: 30 }];

        let curr = new Date(firstMatch);
        while (curr <= end) {
            let y = curr.getFullYear();
            let m = curr.getMonth() + 1;
            let d = curr.getDate();

            for (let slot of slotsToCheck) {
                let testHour = slot.h;
                let testMin = slot.min;

                let exactLunar = Solar.fromYmdHms(y, m, d, testHour, testMin, 0).getLunar();
                let yGZ = exactLunar.getYearInGanZhiExact();
                let mGZ = exactLunar.getMonthInGanZhiExact();

                if (yGZ === tgtY && mGZ === tgtM) {
                    let wushuDate = new Date(y, m - 1, d, testHour, testMin);
                    if (testHour >= 23) wushuDate.setDate(wushuDate.getDate() + 1);
                    
                    let wushuLunar = Solar.fromYmdHms(wushuDate.getFullYear(), wushuDate.getMonth() + 1, wushuDate.getDate(), 12, 0, 0).getLunar();
                    let wushuDayStem = wushuLunar.getDayInGanZhi().substring(0, 1);
                    let wushuDayStemIdx = STEMS.indexOf(wushuDayStem);

                    let testTimeStemIdx = ((wushuDayStemIdx % 5) * 2 + targetHIdx) % 10;
                    let testTimeGZ = STEMS[testTimeStemIdx] + targetHBranch;

                    if (testTimeGZ === tgtH) {
                        results.push(new Date(y, m - 1, d, testHour, testMin));
                    }
                }
            }
            curr.setDate(curr.getDate() + 60);
        }
    }
    return results;
}

function executeBaziSearch() {
    const tgtY = document.getElementById('sel-bazi-y').value;
    const tgtM = document.getElementById('sel-bazi-m').value;
    const tgtD = document.getElementById('sel-bazi-d').value;
    const tgtH = document.getElementById('sel-bazi-h').value;

    const results = searchBaziDates(tgtY, tgtM, tgtD, tgtH);
    const listEl = document.getElementById('bazi-result-list');
    listEl.innerHTML = '';
    
    if (results.length === 0) {
        listEl.innerHTML = '<div class="p-6 text-center text-gray-500 font-bold">在 1930 - 2050 期間無符合之日期組合。<br><span class="text-xs text-gray-400 mt-2 block">請檢查干支是否符合曆法原則。</span></div>';
    } else {
        results.forEach(d => {
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            const day = d.getDate();
            const h = d.getHours();
            const min = d.getMinutes();

            let ziNote = (h === 23) ? " [晚子]" : (h === 0 ? " [早子]" : "");
            const dateStr = `${y}年 ${m.toString().padStart(2, '0')}月 ${day.toString().padStart(2, '0')}日 ${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}${ziNote}`;

            const btn = document.createElement('button');
            btn.className = "w-full text-left p-4 border-b border-gray-100 hover:bg-amber-50 active:bg-amber-100 transition-colors text-amber-900 focus:outline-none focus:bg-amber-100";
            btn.innerHTML = `<span class="font-bold text-lg block">${dateStr}</span><span class="text-sm text-gray-500 mt-1 block">四柱：${tgtY} ${tgtM} ${tgtD} ${tgtH}</span>`;
            btn.onclick = () => applyBaziResult(y, m, day, h, min);
            listEl.appendChild(btn);
        });
    }
    document.getElementById('bazi-modal').classList.remove('hidden');
}

function applyBaziResult(y, m, d, h, min) {
    document.getElementById('bazi-modal').classList.add('hidden');
    if (isBaziMode) toggleInputMode();

    document.getElementById('sel-year').value = y;
    document.getElementById('sel-month').value = m;
    document.getElementById('sel-day').value = d;
    document.getElementById('sel-hour24').value = h;
    document.getElementById('sel-minute').value = min;

    updateJieQiYearBtn();
    generatePan();
}

// 提取特定時辰在特定宮位的奇門要素（供篩選引擎比對）
function getQimenElements(y, m, d, h, min, pNumStr) {
    const pNum = parseInt(pNumStr);
    try {
        const exactLunar = Solar.fromYmdHms(y, m, d, h, min, 0).getLunar();
        const noonLunar = Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar();
        
        const yearGZ = exactLunar.getYearInGanZhiExact();
        const monthGZ = exactLunar.getMonthInGanZhiExact();
        const dayGZ = noonLunar.getDayInGanZhiExact(); 
        const dayStem = dayGZ.substring(0, 1);

        const hIdx = Math.floor((h + 1) % 24 / 2);
        const timeBranch = BRANCHES[hIdx];
        
        let wushuDate = new Date(y, m - 1, d, h, min);
        if (h >= 23) wushuDate.setDate(wushuDate.getDate() + 1);
        const wushuLunar = Solar.fromYmdHms(wushuDate.getFullYear(), wushuDate.getMonth() + 1, wushuDate.getDate(), 12, 0, 0).getLunar();
        const wushuDayStem = wushuLunar.getDayInGanZhi().substring(0, 1);
        const wushuDayStemIdx = STEMS.indexOf(wushuDayStem);
        
        const timeStemIdx = ((wushuDayStemIdx % 5) * 2 + hIdx) % 10;
        const timeGZ_string = STEMS[timeStemIdx] + timeBranch;
        const timeStem = timeGZ_string.substring(0, 1);
        const timeBranchIdx = BRANCHES.indexOf(timeBranch);

        let ziMark = (h >= 23) ? "晚子" : (h === 0 ? "早子" : "");

        const jqData = getAccurateJieQi(new Date(y, m - 1, d, h, min));
        const jieQi = jqData.name;
        const JIA_ZI = []; for(let i=0; i<60; i++) JIA_ZI.push(STEMS[i%10] + BRANCHES[i%12]);
        const dIdx = JIA_ZI.indexOf(dayGZ), fuTouIdx = dIdx - (dIdx % 5), fuTouBranch = BRANCHES[fuTouIdx % 12];
        let yuan = ["子", "午", "卯", "酉"].includes(fuTouBranch) ? "上元" : (["寅", "申", "巳", "亥"].includes(fuTouBranch) ? "中元" : "下元");
        
        const JU_TABLE = { "冬至": { 陽: true, 上元: 1, 中元: 7, 下元: 4 }, "小寒": { 陽: true, 上元: 2, 中元: 8, 下元: 5 }, "大寒": { 陽: true, 上元: 3, 中元: 9, 下元: 6 }, "立春": { 陽: true, 上元: 8, 中元: 5, 下元: 2 }, "雨水": { 陽: true, 上元: 9, 中元: 6, 下元: 3 }, "驚蟄": { 陽: true, 上元: 1, 中元: 7, 下元: 4 }, "春分": { 陽: true, 上元: 3, 中元: 9, 下元: 6 }, "清明": { 陽: true, 上元: 4, 中元: 1, 下元: 7 }, "穀雨": { 陽: true, 上元: 5, 中元: 2, 下元: 8 }, "立夏": { 陽: true, 上元: 4, 中元: 1, 下元: 7 }, "小滿": { 陽: true, 上元: 5, 中元: 2, 下元: 8 }, "芒種": { 陽: true, 上元: 6, 中元: 3, 下元: 9 }, "夏至": { 陽: false, 上元: 9, 中元: 3, 下元: 6 }, "小暑": { 陽: false, 上元: 8, 中元: 2, 下元: 5 }, "大暑": { 陽: false, 上元: 7, 中元: 1, 下元: 4 }, "立秋": { 陽: false, 上元: 2, 中元: 5, 下元: 8 }, "處暑": { 陽: false, 上元: 1, 中元: 4, 下元: 7 }, "白露": { 陽: false, 上元: 9, 中元: 3, 下元: 6 }, "秋分": { 陽: false, 上元: 7, 中元: 1, 下元: 4 }, "寒露": { 陽: false, 上元: 6, 中元: 9, 下元: 3 }, "霜降": { 陽: false, 上元: 5, 中元: 8, 下元: 2 }, "立冬": { 陽: false, 上元: 6, 中元: 9, 下元: 3 }, "小雪": { 陽: false, 上元: 5, 中元: 8, 下元: 2 }, "大雪": { 陽: false, 上元: 4, 中元: 7, 下元: 1 } };
        const juConfig = JU_TABLE[jieQi] || {陽: true, 上元: 1, 中元: 1, 下元: 1};
        const isYang = juConfig["陽"];
        const juNum = juConfig[yuan];
        
        let earthPan = {}; let currentPalaceNum = juNum;
        for (let i = 0; i < 9; i++) { earthPan[currentPalaceNum] = YI_LIU[i]; currentPalaceNum = isYang ? currentPalaceNum + 1 : currentPalaceNum - 1; if (currentPalaceNum > 9) currentPalaceNum = 1; else if (currentPalaceNum < 1) currentPalaceNum = 9; }
        
        const xunShouIdx = (timeBranchIdx - timeStemIdx + 12) % 12;
        const xunShouGZ = "甲" + BRANCHES[xunShouIdx];
        const XUN_MAP = { "甲子": "戊", "甲戌": "己", "甲申": "庚", "甲午": "辛", "甲辰": "壬", "甲寅": "癸" };
        const xunShouStem = XUN_MAP[xunShouGZ];
        
        let xunShouPalace = parseInt(Object.keys(earthPan).find(k => earthPan[k] === xunShouStem));
        let effectiveXunShouPalace = xunShouPalace === 5 ? 2 : xunShouPalace;
        let heavenPan = {}, starPan = {};
        let targetPalace = parseInt(Object.keys(earthPan).find(k => earthPan[k] === (timeStem === '甲' ? xunShouStem : timeStem)));
        if(targetPalace === 5) targetPalace = 2;
        
        const rIdxTarget = RING_ORDER.indexOf(targetPalace), rIdxOrigin = RING_ORDER.indexOf(effectiveXunShouPalace), offset = (rIdxTarget - rIdxOrigin + 8) % 8;
        for (let i = 0; i < 8; i++) {
            const originP = RING_ORDER[i], targetP = RING_ORDER[(i + offset) % 8];
            starPan[targetP] = (originP === 2) ? [BASE_STARS[2], BASE_STARS[5]] : BASE_STARS[originP];
            heavenPan[targetP] = (originP === 2) ? [earthPan[2], earthPan[5]] : earthPan[originP];
        }
        
        let godPan = {}; for (let i = 0; i < 8; i++) godPan[RING_ORDER[(rIdxTarget + (isYang ? i : 8 - i)) % 8]] = GODS_YANG[i];
        
        let currentD_val = xunShouPalace;
        for(let i=0; i<timeStemIdx; i++) { currentD_val = isYang ? currentD_val + 1 : currentD_val - 1; if(currentD_val > 9) currentD_val = 1; else if(currentD_val < 1) currentD_val = 9; }
        if(currentD_val === 5) currentD_val = 2;
        const doorOriginIdx = RING_ORDER.indexOf(effectiveXunShouPalace), doorTargetIdx = RING_ORDER.indexOf(currentD_val), doorOffset = (doorTargetIdx - doorOriginIdx + 8) % 8;
        let doorPan = {};
        for (let i = 0; i < 8; i++) doorPan[RING_ORDER[(i + doorOffset) % 8]] = DOORS_ORDER[i];
        
        const kwIdx = (xunShouIdx + 10) % 12, kw1 = BRANCHES[kwIdx], kw2 = BRANCHES[kwIdx+1];
        const maMap = { "申": "寅", "子": "寅", "辰": "寅", "亥": "巳", "卯": "巳", "未": "巳", "寅": "申", "午": "申", "戌": "申", "巳": "亥", "酉": "亥", "丑": "亥" }, ma = maMap[timeBranch];
        
        let isKong = false, isMa = false, isChong = false;
        let monthBranch = monthGZ.substring(1, 2);
        let clashBranch = CLASH_MAP[monthBranch];
        if (pNum !== 5) {
            isKong = PALACES_HOU[pNum].branch.includes(kw1) || PALACES_HOU[pNum].branch.includes(kw2);
            isMa = PALACES_HOU[pNum].branch.includes(ma);
            isChong = PALACES_HOU[pNum].branch.includes(clashBranch);
        }

        let resGod = godPan[pNum] || "";
        let resStar = Array.isArray(starPan[pNum]) ? starPan[pNum] : [starPan[pNum]];
        let resDoor = doorPan[pNum] || "";
        let resHStems = Array.isArray(heavenPan[pNum]) ? heavenPan[pNum] : [heavenPan[pNum]];
        let resEStems = Array.isArray(earthPan[pNum]) ? (pNum===2 ? [earthPan[2], earthPan[5]] : [earthPan[pNum]]) : [earthPan[pNum]];

        if (pNum === 5) {
            resGod = "";
            resStar = [];
            resDoor = "";
            resHStems = [earthPan[5]];
            resEStems = [earthPan[5]];
        }

        let evalPNum = pNum === 5 ? 2 : pNum;
        let isMenPoRes = false;
        let hasJiXing = false;
        let hasRuMu = false;

        if (pNum !== 5) {
            isMenPoRes = isMenPo(resDoor, evalPNum);
            for (let s of resHStems) {
                if (isJiXing(s, evalPNum)) hasJiXing = true;
                if (isRuMu(s, evalPNum)) hasRuMu = true;
            }
            for (let s of resEStems) {
                if (isJiXing(s, evalPNum)) hasJiXing = true;
                if (isRuMu(s, evalPNum)) hasRuMu = true;
            }
        }

        const isWuBuYu = (timeStemIdx === (STEMS.indexOf(dayStem) + 6) % 10);
        let isTianXian = false;
        const dStemTX = dayGZ.substring(0, 1);
        if (((dStemTX === '甲' || dStemTX === '己') && (timeGZ_string === '己巳')) ||
            ((dStemTX === '乙' || dStemTX === '庚') && timeGZ_string === '甲申') ||
            ((dStemTX === '丙' || dStemTX === '辛') && timeGZ_string === '甲午') ||
            ((dStemTX === '丁' || dStemTX === '壬') && timeGZ_string === '甲辰') ||
            ((dStemTX === '戊' || dStemTX === '癸') && timeGZ_string === '甲寅')) {
            isTianXian = true;
        }

        return {
            god: resGod,
            star: resStar,
            door: resDoor,
            hStems: resHStems,
            eStems: resEStems,
            bazi: `${yearGZ}年 ${monthGZ}月 ${dayGZ}日 ${timeGZ_string}時`,
            yStem: yearGZ.substring(0, 1),
            mStem: monthGZ.substring(0, 1),
            dStem: dayStem,
            hStem: timeStem,
            isKong: isKong,
            isMa: isMa,
            isMenPo: isMenPoRes,
            hasJiXing: hasJiXing,
            hasRuMu: hasRuMu,
            isChong: isChong,
            ziMark: ziMark,
            isTianXian: isTianXian,
            isWuBuYu: isWuBuYu
        };
    } catch(e) {
        console.error(e);
        return null;
    }
}

// 條件比對評估
function evalCriteria(elements, c) {
    if (!elements) return false;
    let isMatch = true;

    let dynamicHStems = c.hStems.map(val => {
        if (val === '=年干') return elements.yStem;
        if (val === '=月干') return elements.mStem;
        if (val === '=日干') return elements.dStem;
        if (val === '=時干') return elements.hStem;
        return val;
    });

    if (c.gods.length > 0 && !c.gods.includes(elements.god)) isMatch = false;
    if (isMatch && c.stars.length > 0 && !elements.star.some(s => c.stars.includes(s))) isMatch = false;
    if (isMatch && c.doors.length > 0 && !c.doors.includes(elements.door)) isMatch = false;
    if (isMatch && c.hStems.length > 0 && !elements.hStems.some(s => dynamicHStems.includes(s))) isMatch = false;
    if (isMatch && c.eStems.length > 0 && !elements.eStems.some(s => c.eStems.includes(s))) isMatch = false;
    
    if (isMatch && c.kong && !elements.isKong) isMatch = false;
    if (isMatch && c.ma && !elements.isMa) isMatch = false;
    if (isMatch && c.jiXing && !elements.hasJiXing) isMatch = false;
    if (isMatch && c.ruMu && !elements.hasRuMu) isMatch = false;
    if (isMatch && c.chong && !elements.isChong) isMatch = false;
    if (isMatch && c.menPo && !elements.isMenPo) isMatch = false;
    
    if (isMatch && c.noKong && elements.isKong) isMatch = false;
    if (isMatch && c.noMa && elements.isMa) isMatch = false;
    if (isMatch && c.noJiXing && elements.hasJiXing) isMatch = false;
    if (isMatch && c.noRuMu && elements.hasRuMu) isMatch = false;
    if (isMatch && c.noChong && elements.isChong) isMatch = false;
    if (isMatch && c.noMenPo && elements.isMenPo) isMatch = false;
    
    if (isMatch && c.tianXian && !elements.isTianXian) isMatch = false;
    if (isMatch && c.wuBuYu && !elements.isWuBuYu) isMatch = false;
    
    return isMatch;
}

// 執行 180 天大數據檢索
function executeRealSearch() {
    const resultsList = document.getElementById('filter-results-list');
    const resultsCount = document.getElementById('filter-results-count');
    
    const startDateStr = document.getElementById('filter-start-date').value;
    const pNum1 = document.getElementById('filter-target-palace-1').value;
    const pNum2 = document.getElementById('filter-target-palace-2').value;
    const logicOp = document.getElementById('filter-logic-operator').value;
    
    const parts = startDateStr.split('/');
    if (parts.length !== 3) {
        alert('請輸入正確的開始日期格式，例如 2026/07/03');
        return;
    }
    const sYear = parseInt(parts[0]);
    const sMonth = parseInt(parts[1]);
    const sDay = parseInt(parts[2]);
    
    const getChecked = (groupId) => Array.from(document.querySelectorAll(`#${groupId} input:checked`)).map(cb => cb.value);
    
    const criteria1 = {
        gods: getChecked('chk-group-god-1'),
        stars: getChecked('chk-group-star-1'),
        doors: getChecked('chk-group-door-1'),
        hStems: getChecked('chk-group-hstem-1'),
        eStems: getChecked('chk-group-estem-1'),
        kong: document.getElementById('chk-kong-1')?.checked,
        noKong: document.getElementById('chk-nokong-1')?.checked,
        ma: document.getElementById('chk-ma-1')?.checked,
        noMa: document.getElementById('chk-noma-1')?.checked,
        jiXing: document.getElementById('chk-jixing-1')?.checked,
        noJiXing: document.getElementById('chk-nojixing-1')?.checked,
        ruMu: document.getElementById('chk-rumu-1')?.checked,
        noRuMu: document.getElementById('chk-norumu-1')?.checked,
        chong: document.getElementById('chk-chong-1')?.checked,
        noChong: document.getElementById('chk-nochong-1')?.checked,
        menPo: document.getElementById('chk-menpo-1')?.checked,
        noMenPo: document.getElementById('chk-nomenpo-1')?.checked,
        tianXian: document.getElementById('chk-tianxian-1')?.checked,
        wuBuYu: document.getElementById('chk-wubuyu-1')?.checked
    };

    const criteria2 = pNum2 !== "0" ? {
        gods: getChecked('chk-group-god-2'),
        stars: getChecked('chk-group-star-2'),
        doors: getChecked('chk-group-door-2'),
        hStems: getChecked('chk-group-hstem-2'),
        eStems: getChecked('chk-group-estem-2'),
        kong: document.getElementById('chk-kong-2')?.checked,
        noKong: document.getElementById('chk-nokong-2')?.checked,
        ma: document.getElementById('chk-ma-2')?.checked,
        noMa: document.getElementById('chk-noma-2')?.checked,
        jiXing: document.getElementById('chk-jixing-2')?.checked,
        noJiXing: document.getElementById('chk-nojixing-2')?.checked,
        ruMu: document.getElementById('chk-rumu-2')?.checked,
        noRuMu: document.getElementById('chk-norumu-2')?.checked,
        chong: document.getElementById('chk-chong-2')?.checked,
        noChong: document.getElementById('chk-nochong-2')?.checked,
        menPo: document.getElementById('chk-menpo-2')?.checked,
        noMenPo: document.getElementById('chk-nomenpo-2')?.checked,
        tianXian: document.getElementById('chk-tianxian-2')?.checked,
        wuBuYu: document.getElementById('chk-wubuyu-2')?.checked
    } : null;

    resultsList.innerHTML = '<div class="p-6 text-center text-amber-600 font-bold flex flex-col items-center justify-center gap-2"><svg class="animate-spin h-6 w-6 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>運算 180 日內全時辰資料中...</span></div>';
    resultsCount.innerText = `計算中`;

    const hourSlots = [
        { h: 0, min: 30, branch: '子', name: '早子' },
        { h: 2, min: 30, branch: '丑', name: '丑' },
        { h: 4, min: 30, branch: '寅', name: '寅' },
        { h: 6, min: 30, branch: '卯', name: '卯' },
        { h: 8, min: 30, branch: '辰', name: '辰' },
        { h: 10, min: 30, branch: '巳', name: '巳' },
        { h: 12, min: 30, branch: '午', name: '午' },
        { h: 14, min: 30, branch: '未', name: '未' },
        { h: 16, min: 30, branch: '申', name: '申' },
        { h: 18, min: 30, branch: '酉', name: '酉' },
        { h: 20, min: 30, branch: '戌', name: '戌' },
        { h: 22, min: 30, branch: '亥', name: '亥' },
        { h: 23, min: 30, branch: '子', name: '晚子' }
    ];

    setTimeout(() => {
        let matchedResults = [];
        let currentD = new Date(sYear, sMonth - 1, sDay);
        
        for(let i = 0; i < 180; i++) {
            let y = currentD.getFullYear();
            let m = currentD.getMonth() + 1;
            let d = currentD.getDate();
            
            for(let slot of hourSlots) {
                let h = slot.h;
                let min = slot.min; 
                
                let elements1 = getQimenElements(y, m, d, h, min, pNum1);
                if(!elements1) continue;
                
                let match1 = evalCriteria(elements1, criteria1);
                let matchOverall = match1;

                if (pNum2 !== "0") {
                    let elements2 = getQimenElements(y, m, d, h, min, pNum2);
                    let match2 = elements2 ? evalCriteria(elements2, criteria2) : false;
                    matchOverall = (logicOp === 'AND') ? (match1 && match2) : (match1 || match2);
                }

                if (matchOverall) {
                    matchedResults.push({
                        y, m, d, h, min,
                        dStr: `${y}年 ${m.toString().padStart(2,'0')}月 ${d.toString().padStart(2,'0')}日 ${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')} (${slot.name}時)`,
                        bazi: elements1.bazi,
                        ziMark: elements1.ziMark
                    });
                }
            }
            currentD.setDate(currentD.getDate() + 1);
        }
        
        resultsList.innerHTML = '';
        resultsCount.innerText = `${matchedResults.length} 筆`;
        
        if (matchedResults.length === 0) {
            resultsList.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">在此 180 天的範圍內，未找到符合全部所選條件的時辰。</div>';
        } else {
            matchedResults.forEach(item => {
                const btn = document.createElement('button');
                btn.className = "w-full text-left p-3 border border-amber-200/60 rounded-xl hover:bg-amber-50 focus:bg-amber-100 active:scale-[0.99] transition duration-150 shadow-sm text-sm bg-white block mb-2";
                btn.innerHTML = `
                    <div class="flex justify-between items-center mb-1">
                        <span class="font-bold text-amber-900">${item.dStr}</span>
                        <span class="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded border border-green-200 font-bold">符合</span>
                    </div>
                    <div class="text-gray-500 font-bold text-xs">四柱：${item.bazi} ${item.ziMark ? '<span class="text-orange-600 font-black">['+item.ziMark+']</span>' : ''}</div>
                `;
                btn.onclick = () => {
                    applyBaziResult(item.y, item.m, item.d, item.h, item.min);
                    if (window.innerWidth < 1024) {
                        toggleFilterPanel();
                        setTimeout(() => {
                            document.getElementById('app-workspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 150);
                    }
                };
                resultsList.appendChild(btn);
            });
        }
    }, 80); 
}

function resetFilter() {
    const today = new Date();
    document.getElementById('filter-start-date').value = `${today.getFullYear()}/${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getDate().toString().padStart(2,'0')}`;
    document.getElementById('filter-target-palace-1').value = "1";
    document.getElementById('filter-target-palace-2').value = "0";
    document.getElementById('filter-logic-operator').value = "AND";
    
    document.querySelectorAll('.chk-label input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('filter-results-list').innerHTML = '<div class="p-3 text-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">已重置。<br>設定好上方的條件然後按下按鈕即可獲得符合之奇門遁甲列表！</div>';
    document.getElementById('filter-results-count').innerText = "0 筆";
    
    handleFilterPalaceChange(1);
    handleFilterPalaceChange(2);
}