// ==========================================
// js/app.js
// 介面交互、初始化、DOM 渲染與 AI 宗師模組 (完整版)
// ==========================================

// 全域變數防護宣告
if (typeof window.currentDate === 'undefined') window.currentDate = new Date();
if (typeof window.isBaziMode === 'undefined') window.isBaziMode = false;
if (typeof window.enablePalaceModal === 'undefined') window.enablePalaceModal = true;
if (typeof window.useXianTian === 'undefined') window.useXianTian = false;
if (typeof window.useEnergy === 'undefined') window.useEnergy = false;
if (typeof window.useNeiWai === 'undefined') window.useNeiWai = false;
if (typeof window.useFeiXing === 'undefined') window.useFeiXing = false;
if (typeof window.useCompass === 'undefined') window.useCompass = false;
if (typeof window.useYinYangGuiRen === 'undefined') window.useYinYangGuiRen = false;
window.currentAiInterpretation = "";

function getTrueSolarTime(baseDate, cityKey) {
    if (cityKey === "none" || typeof CITY_COORDINATES === 'undefined' || !CITY_COORDINATES[cityKey]) {
        return {
            adjustedDate: baseDate,
            offsetMinutes: 0,
            isAdjusted: false
        };
    }

    const city = CITY_COORDINATES[cityKey];
    const stdLon = city.tz * 15; 
    const lonDiff = city.lon - stdLon; 
    const lonOffsetMinutes = lonDiff * 4; 

    const startOfYear = new Date(baseDate.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((baseDate - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
    const b = (2 * Math.PI * (dayOfYear - 81)) / 365;
    const eotMinutes = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

    const totalOffsetMinutes = lonOffsetMinutes + eotMinutes;
    const adjustedTime = new Date(baseDate.getTime() + totalOffsetMinutes * 60000);

    return {
        adjustedDate: adjustedTime,
        offsetMinutes: totalOffsetMinutes,
        isAdjusted: true,
        cityName: city.name
    };
}

function showToast(msg) {
    let existing = document.getElementById('toast-msg');
    if (existing) existing.remove();
    let t = document.createElement('div');
    t.id = 'toast-msg';
    t.className = 'fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm text-white px-5 py-3 rounded-xl shadow-2xl z-[100] transition-opacity duration-300 font-bold border border-gray-700 whitespace-nowrap';
    t.innerText = msg;
    document.body.appendChild(t);
    setTimeout(() => { 
        t.style.opacity = '0'; 
        setTimeout(() => t.remove(), 300); 
    }, 2500);
}

function colorizeGanZhi(str) {
    return str.split('').map(char => (typeof WUXING_COLORS !== 'undefined' && WUXING_COLORS[char]) ? `<span style="color: ${WUXING_COLORS[char]}; text-shadow: 0 0 1px rgba(0,0,0,0.1);">${char}</span>` : char).join('');
}

function highlightPalace(el) {
    if (!enablePalaceModal) return;
    let idMatch = el.id.match(/palace-(\d)/);
    if (idMatch && idMatch[1]) {
        let activePNum = parseInt(idMatch[1]);
        if (activePNum !== 5 && typeof showPalaceDetails === 'function') {
            showPalaceDetails(activePNum);
        }
    }
}

function toggleInputMode() {
    isBaziMode = !isBaziMode;
    const btn = document.getElementById('btn-mode-toggle');
    const dateSels = document.getElementById('date-selectors');
    const baziSels = document.getElementById('bazi-selectors');
    const nowBtn = document.getElementById('btn-now');
    const jqBtn = document.getElementById('btn-show-jieqi');
    const locSels = document.getElementById('location-selectors');

    if (isBaziMode) {
        if (btn) {
            btn.innerText = "時間方式";
            btn.classList.replace('bg-indigo-100', 'bg-amber-100');
            btn.classList.replace('text-indigo-800', 'text-amber-900');
            btn.classList.replace('hover:bg-indigo-200', 'hover:bg-amber-200');
            btn.classList.replace('border-indigo-200', 'border-amber-300');
        }
        if (dateSels) dateSels.classList.add('hidden');
        if (baziSels) { baziSels.classList.remove('hidden'); baziSels.classList.add('flex'); }
        if (nowBtn) nowBtn.classList.add('hidden'); 
        if (jqBtn) jqBtn.classList.add('hidden');
        if (locSels) locSels.classList.add('hidden'); 
    } else {
        if (btn) {
            btn.innerText = "四柱方式";
            btn.classList.replace('bg-amber-100', 'bg-indigo-100');
            btn.classList.replace('text-amber-900', 'text-indigo-800');
            btn.classList.replace('hover:bg-amber-200', 'hover:bg-indigo-200');
            btn.classList.replace('border-amber-300', 'border-indigo-200');
        }
        if (baziSels) { baziSels.classList.add('hidden'); baziSels.classList.remove('flex'); }
        if (dateSels) dateSels.classList.remove('hidden');
        if (nowBtn) nowBtn.classList.remove('hidden'); 
        if (jqBtn) jqBtn.classList.remove('hidden');
        if (locSels) locSels.classList.remove('hidden');
    }
}

function handleGenerateBtn() {
    if (typeof clearActiveCase === 'function') clearActiveCase();
    if (isBaziMode) {
        if (typeof executeBaziSearch === 'function') executeBaziSearch();
    } else {
        if (typeof generatePan === 'function') generatePan();
    }
}

function toggleFilterPanel() {
    const dateInput = document.getElementById('filter-start-date');
    if (dateInput && !dateInput.value) {
        const t = new Date();
        dateInput.value = `${t.getFullYear()}/${(t.getMonth()+1).toString().padStart(2,'0')}/${t.getDate().toString().padStart(2,'0')}`;
    }
    
    const panel = document.getElementById('right-side-panel');
    if (panel) {
        if (panel.classList.contains('hidden')) {
            if (typeof openRightPanelTab === 'function') openRightPanelTab('filter');
        } else {
            if (typeof closeRightPanel === 'function') closeRightPanel();
        }
    }
}

function handleFilterPalaceChange(idx) {
    const targetEl = document.getElementById(`filter-target-palace-${idx}`);
    if (!targetEl) return;
    const pNum = targetEl.value;
    if (idx === 2) {
        const c2Elems = document.getElementById('condition-2-elements');
        const logicOp = document.getElementById('logic-op-container');
        if (pNum === "0") {
            if (c2Elems) c2Elems.classList.add('hidden'); 
            if (logicOp) logicOp.classList.add('hidden');
        } else {
            if (c2Elems) c2Elems.classList.remove('hidden'); 
            if (logicOp) logicOp.classList.remove('hidden');
        }
    }
    if (pNum !== "0") syncSpecialConditions(idx);
}

function syncSpecialConditions(idx) {
    const targetEl = document.getElementById(`filter-target-palace-${idx}`);
    if (!targetEl) return;
    const pNum = targetEl.value;
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
            posEl.checked = false; negEl.checked = false;
            posEl.disabled = true; negEl.disabled = true;
            if (posEl.parentElement) posEl.parentElement.classList.add('chk-label-disabled');
            if (negEl.parentElement) negEl.parentElement.classList.add('chk-label-disabled');
        } else {
            if (posEl.checked) {
                negEl.disabled = true; 
                if (negEl.parentElement) negEl.parentElement.classList.add('chk-label-disabled');
                posEl.disabled = false; 
                if (posEl.parentElement) posEl.parentElement.classList.remove('chk-label-disabled');
            } else if (negEl.checked) {
                posEl.disabled = true; 
                if (posEl.parentElement) posEl.parentElement.classList.add('chk-label-disabled');
                negEl.disabled = false; 
                if (negEl.parentElement) negEl.parentElement.classList.remove('chk-label-disabled');
            } else {
                posEl.disabled = false; negEl.disabled = false;
                if (posEl.parentElement) posEl.parentElement.classList.remove('chk-label-disabled');
                if (negEl.parentElement) negEl.parentElement.classList.remove('chk-label-disabled');
            }
        }
    });
}

function handleGuiRenToggle() {
    const el = document.getElementById('toggle-guiren');
    useYinYangGuiRen = el ? el.checked : false;
    const grLabel = document.getElementById('guiren-label');
    if (grLabel) grLabel.innerText = useYinYangGuiRen ? "陰陽貴人" : "天乙貴人";
    if (typeof generatePan === 'function') generatePan();
}

function handleToggleSwitch(activeId) {
    const allToggles = ['toggle-bagua', 'toggle-energy', 'toggle-neiwai', 'toggle-feixing', 'toggle-compass'];
    const activeEl = document.getElementById(activeId);
    if (activeEl && activeEl.checked) {
        allToggles.forEach(id => {
            if (id !== activeId) {
                const el = document.getElementById(id);
                if (el) el.checked = false;
            }
        });
    }

    useXianTian = document.getElementById('toggle-bagua')?.checked || false;
    useEnergy = document.getElementById('toggle-energy')?.checked || false;
    useNeiWai = document.getElementById('toggle-neiwai')?.checked || false;
    enablePalaceModal = true;
    useFeiXing = document.getElementById('toggle-feixing')?.checked || false;
    useCompass = document.getElementById('toggle-compass')?.checked || false;

    const baguaLabel = document.getElementById('bagua-label');
    if (baguaLabel) baguaLabel.innerText = useXianTian ? "後天八卦數" : "先天八卦數";

    const grLabel = document.getElementById('guiren-label');
    if (grLabel) grLabel.innerText = useYinYangGuiRen ? "陰陽貴人" : "天乙貴人";
    
    const fxSel = document.getElementById('sel-feixing-year');
    if (fxSel) {
        if (useFeiXing) {
            fxSel.classList.remove('hidden');
            if (!fxSel.value) fxSel.value = document.getElementById('sel-year')?.value || "2026";
        } else {
            fxSel.classList.add('hidden');
        }
    }

    if (useCompass) {
        if (typeof openCompassMode === 'function') openCompassMode();
    } else {
        if (typeof closeCompassMode === 'function') closeCompassMode();
        if (typeof generatePan === 'function') generatePan();
    }
}

function getBranchHTML(i) {
    if (typeof BRANCH_POSITIONS_TEMPLATE === 'undefined') return "";
    let text = BRANCH_POSITIONS_TEMPLATE[i];
    let html = "";
    if (!text) return "";
    
    const branchConfig = {
        '子': { class: 'pos-bottom', vertical: false }, '丑': { class: 'pos-bottom', vertical: false },
        '寅': { class: 'pos-left', vertical: true }, '卯': { class: 'pos-left', vertical: true },
        '辰': { class: 'pos-left', vertical: true }, '巳': { class: 'pos-top', vertical: false },
        '午': { class: 'pos-top', vertical: false }, '未': { class: 'pos-top', vertical: false },
        '申': { class: 'pos-right', vertical: true }, '酉': { class: 'pos-right', vertical: true },
        '戌': { class: 'pos-right', vertical: true }, '亥': { class: 'pos-bottom', vertical: false }
    };

    const currentMonthBranch = (typeof panData !== 'undefined' && panData.monthBranch) ? panData.monthBranch : "";

    for (let b of text) {
        let wColor = (typeof WUXING_COLORS !== 'undefined' && WUXING_COLORS[b]) ? WUXING_COLORS[b] : "#1a202c";
        let conf = branchConfig[b] || { class: 'pos-bottom', vertical: false };
        let tjText = (typeof panData !== 'undefined' && panData.branchToTianJiang && panData.branchToTianJiang[b]) ? panData.branchToTianJiang[b] : "";
        let tjHtml = tjText ? `<span class="tian-jiang">${tjText}</span>` : "";
        let baseClasses = `branch-label ${conf.class}`;
        if (conf.vertical) baseClasses += ` vertical-label`;
        let hlClasses = (b === currentMonthBranch) ? " bg-yellow-200 px-1.5 py-0.5 rounded shadow-sm border border-yellow-400 z-30" : "";
        
        html += `<div class="${baseClasses}${hlClasses}" data-branch="${b}" style="color: ${wColor};">
                    <span>${b}</span>${tjHtml}
                 </div>`;
    }
    return html;
}

function renderPalace5Html(s, anGan, centerLabel, bazi5) {
    let baziContent = "";
    if (bazi5) {
        baziContent = `
        <div class="flex flex-col items-center justify-center w-full select-none z-10 my-auto">
            <div class="text-[11px] sm:text-xs md:text-[13px] text-red-700 font-black tracking-widest mb-0.5">${bazi5.methodLabel || "時家拆補法"}</div>
            
            <div class="flex justify-center items-center gap-x-1.5 sm:gap-x-2 font-black text-lg sm:text-xl md:text-2xl leading-none">
                <div class="flex flex-col items-center gap-y-0.5 leading-none">
                    <span style="color:${(typeof WUXING_COLORS !== 'undefined' && WUXING_COLORS[bazi5.hS]) ? WUXING_COLORS[bazi5.hS] : '#1a202c'}">${bazi5.hS}</span>
                    <span style="color:${(typeof WUXING_COLORS !== 'undefined' && WUXING_COLORS[bazi5.hB]) ? WUXING_COLORS[bazi5.hB] : '#1a202c'}">${bazi5.hB}</span>
                </div>
                <div class="flex flex-col items-center gap-y-0.5 leading-none">
                    <span style="color:${(typeof WUXING_COLORS !== 'undefined' && WUXING_COLORS[bazi5.dS]) ? WUXING_COLORS[bazi5.dS] : '#1a202c'}">${bazi5.dS}</span>
                    <span style="color:${(typeof WUXING_COLORS !== 'undefined' && WUXING_COLORS[bazi5.dB]) ? WUXING_COLORS[bazi5.dB] : '#1a202c'}">${bazi5.dB}</span>
                </div>
                <div class="flex flex-col items-center gap-y-0.5 leading-none">
                    <span style="color:${(typeof WUXING_COLORS !== 'undefined' && WUXING_COLORS[bazi5.mS]) ? WUXING_COLORS[bazi5.mS] : '#1a202c'}">${bazi5.mS}</span>
                    <span style="color:${(typeof WUXING_COLORS !== 'undefined' && WUXING_COLORS[bazi5.mB]) ? WUXING_COLORS[bazi5.mB] : '#1a202c'}">${bazi5.mB}</span>
                </div>
                <div class="flex flex-col items-center gap-y-0.5 leading-none">
                    <span style="color:${(typeof WUXING_COLORS !== 'undefined' && WUXING_COLORS[bazi5.yS]) ? WUXING_COLORS[bazi5.yS] : '#1a202c'}">${bazi5.yS}</span>
                    <span style="color:${(typeof WUXING_COLORS !== 'undefined' && WUXING_COLORS[bazi5.yB]) ? WUXING_COLORS[bazi5.yB] : '#1a202c'}">${bazi5.yB}</span>
                </div>
            </div>
            <div class="text-[9px] sm:text-[10px] text-gray-400 font-bold tracking-widest mt-0.5">時日月年</div>
            
            <div class="flex flex-col items-start w-full text-[10px] sm:text-[11px] md:text-xs text-gray-700 font-bold leading-tight space-y-0 mt-1 px-1">
                <div class="whitespace-nowrap flex items-center">旬首：<span class="text-gray-950 font-black ml-0.5">${bazi5.xun}</span></div>
                <div class="whitespace-nowrap flex items-center">值符：<span class="text-gray-950 font-black ml-0.5">${bazi5.zf}</span></div>
                <div class="whitespace-nowrap flex items-center">值使：<span class="text-gray-950 font-black ml-0.5">${bazi5.zs}</span></div>
            </div>
        </div>`;
    }
    
    let stemColor = (typeof WUXING_COLORS !== 'undefined' && WUXING_COLORS[s]) ? WUXING_COLORS[s] : "#1a202c";
    let highlightClass = (typeof panData !== 'undefined' && s === panData.targetHighlightStem) ? "hour-stem" : ((typeof panData !== 'undefined' && s === panData.dayHighlightStem) ? "day-stem" : "");
    let mainStemHtml = highlightClass ? `<span class="${highlightClass} font-bold" style="color: ${stemColor} !important;">${s}</span>` : `<span class="font-bold" style="color: ${stemColor};">${s}</span>`;
    let anGanHtml = `<span class="text-gray-400 text-sm sm:text-base">${anGan}</span>`;

    return `
        ${getBranchHTML(5)}
        <div class="flex flex-col h-full justify-between relative select-none">
            <div class="flex flex-col items-center leading-none">
                <span class="text-palace-name text-brown">${centerLabel}</span>
            </div>
            ${baziContent}
            <div class="flex justify-between items-end w-full mt-auto z-10 px-0.5 pb-0.5 pt-1">
                <div class="flex-shrink-0 self-end pb-0.5">${anGanHtml}</div>
                <div class="flex flex-col items-stretch text-right leading-tight text-tiandi-stem font-black">
                    <div>${mainStemHtml}</div>
                </div>
            </div>
        </div>`;
}

function updateJieQiYearBtn() { 
    const yearElem = document.getElementById('sel-year');
    const btnSpan = document.getElementById('btn-jieqi-year');
    if (yearElem && btnSpan) btnSpan.innerText = yearElem.value; 
}

function resetToNow() { 
    currentDate = new Date(); 
    updateSelectorsFromDate(currentDate); 
    if (typeof generatePan === 'function') generatePan(); 
}

function shiftHour(dir) { 
    if (!currentDate) currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + (dir * 2)); 
    updateSelectorsFromDate(currentDate); 
    if (typeof generatePan === 'function') generatePan(); 
}

function initSelectors() {
    const ySel = document.getElementById('sel-year');
    const mSel = document.getElementById('sel-month');
    const dSel = document.getElementById('sel-day');
    const hSel = document.getElementById('sel-hour24');
    const minSel = document.getElementById('sel-minute');
    const fxSel = document.getElementById('sel-feixing-year');
    const locSel = document.getElementById('sel-location');
    
    if (!ySel || !mSel || !dSel || !hSel || !minSel) return;

    // 清空現有選項，避免重複疊加
    ySel.innerHTML = "";
    mSel.innerHTML = "";
    dSel.innerHTML = "";
    hSel.innerHTML = "";
    minSel.innerHTML = "";
    if (fxSel) fxSel.innerHTML = "";
    
    // 初始化地區選單
    if (locSel && typeof CITY_COORDINATES !== 'undefined') {
        locSel.innerHTML = "";
        for (let key in CITY_COORDINATES) {
            locSel.add(new Option(CITY_COORDINATES[key].name, key));
        }
        locSel.value = "none"; 
    }
    
    const compassFxSel = document.getElementById('sel-compass-feixing-year');
    if (compassFxSel) compassFxSel.innerHTML = "";
    
    for (let i = 1930; i <= 2050; i++) {
        ySel.add(new Option(i, i));
        if (fxSel) fxSel.add(new Option(i + "年", i));
        if (compassFxSel) compassFxSel.add(new Option(i + "年", i));
    }
    for (let i = 1; i <= 12; i++) mSel.add(new Option(i, i));
    for (let i = 1; i <= 31; i++) dSel.add(new Option(i, i));
    for (let i = 0; i <= 23; i++) hSel.add(new Option(i.toString().padStart(2, '0'), i));
    for (let i = 0; i <= 59; i++) minSel.add(new Option(i.toString().padStart(2, '0'), i));
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('y') && urlParams.has('m') && urlParams.has('d') && urlParams.has('h') && urlParams.has('min')) {
        ySel.value = urlParams.get('y');
        mSel.value = urlParams.get('m');
        dSel.value = urlParams.get('d');
        hSel.value = urlParams.get('h');
        minSel.value = urlParams.get('min');
        
        if (urlParams.has('method')) {
            const methodSel = document.getElementById('sel-qimen-method');
            if (methodSel) methodSel.value = urlParams.get('method');
        }

        currentDate = new Date(urlParams.get('y'), urlParams.get('m') - 1, urlParams.get('d'), urlParams.get('h'), urlParams.get('min'));
        updateJieQiYearBtn();
        if (typeof generatePan === 'function') generatePan();
    } else {
        if (!currentDate || isNaN(currentDate.getTime())) currentDate = new Date();
        updateSelectorsFromDate(currentDate);
        if (typeof generatePan === 'function') generatePan();
    }
}

function initBaziSelectors() {
    if (typeof JIA_ZI_ARRAY === 'undefined' || typeof STEMS === 'undefined') return;
    const sortedJiaZi = [...JIA_ZI_ARRAY].sort((a, b) => {
        const stemA = STEMS.indexOf(a[0]);
        const stemB = STEMS.indexOf(b[0]);
        if (stemA !== stemB) return stemA - stemB;
        return JIA_ZI_ARRAY.indexOf(a) - JIA_ZI_ARRAY.indexOf(b);
    });

    ['sel-bazi-y', 'sel-bazi-m', 'sel-bazi-d', 'sel-bazi-h'].forEach(id => {
        let sel = document.getElementById(id);
        if (sel) {
            sel.innerHTML = "";
            sortedJiaZi.forEach(gz => sel.add(new Option(gz, gz)));
        }
    });
    
    try {
        if (typeof Solar !== 'undefined') {
            const nowLunar = Solar.fromDate(new Date()).getLunar();
            const noonLunar = Solar.fromYmdHms(new Date().getFullYear(), new Date().getMonth()+1, new Date().getDate(), 12, 0, 0).getLunar();
            const yEl = document.getElementById('sel-bazi-y');
            const mEl = document.getElementById('sel-bazi-m');
            const dEl = document.getElementById('sel-bazi-d');
            const hEl = document.getElementById('sel-bazi-h');
            if (yEl) yEl.value = nowLunar.getYearInGanZhiExact();
            if (mEl) mEl.value = nowLunar.getMonthInGanZhiExact();
            if (dEl) dEl.value = noonLunar.getDayInGanZhiExact();
            
            let hIdx = Math.floor((new Date().getHours() + 1) % 24 / 2);
            let timeBranch = BRANCHES[hIdx];
            let dayStem = noonLunar.getDayInGanZhiExact().charAt(0);
            let dayStemIdx = STEMS.indexOf(dayStem);
            let hStemIdx = ((dayStemIdx % 5) * 2 + hIdx) % 10;
            if (hEl) hEl.value = STEMS[hStemIdx] + timeBranch;
        }
    } catch(e) {}
}

function updateSelectorsFromDate(d) {
    if (!d || isNaN(d.getTime())) return;
    const ySel = document.getElementById('sel-year');
    const mSel = document.getElementById('sel-month');
    const dSel = document.getElementById('sel-day');
    const hSel = document.getElementById('sel-hour24');
    const minSel = document.getElementById('sel-minute');
    if (ySel) ySel.value = d.getFullYear();
    if (mSel) mSel.value = d.getMonth() + 1;
    if (dSel) dSel.value = d.getDate();
    if (hSel) hSel.value = d.getHours();
    if (minSel) minSel.value = d.getMinutes();
    
    const fxSel = document.getElementById('sel-feixing-year');
    if (fxSel && !useFeiXing) fxSel.value = d.getFullYear();
    updateJieQiYearBtn();
}

// 確保無論何種時機加載均能執行初始化
function bootstrapApp() {
    initSelectors();
    initBaziSelectors();
    handleFilterPalaceChange(1);
    handleFilterPalaceChange(2);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
    bootstrapApp();
}

function copyPan() {
    const ACTIVE_PALACES = (typeof useXianTian !== 'undefined' && useXianTian) ? PALACES_XIAN : PALACES_HOU;
    if (typeof panData === 'undefined' || !panData) return;
    
    const methodTitle = (panData.bazi5Info && panData.bazi5Info.methodLabel) ? panData.bazi5Info.methodLabel : "【奇門遁甲】";
    const baziLine = panData.bazi + (panData.special ? " " + panData.special : "") + (panData.stemStatus ? " " + panData.stemStatus : "");
    const yima = (typeof currentYiMaPalace !== 'undefined') ? currentYiMaPalace : "";
    let text = `${methodTitle} 排盤\n時間：${baziLine}\n局數：${panData.ju}\n旬首：${panData.xun}\n值符：${panData.zf} | 值使：${panData.zs}\n空亡：${panData.kw} | 驛馬：${yima}\n----------------------\n`;
    
    for (let i = 1; i <= 9; i++) {
        if(i !== 5) {
            let pName = ACTIVE_PALACES[i].name;
            text += `${pName}：${panData.palaces[pName]}\n`;
        }
    }
    navigator.clipboard.writeText(text).then(() => showToast("📋 盤面資料已複製！")).catch(() => { 
        let t = document.createElement("textarea"); 
        t.value = text; document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); showToast("📋 盤面資料已複製！"); 
    });
}

function sharePan() {
    const y = document.getElementById('sel-year')?.value;
    const m = document.getElementById('sel-month')?.value;
    const d = document.getElementById('sel-day')?.value;
    const h = document.getElementById('sel-hour24')?.value;
    const min = document.getElementById('sel-minute')?.value;
    const qimenMethod = document.getElementById('sel-qimen-method') ? document.getElementById('sel-qimen-method').value : 'chaibu';
    
    const url = new URL(window.location.href);
    url.searchParams.set('y', y); url.searchParams.set('m', m);
    url.searchParams.set('d', d); url.searchParams.set('h', h); url.searchParams.set('min', min);
    url.searchParams.set('method', qimenMethod);
    
    navigator.clipboard.writeText(url.toString()).then(() => showToast("🔗 分享連結已複製！")).catch(() => {
        let t = document.createElement("textarea"); 
        t.value = url.toString(); document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); showToast("🔗 分享連結已複製！");
    });
}

// ==========================================
// AI 大師解盤模組 (Cloudflare Workers AI 直連)
// ==========================================
const CLOUDFLARE_WORKER_URL = "/api/qmai";

function openAiModal() {
    if (typeof panData === 'undefined' || !panData || !panData.ju) {
        showToast("⚠️ 請先起盤後再進行 AI 分析！");
        return;
    }
    if (typeof activeCase !== 'undefined' && activeCase && activeCase.notes) {
        const userCtx = document.getElementById('ai-user-context');
        if (userCtx) userCtx.value = activeCase.notes;
    }
    const modal = document.getElementById('ai-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeAiModal() {
    const modal = document.getElementById('ai-modal');
    if (modal) modal.classList.add('hidden');
}

async function requestAiInterpretation() {
    const btn = document.getElementById('btn-call-ai');
    const resultBox = document.getElementById('ai-result-container');
    const resultContent = document.getElementById('ai-result-content');
    const category = document.getElementById('ai-question-category')?.value || "綜合問事";
    const userContext = document.getElementById('ai-user-context')?.value.trim() || "";
    const passcode = document.getElementById('ai-user-passcode')?.value.trim() || "";

    const ACTIVE_PALACES = (typeof useXianTian !== 'undefined' && useXianTian) ? PALACES_XIAN : PALACES_HOU;
    
    const PALACE_WUXING_MAP = {
        "坎一": "水", "坤二": "土", "震三": "木", "巽四": "木",
        "中五": "土", "乾六": "金", "兌七": "金", "艮八": "土", "離九": "火"
    };

    // 1. 定位日干與時干
    let dStem = (panData.bazi5Info && panData.bazi5Info.dS) ? panData.bazi5Info.dS : "";
    let hStem = (panData.bazi5Info && panData.bazi5Info.hS) ? panData.bazi5Info.hS : "";
    
    if (!dStem || !hStem) {
        const baziParts = (panData.bazi || "").split(' ');
        if (baziParts.length >= 4) {
            dStem = baziParts[2].charAt(0);
            hStem = baziParts[3].charAt(0);
        }
    }

    // 2. 遍歷九宮：支援天禽星寄宮 "+干(寄天)" 正則
    let dayPalaceFound = "未定位";
    let hourPalaceFound = "未定位";
    let palaceDetails = [];

    for (let i = 1; i <= 9; i++) {
        if (i !== 5) {
            let pName = ACTIVE_PALACES[i].name;
            let pContent = (panData.palaces && panData.palaces[pName]) ? panData.palaces[pName] : '';
            let wx = PALACE_WUXING_MAP[pName] || "";
            palaceDetails.push(`• ${pName}（五行屬${wx}）：${pContent}`);

            const dayRegex = new RegExp(`(${dStem}(\\([^\\)]*\\))?\\(天\\)|\\+${dStem}(\\([^\\)]*\\))?\\(寄天\\))`);
            const hourRegex = new RegExp(`(${hStem}(\\([^\\)]*\\))?\\(天\\)|\\+${hStem}(\\([^\\)]*\\))?\\(寄天\\))`);

            if (dayRegex.test(pContent)) dayPalaceFound = `${pName}（五行：${wx}）`;
            if (hourRegex.test(pContent)) hourPalaceFound = `${pName}（五行：${wx}）`;
        }
    }

    const specialStatus = panData.special || "無";
    const yimaVal = (typeof currentYiMaPalace !== 'undefined') ? currentYiMaPalace : "無";

    // 3. 組裝高度約束 Prompt
    const systemPrompt = `你是一位實戰派奇門遁甲宗師。推演必須嚴格遵守以下易理鐵律：
1. 嚴格遵守五行生剋：木生火、火生土、土生金、金生水、水生木；木剋土、土剋水、水剋火、火剋金、金剋木。絕不可搞反主生與被生、主剋與被剋！
2. 盤面各宮括號內已標明四害狀態（如：門迫、空亡、擊刑、入墓）。若標有【空亡】即逢空（能量大減或事不成/懸空），標有【門迫】即人事受阻內耗，嚴禁將有標記的斷為無四害！
3. 若全盤出現【門伏吟】主停滯、拖延、保守、不宜妄動，主動多不利；若遇【門反吟】主反覆、波折、成而復敗。
4. 問求職/工作：日干為求測人，時干為所問事體/聯絡動向；開門代表職位與工作（乾六宮）；值符代表僱主/面試長官（坤二宮）。必須綜合生剋研判。`;

    const promptText = `
【排盤格局】
四柱：${panData.bazi} ｜ 局數：${panData.ju} ｜ 旬首：${panData.xun}
值符星：${panData.zf} ｜ 值使門：${panData.zs}
空亡：${panData.kw} ｜ 驛馬：${yimaVal}
全局特殊神煞：${specialStatus}

【★ 核心用神精確鎖定】
• 求測人（日干/年命【${dStem}】）：真實落在【${dayPalaceFound}】
• 問事事體（時干【${hStem}】）：真實落在【${hourPalaceFound}】
（註：九宮固有五行：坎一水、坤二土、震三木、巽四木、乾六金、兌七金、艮八土、離九火）

【九宮各宮詳細落宮數據】
${palaceDetails.join('\n')}

【問事事項】
問事分類：${category}
具體提問：${userContext || "無補充說明"}

【請依以下三步驟條理清晰推演，杜絕套話】
一、用神落宮及狀態剖析：
   - 求測人【${dStem}】落宮分析：宮內門、星、神組合，是否有四害（空亡/門迫/擊刑/入墓）。
   - 事體時干【${hStem}】落宮分析：宮內門、星、神組合，是否有四害（特別留意是否逢空亡或反伏吟）。
   - （若問工作招聘）檢視「值符（僱主）」與「開門（工作職位）」之宮位吉凶及對求測人的生剋。
二、主客五行生剋與大局定調：
   - 時干落宮（事體進展）對 日干落宮（求測人）的生剋方向是？（生我/剋我/我剋/我生/比和）
   - 結合全局格局（如【${specialStatus}】）分析此時行動（例如主動打電話催問）的利弊。
三、吉凶結論與實戰行動建議：
   - 明確結論：吉 / 凶 / 宜靜守 / 忌急躁催問。
   - 給予求測者當下具體、務實的應對建議。
`;

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin h-4 w-4 text-white mr-1 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 宗師推演中，請稍候...`;
    }

    if (resultBox) resultBox.classList.add('hidden');
    if (resultContent) resultContent.innerText = '';

    try {
        const response = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPasscode: passcode,
                qimenPrompt: promptText
            })
        });

        const data = await response.json();

        if (data.error) {
            alert("⚠️ 分析失敗：" + data.error);
        } else {
            if (resultBox) resultBox.classList.remove('hidden');
            let cleanResult = (data.result || "")
                .replace(/\r\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .replace(/^\s*[\*\-_]{3,}\s*$/gm, '')
                .trim();

            window.currentAiInterpretation = cleanResult;
            if (typeof panData !== 'undefined') {
                panData.aiInsights = cleanResult;
                panData.aiInterpretation = cleanResult;
            }

            if (resultContent) {
                if (typeof marked !== 'undefined') {
                    resultContent.innerHTML = marked.parse(cleanResult);
                } else {
                    resultContent.innerText = cleanResult;
                }
            }
        }
    } catch (err) {
        alert("網路請求異常，請檢查連線狀態：" + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<span>⚡ 開始 AI 深度分析</span>`;
        }
    }
}

// 按鈕功能一：複製斷語 (對接 index.html onclick="copyAiResult()")
function copyAiResult() {
    const textToCopy = window.currentAiInterpretation || 
                       document.getElementById('ai-result-content')?.innerText || 
                       (typeof panData !== 'undefined' ? (panData.aiInsights || panData.aiInterpretation) : "");

    if (!textToCopy || textToCopy.trim() === "") {
        alert("尚未生成 AI 斷語！");
        return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("✅ AI 斷語已複製到剪貼簿！");
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast("✅ AI 斷語已複製到剪貼簿！");
    });
}

// 按鈕功能二：存入案例筆記 (對接 index.html onclick="saveAiResultToCase()")
async function saveAiResultToCase() {
    const aiText = window.currentAiInterpretation || 
                   document.getElementById('ai-result-content')?.innerText || 
                   (typeof panData !== 'undefined' ? (panData.aiInsights || panData.aiInterpretation) : "");

    if (!aiText || aiText.trim() === "") {
        alert("⚠️ 尚未生成 AI 斷語，無法存入筆記！");
        return;
    }

    const category = document.getElementById('ai-question-category')?.value || "綜合問事";
    const userContext = document.getElementById('ai-user-context')?.value.trim() || "";
    const shortTitle = userContext ? (userContext.length > 20 ? userContext.slice(0, 20) + "..." : userContext) : category.split('（')[0];

    // 1. 同步寫入記憶體 panData
    if (typeof panData !== 'undefined') {
        panData.aiInsights = aiText;
        panData.aiInterpretation = aiText;
    }

    // 2. 填入 index.html 的原生案例欄位
    const notesElem = document.getElementById('case-notes');
    if (notesElem) {
        const existing = notesElem.value.trim();
        const header = `\n\n【AI 宗師推演報告 · ${category}】\n`;
        notesElem.value = existing ? (existing + header + aiText) : `【AI 宗師推演報告 · ${category}】\n${aiText}`;
    }

    const nameElem = document.getElementById('case-client-name');
    if (nameElem && !nameElem.value.trim()) {
        nameElem.value = shortTitle;
    }

    // 3. 原生案例庫確認儲存
    let saved = false;
    if (typeof confirmSaveCase === 'function') {
        try {
            await confirmSaveCase();
            saved = true;
        } catch (e) {
            console.warn("confirmSaveCase 執行異常:", e);
        }
    }

    // 4. 備援寫入 IndexedDB
    if (!saved) {
        try {
            await writeDirectlyToIndexedDB({
                category: category,
                question: userContext,
                aiInsights: aiText,
                bazi: (typeof panData !== 'undefined' && panData.bazi) ? panData.bazi : "",
                ju: (typeof panData !== 'undefined' && panData.ju) ? panData.ju : "",
                date: new Date().toLocaleString('zh-HK')
            });
        } catch (err) {
            console.error("備援寫入失敗:", err);
        }
    }

    showToast("✅ AI 斷語已成功存入案例庫！");
}

// 萬用底層 IndexedDB 寫入函式（備援）
function writeDirectlyToIndexedDB(casePayload) {
    return new Promise(async (resolve, reject) => {
        let targetDbName = "QimenCaseDB";
        if (indexedDB.databases) {
            try {
                const dbs = await indexedDB.databases();
                const matched = dbs.find(d => /qimen|case/i.test(d.name));
                if (matched && matched.name) targetDbName = matched.name;
            } catch (e) {}
        }

        const request = indexedDB.open(targetDbName);
        request.onupgradeneeded = function(e) {
            const db = e.target.result;
            if (!db.objectStoreNames.contains("cases")) {
                db.createObjectStore("cases", { keyPath: "id", autoIncrement: true });
            }
        };
        request.onsuccess = function(e) {
            const db = e.target.result;
            const storeName = db.objectStoreNames.contains("cases") ? "cases" : db.objectStoreNames[0];
            if (!storeName) { db.close(); return resolve(); }

            const tx = db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            store.add({
                name: casePayload.question || casePayload.category,
                clientName: casePayload.question || casePayload.category,
                category: casePayload.category,
                notes: casePayload.aiInsights,
                aiInsights: casePayload.aiInsights,
                bazi: casePayload.bazi,
                ju: casePayload.ju,
                status: "等待反饋",
                createdAt: new Date().toISOString(),
                displayTime: casePayload.date
            });

            tx.oncomplete = function() {
                db.close();
                if (typeof renderCaseList === 'function') renderCaseList();
                resolve();
            };
            tx.onerror = function(err) { db.close(); reject(err); };
        };
        request.onerror = function(err) { reject(err); };
    });
}

// 全面綁定全域變數，保證 HTML 所有按鈕 100% 呼叫得到
window.openAiModal = openAiModal;
window.closeAiModal = closeAiModal;
window.requestAiInterpretation = requestAiInterpretation;
window.copyAiResult = copyAiResult;
window.copyAiInterpretation = copyAiResult;
window.saveAiResultToCase = saveAiResultToCase;
window.saveAiToCaseNotes = saveAiResultToCase;
window.saveAiToCase = saveAiResultToCase;
window.saveAiCase = saveAiResultToCase;
