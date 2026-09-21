// ==========================================
// js/compass.js
// 實地風水奇門指南針與陀螺儀控制
// ==========================================

let useCompass = false;
let isCompassRunning = false;
let isCompassLocked = false;
let isCompassBW = false;
let compassScale = 1.0;
let isAutoAlign = false;

let compassActiveListenerType = null;
let currentContinuousRotation = 0;
let smoothedHeading = null;

function get24Mountain(deg) {
    deg = (deg % 360 + 360) % 360;
    for (let m of MOUNTAINS_24) {
        if (m.start > m.end) {
            if (deg >= m.start || deg < m.end) return m;
        } else {
            if (deg >= m.start && deg < m.end) return m;
        }
    }
    return MOUNTAINS_24[0];
}

function getDirectionName(deg) {
    const dirs = [
        { name: "正北", start: 337.5, end: 22.5 }, { name: "東北", start: 22.5, end: 67.5 },
        { name: "正東", start: 67.5, end: 112.5 }, { name: "東南", start: 112.5, end: 157.5 },
        { name: "正南", start: 157.5, end: 202.5 }, { name: "西南", start: 202.5, end: 247.5 },
        { name: "正西", start: 247.5, end: 292.5 }, { name: "西北", start: 292.5, end: 337.5 }
    ];
    deg = (deg % 360 + 360) % 360;
    for (let d of dirs) {
        if (d.start > d.end) {
            if (deg >= d.start || deg < d.end) return d.name;
        } else {
            if (deg >= d.start && deg < d.end) return d.name;
        }
    }
    return "正北";
}

function cycleCompassSize() {
    if (compassScale === 1.0) compassScale = 1.25;
    else if (compassScale === 1.25) compassScale = 1.5;
    else compassScale = 1.0;
    
    document.getElementById('btn-compass-size').innerHTML = `🔍 ${compassScale}x`;
    const wrapper = document.getElementById('compass-scale-wrapper');
    if (wrapper) wrapper.style.transform = `scale(${compassScale})`;
}

function toggleAutoAlign() {
    isAutoAlign = !isAutoAlign;
    const btn = document.getElementById('btn-auto-align');
    const sel = document.getElementById('sel-compass-yun9-ju');
    if (isAutoAlign) {
        btn.innerText = "自動定盤:關";
        btn.className = "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap shadow transition-colors auto-align-on";
        if(sel) { sel.disabled = true; sel.classList.add('opacity-50', 'cursor-not-allowed'); }
        if(smoothedHeading !== null) applyAutoAlign(smoothedHeading);
    } else {
        btn.innerText = "自動定盤:開";
        btn.className = "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 px-3 py-1 rounded-lg text-sm font-bold whitespace-nowrap shadow transition-colors auto-align-off";
        if(sel) { sel.disabled = false; sel.classList.remove('opacity-50', 'cursor-not-allowed'); }
    }
}

function getBranchFromHeading(deg) {
    deg = (deg % 360 + 360) % 360;
    if (deg >= 345 || deg < 15) return '子_1';
    if (deg >= 15 && deg < 45) return '丑_8';
    if (deg >= 45 && deg < 75) return '寅_8';
    if (deg >= 75 && deg < 105) return '卯_3';
    if (deg >= 105 && deg < 135) return '辰_4';
    if (deg >= 135 && deg < 165) return '巳_4';
    if (deg >= 165 && deg < 195) return '午_9';
    if (deg >= 195 && deg < 225) return '未_2';
    if (deg >= 225 && deg < 255) return '申_2';
    if (deg >= 255 && deg < 285) return '酉_7';
    if (deg >= 285 && deg < 315) return '戌_6';
    if (deg >= 315 && deg < 345) return '亥_6';
    return '子_1';
}

function applyAutoAlign(heading) {
    const targetVal = getBranchFromHeading(heading);
    const sel = document.getElementById('sel-compass-yun9-ju');
    if (sel && sel.value !== targetVal) {
        sel.value = targetVal;
        renderCompassQimen();
    }
}

function toggleCompassTheme() {
    isCompassBW = !isCompassBW;
    const modal = document.getElementById('compass-modal');
    if (modal) {
        if (isCompassBW) modal.classList.add('bw-mode');
        else modal.classList.remove('bw-mode');
    }
    renderCompassSvgDial();
    renderCompassQimen();
}

function switchCompassPanMode(mode) {
    compassPanMode = mode;
    const btnShijia = document.getElementById('btn-mode-shijia');
    const btnWuxiang = document.getElementById('btn-mode-wuxiang');
    const subShijia = document.getElementById('compass-sub-shijia');
    const subWuxiang = document.getElementById('compass-sub-wuxiang');

    if (mode === 'shijia') {
        btnShijia.className = "px-4 py-1.5 text-base sm:text-lg font-black rounded-lg bg-amber-500 text-slate-950 transition selected-pan";
        btnWuxiang.className = "px-4 py-1.5 text-base sm:text-lg font-black rounded-lg text-gray-300 hover:text-white transition unselected-pan";
        subShijia.classList.remove('hidden'); subShijia.classList.add('flex');
        subWuxiang.classList.add('hidden'); subWuxiang.classList.remove('flex');
    } else {
        btnWuxiang.className = "px-4 py-1.5 text-base sm:text-lg font-black rounded-lg bg-indigo-600 text-white transition selected-pan";
        btnShijia.className = "px-4 py-1.5 text-base sm:text-lg font-black rounded-lg text-gray-300 hover:text-white transition unselected-pan";
        subWuxiang.classList.remove('hidden'); subWuxiang.classList.add('flex');
        subShijia.classList.add('hidden'); subShijia.classList.remove('flex');
    }
    renderCompassQimen();
}

function renderCompassSvgDial() {
    const svg = document.getElementById('compass-svg-dial');
    if (!svg) return;
    const cx = 220, cy = 220, rOut = 216, rMid = 176, rIn = 162;
    
    let bgOut = isCompassBW ? "#ffffff" : "#050b14";
    let bgMid = isCompassBW ? "#f8fafc" : "#0f172a";
    let bgIn = isCompassBW ? "#ffffff" : "#020617";
    let strokeMain = isCompassBW ? "#000000" : "#d97706";
    let strokeMid = isCompassBW ? "#000000" : "#78350f";

    let html = `
        <circle cx="${cx}" cy="${cy}" r="${rOut}" fill="${bgOut}" stroke="${strokeMain}" stroke-width="2.5"/>
        <circle cx="${cx}" cy="${cy}" r="${rMid}" fill="${bgMid}" stroke="${strokeMid}" stroke-width="1.5"/>
        <circle cx="${cx}" cy="${cy}" r="${rIn}" fill="${bgIn}" stroke="${strokeMain}" stroke-width="2"/>
    `;

    for (let deg = 0; deg < 360; deg += 5) {
        let dialAngle = (deg - 180 + 360) % 360;
        let rad = dialAngle * Math.PI / 180;
        
        let isMajorCardinal = (deg === 0 || deg === 90 || deg === 180 || deg === 270);
        let is10 = (deg % 10 === 0); let is30 = (deg % 30 === 0);

        let len = isMajorCardinal ? 16 : (is30 ? 9 : (is10 ? 6 : 3.5));
        let x1 = cx + (rOut - 2) * Math.sin(rad); let y1 = cy - (rOut - 2) * Math.cos(rad);
        let x2 = cx + (rOut - 2 - len) * Math.sin(rad); let y2 = cy - (rOut - 2 - len) * Math.cos(rad);

        let strokeColor = isCompassBW ? '#000000' : (isMajorCardinal ? '#f87171' : (is30 ? '#fbbf24' : (is10 ? '#94a3b8' : '#475569')));
        let strokeWidth = isMajorCardinal ? 2.5 : (is30 ? 1.5 : 1);

        html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    }

    MOUNTAINS_24.forEach(m => {
        let dialAngle = (m.center - 180 + 360) % 360;
        let boundaryDialAngle = (dialAngle - 7.5 + 360) % 360;
        let bRad = boundaryDialAngle * Math.PI / 180;
        
        let bx1 = cx + rOut * Math.sin(bRad); let by1 = cy - rOut * Math.cos(bRad);
        let bx2 = cx + rIn * Math.sin(bRad); let by2 = cy - rIn * Math.cos(bRad);
        let lineStroke = isCompassBW ? "#000000" : "#78350f";
        let lineOpacity = isCompassBW ? "1" : "0.6";
        html += `<line x1="${bx1}" y1="${by1}" x2="${bx2}" y2="${by2}" stroke="${lineStroke}" stroke-width="1" opacity="${lineOpacity}"/>`;

        let tRad = dialAngle * Math.PI / 180;
        let textR = (rMid + rOut - 10) / 2 + 2;
        let tx = cx + textR * Math.sin(tRad); let ty = cy - textR * Math.cos(tRad);
        
        let fontSize = m.isMajor ? "17" : "14";
        let fontWeight = m.isMajor ? "900" : "800";
        let fontColor = isCompassBW ? "#000000" : m.color;
        html += `<text x="${tx}" y="${ty}" fill="${fontColor}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="central" transform="rotate(${dialAngle}, ${tx}, ${ty})">${m.name}</text>`;
    });

    svg.innerHTML = html;
}

function renderCompassQimen() {
    const grid = document.getElementById('compass-qimen-grid');
    if (!grid) return;
    const order = [4, 9, 2, 3, 5, 7, 8, 1, 6];
    let html = '';

    if (compassPanMode === 'shijia') {
        const cFxSel = document.getElementById('sel-compass-feixing-year');
        const y = parseInt(document.getElementById('sel-year').value);
        let flightYear = (cFxSel && cFxSel.value) ? parseInt(cFxSel.value) : y;
        
        let starC = (11 - (flightYear % 9)) % 9;
        if (starC <= 0) starC += 9;
        const FLIGHT_OFFSET = { 5: 0, 6: 1, 7: 2, 8: 3, 9: 4, 1: 5, 2: 6, 3: 7, 4: 8 };
        const FEIXING_ZH_NAMES = ["", "一白", "二黑", "三碧", "四綠", "五黃", "六白", "七赤", "八白", "九紫"];

        order.forEach(pNum => {
            let data = globalPalaceData[pNum];
            let feixingNum = (starC + FLIGHT_OFFSET[pNum] - 1) % 9 + 1;
            let feixingStr = FEIXING_ZH_NAMES[feixingNum];

            if (pNum === 5) {
                let s = data ? data.hStems[0] : ""; let b5 = panData.bazi5Info;
                let bgCell = isCompassBW ? "bg-white border-black text-black" : "bg-slate-900/95 border-amber-500/40 text-white";
                let topBorder = isCompassBW ? "border-black" : "border-gray-700/60";
                let titleCol = isCompassBW ? "text-black" : "text-amber-300";
                let tagCol = isCompassBW ? "bg-gray-100 text-black border border-black" : "bg-rose-900/90 text-rose-200";
                let baziCol = isCompassBW ? "text-black" : "text-amber-200";
                let infoCol = isCompassBW ? "text-black" : "text-gray-300";
                let stemCol = isCompassBW ? "text-black" : "text-amber-400";

                html += `
                <div class="flex flex-col justify-between p-1 ${bgCell} border rounded text-center overflow-hidden shadow-inner leading-none">
                    <div class="flex justify-between items-center text-[9px] sm:text-[10px] font-black border-b ${topBorder} pb-0.5">
                        <span class="${titleCol}">中五</span>
                        <span class="${tagCol} px-1 rounded text-[8px] sm:text-[9px] font-mono">${feixingStr}</span>
                    </div>
                    <div class="flex flex-col justify-center items-center my-auto space-y-0.5">
                        <div class="text-xs sm:text-sm ${baziCol} font-black">${b5 ? b5.hS + b5.hB + '時' : ''}</div>
                        <div class="text-[9px] sm:text-[10px] ${infoCol} font-bold">符:${b5 ? b5.zf : ''}</div>
                        <div class="text-[9px] sm:text-[10px] ${infoCol} font-bold">使:${b5 ? b5.zs : ''}</div>
                    </div>
                    <div class="text-xs sm:text-sm text-right font-black ${stemCol} mt-auto">${s}</div>
                </div>`;
            } else if (data) {
                let pGua = PALACES_HOU[pNum].gua;
                let maKong = []; if (data.isMa) maKong.push('🐎'); if (data.isKong) maKong.push('🈳');
                let maKongHtml = maKong.join('');
                let bgCell = isCompassBW ? "bg-white border-black text-black" : "bg-slate-950/95 border-slate-800 text-white";
                let topBorder = isCompassBW ? "border-black" : "border-slate-800/80";
                let titleCol = isCompassBW ? "text-black" : "text-amber-300";
                let anGanCol = isCompassBW ? "text-gray-600" : "text-gray-400";
                let tagCol = isCompassBW ? "bg-gray-100 text-black border border-black" : "bg-rose-900/90 text-rose-200";

                html += `
                <div class="flex flex-col justify-between p-1 ${bgCell} border rounded overflow-hidden shadow leading-none">
                    <div class="flex justify-between items-center text-[9px] sm:text-[10px] font-black border-b ${topBorder} pb-0.5">
                        <span class="${titleCol} truncate">${data.name}${pGua} <span class="${anGanCol} font-normal text-[8px]">${data.anGan || ''}</span></span>
                        <span class="${tagCol} px-1 rounded text-[8px] sm:text-[9px] font-mono">${feixingStr}</span>
                    </div>
                    <div class="flex flex-col justify-around flex-grow my-auto py-0.5 text-[12px] sm:text-[13.5px] md:text-[15px] font-black leading-tight w-full">
                        <div class="flex justify-between items-center w-full">
                            <span class="${isCompassBW ? "text-black" : "text-emerald-400"} truncate">${data.god}</span>
                            <span class="text-right inline-flex items-center text-[11px] sm:text-[12px] leading-none shrink-0">${maKongHtml}</span>
                        </div>
                        <div class="flex justify-between items-center w-full">
                            <span class="${isCompassBW ? "text-black" : "text-yellow-300"} truncate">${data.star}</span>
                            <span class="${isCompassBW ? "text-black" : "text-cyan-300"} font-mono text-right shrink-0 tracking-tight">${data.hStems.join('')}</span>
                        </div>
                        <div class="flex justify-between items-center w-full">
                            <div class="flex items-center truncate">
                                <span class="${isCompassBW ? "text-black" : "text-red-400"}">${data.door}</span>
                                ${data.isMenPo ? `<span class="${isCompassBW ? "text-black" : "text-red-500"} font-black ml-0.5 text-[10px] sm:text-[11px]">迫</span>` : ''}
                            </div>
                            <span class="${isCompassBW ? "text-black" : "text-orange-300"} font-mono text-right shrink-0 tracking-tight">${data.eStems.join('')}</span>
                        </div>
                    </div>
                </div>`;
            }
        });
    } else {
        const juVal = document.getElementById('sel-compass-yun9-ju')?.value || '子_1';
        const [doorMountain, housePalaceStr] = juVal.split('_');
        const housePalace = parseInt(housePalaceStr);
        const wx = calculateWuxiangData(9, housePalace, doorMountain); // calculateWuxiangData 在 engine-wuxiang.js 中

        order.forEach(pNum => {
            const pInfo = PALACES_HOU[pNum];
            if (pNum === 5) {
                const eNumZh = wx.CHINESE_NUMS[wx.earthNum[5]];
                let bgCell = isCompassBW ? "bg-white border-black text-black" : "bg-slate-900/95 border-indigo-500/50 text-white";
                let topBorder = isCompassBW ? "border-black" : "border-indigo-900";
                html += `
                <div class="flex flex-col justify-between p-1 ${bgCell} border rounded text-center overflow-hidden shadow-inner leading-none">
                    <div class="flex justify-between items-center text-[9px] sm:text-[10px] font-black border-b ${topBorder} pb-0.5">
                        <span class="${isCompassBW ? 'text-black' : 'text-indigo-300'}">中五</span>
                        <span class="${isCompassBW ? 'bg-gray-100 text-black border border-black' : 'bg-indigo-900 text-indigo-200'} px-1 rounded text-[8px]">立極</span>
                    </div>
                    <div class="flex flex-col justify-center items-center my-auto space-y-0.5">
                        <div class="text-xs sm:text-sm ${isCompassBW ? 'text-black' : 'text-amber-300'} font-bold">${wx.yun}運</div>
                        <div class="text-[9px] sm:text-[10px] ${isCompassBW ? 'text-black' : 'text-gray-400'}">符頭:${wx.fuTouStem}</div>
                        <div class="text-[9px] sm:text-[10px] ${isCompassBW ? 'text-black' : 'text-gray-400'}">符星:${wx.starLeader}</div>
                    </div>
                    <div class="flex justify-between items-end mt-auto text-[10px] sm:text-xs font-mono font-bold">
                        <span class="${isCompassBW ? 'text-black' : 'text-amber-400'}">${eNumZh}</span>
                        <span class="${isCompassBW ? 'text-black' : 'text-orange-300'}">${wx.centerStem}</span>
                    </div>
                </div>`;
            } else {
                const isHouse = (pNum === housePalace); const isDoor = (pNum === wx.doorPalace);
                let badgeHtml = '';
                if (isHouse) badgeHtml += `<span class="${isCompassBW ? 'bg-black text-white' : 'bg-red-600 text-white'} text-[8px] px-0.5 rounded font-black">屋</span>`;
                if (isDoor) badgeHtml += `<span class="${isCompassBW ? 'border border-black text-black' : 'bg-blue-600 text-white'} text-[8px] px-0.5 rounded font-black">門</span>`;

                const eNumZh = wx.CHINESE_NUMS[wx.earthNum[pNum]];
                let bgCell = isCompassBW ? "bg-white border-black text-black" : "bg-slate-950/95 border-slate-800 text-white";
                
                html += `
                <div class="flex flex-col justify-between p-1 ${bgCell} border rounded overflow-hidden shadow leading-none">
                    <div class="flex justify-between items-center text-[9px] sm:text-[10px] font-black border-b ${isCompassBW ? "border-black" : "border-slate-800/80"} pb-0.5">
                        <span class="${isCompassBW ? 'text-black' : 'text-amber-300'} truncate">${pInfo.name} ${pInfo.gua}</span>
                        <div class="flex items-center gap-0.5">
                            <span class="${isCompassBW ? 'text-black' : 'text-amber-400'} font-mono text-[9px]">${eNumZh}</span>
                            ${badgeHtml}
                        </div>
                    </div>
                    <div class="flex flex-col justify-around flex-grow my-auto py-0.5 text-[12px] sm:text-[13.5px] md:text-[15px] font-black leading-tight w-full">
                        <div class="flex justify-between items-center w-full">
                            <span class="${isCompassBW ? "text-black" : "text-emerald-400"} truncate">${wx.godPan[pNum]}</span>
                        </div>
                        <div class="flex justify-between items-center w-full">
                            <span class="${isCompassBW ? "text-black" : "text-yellow-300"} truncate">${wx.starPan[pNum]}</span>
                            <span class="${isCompassBW ? "text-black" : "text-cyan-300"} font-mono text-right shrink-0 tracking-tight">${wx.heavenStemPan[pNum]}</span>
                        </div>
                        <div class="flex justify-between items-center w-full">
                            <span class="${isCompassBW ? "text-black" : "text-red-400"} truncate">${wx.doorPan[pNum]}</span>
                            <span class="${isCompassBW ? "text-black" : "text-orange-300"} font-mono text-right shrink-0 tracking-tight">${wx.earthStem[pNum]}</span>
                        </div>
                    </div>
                </div>`;
            }
        });
    }
    grid.innerHTML = html;
}

function openCompassMode() {
    if (!panData || !panData.ju) generatePan();
    const modal = document.getElementById('compass-modal');
    if (modal) modal.classList.remove('hidden');

    const cFxSel = document.getElementById('sel-compass-feixing-year');
    if (cFxSel) cFxSel.value = document.getElementById('sel-year').value;
    
    renderCompassSvgDial();
    renderCompassQimen();
    startCompassSensor();
}

function changeCompassFeiXingYear() { renderCompassQimen(); }

function closeCompassMode() {
    const modal = document.getElementById('compass-modal');
    if (modal) modal.classList.add('hidden');
    stopCompassSensor();
    const toggle = document.getElementById('toggle-compass');
    if (toggle && toggle.checked) toggle.checked = false;
}

function toggleCompassLock() {
    isCompassLocked = !isCompassLocked;
    const icon = document.getElementById('compass-lock-icon');
    const txt = document.getElementById('compass-lock-text');
    const btn = document.getElementById('btn-compass-lock');
    
    if (isCompassLocked) {
        if (icon) icon.innerText = '🔒';
        if (txt) txt.innerText = '解鎖';
        if (btn) { btn.classList.replace('border-gray-700', 'border-amber-500'); btn.classList.add('text-amber-400'); }
    } else {
        if (icon) icon.innerText = '🔓';
        if (txt) txt.innerText = '鎖定';
        if (btn) { btn.classList.replace('border-amber-500', 'border-gray-700'); btn.classList.remove('text-amber-400'); }
    }
}

function startCompassSensor() {
    stopCompassSensor();
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permBtn = document.getElementById('btn-ios-perm');
        const hint = document.getElementById('compass-status-hint');
        
        DeviceOrientationEvent.requestPermission().then(response => {
            if (response === 'granted') {
                window.addEventListener('deviceorientation', handleDeviceOrientation, true);
                compassActiveListenerType = 'deviceorientation'; isCompassRunning = true;
                if (permBtn) permBtn.classList.add('hidden');
                if (hint) hint.innerText = '💡 轉動手機，奇門盤將自動對準方位實地堪輿';
            } else {
                if (permBtn) permBtn.classList.remove('hidden');
                if (hint) hint.innerText = '⚠️ 請授權指南針讀取：';
            }
        }).catch(err => {
            if (permBtn) permBtn.classList.remove('hidden');
            if (hint) hint.innerText = '⚠️ 請點擊按鈕啟用指南針：';
        });
    } else if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
        compassActiveListenerType = 'deviceorientationabsolute'; isCompassRunning = true;
    } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation, true);
        compassActiveListenerType = 'deviceorientation'; isCompassRunning = true;
    }
}

function stopCompassSensor() {
    if (compassActiveListenerType === 'deviceorientationabsolute') {
        window.removeEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
    } else if (compassActiveListenerType === 'deviceorientation') {
        window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
    }
    window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
    window.removeEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
    compassActiveListenerType = null; isCompassRunning = false; smoothedHeading = null;
}

function requestDeviceOrientationPerm() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(res => {
            if (res === 'granted') startCompassSensor();
            else alert('指南針權限未開啟。');
        }).catch(console.error);
    }
}

function handleDeviceOrientation(e) {
    if (isCompassLocked) return;
    let rawHeading = 0;
    if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
        rawHeading = e.webkitCompassHeading;
    } else if (e.alpha !== null && e.alpha !== undefined) {
        rawHeading = (360 - e.alpha) % 360;
    } else return;

    if (smoothedHeading === null) smoothedHeading = rawHeading;
    else {
        let delta = rawHeading - smoothedHeading;
        delta = (delta + 540) % 360 - 180;
        smoothedHeading = (smoothedHeading + delta * 0.25 + 360) % 360;
    }
    updateCompassHeading(smoothedHeading);
}

function updateCompassHeading(heading) {
    heading = Math.round(heading) % 360;
    let targetRotation = (180 - heading + 360) % 360;
    let diff = (targetRotation - (currentContinuousRotation % 360) + 540) % 360 - 180;
    currentContinuousRotation += diff;

    const dial = document.getElementById('compass-dial-container');
    if (dial) dial.style.transform = `rotate(${currentContinuousRotation}deg)`;

    const degEl = document.getElementById('compass-degree');
    if (degEl) degEl.innerText = `${heading.toString().padStart(3, '0')}°`;

    const dirEl = document.getElementById('compass-direction-text');
    if (dirEl) dirEl.innerText = getDirectionName(heading);

    const mInfo = get24Mountain(heading);
    const mEl = document.getElementById('compass-mountain');
    if (mEl) mEl.innerText = `${mInfo.gua}宮 · ${mInfo.name}山 (${mInfo.center}°)`;

    if (isAutoAlign && compassPanMode === 'wuxiang') applyAutoAlign(heading);
}