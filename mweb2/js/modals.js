// ==========================================
// js/modals.js
// 彈出視窗、宮位詳細資訊與作功關係比對
// ==========================================

function showManualModal() {
    const el = document.getElementById('manual-modal');
    if (el) el.classList.remove('hidden');
}

function closeManualModal() {
    const el = document.getElementById('manual-modal');
    if (el) el.classList.add('hidden');
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
                if (matchedChars.length >= grp.min) matchedDisplay = matchedChars;
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
                    if (!hasPhysicalBranch) matchedItems = [];
                }

                if (matchedItems.length >= grp.min) matchedDisplay = matchedItems.map(b => b.display);
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
        palaceBranches.forEach(b => activeBranchList.push({ char: b, display: b, source: 'palace' }));
    }

    const DOOR_BRANCH_MAP = {
        '休門': { branch: '子', label: '休' }, '傷門': { branch: '卯', label: '傷' },
        '景門': { branch: '午', label: '景' }, '驚門': { branch: '酉', label: '驚' }
    };

    if (data.door && DOOR_BRANCH_MAP[data.door]) {
        const dInfo = DOOR_BRANCH_MAP[data.door];
        if (!palaceBranches.includes(dInfo.branch)) {
            activeBranchList.push({ char: dInfo.branch, display: `${dInfo.branch}（${dInfo.label}）`, source: 'door' });
        }
    }

    if (data.hStems) {
        data.hStems.forEach(s => {
            if (DUN_GAN_MAP[s]) activeBranchList.push({ char: DUN_GAN_MAP[s], display: `${DUN_GAN_MAP[s]}（天${s}）`, source: 'hStem' });
        });
    }

    if (data.eStems) {
        data.eStems.forEach(s => {
            if (DUN_GAN_MAP[s]) activeBranchList.push({ char: DUN_GAN_MAP[s], display: `${DUN_GAN_MAP[s]}（地${s}）`, source: 'eStem' });
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
    let gejus = calculateGeju(data); // 依賴 engine-chaibu.js
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

function closePalaceModal() {
    document.getElementById('palace-modal').classList.add('hidden');
}