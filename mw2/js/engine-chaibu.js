// ==========================================
// 核心排盤函數主流程 (支援真太陽時)
// ==========================================
function generatePan() {
    try {
        const ACTIVE_PALACES = useXianTian ? PALACES_XIAN : PALACES_HOU;
        const y = parseInt(document.getElementById('sel-year').value);
        const m = parseInt(document.getElementById('sel-month').value);
        const d = parseInt(document.getElementById('sel-day').value);
        
        const checkDate = new Date(y, m - 1, d);
        if (checkDate.getFullYear() !== y || checkDate.getMonth() !== (m - 1) || checkDate.getDate() !== d) {
            alert(`錯誤：您輸入的日期 ${y}年${m}月${d}日 並不存在，請重新選擇。`);
            return;
        }

        const h = parseInt(document.getElementById('sel-hour24').value);
        const min = parseInt(document.getElementById('sel-minute').value);
        
        // --- ✨ 真太陽時校正開始 ---
        let rawDate = new Date(y, m - 1, d, h, min);
        let cityKey = document.getElementById('sel-location') ? document.getElementById('sel-location').value : "none";
        let solarData = typeof getTrueSolarTime === 'function' ? getTrueSolarTime(rawDate, cityKey) : { adjustedDate: rawDate, isAdjusted: false };
        
        // 將系統核心時間設定為「真太陽時」
        currentDate = solarData.adjustedDate; 
        
        const trueY = currentDate.getFullYear();
        const trueM = currentDate.getMonth() + 1;
        const trueD = currentDate.getDate();
        const trueH = currentDate.getHours();
        const trueMin = currentDate.getMinutes();
        // --- ✨ 真太陽時校正結束 ---
        
        // 接下來的節氣與干支計算，全部改用 trueY, trueM, trueD, trueH, trueMin
        const exactLunar = Solar.fromYmdHms(trueY, trueM, trueD, trueH, trueMin, 0).getLunar();
        const noonLunar = Solar.fromYmdHms(trueY, trueM, trueD, 12, 0, 0).getLunar();
        
        const yearGZ = exactLunar.getYearInGanZhiExact();
        const monthGZ = exactLunar.getMonthInGanZhiExact();
        const dayGZ = noonLunar.getDayInGanZhiExact(); 
        const dayStem = dayGZ.substring(0, 1);

        const hIdx = Math.floor((trueH + 1) % 24 / 2);
        const timeBranch = BRANCHES[hIdx];
        
        let wushuDate = new Date(currentDate);
        if (trueH >= 23) wushuDate.setDate(wushuDate.getDate() + 1);
        
        const wushuLunar = Solar.fromYmdHms(wushuDate.getFullYear(), wushuDate.getMonth() + 1, wushuDate.getDate(), 12, 0, 0).getLunar();
        const wushuDayStem = wushuLunar.getDayInGanZhi().substring(0, 1);
        const wushuDayStemIdx = STEMS.indexOf(wushuDayStem);
        
        const timeStemIdx = ((wushuDayStemIdx % 5) * 2 + hIdx) % 10;
        const timeGZ = STEMS[timeStemIdx] + timeBranch;
        const timeGZ_string = STEMS[timeStemIdx] + timeBranch;
        const timeStem = timeGZ.substring(0, 1);
        const timeBranchIdx = BRANCHES.indexOf(timeBranch);

        let ziMark = (trueH >= 23) ? "晚子" : (trueH === 0 ? "早子" : "");

        let prevQi = exactLunar.getPrevQi(true);
        let zqName = prevQi.getName();
        let yueJiangBranchCalculated = ZQ_MAP[zqName] || "亥";
        
        let timeBranchIdxForDayNight = BRANCHES.indexOf(timeBranch);
        let isDay = (timeBranchIdxForDayNight >= 3 && timeBranchIdxForDayNight <= 8);
        
        let currentGuiRenMap = useYinYangGuiRen ? GUI_REN_MAP_YINYANG : GUI_REN_MAP_ORIGINAL;
        let guiRenBaseBranch = currentGuiRenMap[dayStem][isDay ? 'day' : 'night'];
        
        let yjIdx = BRANCHES.indexOf(yueJiangBranchCalculated);
        let tbIdx = BRANCHES.indexOf(timeBranch);
        let grBaseIdx = BRANCHES.indexOf(guiRenBaseBranch);
        let guiRenEarthIdx = (grBaseIdx - yjIdx + tbIdx + 12) % 12;
        
        let isForward = [11, 0, 1, 2, 3, 4].includes(guiRenEarthIdx);
        let dir = isForward ? 1 : -1;
        
        let branchToTianJiang = {};
        for(let i=0; i<12; i++) {
            let currentEarthIdx = (guiRenEarthIdx + i * dir + 12) % 12;
            let currentEarthBranch = BRANCHES[currentEarthIdx];
            branchToTianJiang[currentEarthBranch] = TIAN_JIANG_LIST[i];
        }

        const baziRawStr = `${yearGZ}年 ${monthGZ}月 ${dayGZ}日 ${timeGZ_string}時`;
        const coloredBaziStr = `${colorizeGanZhi(yearGZ)}年 ${colorizeGanZhi(monthGZ)}月 ${colorizeGanZhi(dayGZ)}日 ${colorizeGanZhi(timeGZ_string)}時`;
        
        const jqData = getAccurateJieQi(currentDate);
        const jieQi = jqData.name;
        const JIA_ZI = []; for(let i=0; i<60; i++) JIA_ZI.push(STEMS[i%10] + BRANCHES[i%12]);
        const dIdx = JIA_ZI.indexOf(dayGZ), fuTouIdx = dIdx - (dIdx % 5), fuTouBranch = BRANCHES[fuTouIdx % 12];
        let yuan = ["子", "午", "卯", "酉"].includes(fuTouBranch) ? "上元" : (["寅", "申", "巳", "亥"].includes(fuTouBranch) ? "中元" : "下元");
        
        const JU_TABLE = { "冬至": { 陽: true, 上元: 1, 中元: 7, 下元: 4 }, "小寒": { 陽: true, 上元: 2, 中元: 8, 下元: 5 }, "大寒": { 陽: true, 上元: 3, 中元: 9, 下元: 6 }, "立春": { 陽: true, 上元: 8, 中元: 5, 下元: 2 }, "雨水": { 陽: true, 上元: 9, 中元: 6, 下元: 3 }, "驚蟄": { 陽: true, 上元: 1, 中元: 7, 下元: 4 }, "春分": { 陽: true, 上元: 3, 中元: 9, 下元: 6 }, "清明": { 陽: true, 上元: 4, 中元: 1, 下元: 7 }, "穀雨": { 陽: true, 上元: 5, 中元: 2, 下元: 8 }, "立夏": { 陽: true, 上元: 4, 中元: 1, 下元: 7 }, "小滿": { 陽: true, 上元: 5, 中元: 2, 下元: 8 }, "芒種": { 陽: true, 上元: 6, 中元: 3, 下元: 9 }, "夏至": { 陽: false, 上元: 9, 中元: 3, 下元: 6 }, "小暑": { 陽: false, 上元: 8, 中元: 2, 下元: 5 }, "大暑": { 陽: false, 上元: 7, 中元: 1, 下元: 4 }, "立秋": { 陽: false, 上元: 2, 中元: 5, 下元: 8 }, "處暑": { 陽: false, 上元: 1, 中元: 4, 下元: 7 }, "白露": { 陽: false, 上元: 9, 中元: 3, 下元: 6 }, "秋分": { 陽: false, 上元: 7, 中元: 1, 下元: 4 }, "寒露": { 陽: false, 上元: 6, 中元: 9, 下元: 3 }, "霜降": { 陽: false, 上元: 5, 中元: 8, 下元: 2 }, "立冬": { 陽: false, 上元: 6, 中元: 9, 下元: 3 }, "小雪": { 陽: false, 上元: 5, 中元: 8, 下元: 2 }, "大雪": { 陽: false, 上元: 4, 中元: 7, 下元: 1 } };
        const juConfig = JU_TABLE[jieQi] || {陽: true, 上元: 1, 中元: 1, 下元: 1};
        const isYang = juConfig["陽"], juNum = juConfig[yuan], juStr = (isYang ? "陽遁" : "陰遁") + juNum + "局 (" + yuan + ")";
        
        let earthPan = {}; let currentPalaceNum = juNum;
        for (let i = 0; i < 9; i++) { earthPan[currentPalaceNum] = YI_LIU[i]; currentPalaceNum = isYang ? currentPalaceNum + 1 : currentPalaceNum - 1; if (currentPalaceNum > 9) currentPalaceNum = 1; else if (currentPalaceNum < 1) currentPalaceNum = 9; }
        
        const xunShouIdx = (timeBranchIdx - timeStemIdx + 12) % 12, xunShouGZ = "甲" + BRANCHES[xunShouIdx], XUN_MAP = { "甲子": "戊", "甲戌": "己", "甲申": "庚", "甲午": "辛", "甲辰": "壬", "甲寅": "癸" }, xunShouStem = XUN_MAP[xunShouGZ], targetHighlightStem = (timeStem === '甲') ? xunShouStem : timeStem;
        const dayHighlightStem = (dayStem === '甲') ? XUN_MAP[dayGZ.substring(0,2)] || dayStem : dayStem;

        const getEffStem = (gz) => {
            if (!gz) return '';
            let stem = gz.substring(0, 1);
            if (stem === '甲') return XUN_MAP[gz.substring(0, 2)] || stem;
            return stem;
        };

        const yStemEff = getEffStem(yearGZ), mStemEff = getEffStem(monthGZ), dStemEff = getEffStem(dayGZ), hStemEff = getEffStem(timeGZ_string);
        let xunShouPalace = parseInt(Object.keys(earthPan).find(k => earthPan[k] === xunShouStem)), zhiFuStar = BASE_STARS[xunShouPalace], effectiveXunShouPalace = xunShouPalace === 5 ? 2 : xunShouPalace;
        if (xunShouPalace === 5) zhiFuStar = "天禽";
        
        let heavenPan = {}, starPan = {}, targetPalace = parseInt(Object.keys(earthPan).find(k => earthPan[k] === (timeStem === '甲' ? xunShouStem : timeStem)));
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
        
        let anGanPan = {};
        for (let i = 1; i <= 9; i++) {
            if(i === 5) { anGanPan[5] = earthPan[5]; continue; }
            let currentDoor = doorPan[i];
            let originPNum = Object.keys(PALACES_HOU).find(key => PALACES_HOU[key].baseDoor === currentDoor);
            anGanPan[i] = earthPan[originPNum];
        }

        const kwIdx = (xunShouIdx + 10) % 12, kw1 = BRANCHES[kwIdx], kw2 = BRANCHES[kwIdx+1], maMap = { "申": "寅", "子": "寅", "辰": "寅", "亥": "巳", "卯": "巳", "未": "巳", "寅": "申", "午": "申", "戌": "申", "巳": "亥", "酉": "亥", "丑": "亥" }, ma = maMap[timeBranch];
        let specialStr = "", isWuBuYu = (timeStemIdx === (STEMS.indexOf(dayStem) + 6) % 10), isTianXian = false;
        const dStemTX = dayGZ.substring(0, 1);
        if (((dStemTX === '甲' || dStemTX === '己') && (timeGZ_string === '己巳')) || ((dStemTX === '乙' || dStemTX === '庚') && timeGZ_string === '甲申') || ((dStemTX === '丙' || dStemTX === '辛') && timeGZ_string === '甲午') || ((dStemTX === '丁' || dStemTX === '壬') && timeGZ_string === '甲辰') || ((dStemTX === '戊' || dStemTX === '癸') && timeGZ_string === '甲寅')) isTianXian = true;
        
        let rawSpecialInfo = "";
        if (isTianXian) { specialStr += "<span class='text-green-600 font-bold ml-2'>【✅天顯時格】</span>"; rawSpecialInfo += "【✅天顯時格】"; }
        if (isWuBuYu) { specialStr += "<span class='text-red-600 font-bold ml-2'>【❌五不遇時】</span>"; rawSpecialInfo += "【❌五不遇時】"; }
        
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekStr = weekDays[currentDate.getDay()];
        const lunarStr = `農曆${exactLunar.getMonthInChinese()}月${exactLunar.getDayInChinese()}`;
        let displayZiMark = ziMark ? `<span class="text-orange-600 font-bold ml-1">【${ziMark}】</span>` : "";

        // --- ✨ 真太陽時 UI 提示徽章 ---
        let solarBadge = "";
        let copyBaziLine = `${baziRawStr} (${y}年${m}月${d}日 ${weekStr} ${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}${ziMark ? ' ' + ziMark : ''})`;
        
        if (solarData.isAdjusted) {
            let offsetSign = solarData.offsetMinutes >= 0 ? "+" : "";
            let offsetMinStr = solarData.offsetMinutes.toFixed(1);
            solarBadge = `<div class="text-[11px] sm:text-xs text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded inline-flex items-center gap-1 mb-1.5 font-bold shadow-sm">
                🌞 ${solarData.cityName}真太陽時 ${trueH.toString().padStart(2,'0')}:${trueMin.toString().padStart(2,'0')} (鐘錶差 ${offsetSign}${offsetMinStr}分)
            </div><br>`;
            copyBaziLine += ` [${solarData.cityName}真太陽時]`;
        }
        
        const appTitle = document.getElementById('app-title');
        if (appTitle) appTitle.classList.add('hidden');

        const accControls = document.getElementById('accordion-controls');
        const accInfo = document.getElementById('accordion-pan-info');
        const quickBar = document.getElementById('quick-time-bar');

        if (accControls) accControls.open = false;
        if (accInfo) {
            accInfo.classList.remove('hidden');
            accInfo.open = true;
            document.getElementById('pan-summary-title').innerHTML = `📋 排盤資料`;
        }
        if (quickBar) {
            quickBar.classList.remove('hidden');
            quickBar.classList.add('flex');
            document.getElementById('quick-bar-time').innerHTML = `${trueY}年${trueM}月${trueD}日(${weekStr}) ${trueH.toString().padStart(2,'0')}:${trueMin.toString().padStart(2,'0')}${displayZiMark}`;
        }

        // 修改排盤資料顯示，加上 solarBadge
        document.getElementById('info-bazi').innerHTML = `${solarBadge}${trueY}年${trueM}月${trueD}日(${weekStr}) ${trueH.toString().padStart(2,'0')}:${trueMin.toString().padStart(2,'0')} ｜ <span class="text-teal-800 font-bold">${lunarStr}</span> ｜ ${coloredBaziStr}${displayZiMark}${specialStr}`;
        
        let targetWarn = jqData.isCurrentTransition ? "⚠️" : "";
        let nextWarn = jqData.isNextTransition ? "⚠️" : "";
        document.getElementById('info-jieqi').innerHTML = `${jieQi} <span class="text-xs sm:text-sm text-gray-500 font-normal">(交節：${jqData.time}${targetWarn})</span>`;
        document.getElementById('info-next-jieqi').innerHTML = `${jqData.nextName} <span class="text-xs sm:text-sm text-gray-500 font-normal">(交節：${jqData.nextTime}${nextWarn})</span>`;
        
        if (jqData.isTransitionInHour) {
            const warnModal = document.getElementById('jieqi-warn-modal');
            if (warnModal) warnModal.classList.remove('hidden');
        }

        document.getElementById('info-ju').innerText = juStr;
        document.getElementById('info-xunshou').innerText = xunShouGZ + xunShouStem;
        document.getElementById('info-zhifu').innerText = zhiFuStar;
        document.getElementById('info-zhishi').innerText = doorPan[currentD_val];
        document.getElementById('info-kongwang').innerText = kw1 + "、" + kw2;

        let isMenFuyin = (doorOffset === 0); let isStarFuyin = (offset === 0); let isGanFuyin = (offset === 0);
        let isMenFanyin = (doorOffset === 4); let isStarFanyin = (offset === 4); let isGanFanyin = (offset === 4);

        let fuyinHTML = ""; let rawFuyin = ""; let rawFanyin = "";
        
        if (isMenFuyin) { fuyinHTML += "<span class='text-red-700 mr-2'>【門伏吟】</span>"; rawFuyin += "【門伏吟】"; }
        if (isStarFuyin) { fuyinHTML += "<span class='text-amber-700 mr-2'>【星伏吟】</span>"; rawFuyin += "【星伏吟】"; }
        if (isGanFuyin) { fuyinHTML += "<span class='text-purple-700 mr-2'>【干伏吟】</span>"; rawFuyin += "【干伏吟】"; }

        if (isMenFanyin) { fuyinHTML += "<span class='text-red-700 mr-2'>【門反吟】</span>"; rawFanyin += "【門反吟】"; }
        if (isStarFanyin) { fuyinHTML += "<span class='text-amber-700 mr-2'>【星反吟】</span>"; rawFanyin += "【星反吟】"; }
        if (isGanFanyin) { fuyinHTML += "<span class='text-purple-700 mr-2'>【干反吟】</span>"; rawFanyin += "【干反吟】"; }

        let dPalaces = [];
        for(let i=1; i<=9; i++) {
            if(i===5) continue;
            let hStems = Array.isArray(heavenPan[i]) ? heavenPan[i] : [heavenPan[i]];
            if(hStems.includes(dayHighlightStem)) dPalaces.push(i); 
        }
        let monthBranch = monthGZ.substring(1, 2);
        let clashBranch = CLASH_MAP[monthBranch];
        let isZuo = false; let isChong = false;
        for(let p of dPalaces) {
            let pBranches = PALACES_HOU[p].branch; 
            if(pBranches.includes(monthBranch)) isZuo = true;
            if(pBranches.includes(clashBranch)) isChong = true;
        }
        
        let stemStatusStr = "", rawStemStatus = "";
        if (isZuo) { stemStatusStr = "<span class='text-blue-700'>【日干落月令之宮】</span>"; rawStemStatus = "【日干落月令之宮】"; }
        if (isChong) { stemStatusStr = "<span class='text-red-700'>【月令沖日干】</span>"; rawStemStatus = "【月令沖日干】"; }

        let combinedStatusHTML = fuyinHTML + stemStatusStr;
        let combinedRawStatus = rawFuyin + rawFanyin + rawStemStatus;

        if (!combinedStatusHTML) {
            document.getElementById('info-special').classList.add('hidden');
            document.getElementById('info-special').innerHTML = "";
        } else {
            document.getElementById('info-special').classList.remove('hidden');
            document.getElementById('info-special').innerHTML = combinedStatusHTML;
        }

        document.getElementById('qimen-grid').classList.remove('hidden');
        document.getElementById('action-footer').classList.remove('hidden');
        document.getElementById('action-footer').classList.add('flex');

        const isMenPo = (door, pNum) => {
            const fire = pNum===9, water = pNum===1, earth = pNum===2||pNum===8, metal = pNum===6||pNum===7, wood = pNum===3||pNum===4;
            if (door==="休門" && fire) return true; if ((door==="生門"||door==="死門") && water) return true; if ((door==="傷門"||door==="杜門") && earth) return true; if (door==="景門" && metal) return true; if ((door==="驚門"||door==="開門") && wood) return true; return false;
        };

        const getStemTagsText = (stem, pNum) => {
            let tags = [];
            if(isJiXing(stem, pNum)) tags.push("刑");
            if(isRuMu(stem, pNum)) tags.push("墓");
            return tags.length ? tags.join("+") : "";
        };

        const fxSelVal = document.getElementById('sel-feixing-year')?.value;
        let flightYear = (useFeiXing && fxSelVal) ? parseInt(fxSelVal) : trueY;
        if (flightYear === trueY) {
            const midYearGZ = Solar.fromYmd(trueY, 6, 1).getLunar().getYearInGanZhiExact();
            if (yearGZ !== midYearGZ) {
                flightYear = (trueM < 6) ? trueY - 1 : trueY + 1;
            }
        }
        let starC = (11 - (flightYear % 9)) % 9;
        if (starC <= 0) starC += 9;
        const FLIGHT_OFFSET = { 5: 0, 6: 1, 7: 2, 8: 3, 9: 4, 1: 5, 2: 6, 3: 7, 4: 8 };
        const FEIXING_ZH_WX = ["", "一水", "二土", "三木", "四木", "五土", "六金", "七金", "八土", "九火"];

        panData = { 
            bazi: copyBaziLine, ju: juStr, xun: xunShouGZ+xunShouStem, zf: zhiFuStar, zs: doorPan[currentD_val], 
            kw: kw1+"、"+kw2, special: rawSpecialInfo, stemStatus: combinedRawStatus, monthBranch: monthBranch,
            branchToTianJiang: branchToTianJiang, dayHighlightStem: dayHighlightStem, targetHighlightStem: targetHighlightStem,
            starC: starC, palaces: {} 
        };

        panData.bazi5Info = {
            yS: yearGZ.substring(0, 1), yB: yearGZ.substring(1, 2),
            mS: monthGZ.substring(0, 1), mB: monthGZ.substring(1, 2),
            dS: dayGZ.substring(0, 1), dB: dayGZ.substring(1, 2),
            hS: timeGZ_string.substring(0, 1), hB: timeGZ_string.substring(1, 2),
            xun: xunShouGZ + xunShouStem, zf: zhiFuStar, zs: doorPan[currentD_val], kw: kw1 + "、" + kw2
        };

        const renderStem = (s, pNum, isAnGan = false) => {
            let tagStr = "";
            if (!isAnGan) {
                let tags = []; 
                if(isJiXing(s, pNum)) tags.push("刑"); 
                if(isRuMu(s, pNum)) tags.push("墓");
                if (tags.length) tagStr = `<span class="text-[10px] text-red-600 ml-0.5 font-bold">${tags.join("+")}</span>`;
            }
            
            let displayChar = s;
            if (useEnergy && pNum !== 5) displayChar = resolveStemEnergy(s, pNum, timeBranch);

            if (isAnGan) {
                let textClassSize = useEnergy ? "text-[10px] sm:text-xs" : "text-sm sm:text-base";
                return `<span class="text-gray-400 ${textClassSize}">${displayChar}</span>`;
            }

            let stemColor = WUXING_COLORS[s] || "#1a202c";
            let highlightClass = (s === targetHighlightStem) ? "hour-stem" : (s === dayHighlightStem ? "day-stem" : "");
            let extraStyle = useEnergy && displayChar.length > 1 ? "font-size: 0.75em; line-height: 1;" : "";
            let content = highlightClass ? `<span class="${highlightClass} font-bold" style="color: ${stemColor} !important; ${extraStyle}">${displayChar}</span>` : `<span class="font-bold" style="color: ${stemColor}; ${extraStyle}">${displayChar}</span>`;
            return `<span>${content}${tagStr}</span>`;
        };

        for (let i = 1; i <= 9; i++) {
            const el = document.getElementById(`palace-${i}`);
            el.className = `palace bg-${ACTIVE_PALACES[i].type}`;

            let feixingNum = (starC + FLIGHT_OFFSET[i] - 1) % 9 + 1;
            let feixingSuffix = useFeiXing ? `<span class="text-gray-400 font-normal text-xs sm:text-sm ml-0.5">(流${FEIXING_ZH_WX[feixingNum]})</span>` : "";

            let guaDisplay = ACTIVE_PALACES[i].gua;
            if (useNeiWai) {
                let isInner = false;
                if (isYang) { if ([1, 8, 3, 4].includes(i)) isInner = true; } 
                else { if ([9, 2, 7, 6].includes(i)) isInner = true; }
                guaDisplay = isInner ? "內" : "外";
            }

            if(i === 5) {
                let s = earthPan[5], anGan = anGanPan[5];
                let centerLabel = `${ACTIVE_PALACES[5].name}${feixingSuffix}`;
                el.innerHTML = renderPalace5Html(s, anGan, centerLabel, panData.bazi5Info);
                panData.palaces[ACTIVE_PALACES[5].name] = s;
                
                globalPalaceData[5] = { name: ACTIVE_PALACES[5].name, branch: '', hStems: [s], eStems: [s], anGan: anGan, isCenter: true };
                continue;
            }
            
            let pDoor = doorPan[i], isKong = ACTIVE_PALACES[i].branch.includes(kw1) || ACTIVE_PALACES[i].branch.includes(kw2), isMa = ACTIVE_PALACES[i].branch.includes(ma);
            let hStems = Array.isArray(heavenPan[i]) ? heavenPan[i] : [heavenPan[i]];
            let eStems = Array.isArray(earthPan[i]) ? earthPan[i] : (i===2 ? [earthPan[2], earthPan[5]] : [earthPan[i]]);
            let pStars = Array.isArray(starPan[i]) ? starPan[i] : [starPan[i]];
            if(isMa) currentYiMaPalace = ACTIVE_PALACES[i].name;
            
            let godColor = GOD_COLORS[godPan[i]] || "black", doorColor = DOOR_COLORS[pDoor] || "black", anGan = anGanPan[i];
            let starText = (pStars[0] === "天芮" && pStars[1] === "天禽") ? "芮/禽" : pStars[0];
            let palaceLabel = `${ACTIVE_PALACES[i].name}${feixingSuffix}`;

            let pDoorDisplay = useEnergy ? DOOR_ENERGY[pDoor][i] : pDoor;
            let starTextDisplay = useEnergy ? (STAR_ENERGY[pStars[0]] ? STAR_ENERGY[pStars[0]][i] : starText) : starText;

            globalPalaceData[i] = {
                name: ACTIVE_PALACES[i].name, branch: ACTIVE_PALACES[i].branch.join('/'), star: pStars[0], door: pDoor,
                god: godPan[i], hStems: hStems, eStems: eStems, anGan: anGanPan[i],
                isKong: isKong, isMa: isMa, isMenPo: isMenPo(pDoor, i),
                hStemJiXing: hStems.filter(s => isJiXing(s, i)), eStemJiXing: eStems.filter(s => isJiXing(s, (i===5)?2:i)),
                hStemRuMu: hStems.filter(s => isRuMu(s, i)), eStemRuMu: eStems.filter(s => isRuMu(s, (i===5)?2:i)),
                isZhiShi: (pDoor === doorPan[currentD_val]), palaceNum: i,
                yStemEff: yStemEff, mStemEff: mStemEff, dStemEff: dStemEff, hStemEff: hStemEff
            };

            el.innerHTML = `${getBranchHTML(i)}
                <div class="emoji-container">
                    ${isKong ? '<span>🈳</span>' : ''}
                    ${isMa ? '<span>🐎</span>' : ''}
                </div>
                <div class="flex flex-col h-full justify-between relative select-none">
                    <div class="flex flex-col items-center leading-none mb-0.5">
                        <span class="text-palace-name text-${ACTIVE_PALACES[i].type}">${palaceLabel}</span>
                        <span class="text-sm sm:text-base leading-none mt-0.5 font-normal">${guaDisplay}</span>
                    </div>
                    <div class="flex flex-col items-start leading-none space-y-1 w-full my-0.5">
                        <span class="text-main text-${godColor} w-full tracking-wide">${godPan[i]}</span>
                        <span class="text-main text-${STAR_COLORS[pStars[0]] || 'black'} w-full tracking-wide">${starTextDisplay}</span>
                        <div class="flex items-center leading-none w-full">
                            <span class="text-main text-${doorColor} tracking-wide">${pDoorDisplay}</span>
                            ${isMenPo(pDoor, i)?`<span class="text-[10px] text-red-600 ml-1 font-black px-0.5 bg-red-50 border border-red-200 rounded">迫</span>`:""}
                        </div>
                    </div>
                    <div class="flex justify-between items-end mt-auto w-full pt-1">
                        <div class="flex-shrink-0 self-end pb-0.5">${renderStem(anGan, i, true)}</div>
                        <div class="flex flex-col items-stretch text-right leading-tight text-tiandi-stem font-black flex-grow max-w-[80%]">
                            <div class="w-full">${[...hStems].map(s => renderStem(s, i)).join('<span class="text-gray-400 mx-0.5 text-xs font-normal">|</span>')}</div>
                            <div class="border-t-[2px] border-gray-400 min-w-[2.2rem] w-full pt-0.5 mt-0.5">${[...eStems].map(s => renderStem(s, i)).join('<span class="text-gray-400 mx-0.5 text-xs font-normal">|</span>')}</div>
                        </div>
                    </div>
                </div>`;               
            
            let doorTextForCopy = pDoorDisplay + (isMenPo(pDoor, i) ? "(迫)" : "");
            let hStemsForCopy = hStems.map((s, idx) => {
                let tagsText = getStemTagsText(s, i);
                let txt = (useEnergy ? resolveStemEnergy(s, i, timeBranch) : s) + (tagsText ? `(${tagsText})` : "");
                return txt + (idx === 0 ? "(天)" : "(寄天)");
            }).join('+');

            let eStemsForCopy = eStems.map((s, idx) => {
                let tagsText = getStemTagsText(s, (i===5)?2:i);
                let txt = (useEnergy ? resolveStemEnergy(s, (i===5)?2:i, timeBranch) : s) + (tagsText ? `(${tagsText})` : "");
                return txt + (idx === 0 ? "(地)" : "(寄地)");
            }).join('+');

            let tianJiangStrs = [];
            if(BRANCH_POSITIONS_TEMPLATE[i]){
                for(let b of BRANCH_POSITIONS_TEMPLATE[i]){
                    if(branchToTianJiang[b]) tianJiangStrs.push(`${branchToTianJiang[b]}(${b})`);
                }
            }
            let tianJiangCopyStr = tianJiangStrs.length ? `[${tianJiangStrs.join('/')}] ` : "";

            panData.palaces[ACTIVE_PALACES[i].name] = `${tianJiangCopyStr}${godPan[i]}/${starTextDisplay}/${doorTextForCopy}/${hStemsForCopy}/${eStemsForCopy}${isMa?'/**驛馬**':''}${isKong?'/**空亡**':''}`;
        }
        
    } catch (e) { alert("起盤錯誤: " + e.message); console.error(e); }
}