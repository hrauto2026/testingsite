// js/app.js
// 奇門遁甲：主介面控制、起盤渲染、九宮詳情與彈窗互動控制器

function showManualModal() {
    const el = document.getElementById('manual-modal');
    if (el) el.classList.remove('hidden');
}

function closeManualModal() {
    const el = document.getElementById('manual-modal');
    if (el) el.classList.add('hidden');
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

let globalPalaceData = {};
let useNeiWai = false;
let enablePalaceModal = true;
let isBaziMode = false; 
let isFilterPanelOpen = false;

// 輔助開關變數
let useXianTian = false;
let useEnergy = false;
let useFeiXing = false;
let useCompass = false;
let isCompassRunning = false;
let isCompassLocked = false;

function handleToggleSwitch(activeId) {
    const allToggles = [
        'toggle-bagua', 
        'toggle-energy', 
        'toggle-neiwai', 
        'toggle-palacemodal', 
        'toggle-feixing',
        'toggle-compass'
    ];
    
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
    enablePalaceModal = document.getElementById('toggle-palacemodal').checked;
    useFeiXing = document.getElementById('toggle-feixing').checked;
    useCompass = document.getElementById('toggle-compass').checked;

    const fxSel = document.getElementById('sel-feixing-year');
    if (fxSel) {
        if (useFeiXing) {
            fxSel.classList.remove('hidden');
            if (!fxSel.value) {
                fxSel.value = document.getElementById('sel-year').value;
            }
        } else {
            fxSel.classList.add('hidden');
        }
    }

    document.getElementById('bagua-label').innerText = useXianTian ? "後天八卦數" : "先天八卦數";

    if (useCompass) {
        openCompassMode();
    } else {
        closeCompassMode();
        generatePan();
    }
}

const getBranchHTML = (i) => {
    let text = BRANCH_POSITIONS_TEMPLATE[i];
    let html = "";
    if (!text) return "";
    
    const branchConfig = {
        '子': { class: 'pos-bottom', vertical: false },
        '丑': { class: 'pos-bottom', vertical: false },
        '寅': { class: 'pos-left', vertical: true },
        '卯': { class: 'pos-left', vertical: true },
        '辰': { class: 'pos-left', vertical: true },
        '巳': { class: 'pos-top', vertical: false },
        '午': { class: 'pos-top', vertical: false },
        '未': { class: 'pos-top', vertical: false },
        '申': { class: 'pos-right', vertical: true },
        '酉': { class: 'pos-right', vertical: true },
        '戌': { class: 'pos-right', vertical: true },
        '亥': { class: 'pos-bottom', vertical: false }
    };

    const currentMonthBranch = panData.monthBranch || "";

    for(let b of text) {
        let wColor = WUXING_COLORS[b];
        let conf = branchConfig[b];
        let tjText = (panData.branchToTianJiang && panData.branchToTianJiang[b]) ? panData.branchToTianJiang[b] : "";
        
        let tjHtml = tjText ? `<span class="tian-jiang">${tjText}</span>` : "";
        let baseClasses = `branch-label ${conf.class}`;
        if (conf.vertical) baseClasses += ` vertical-label`;
        
        let hlClasses = "";
        if (b === currentMonthBranch) {
            hlClasses = " bg-yellow-200 px-1.5 py-0.5 rounded shadow-sm border border-yellow-400 z-30";
        }
        
        html += `<div class="${baseClasses}${hlClasses}" data-branch="${b}" style="color: ${wColor};">
                    <span>${b}</span>
                    ${tjHtml}
                 </div>`;
    }
    return html;
};

function closePalaceModal() {
    document.getElementById('palace-modal').classList.add('hidden');
}

function renderRelationBox(activeStems, activeBranchList) {
    let totalMatches = 0;
    let html = '<div class="grid grid-cols-2 gap-x-4 gap-y-3.5">';

    for (let key in RELATION_RULES) {
        const grp = RELATION_RULES[key];
        const isStem = (grp.type === 'stem');
        
        html += `<div>
            <div class="font-black text-blue-900 mb-1 border-b border-blue-100 pb-0.5 text-xs sm:text-sm md:text-base">${grp.title}</div>
            <div class="space-y-1 sm:space-y-1.5">`;

        grp.items.forEach(item => {
            let matchedDisplay = [];
            if (isStem) {
                const matchedChars = item.chars.filter(c => activeStems.has(c));
                if (matchedChars.length >= grp.min) {
                    matchedDisplay = matchedChars;
                }
            } else {
                let tempBranches = [...activeBranchList];
                let matchedItems = [];
                for (let reqChar of item.chars) {
                    let idx = tempBranches.findIndex(b => b.char === reqChar);
                    if (idx !== -1) {
                        matchedItems.push(tempBranches[idx]);
                        tempBranches.splice(idx, 1);
                    }
                }

                if (item.isZiXing) {
                    const hasPhysicalBranch = matchedItems.some(b => b.source === 'palace' || b.source === 'door');
                    if (!hasPhysicalBranch) {
                        matchedItems = [];
                    }
                }

                if (matchedItems.length >= grp.min) {
                    matchedDisplay = matchedItems.map(b => b.display);
                }
            }

            if (matchedDisplay.length > 0) {
                totalMatches++;
                html += `<div class="bg-amber-100 text-amber-950 font-bold px-2 py-1 rounded border border-amber-300 shadow-sm flex items-center justify-between text-xs sm:text-sm md:text-sm leading-tight">
                    <span>➡️ ${item.label}</span>
                    <span class="text-[11px] sm:text-xs md:text-xs text-amber-900 bg-amber-200/90 px-1.5 py-0.5 rounded font-black">${matchedDisplay.join('·')}</span>
                </div>`;
            } else {
                html += `<div class="text-gray-600 px-1 py-0.5 text-xs sm:text-sm md:text-sm">${item.label}</div>`;
            }
        });

        html += `</div></div>`;
    }
    html += '</div>';
    return { html, totalMatches };
}

function showPalaceDetails(pNum) {
    const data = globalPalaceData[pNum];
    if (!data || data.isCenter) return;

    document.getElementById('pm-title').innerText = data.name + " 詳細資訊";
    document.getElementById('pm-branch').innerHTML = data.branch ? colorizeGanZhi(data.branch) : "-";

    let doorText = data.door || "";
    if (doorText === '傷門') doorText += '(卯)';
    if (doorText === '景門') doorText += '(午)';
    if (doorText === '驚門') doorText += '(酉)';
    if (doorText === '休門') doorText += '(子)';

    document.getElementById('pm-god').innerHTML = data.god ? `<span class="text-${GOD_COLORS[data.god] || 'black'}">${data.god}</span>` : "-";
    document.getElementById('pm-star').innerHTML = data.star ? `<span class="text-${STAR_COLORS[data.star.split('/')[0]] || 'black'}">${data.star}</span>` : "-";
    document.getElementById('pm-door').innerHTML = doorText ? `<span class="text-${DOOR_COLORS[data.door] || 'black'}">${doorText}</span>` : "-";
    document.getElementById('pm-angan').innerHTML = colorizeGanZhi(data.anGan || "-");
    document.getElementById('pm-hstem').innerHTML = data.hStems ? [...data.hStems].map(s => colorizeGanZhi(s)).join(' | ') : "-"; 
    document.getElementById('pm-estem').innerHTML = data.eStems ? [...data.eStems].map(s => colorizeGanZhi(s)).join(' | ') : "-"; 

    const DUN_GAN_MAP = { '戊': '子', '己': '戌', '庚': '申', '辛': '午', '壬': '辰', '癸': '寅' };
    let hHidden = data.hStems ? data.hStems.map(s => DUN_GAN_MAP[s] ? `${s}遁${DUN_GAN_MAP[s]}` : '').filter(Boolean).join(' | ') : '';
    let eHidden = data.eStems ? data.eStems.map(s => DUN_GAN_MAP[s] ? `${s}遁${DUN_GAN_MAP[s]}` : '').filter(Boolean).join(' | ') : '';
    
    document.getElementById('pm-hstem-hidden').innerText = hHidden ? `(${hHidden})` : '';
    document.getElementById('pm-estem-hidden').innerText = eHidden ? `(${eHidden})` : '';

    let activeStems = new Set();
    let activeBranchList = [];

    if (data.hStems) data.hStems.forEach(s => activeStems.add(s));
    if (data.eStems) data.eStems.forEach(s => activeStems.add(s));

    let palaceBranches = [];
    if (data.branch) {
        palaceBranches = data.branch.split('/').filter(Boolean);
        palaceBranches.forEach(b => {
            activeBranchList.push({ char: b, display: b, source: 'palace' });
        });
    }

    const DOOR_BRANCH_MAP = {
        '休門': { branch: '子', label: '休' },
        '傷門': { branch: '卯', label: '傷' },
        '景門': { branch: '午', label: '景' },
        '驚門': { branch: '酉', label: '驚' }
    };

    if (data.door && DOOR_BRANCH_MAP[data.door]) {
        const dInfo = DOOR_BRANCH_MAP[data.door];
        if (!palaceBranches.includes(dInfo.branch)) {
            activeBranchList.push({ char: dInfo.branch, display: `${dInfo.branch}（${dInfo.label}）`, source: 'door' });
        }
    }

    if (data.hStems) {
        data.hStems.forEach(s => {
            if (DUN_GAN_MAP[s]) {
                let b = DUN_GAN_MAP[s];
                activeBranchList.push({ char: b, display: `${b}（天${s}）`, source: 'hStem' });
            }
        });
    }

    if (data.eStems) {
        data.eStems.forEach(s => {
            if (DUN_GAN_MAP[s]) {
                let b = DUN_GAN_MAP[s];
                activeBranchList.push({ char: b, display: `${b}（地${s}）`, source: 'eStem' });
            }
        });
    }

    const { html: relationHtml, totalMatches } = renderRelationBox(activeStems, activeBranchList);
    document.getElementById('pm-cheatsheet-content').innerHTML = relationHtml;
    const badgeEl = document.getElementById('pm-cheatsheet-badge');
    const detailsEl = document.getElementById('pm-cheatsheet-details');
    if (badgeEl && detailsEl) {
        if (totalMatches > 0) {
            badgeEl.innerHTML = `<span class="bg-amber-100 text-amber-800 border border-amber-300 font-bold px-1.5 py-0.2 rounded-full text-[11px]">${totalMatches} 組相合/沖/方/刑/害</span>`;
            detailsEl.open = true;
        } else {
            badgeEl.innerHTML = '';
            detailsEl.open = false;
        }
    }

    let harmsHTML = "";
    const tagStyle = "px-2 py-0.5 rounded text-xs font-bold text-white shadow-sm";
    if (data.isKong) harmsHTML += `<span class="bg-gray-500 ${tagStyle}">空亡</span>`;
    if (data.isMa) harmsHTML += `<span class="bg-blue-500 ${tagStyle}">驛馬</span>`;
    if (data.isMenPo) harmsHTML += `<span class="bg-red-500 ${tagStyle}">門迫</span>`;
    
    if (data.hStemJiXing && data.hStemJiXing.length) harmsHTML += `<span class="bg-orange-600 ${tagStyle}">天盤擊刑(${data.hStemJiXing.join('')})</span>`;
    if (data.eStemJiXing && data.eStemJiXing.length) harmsHTML += `<span class="bg-orange-800 ${tagStyle}">地盤擊刑(${data.eStemJiXing.join('')})</span>`;
    if (data.hStemRuMu && data.hStemRuMu.length) harmsHTML += `<span class="bg-purple-600 ${tagStyle}">天盤入墓(${data.hStemRuMu.join('')})</span>`;
    if (data.eStemRuMu && data.eStemRuMu.length) harmsHTML += `<span class="bg-purple-800 ${tagStyle}">地盤入墓(${data.eStemRuMu.join('')})</span>`;

    document.getElementById('pm-harms').innerHTML = harmsHTML || '<span class="text-gray-400">無特殊狀態</span>';

    let gejuHTML = "";
    let gejus = calculateGeju(data);
    if (gejus.length === 0) {
        gejuHTML = '<span class="text-gray-400">此宮目前無特殊格局。</span>';
    } else {
        gejus.forEach(g => {
            let badgeColor = 'bg-gray-100 text-gray-800 border-gray-200'; 
            if (g.type.includes('吉')) badgeColor = 'bg-green-100 text-green-800 border-green-200';
            else if (g.type.includes('凶')) badgeColor = 'bg-red-100 text-red-800 border-red-200';
            
            gejuHTML += `
                <div class="p-3 bg-gray-50 border border-gray-100 rounded-lg flex flex-col">
                    <div class="flex items-center gap-2 mb-1.5">
                        <span class="font-bold text-gray-800 text-base">${g.name}</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded border ${badgeColor} font-bold">${g.type}</span>
                    </div>
                    <span class="text-gray-600 text-sm leading-relaxed">${g.desc}</span>
                </div>`;
        });
    }
    
    document.getElementById('pm-geju').innerHTML = gejuHTML;
    document.getElementById('palace-modal').classList.remove('hidden');
}

let currentDate = new Date();
let panData = {}; 
let currentYiMaPalace = "";

function renderPalace5Html(s, anGan, centerLabel, bazi5) {
    let baziContent = "";
    if (bazi5) {
        baziContent = `
<div class="flex flex-col items-center justify-center w-full select-none z-10 my-auto">
<div class="flex justify-center items-center gap-x-1.5 sm:gap-x-2 font-black text-lg sm:text-xl md:text-2xl leading-none mt-1">
    <div class="flex flex-col items-center gap-y-0.5 leading-none">
        <span style="color:${WUXING_COLORS[bazi5.yS] || '#1a202c'}">${bazi5.yS}</span>
        <span style="color:${WUXING_COLORS[bazi5.yB] || '#1a202c'}">${bazi5.yB}</span>
    </div>
    <div class="flex flex-col items-center gap-y-0.5 leading-none">
        <span style="color:${WUXING_COLORS[bazi5.mS] || '#1a202c'}">${bazi5.mS}</span>
        <span style="color:${WUXING_COLORS[bazi5.mB] || '#1a202c'}">${bazi5.mB}</span>
    </div>
    <div class="flex flex-col items-center gap-y-0.5 leading-none">
        <span style="color:${WUXING_COLORS[bazi5.dS] || '#1a202c'}">${bazi5.dS}</span>
        <span style="color:${WUXING_COLORS[bazi5.dB] || '#1a202c'}">${bazi5.dB}</span>
    </div>
    <div class="flex flex-col items-center gap-y-0.5 leading-none">
        <span style="color:${WUXING_COLORS[bazi5.hS] || '#1a202c'}">${bazi5.hS}</span>
        <span style="color:${WUXING_COLORS[bazi5.hB] || '#1a202c'}">${bazi5.hB}</span>
    </div>
</div>
<div class="text-[10px] sm:text-xs text-gray-400 font-bold tracking-widest mt-1">年月日時</div>
<div class="flex flex-col items-start w-full text-xs sm:text-sm md:text-base text-gray-700 font-bold leading-normal space-y-1.5 mt-2 sm:mt-3 px-1">
    <div class="whitespace-nowrap flex items-center">旬首：<span class="text-gray-950 font-black ml-0.5">${bazi5.xun}</span></div>
    <div class="whitespace-nowrap flex items-center">值符：<span class="text-gray-950 font-black ml-0.5">${bazi5.zf}</span></div>
    <div class="whitespace-nowrap flex items-center">值使：<span class="text-gray-950 font-black ml-0.5">${bazi5.zs}</span></div>
</div>
</div>`;
    }
    
    let stemColor = WUXING_COLORS[s] || "#1a202c";
    const dayHighlightStem = panData.dayHighlightStem;
    const targetHighlightStem = panData.targetHighlightStem;
    let highlightClass = (s === targetHighlightStem) ? "hour-stem" : (s === dayHighlightStem ? "day-stem" : "");
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

function toggleInputMode() {
    isBaziMode = !isBaziMode;
    const btn = document.getElementById('btn-mode-toggle');
    const dateSels = document.getElementById('date-selectors');
    const baziSels = document.getElementById('bazi-selectors');
    const nowBtn = document.getElementById('btn-now');
    const jqBtn = document.getElementById('btn-show-jieqi');

    if (isBaziMode) {
        btn.innerText = "時間方式";
        btn.classList.replace('bg-indigo-100', 'bg-amber-100');
        btn.classList.replace('text-indigo-800', 'text-amber-900');
        btn.classList.replace('hover:bg-indigo-200', 'hover:bg-amber-200');
        btn.classList.replace('border-indigo-200', 'border-amber-300');
        dateSels.classList.add('hidden');
        baziSels.classList.remove('hidden');
        baziSels.classList.add('flex');
        nowBtn.classList.add('hidden');
        jqBtn.classList.add('hidden');
    } else {
        btn.innerText = "四柱方式";
        btn.classList.replace('bg-amber-100', 'bg-indigo-100');
        btn.classList.replace('text-amber-900', 'text-indigo-800');
        btn.classList.replace('hover:bg-amber-200', 'hover:bg-indigo-200');
        btn.classList.replace('border-amber-300', 'border-indigo-200');
        baziSels.classList.add('hidden');
        baziSels.classList.remove('flex');
        dateSels.classList.remove('hidden');
        nowBtn.classList.remove('hidden');
        jqBtn.classList.remove('hidden');
    }
}

function initSelectors() {
    const ySel = document.getElementById('sel-year');
    const mSel = document.getElementById('sel-month');
    const dSel = document.getElementById('sel-day');
    const hSel = document.getElementById('sel-hour24');
    const minSel = document.getElementById('sel-minute');
    const fxSel = document.getElementById('sel-feixing-year');
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
        sortedJiaZi.forEach(gz => {
            sel.add(new Option(gz, gz));
        });
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
    document.getElementById('sel-year').value = d.getFullYear();
    document.getElementById('sel-month').value = d.getMonth() + 1;
    document.getElementById('sel-day').value = d.getDate();
    document.getElementById('sel-hour24').value = d.getHours();
    document.getElementById('sel-minute').value = d.getMinutes();
    
    const fxSel = document.getElementById('sel-feixing-year');
    if (fxSel && !useFeiXing) {
        fxSel.value = d.getFullYear();
    }
    updateJieQiYearBtn();
}

function updateJieQiYearBtn() { document.getElementById('btn-jieqi-year').innerText = document.getElementById('sel-year').value; }
function resetToNow() { currentDate = new Date(); updateSelectorsFromDate(currentDate); generatePan(); }
function shiftHour(dir) { currentDate.setHours(currentDate.getHours() + (dir * 2)); updateSelectorsFromDate(currentDate); generatePan(); }

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

function handleGenerateBtn() {
    if (isBaziMode) {
        executeBaziSearch();
    } else {
        generatePan();
    }
}

function showJieQiModal() {
    const y = parseInt(document.getElementById('sel-year').value);
    document.getElementById('jieqi-modal-title').innerText = `${y}年 廿四節氣`;
    let termsList = [];
    for(let m = 1; m <= 12; m++) {
        let d = Solar.fromYmd(y, m, 15).getLunar();
        let table = d.getJieQiTable(); 
        for(let key of Object.keys(table)) {
            let s = table[key];
            if(s.getYear() === y && s.getMonth() === m) termsList.push({ name: TRAD_JIEQI[key] || key, time: s.toYmdHms() });
        }
    }
    termsList.sort((a,b) => a.time.localeCompare(b.time));
    let html = '';
    termsList.forEach(t => { html += `<div class="p-2 border border-gray-100 rounded bg-gray-50 flex justify-between"><span class="text-teal-800">${t.name}</span><span class="text-gray-500 text-xs">${t.time.substring(5,16)}</span></div>`; });
    document.getElementById('jieqi-modal-content').innerHTML = html;
    document.getElementById('jieqi-modal').classList.remove('hidden');
}
function closeJieQiModal() { document.getElementById('jieqi-modal').classList.add('hidden'); }

function colorizeGanZhi(str) {
    return str.split('').map(char => WUXING_COLORS[char] ? `<span style="color: ${WUXING_COLORS[char]}; text-shadow: 0 0 1px rgba(0,0,0,0.1);">${char}</span>` : char).join('');
}

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
        currentDate = new Date(y, m - 1, d, h, min); 
        
        const exactLunar = Solar.fromYmdHms(y, m, d, h, min, 0).getLunar();
        const noonLunar = Solar.fromYmdHms(y, m, d, 12, 0, 0).getLunar();
        
        const yearGZ = exactLunar.getYearInGanZhiExact();
        const monthGZ = exactLunar.getMonthInGanZhiExact();
        const dayGZ = noonLunar.getDayInGanZhiExact(); 
        const dayStem = dayGZ.substring(0, 1);

        const hIdx = Math.floor((h + 1) % 24 / 2);
        const timeBranch = BRANCHES[hIdx];
        
        let wushuDate = new Date(currentDate);
        if (h >= 23) {
            wushuDate.setDate(wushuDate.getDate() + 1);
        }
        const wushuLunar = Solar.fromYmdHms(wushuDate.getFullYear(), wushuDate.getMonth() + 1, wushuDate.getDate(), 12, 0, 0).getLunar();
        const wushuDayStem = wushuLunar.getDayInGanZhi().substring(0, 1);
        const wushuDayStemIdx = STEMS.indexOf(wushuDayStem);
        
        const timeStemIdx = ((wushuDayStemIdx % 5) * 2 + hIdx) % 10;
        const timeGZ = STEMS[timeStemIdx] + timeBranch;
        const timeGZ_string = STEMS[timeStemIdx] + timeBranch;
        const timeStem = timeGZ.substring(0, 1);
        const timeBranchIdx = BRANCHES.indexOf(timeBranch);

        let ziMark = (h >= 23) ? "晚子" : (h === 0 ? "早子" : "");

        let prevQi = exactLunar.getPrevQi(true);
        let zqName = prevQi.getName();
        let yueJiangBranchCalculated = ZQ_MAP[zqName] || "亥";
        
        let timeBranchIdxForDayNight = BRANCHES.indexOf(timeBranch);
        let isDay = (timeBranchIdxForDayNight >= 3 && timeBranchIdxForDayNight <= 8);
        let guiRenBaseBranch = GUI_REN_MAP[dayStem][isDay ? 'day' : 'night'];
        
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
        const juConfig = JU_TABLE[jieQi] || {陽: true, 上元: 1, 中元: 1, 下元: 1}, isYang = juConfig["陽"], juNum = juConfig[yuan], juStr = (isYang ? "陽遁" : "陰遁") + juNum + "局 (" + yuan + ")";
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

        const yStemEff = getEffStem(yearGZ);
        const mStemEff = getEffStem(monthGZ);
        const dStemEff = getEffStem(dayGZ);
        const hStemEff = getEffStem(timeGZ_string);

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
        if (((dStemTX === '甲' || dStemTX === '己') && (timeGZ === '己巳')) || ((dStemTX === '乙' || dStemTX === '庚') && timeGZ === '甲申') || ((dStemTX === '丙' || dStemTX === '辛') && timeGZ === '甲午') || ((dStemTX === '丁' || dStemTX === '壬') && timeGZ === '甲辰') || ((dStemTX === '戊' || dStemTX === '癸') && timeGZ === '甲寅')) isTianXian = true;
        
        let rawSpecialInfo = "";
        if (isTianXian) { specialStr += "<span class='text-green-600 font-bold ml-2'>【✅天顯時格】</span>"; rawSpecialInfo += "【✅天顯時格】"; }
        if (isWuBuYu) { specialStr += "<span class='text-red-600 font-bold ml-2'>【❌五不遇時】</span>"; rawSpecialInfo += "【❌五不遇時】"; }
        
        const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekStr = weekDays[currentDate.getDay()];
        const lunarStr = `農曆${exactLunar.getMonthInChinese()}月${exactLunar.getDayInChinese()}`;
        let displayZiMark = ziMark ? `<span class="text-orange-600 font-bold ml-1">【${ziMark}】</span>` : "";
        
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
            document.getElementById('quick-bar-time').innerHTML = `${y}年${m}月${d}日(${weekStr}) ${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}${displayZiMark}`;
        }

        document.getElementById('info-bazi').innerHTML = `${y}年${m}月${d}日(${weekStr}) ${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')} ｜ <span class="text-teal-800 font-bold">${lunarStr}</span> ｜ ${coloredBaziStr}${displayZiMark}${specialStr}`;
        
        let targetWarn = jqData.isCurrentTransition ? "⚠️" : "";
        let nextWarn = jqData.isNextTransition ? "⚠️" : "";
        document.getElementById('info-jieqi').innerHTML = `${jieQi} <span class="text-[10px] text-gray-500 font-normal">(交節：${jqData.time}${targetWarn})</span>`;
        document.getElementById('info-next-jieqi').innerHTML = `${jqData.nextName} <span class="text-[10px] text-gray-500 font-normal">(交節：${jqData.nextTime}${nextWarn})</span>`;
        
        if (jqData.isTransitionInHour) {
            const warnModal = document.getElementById('jieqi-warn-modal');
            if (warnModal) warnModal.classList.remove('hidden');
        }

        document.getElementById('info-ju').innerText = juStr;
        document.getElementById('info-xunshou').innerText = xunShouGZ + xunShouStem;
        document.getElementById('info-zhifu').innerText = zhiFuStar;
        document.getElementById('info-zhishi').innerText = doorPan[currentD_val];
        document.getElementById('info-kongwang').innerText = kw1 + "、" + kw2;

        let isMenFuyin = (doorOffset === 0);
        let isStarFuyin = (offset === 0);
        let isGanFuyin = (offset === 0);

        let isMenFanyin = (doorOffset === 4);
        let isStarFanyin = (offset === 4);
        let isGanFanyin = (offset === 4);

        let fuyinHTML = "";
        let rawFuyin = "";
        let rawFanyin = "";
        
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
        let isZuo = false;
        let isChong = false;
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

        const getStemTagsText = (stem, pNum) => {
            let tags = [];
            if(isJiXing(stem, pNum)) tags.push("刑");
            if(isRuMu(stem, pNum)) tags.push("墓");
            return tags.length ? tags.join("+") : "";
        };

        let copyBaziLine = `${baziRawStr} (${y}年${m}月${d}日 ${weekStr} ${h.toString().padStart(2,'0')}:${min.toString().padStart(2,'0')}${ziMark ? ' ' + ziMark : ''})`;
        
        const fxSelVal = document.getElementById('sel-feixing-year')?.value;
        let flightYear = (useFeiXing && fxSelVal) ? parseInt(fxSelVal) : y;
        if (flightYear === y) {
            const midYearGZ = Solar.fromYmd(y, 6, 1).getLunar().getYearInGanZhiExact();
            if (yearGZ !== midYearGZ) {
                flightYear = (m < 6) ? y - 1 : y + 1;
            }
        }
        let starC = (11 - (flightYear % 9)) % 9;
        if (starC <= 0) starC += 9;
        const FLIGHT_OFFSET = { 5: 0, 6: 1, 7: 2, 8: 3, 9: 4, 1: 5, 2: 6, 3: 7, 4: 8 };
        const FEIXING_ZH_WX = ["", "一水", "二土", "三木", "四木", "五土", "六金", "七金", "八土", "九火"];

        panData = { 
            bazi: copyBaziLine, 
            ju: juStr, 
            xun: xunShouGZ+xunShouStem, 
            zf: zhiFuStar, 
            zs: doorPan[currentD_val], 
            kw: kw1+"、"+kw2, 
            special: rawSpecialInfo, 
            stemStatus: combinedRawStatus, 
            monthBranch: monthBranch,
            branchToTianJiang: branchToTianJiang,
            dayHighlightStem: dayHighlightStem,
            targetHighlightStem: targetHighlightStem,
            starC: starC,
            palaces: {} 
        };

        panData.bazi5Info = {
            yS: yearGZ.substring(0, 1), yB: yearGZ.substring(1, 2),
            mS: monthGZ.substring(0, 1), mB: monthGZ.substring(1, 2),
            dS: dayGZ.substring(0, 1), dB: dayGZ.substring(1, 2),
            hS: timeGZ_string.substring(0, 1), hB: timeGZ_string.substring(1, 2),
            xun: xunShouGZ + xunShouStem,
            zf: zhiFuStar,
            zs: doorPan[currentD_val],
            kw: kw1 + "、" + kw2
        };

        const renderStem = (s, pNum, isAnGan = false) => {
            let tagStr = "";
            if (!isAnGan) {
                let tags = []; 
                if(isJiXing(s, pNum)) tags.push("刑"); 
                if(isRuMu(s, pNum)) tags.push("墓");
                if (tags.length) {
                    tagStr = `<span class="text-[10px] text-red-600 ml-0.5 font-bold">${tags.join("+")}</span>`;
                }
            }
            
            let displayChar = s;
            if (useEnergy && pNum !== 5) {
                displayChar = resolveStemEnergy(s, pNum, timeBranch);
            }

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
                if (isYang) {
                    if ([1, 8, 3, 4].includes(i)) isInner = true;
                } else {
                    if ([9, 2, 7, 6].includes(i)) isInner = true;
                }
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
                name: ACTIVE_PALACES[i].name,
                branch: ACTIVE_PALACES[i].branch.join('/'),
                star: pStars[0],
                door: pDoor,
                god: godPan[i],
                hStems: hStems,
                eStems: eStems,
                anGan: anGanPan[i],
                isKong: isKong,
                isMa: isMa,
                isMenPo: isMenPo(pDoor, i),
                hStemJiXing: hStems.filter(s => isJiXing(s, i)),
                eStemJiXing: eStems.filter(s => isJiXing(s, (i===5)?2:i)),
                hStemRuMu: hStems.filter(s => isRuMu(s, i)),
                eStemRuMu: eStems.filter(s => isRuMu(s, (i===5)?2:i)),
                isZhiShi: (pDoor === doorPan[currentD_val]),
                palaceNum: i,
                yStemEff: yStemEff,
                mStemEff: mStemEff,
                dStemEff: dStemEff,
                hStemEff: hStemEff
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
                        <span class="text-main text-${godColor} w-full">${godPan[i]}</span>
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
                    if(branchToTianJiang[b]) {
                        tianJiangStrs.push(`${branchToTianJiang[b]}(${b})`);
                    }
                }
            }
            let tianJiangCopyStr = tianJiangStrs.length ? `[${tianJiangStrs.join('/')}] ` : "";

            panData.palaces[ACTIVE_PALACES[i].name] = `${tianJiangCopyStr}${godPan[i]}/${starTextDisplay}/${doorTextForCopy}/${hStemsForCopy}/${eStemsForCopy}${isMa?'/**驛馬**':''}${isKong?'/**空亡**':''}`;
        }
        
    } catch (e) { alert("起盤錯誤: " + e.message); console.error(e); }
}

function copyPan() {
    const ACTIVE_PALACES = useXianTian ? PALACES_XIAN : PALACES_HOU;
    const baziLine = panData.bazi + (panData.special ? " " + panData.special : "") + (panData.stemStatus ? " " + panData.stemStatus : "");
    let text = `【奇門遁甲 - 拆補法排盤】\n時間：${baziLine}\n局數：${panData.ju}\n旬首：${panData.xun}\n值符：${panData.zf} | 值使：${panData.zs}\n空亡：${panData.kw} | 驛馬：${currentYiMaPalace}\n**解讀方法："奇門宮位：[穿壬十二天將(地支)] 神/星/門/天盤/地盤/驛馬或空亡(如有)"**\n----------------------\n`;
    for (let i = 1; i <= 9; i++) {
        if(i!==5) {
            let pName = ACTIVE_PALACES[i].name;
            text += `${pName}：${panData.palaces[pName]}\n`;
        }
    }
    navigator.clipboard.writeText(text).then(() => alert("資料已複製！")).catch(() => { let t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); alert("資料已複製！"); });
}

function sharePan() {
    const y = document.getElementById('sel-year').value;
    const m = document.getElementById('sel-month').value;
    const d = document.getElementById('sel-day').value;
    const h = document.getElementById('sel-hour24').value;
    const min = document.getElementById('sel-minute').value;
    
    const url = new URL(window.location.href);
    url.searchParams.set('y', y);
    url.searchParams.set('m', m);
    url.searchParams.set('d', d);
    url.searchParams.set('h', h);
    url.searchParams.set('min', min);
    
    navigator.clipboard.writeText(url.toString()).then(() => {
        alert("分享連結已複製！貼上即可分享目前的排盤時間。");
    }).catch(() => {
        let t = document.createElement("textarea"); 
        t.value = url.toString(); 
        document.body.appendChild(t); 
        t.select(); 
        document.execCommand("Copy"); 
        t.remove(); 
        alert("分享連結已複製！貼上即可分享目前的排盤時間。");
    });
}

window.onload = function() {
    initSelectors();
    initBaziSelectors();
    handleFilterPalaceChange(1);
    handleFilterPalaceChange(2);
};