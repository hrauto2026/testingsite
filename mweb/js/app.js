// ==========================================
// js/app.js
// 介面交互、初始化與 DOM 渲染控制
// ==========================================

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
    setTimeout(() => { t.style.opacity = '0'; setTimeout(()=>t.remove(),300); }, 2500);
}

function colorizeGanZhi(str) {
    return str.split('').map(char => WUXING_COLORS[char] ? `<span style="color: ${WUXING_COLORS[char]}; text-shadow: 0 0 1px rgba(0,0,0,0.1);">${char}</span>` : char).join('');
}

function highlightPalace(el) {
    if (!enablePalaceModal) return;
    let idMatch = el.id.match(/palace-(\d)/);
    if (idMatch && idMatch[1]) {
        let activePNum = parseInt(idMatch[1]);
        if (activePNum !== 5) {
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
        btn.innerText = "時間方式";
        btn.classList.replace('bg-indigo-100', 'bg-amber-100');
        btn.classList.replace('text-indigo-800', 'text-amber-900');
        btn.classList.replace('hover:bg-indigo-200', 'hover:bg-amber-200');
        btn.classList.replace('border-indigo-200', 'border-amber-300');
        dateSels.classList.add('hidden');
        baziSels.classList.remove('hidden'); baziSels.classList.add('flex');
        nowBtn.classList.add('hidden'); jqBtn.classList.add('hidden');
        if (locSels) locSels.classList.add('hidden'); 
    } else {
        btn.innerText = "四柱方式";
        btn.classList.replace('bg-amber-100', 'bg-indigo-100');
        btn.classList.replace('text-amber-900', 'text-indigo-800');
        btn.classList.replace('hover:bg-amber-200', 'hover:bg-indigo-200');
        btn.classList.replace('border-amber-300', 'border-indigo-200');
        baziSels.classList.add('hidden'); baziSels.classList.remove('flex');
        dateSels.classList.remove('hidden');
        nowBtn.classList.remove('hidden'); jqBtn.classList.remove('hidden');
        if (locSels) locSels.classList.remove('hidden');
    }
}

function handleGenerateBtn() {
    // 若為主動起盤，先解除目前的案例關聯狀態
    if (typeof clearActiveCase === 'function') clearActiveCase();
    
    if (isBaziMode) executeBaziSearch();
    else generatePan();
}

function toggleFilterPanel() {
    const dateInput = document.getElementById('filter-start-date');
    if (!dateInput.value) {
        const t = new Date();
        dateInput.value = `${t.getFullYear()}/${(t.getMonth()+1).toString().padStart(2,'0')}/${t.getDate().toString().padStart(2,'0')}`;
    }
    
    const panel = document.getElementById('right-side-panel');
    if (panel.classList.contains('hidden')) {
        openRightPanelTab('filter');
    } else {
        closeRightPanel();
    }
}
function handleFilterPalaceChange(idx) {
    const pNum = document.getElementById(`filter-target-palace-${idx}`).value;
    if (idx === 2) {
        const c2Elems = document.getElementById('condition-2-elements');
        const logicOp = document.getElementById('logic-op-container');
        if (pNum === "0") {
            c2Elems.classList.add('hidden'); logicOp.classList.add('hidden');
        } else {
            c2Elems.classList.remove('hidden'); logicOp.classList.remove('hidden');
        }
    }
    if (pNum !== "0") syncSpecialConditions(idx);
}

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
            posEl.checked = false; negEl.checked = false;
            posEl.disabled = true; negEl.disabled = true;
            posEl.parentElement.classList.add('chk-label-disabled');
            negEl.parentElement.classList.add('chk-label-disabled');
        } else {
            if (posEl.checked) {
                negEl.disabled = true; negEl.parentElement.classList.add('chk-label-disabled');
                posEl.disabled = false; posEl.parentElement.classList.remove('chk-label-disabled');
            } else if (negEl.checked) {
                posEl.disabled = true; posEl.parentElement.classList.add('chk-label-disabled');
                negEl.disabled = false; negEl.parentElement.classList.remove('chk-label-disabled');
            } else {
                posEl.disabled = false; negEl.disabled = false;
                posEl.parentElement.classList.remove('chk-label-disabled');
                negEl.parentElement.classList.remove('chk-label-disabled');
            }
        }
    });
}

function handleGuiRenToggle() {
    const el = document.getElementById('toggle-guiren');
    useYinYangGuiRen = el ? el.checked : false;
    const grLabel = document.getElementById('guiren-label');
    if (grLabel) grLabel.innerText = useYinYangGuiRen ? "陰陽貴人" : "天乙貴人";
    generatePan();
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

    useXianTian = document.getElementById('toggle-bagua').checked;
    useEnergy = document.getElementById('toggle-energy').checked;
    useNeiWai = document.getElementById('toggle-neiwai').checked;
    enablePalaceModal = true;
    useFeiXing = document.getElementById('toggle-feixing').checked;
    useCompass = document.getElementById('toggle-compass').checked;

    document.getElementById('bagua-label').innerText = useXianTian ? "後天八卦數" : "先天八卦數";

    const grLabel = document.getElementById('guiren-label');
    if (grLabel) grLabel.innerText = useYinYangGuiRen ? "陰陽貴人" : "天乙貴人";
    
    const fxSel = document.getElementById('sel-feixing-year');
    if (fxSel) {
        if (useFeiXing) {
            fxSel.classList.remove('hidden');
            if (!fxSel.value) fxSel.value = document.getElementById('sel-year').value;
        } else {
            fxSel.classList.add('hidden');
        }
    }

    if (useCompass) openCompassMode();
    else { closeCompassMode(); generatePan(); }
}

function getBranchHTML(i) {
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

    const currentMonthBranch = panData.monthBranch || "";

    for(let b of text) {
        let wColor = WUXING_COLORS[b];
        let conf = branchConfig[b];
        let tjText = (panData.branchToTianJiang && panData.branchToTianJiang[b]) ? panData.branchToTianJiang[b] : "";
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
            <!-- ✨ 新增：流派標示 -->
            <div class="text-[11px] sm:text-xs md:text-[13px] text-red-700 font-black tracking-widest mb-0.5">${bazi5.methodLabel}</div>
            
            <div class="flex justify-center items-center gap-x-1.5 sm:gap-x-2 font-black text-lg sm:text-xl md:text-2xl leading-none">
                <div class="flex flex-col items-center gap-y-0.5 leading-none">
                    <span style="color:${WUXING_COLORS[bazi5.hS] || '#1a202c'}">${bazi5.hS}</span>
                    <span style="color:${WUXING_COLORS[bazi5.hB] || '#1a202c'}">${bazi5.hB}</span>
                </div>
                <div class="flex flex-col items-center gap-y-0.5 leading-none">
                    <span style="color:${WUXING_COLORS[bazi5.dS] || '#1a202c'}">${bazi5.dS}</span>
                    <span style="color:${WUXING_COLORS[bazi5.dB] || '#1a202c'}">${bazi5.dB}</span>
                </div>
                <div class="flex flex-col items-center gap-y-0.5 leading-none">
                    <span style="color:${WUXING_COLORS[bazi5.mS] || '#1a202c'}">${bazi5.mS}</span>
                    <span style="color:${WUXING_COLORS[bazi5.mB] || '#1a202c'}">${bazi5.mB}</span>
                </div>
                <div class="flex flex-col items-center gap-y-0.5 leading-none">
                    <span style="color:${WUXING_COLORS[bazi5.yS] || '#1a202c'}">${bazi5.yS}</span>
                    <span style="color:${WUXING_COLORS[bazi5.yB] || '#1a202c'}">${bazi5.yB}</span>
                </div>
            </div>
            <div class="text-[9px] sm:text-[10px] text-gray-400 font-bold tracking-widest mt-0.5">時日月年</div>
            
            <!-- ✨ 修改：大幅縮小行距與字級，騰出上方空間 -->
            <div class="flex flex-col items-start w-full text-[10px] sm:text-[11px] md:text-xs text-gray-700 font-bold leading-tight space-y-0 mt-1 px-1">
                <div class="whitespace-nowrap flex items-center">旬首：<span class="text-gray-950 font-black ml-0.5">${bazi5.xun}</span></div>
                <div class="whitespace-nowrap flex items-center">值符：<span class="text-gray-950 font-black ml-0.5">${bazi5.zf}</span></div>
                <div class="whitespace-nowrap flex items-center">值使：<span class="text-gray-950 font-black ml-0.5">${bazi5.zs}</span></div>
            </div>
        </div>`;
    }
    
    let stemColor = WUXING_COLORS[s] || "#1a202c";
    let highlightClass = (s === panData.targetHighlightStem) ? "hour-stem" : (s === panData.dayHighlightStem ? "day-stem" : "");
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
    document.getElementById('btn-jieqi-year').innerText = document.getElementById('sel-year').value; 
}
function resetToNow() { currentDate = new Date(); updateSelectorsFromDate(currentDate); generatePan(); }
function shiftHour(dir) { currentDate.setHours(currentDate.getHours() + (dir * 2)); updateSelectorsFromDate(currentDate); generatePan(); }

function initSelectors() {
    const ySel = document.getElementById('sel-year');
    const mSel = document.getElementById('sel-month');
    const dSel = document.getElementById('sel-day');
    const hSel = document.getElementById('sel-hour24');
    const minSel = document.getElementById('sel-minute');
    const fxSel = document.getElementById('sel-feixing-year');
    const locSel = document.getElementById('sel-location');
    
    // 初始化地區選單
    if (locSel && typeof CITY_COORDINATES !== 'undefined') {
        for (let key in CITY_COORDINATES) {
            locSel.add(new Option(CITY_COORDINATES[key].name, key));
        }
        locSel.value = "none"; 
    }
    
    const compassFxSel = document.getElementById('sel-compass-feixing-year');
    
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
        document.getElementById('sel-year').value = urlParams.get('y');
        document.getElementById('sel-month').value = urlParams.get('m');
        document.getElementById('sel-day').value = urlParams.get('d');
        document.getElementById('sel-hour24').value = urlParams.get('h');
        document.getElementById('sel-minute').value = urlParams.get('min');
        
        // ✨ 新增：讀取分享連結中的流派設定
        if (urlParams.has('method')) {
            const methodSel = document.getElementById('sel-qimen-method');
            if (methodSel) methodSel.value = urlParams.get('method');
        }

        currentDate = new Date(urlParams.get('y'), urlParams.get('m') - 1, urlParams.get('d'), urlParams.get('h'), urlParams.get('min'));
        updateJieQiYearBtn();
        generatePan();
    } else {
        updateSelectorsFromDate(currentDate);
        generatePan();
    }
}

function initBaziSelectors() {
    const sortedJiaZi = [...JIA_ZI_ARRAY].sort((a, b) => {
        const stemA = STEMS.indexOf(a[0]);
        const stemB = STEMS.indexOf(b[0]);
        if (stemA !== stemB) return stemA - stemB;
        return JIA_ZI_ARRAY.indexOf(a) - JIA_ZI_ARRAY.indexOf(b);
    });

    ['sel-bazi-y', 'sel-bazi-m', 'sel-bazi-d', 'sel-bazi-h'].forEach(id => {
        let sel = document.getElementById(id);
        sortedJiaZi.forEach(gz => sel.add(new Option(gz, gz)));
    });
    
    try {
        const nowLunar = Solar.fromDate(new Date()).getLunar();
        const noonLunar = Solar.fromYmdHms(new Date().getFullYear(), new Date().getMonth()+1, new Date().getDate(), 12, 0, 0).getLunar();
        document.getElementById('sel-bazi-y').value = nowLunar.getYearInGanZhiExact();
        document.getElementById('sel-bazi-m').value = nowLunar.getMonthInGanZhiExact();
        document.getElementById('sel-bazi-d').value = noonLunar.getDayInGanZhiExact();
        
        let hIdx = Math.floor((new Date().getHours() + 1) % 24 / 2);
        let timeBranch = BRANCHES[hIdx];
        let dayStem = noonLunar.getDayInGanZhiExact().charAt(0);
        let dayStemIdx = STEMS.indexOf(dayStem);
        let hStemIdx = ((dayStemIdx % 5) * 2 + hIdx) % 10;
        document.getElementById('sel-bazi-h').value = STEMS[hStemIdx] + timeBranch;
    } catch(e) {}
}

function updateSelectorsFromDate(d) {
    if (!d || isNaN(d.getTime())) return;
    document.getElementById('sel-year').value = d.getFullYear();
    document.getElementById('sel-month').value = d.getMonth() + 1;
    document.getElementById('sel-day').value = d.getDate();
    document.getElementById('sel-hour24').value = d.getHours();
    document.getElementById('sel-minute').value = d.getMinutes();
    
    const fxSel = document.getElementById('sel-feixing-year');
    if (fxSel && !useFeiXing) fxSel.value = d.getFullYear();
    updateJieQiYearBtn();
}

window.onload = function() {
    initSelectors();
    initBaziSelectors();
    handleFilterPalaceChange(1);
    handleFilterPalaceChange(2);
};

// ====== ✨ 升級版：複製與分享功能 (包含流派) ======
function copyPan() {
    const ACTIVE_PALACES = (typeof useXianTian !== 'undefined' && useXianTian) ? PALACES_XIAN : PALACES_HOU;
    if (!panData) return;
    
    // 動態抓取目前盤面的流派標籤
    const methodTitle = (panData.bazi5Info && panData.bazi5Info.methodLabel) ? panData.bazi5Info.methodLabel : "【奇門遁甲】";
    
    const baziLine = panData.bazi + (panData.special ? " " + panData.special : "") + (panData.stemStatus ? " " + panData.stemStatus : "");
    let text = `${methodTitle} 排盤\n時間：${baziLine}\n局數：${panData.ju}\n旬首：${panData.xun}\n值符：${panData.zf} | 值使：${panData.zs}\n空亡：${panData.kw} | 驛馬：${currentYiMaPalace}\n----------------------\n`;
    
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
    const y = document.getElementById('sel-year').value;
    const m = document.getElementById('sel-month').value;
    const d = document.getElementById('sel-day').value;
    const h = document.getElementById('sel-hour24').value;
    const min = document.getElementById('sel-minute').value;
    
    // 抓取目前的流派
    const qimenMethod = document.getElementById('sel-qimen-method') ? document.getElementById('sel-qimen-method').value : 'chaibu';
    
    const url = new URL(window.location.href);
    url.searchParams.set('y', y); url.searchParams.set('m', m);
    url.searchParams.set('d', d); url.searchParams.set('h', h); url.searchParams.set('min', min);
    url.searchParams.set('method', qimenMethod); // 寫入流派參數
    
    navigator.clipboard.writeText(url.toString()).then(() => showToast("🔗 分享連結已複製！")).catch(() => {
        let t = document.createElement("textarea"); 
        t.value = url.toString(); document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); showToast("🔗 分享連結已複製！");
    });
}

// ==========================================
// AI 大師解盤模組 (Cloudflare Workers AI 直連)
// ==========================================
const CLOUDFLARE_WORKER_URL = "/api/qmai"; // 
function openAiModal() {
    if (!panData || !panData.ju) {
        showToast("⚠️ 請先起盤後再進行 AI 分析！");
        return;
    }
    if (activeCase && activeCase.notes) {
        document.getElementById('ai-user-context').value = activeCase.notes;
    }
    document.getElementById('ai-modal').classList.remove('hidden');
}

function closeAiModal() {
    document.getElementById('ai-modal').classList.add('hidden');
}


async function requestAiInterpretation() {
    const btn = document.getElementById('btn-call-ai');
    const resultBox = document.getElementById('ai-result-container');
    const resultContent = document.getElementById('ai-result-content');
    const category = document.getElementById('ai-question-category').value;
    const userContext = document.getElementById('ai-user-context').value.trim();
    const passcode = document.getElementById('ai-user-passcode').value.trim();

    const ACTIVE_PALACES = (typeof useXianTian !== 'undefined' && useXianTian) ? PALACES_XIAN : PALACES_HOU;
    
    // 九宮固定五行字典
    const PALACE_WUXING_MAP = {
        "坎一": "水", "坤二": "土", "震三": "木", "巽四": "木",
        "中五": "土", "乾六": "金", "兌七": "金", "艮八": "土", "離九": "火"
    };

    // 1. 自動從盤面精確定位四柱天干
    let dStem = (panData.bazi5Info && panData.bazi5Info.dS) ? panData.bazi5Info.dS : "";
    let hStem = (panData.bazi5Info && panData.bazi5Info.hS) ? panData.bazi5Info.hS : "";
    
    // 備援抓取：若 bazi5Info 不存在，從 bazi 字串擷取
    if (!dStem || !hStem) {
        const baziParts = panData.bazi.split(' ');
        if (baziParts.length >= 4) {
            dStem = baziParts[2].charAt(0);
            hStem = baziParts[3].charAt(0);
        }
    }

    // 2. 遍歷九宮，由程式精確鎖定「天盤日干」與「天盤時干」落宮
    let dayPalaceFound = "未定位";
    let hourPalaceFound = "未定位";
    let palaceDetails = [];

    for (let i = 1; i <= 9; i++) {
        if (i !== 5) {
            let pName = ACTIVE_PALACES[i].name;
            let pContent = panData.palaces[pName] || '';
            let wx = PALACE_WUXING_MAP[pName] || "";
            palaceDetails.push(`• ${pName}（五行屬${wx}）：${pContent}`);

            // 精確比對天盤干標籤 (天)
            const isDayOnTian = new RegExp(`${dStem}(\\([^\\)]*\\))?\\(天\\)`).test(pContent);
            const isHourOnTian = new RegExp(`${hStem}(\\([^\\)]*\\))?\\(天\\)`).test(pContent);

            if (isDayOnTian) {
                dayPalaceFound = `${pName}（五行：${wx}）`;
            }
            if (isHourOnTian) {
                hourPalaceFound = `${pName}（五行：${wx}）`;
            }
        }
    }

    // 3. 組裝高約束力的結構化 Prompt
    const promptText = `
【起局基本盤面】
流派基準：${panData.bazi5Info ? panData.bazi5Info.methodLabel : "時家拆補法"}
四柱時間：${panData.bazi}
局數：${panData.ju} ｜ 旬首：${panData.xun}
值符星：${panData.zf} ｜ 值使門：${panData.zs}
空亡：${panData.kw}（落宮：乾六宮） ｜ 驛馬落宮：${currentYiMaPalace}
特殊象意：${panData.special || '無'} ${panData.stemStatus || ''}

【★ 核心用神精準定位（已由演算法驗證，必須以此為準，嚴禁篡改）】
• 求測人（日柱天盤干【${dStem}】）：真實落在【${dayPalaceFound}】
  （※ 警告：奇門斷事一律以天盤為用神，嚴禁誤取地盤干，更切勿把坤二地盤己當作落宮！）
• 事體/所問之事（時柱天盤干【${hStem}】）：真實落在【${hourPalaceFound}】
  （※ 警告：時柱干為【${hStem}】，切勿誤用年柱【${panData.bazi5Info ? panData.bazi5Info.yS : ''}】！）
• 九宮固有五行常識：坎一屬水、坤二屬土、震三屬木、巽四屬木、乾六屬金、兌七屬金、艮八屬土、離九屬火。

【九宮各宮詳細落宮數據】
${palaceDetails.join('\n')}

【求測事宜】
問題類別：${category}
補充背景：${userContext || "無補充，請針對該類別作全盤標準推演"}

【請依以下層次嚴格推導斷事】
1. 【用神定位確認】：根據上述精準定位，確認日干【${dStem}】落在何宮、時干【${hStem}】落在何宮，以及各自主客用神的五行屬性。
2. 【生剋與四害分析】：
   - 分析日干落宮與時干落宮的五行主客生剋（以天盤落宮五行為主）。
   - 檢視用神宮位是否有空亡（只有乾六宮逢空，其他宮絕無空亡）、門迫、擊刑、入墓或吉凶格局。
3. 【結論與行動建議】：
   - 給出清晰吉凶定性（吉 / 凶 / 平 / 待時）。
   - 結合問事項目（${category}），給出接地氣、具可行性的具體實戰建議。
`;

    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin h-4 w-4 text-white mr-1 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 宗師推演中，請稍候...`;

    resultBox.classList.add('hidden');
    resultContent.innerText = '';

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
            resultBox.classList.remove('hidden');
            if (typeof marked !== 'undefined') {
let cleanResult = data.result
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')            // 將 3 個以上連續換行壓成標準雙換行
    .replace(/^\s*[\*\-_]{3,}\s*$/gm, '')   // 移除滿屏的 ********************
    .trim();

if (typeof marked !== 'undefined') {
    resultContent.innerHTML = marked.parse(cleanResult);
} else {
    resultContent.innerText = cleanResult;
}
            } else {
                resultContent.innerText = data.result;
            }
        }
    } catch (err) {
        alert("網路請求異常，請檢查 Worker 網址或連線狀態：" + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>⚡ 開始 AI 深度分析</span>`;
    }
}

function copyAiResult() {
    const text = document.getElementById('ai-result-content').innerText;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => showToast("📋 AI 斷語報告已複製！"));
}

async function saveAiResultToCase() {
    const rawText = document.getElementById('ai-result-content').innerText;
    if (!rawText || rawText.trim() === "") {
        showToast("⚠️ 暫無可儲存的分析內容");
        return;
    }

    const category = document.getElementById('ai-question-category').value.split('（')[0].trim();
    const userContext = document.getElementById('ai-user-context').value.trim();
    
    // 整理乾淨的案例筆記內容
    const formattedNotes = `【AI 宗師推演報告 · ${category}】\n` + 
                           (userContext ? `問事背景：${userContext}\n\n` : "") + 
                           rawText.trim();

    const clientName = userContext ? `${userContext.slice(0, 15)} (${category})` : `${category} AI解盤`;

    // 1. 關閉 AI 彈窗
    closeAiModal();

    // 2. ✨ 直接呼叫 storage.js 將完整 notes 寫入 IndexedDB！
    if (typeof saveCurrentCase === 'function') {
        await saveCurrentCase(true, {
            clientName: clientName,
            notes: formattedNotes,
            status: "等待反饋"
        });
    }

    // 3. 自動滑出右側案例庫，直接看到帶有斷語的卡片
    if (typeof openRightPanelTab === 'function') {
        openRightPanelTab('cases');
    }
    if (typeof renderCaseList === 'function') {
        renderCaseList();
    }

    showToast("✅ AI 斷語已直接存入案例庫！");
}
