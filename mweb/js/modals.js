// ==========================================
// js/modals.js
// 彈出視窗、宮位詳細資訊與作功關係比對 (純淨無 Emoji 國風版)
// ==========================================

function showManualModal() {
    const el = document.getElementById('manual-modal');
    if (el) el.classList.remove('hidden');
}

function closeManualModal() {
    const el = document.getElementById('manual-modal');
    if (el) el.classList.add('hidden');
}

// 廿四節氣彈窗
function showJieQiModal() {
    const ySel = document.getElementById('sel-year');
    const y = ySel ? parseInt(ySel.value) : new Date().getFullYear();
    
    const titleEl = document.getElementById('jieqi-modal-title');
    if (titleEl) titleEl.innerText = `${y}年 廿四節氣`;

    let termsList = [];
    for (let m = 1; m <= 12; m++) {
        let d = Solar.fromYmd(y, m, 15).getLunar();
        let table = d.getJieQiTable(); 
        for (let key of Object.keys(table)) {
            let s = table[key];
            if (s.getYear() === y && s.getMonth() === m) {
                termsList.push({ name: TRAD_JIEQI[key] || key, time: s.toYmdHms() });
            }
        }
    }
    termsList.sort((a, b) => a.time.localeCompare(b.time));

    let html = '';
    termsList.forEach(t => { 
        html += `<div class="p-2 border border-[#C5A06A]/30 rounded-lg bg-[rgba(248,241,227,0.5)] flex justify-between items-center shadow-sm">
            <span class="text-[#2C4A38] font-black">${t.name}</span>
            <span class="text-[#8C887B] text-xs font-bold">${t.time.substring(5, 16)}</span>
        </div>`; 
    });

    const contentEl = document.getElementById('jieqi-modal-content');
    if (contentEl) contentEl.innerHTML = html;

    const modalEl = document.getElementById('jieqi-modal');
    if (modalEl) modalEl.classList.remove('hidden');
}

function closeJieQiModal() { 
    const el = document.getElementById('jieqi-modal');
    if (el) el.classList.add('hidden'); 
}

// 宮位作功關係比對 (已徹底移除 ➡️ Emoji)
function renderRelationBox(activeStems, activeBranchList) {
    let totalMatches = 0;
    let html = '<div class="grid grid-cols-2 gap-x-4 gap-y-3.5">';

    for (let key in RELATION_RULES) {
        const grp = RELATION_RULES[key];
        const isStem = (grp.type === 'stem');
        
        html += `<div>
            <div class="font-black text-[#4A3319] mb-1.5 border-b border-[#C5A06A]/30 pb-0.5 text-xs sm:text-sm md:text-base">${grp.title}</div>
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
                // 🌟 移除 ➡️ Emoji，採用簡約金絲高亮印章風格
                html += `<div class="bg-[rgba(254,243,199,0.85)] text-[#78350F] font-bold px-2 py-1 rounded-lg border border-[#FDE68A] shadow-sm flex items-center justify-between text-xs sm:text-sm leading-tight">
                    <span class="font-black">${item.label}</span>
                    <span class="text-[11px] sm:text-xs text-[#92400E] bg-[#FDE68A]/90 px-1.5 py-0.5 rounded font-black">${matchedDisplay.join('·')}</span>
                </div>`;
            } else {
                html += `<div class="text-[#8C887B] px-1 py-0.5 text-xs sm:text-sm font-bold">${item.label}</div>`;
            }
        });
        html += `</div></div>`;
    }
    html += '</div>';
    return { html, totalMatches };
}

// 顯示宮位詳細資訊彈窗
function showPalaceDetails(pNum) {
    const data = globalPalaceData[pNum];
    if (!data || data.isCenter) return;

    const pmTitle = document.getElementById('pm-title');
    if (pmTitle) pmTitle.innerText = data.name + " 詳細資訊";

    const pmBranch = document.getElementById('pm-branch');
    if (pmBranch) pmBranch.innerHTML = data.branch ? colorizeGanZhi(data.branch) : "-";

    let doorText = data.door || "";
    if (doorText === '傷門') doorText += '(卯)';
    if (doorText === '景門') doorText += '(午)';
    if (doorText === '驚門') doorText += '(酉)';
    if (doorText === '休門') doorText += '(子)';

    const pmGod = document.getElementById('pm-god');
    if (pmGod) pmGod.innerHTML = data.god ? `<span class="text-${GOD_COLORS[data.god] || 'black'} font-black">${data.god}</span>` : "-";

    const pmStar = document.getElementById('pm-star');
    if (pmStar) pmStar.innerHTML = data.star ? `<span class="text-${STAR_COLORS[data.star.split('/')[0]] || 'black'} font-black">${data.star}</span>` : "-";

    const pmDoor = document.getElementById('pm-door');
    if (pmDoor) pmDoor.innerHTML = doorText ? `<span class="text-${DOOR_COLORS[data.door] || 'black'} font-black">${doorText}</span>` : "-";

    const pmAngan = document.getElementById('pm-angan');
    if (pmAngan) pmAngan.innerHTML = colorizeGanZhi(data.anGan || "-");

    const pmHstem = document.getElementById('pm-hstem');
    if (pmHstem) pmHstem.innerHTML = data.hStems ? [...data.hStems].map(s => colorizeGanZhi(s)).join(' | ') : "-"; 

    const pmEstem = document.getElementById('pm-estem');
    if (pmEstem) pmEstem.innerHTML = data.eStems ? [...data.eStems].map(s => colorizeGanZhi(s)).join(' | ') : "-"; 

    const DUN_GAN_MAP = { '戊': '子', '己': '戌', '庚': '申', '辛': '午', '壬': '辰', '癸': '寅' };
    let hHidden = data.hStems ? data.hStems.map(s => DUN_GAN_MAP[s] ? `${s}遁${DUN_GAN_MAP[s]}` : '').filter(Boolean).join(' | ') : '';
    let eHidden = data.eStems ? data.eStems.map(s => DUN_GAN_MAP[s] ? `${s}遁${DUN_GAN_MAP[s]}` : '').filter(Boolean).join(' | ') : '';
    
    const pmHstemHidden = document.getElementById('pm-hstem-hidden');
    if (pmHstemHidden) pmHstemHidden.innerText = hHidden ? `(${hHidden})` : '';

    const pmEstemHidden = document.getElementById('pm-estem-hidden');
    if (pmEstemHidden) pmEstemHidden.innerText = eHidden ? `(${eHidden})` : '';

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
    const cheatsheetContent = document.getElementById('pm-cheatsheet-content');
    if (cheatsheetContent) cheatsheetContent.innerHTML = relationHtml;

    const badgeEl = document.getElementById('pm-cheatsheet-badge');
    const detailsEl = document.getElementById('pm-cheatsheet-details');
    if (badgeEl && detailsEl) {
        if (totalMatches > 0) {
            badgeEl.innerHTML = `<span class="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-black px-2 py-0.5 rounded-full text-[11px]">${totalMatches} 組相合/沖/方/刑/害</span>`;
            detailsEl.open = true;
        } else {
            badgeEl.innerHTML = '';
            detailsEl.open = false;
        }
    }

    // 四害狀態徽章
    let harmsHTML = "";
    const tagStyle = "px-2 py-0.5 rounded text-xs font-black text-white shadow-sm";
    if (data.isKong) harmsHTML += `<span class="bg-[#6B7280] ${tagStyle}">空亡</span>`;
    if (data.isMa) harmsHTML += `<span class="bg-[#0284C7] ${tagStyle}">驛馬</span>`;
    if (data.isMenPo) harmsHTML += `<span class="bg-[#DC2626] ${tagStyle}">門迫</span>`;
    
    if (data.hStemJiXing && data.hStemJiXing.length) harmsHTML += `<span class="bg-[#EA580C] ${tagStyle}">天盤擊刑(${data.hStemJiXing.join('')})</span>`;
    if (data.eStemJiXing && data.eStemJiXing.length) harmsHTML += `<span class="bg-[#C2410C] ${tagStyle}">地盤擊刑(${data.eStemJiXing.join('')})</span>`;
    if (data.hStemRuMu && data.hStemRuMu.length) harmsHTML += `<span class="bg-[#7C3AED] ${tagStyle}">天盤入墓(${data.hStemRuMu.join('')})</span>`;
    if (data.eStemRuMu && data.eStemRuMu.length) harmsHTML += `<span class="bg-[#6D28D9] ${tagStyle}">地盤入墓(${data.eStemRuMu.join('')})</span>`;

    const pmHarms = document.getElementById('pm-harms');
    if (pmHarms) pmHarms.innerHTML = harmsHTML || '<span class="text-[#8C887B] text-sm font-bold">無特殊狀態</span>';

    // 格局名堂卡片
    let gejuHTML = "";
    let gejus = calculateGeju(data);
    if (!gejus || gejus.length === 0) {
        gejuHTML = '<span class="text-[#8C887B] text-sm font-bold">此宮目前無特殊格局。</span>';
    } else {
        gejus.forEach(g => {
            let badgeColor = 'bg-[#FAF6EE] text-[#4A3319] border-[#D1C2A5]'; 
            if (g.type.includes('吉')) badgeColor = 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]';
            else if (g.type.includes('凶')) badgeColor = 'bg-[#FEF2F2] text-[#9E2A2B] border-[#FECACA]';
            
            gejuHTML += `
                <div class="p-3 bg-[rgba(248,241,227,0.6)] border border-[#C5A06A]/30 rounded-xl flex flex-col shadow-sm">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="font-black text-[#26211C] text-sm sm:text-base">${g.name}</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded border ${badgeColor} font-black">${g.type}</span>
                    </div>
                    <span class="text-[#786C5E] text-xs sm:text-sm leading-relaxed font-bold">${g.desc}</span>
                </div>`;
        });
    }
    
    const pmGeju = document.getElementById('pm-geju');
    if (pmGeju) pmGeju.innerHTML = gejuHTML;

    const modalEl = document.getElementById('palace-modal');
    if (modalEl) modalEl.classList.remove('hidden');
}

function closePalaceModal() {
    const el = document.getElementById('palace-modal');
    if (el) el.classList.add('hidden');
}
