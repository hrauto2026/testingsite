// services/compass_service.js
// 奇門指南針風水羅盤：感測器濾波、廿四山刻度繪製與微縮九宮格即時旋轉服務
let compassPanMode = 'shijia'; // 確保有這一行宣告，預設為時家盤
let compassActiveListenerType = null;
let currentContinuousRotation = 0; // 連續旋轉角度（避免 0/360 度跨界倒轉）
let smoothedHeading = null;        // EMA 低通平滑濾波角度

// 取得 24 山與卦位資訊
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

// 取得八方方位名稱
function getDirectionName(deg) {
    const dirs = [
        { name: "正北", start: 337.5, end: 22.5 },
        { name: "東北", start: 22.5, end: 67.5 },
        { name: "正東", start: 67.5, end: 112.5 },
        { name: "東南", start: 112.5, end: 157.5 },
        { name: "正南", start: 157.5, end: 202.5 },
        { name: "西南", start: 202.5, end: 247.5 },
        { name: "正西", start: 247.5, end: 292.5 },
        { name: "西北", start: 292.5, end: 337.5 }
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

// 繪製外圈 24 山與加長四正（子卯午酉）SVG 刻度盤
function renderCompassSvgDial() {
    const svg = document.getElementById('compass-svg-dial');
    if (!svg) return;
    const cx = 220, cy = 220, rOut = 216, rMid = 176, rIn = 162;
    let html = `
        <circle cx="${cx}" cy="${cy}" r="${rOut}" fill="#050b14" stroke="#d97706" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy}" r="${rMid}" fill="#0f172a" stroke="#78350f" stroke-width="1.5"/>
        <circle cx="${cx}" cy="${cy}" r="${rIn}" fill="#020617" stroke="#d97706" stroke-width="1.5"/>
    `;

    for (let deg = 0; deg < 360; deg += 5) {
        let dialAngle = (deg - 180 + 360) % 360;
        let rad = dialAngle * Math.PI / 180;
        
        let isMajorCardinal = (deg === 0 || deg === 90 || deg === 180 || deg === 270);
        let is10 = (deg % 10 === 0);
        let is30 = (deg % 30 === 0);

        let len = isMajorCardinal ? 16 : (is30 ? 9 : (is10 ? 6 : 3.5));
        let x1 = cx + (rOut - 2) * Math.sin(rad);
        let y1 = cy - (rOut - 2) * Math.cos(rad);
        let x2 = cx + (rOut - 2 - len) * Math.sin(rad);
        let y2 = cy - (rOut - 2 - len) * Math.cos(rad);

        let strokeColor = isMajorCardinal ? '#f87171' : (is30 ? '#fbbf24' : (is10 ? '#94a3b8' : '#475569'));
        let strokeWidth = isMajorCardinal ? 2.5 : (is30 ? 1.5 : 1);

        html += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;
    }

    MOUNTAINS_24.forEach(m => {
        let dialAngle = (m.center - 180 + 360) % 360;
        let boundaryDialAngle = (dialAngle - 7.5 + 360) % 360;
        let bRad = boundaryDialAngle * Math.PI / 180;
        
        let bx1 = cx + rOut * Math.sin(bRad);
        let by1 = cy - rOut * Math.cos(bRad);
        let bx2 = cx + rIn * Math.sin(bRad);
        let by2 = cy - rIn * Math.cos(bRad);
        html += `<line x1="${bx1}" y1="${by1}" x2="${bx2}" y2="${by2}" stroke="#78350f" stroke-width="1" opacity="0.6"/>`;

        let tRad = dialAngle * Math.PI / 180;
        let textR = (rMid + rOut - 10) / 2 + 2;
        let tx = cx + textR * Math.sin(tRad);
        let ty = cy - textR * Math.cos(tRad);
        
        let fontSize = m.isMajor ? "12" : "10";
        let fontWeight = m.isMajor ? "900" : "700";
        html += `<text x="${tx}" y="${ty}" fill="${m.color}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="middle" dominant-baseline="central" transform="rotate(${dialAngle}, ${tx}, ${ty})">${m.name}</text>`;
    });

    svg.innerHTML = html;
}

// 渲染羅盤微縮九宮格（支援時家盤與屋向盤雙模式切換）
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
                let s = data ? data.hStems[0] : "";
                let b5 = panData.bazi5Info;
                html += `
                <div class="flex flex-col justify-between p-1 bg-slate-900/95 border border-amber-500/40 rounded text-center text-white overflow-hidden shadow-inner">
                    <div class="flex justify-between items-center text-[9px] sm:text-[10px] font-black border-b border-gray-700/60 pb-0.5">
                        <span class="text-amber-300">中五</span>
                        <span class="bg-rose-900/90 text-rose-200 px-1 rounded text-[8px] sm:text-[9px] font-mono">${feixingStr}</span>
                    </div>
                    <div class="flex flex-col justify-center items-center my-auto leading-none space-y-0.5">
                        <div class="text-[9px] text-amber-200 font-bold">${b5 ? b5.hS+b5.hB+'時' : ''}</div>
                        <div class="text-[9px] text-gray-300 scale-90">符:${b5?b5.zf:''}</div>
                        <div class="text-[9px] text-gray-300 scale-90">使:${b5?b5.zs:''}</div>
                    </div>
                    <div class="text-[10px] text-right font-black text-amber-400 mt-auto">${s}</div>
                </div>`;
            } else if (data) {
                let pGua = PALACES_HOU[pNum].gua;
                let tags = [];
                if (data.isKong) tags.push("🈳");
                if (data.isMa) tags.push("🐎");
                if (data.isMenPo) tags.push("迫");
                let tagDisplay = tags.length ? `<span class="text-[8px] text-red-400 ml-0.5">${tags.join('')}</span>` : '';

                html += `
                <div class="flex flex-col justify-between p-1 bg-slate-950/95 border border-slate-800 rounded text-white overflow-hidden shadow">
                    <div class="flex justify-between items-center text-[9px] sm:text-[10px] font-black border-b border-slate-800 pb-0.5">
                        <span class="text-amber-300">${data.name} ${pGua}</span>
                        <span class="bg-rose-900/90 text-rose-200 px-1 rounded text-[8px] sm:text-[9px] font-mono">${feixingStr}</span>
                    </div>
                    <div class="flex flex-col items-start my-auto space-y-0.5 text-[10px] sm:text-[11px] font-black leading-tight w-full">
                        <span class="text-emerald-400 truncate w-full">${data.god}</span>
                        <span class="text-yellow-300 truncate w-full">${data.star}</span>
                        <div class="flex items-center w-full justify-between">
                            <span class="text-red-400 truncate">${data.door}</span>
                            ${tagDisplay}
                        </div>
                    </div>
                    <div class="flex justify-between items-end mt-auto pt-0.5 border-t border-slate-800 text-[10px] sm:text-[11px] font-black leading-none">
                        <span class="text-[8px] text-gray-500">${data.anGan||''}</span>
                        <div class="text-right">
                            <span class="text-cyan-300">${data.hStems.join('|')}</span>
                            <span class="text-gray-600 mx-0.5">/</span>
                            <span class="text-orange-300">${data.eStems.join('|')}</span>
                        </div>
                    </div>
                </div>`;
            }
        });
    } else {
        const yun = parseInt(document.getElementById('sel-compass-yun').value);
        const housePalace = parseInt(document.getElementById('sel-compass-house').value);
        const doorMountain = document.getElementById('sel-compass-door').value;
        const wx = calculateWuxiangData(yun, housePalace, doorMountain);

        order.forEach(pNum => {
            const pInfo = PALACES_HOU[pNum];

            if (pNum === 5) {
                const eNumZh = wx.CHINESE_NUMS[wx.earthNum[5]];
                html += `
                <div class="flex flex-col justify-between p-1 bg-slate-900/95 border border-indigo-500/50 rounded text-center text-white overflow-hidden shadow-inner">
                    <div class="flex justify-between items-center text-[9px] sm:text-[10px] font-black border-b border-indigo-900 pb-0.5">
                        <span class="text-indigo-300">中五</span>
                        <span class="bg-indigo-900 text-indigo-200 px-1 rounded text-[8px]">立極</span>
                    </div>
                    <div class="flex flex-col justify-center items-center my-auto leading-none space-y-1">
                        <div class="text-[10px] text-amber-300 font-bold">${wx.yun}運</div>
                        <div class="text-[8px] text-gray-400">符頭:${wx.fuTouStem}</div>
                        <div class="text-[8px] text-gray-400">符星:${wx.starLeader}</div>
                    </div>
                    <div class="flex justify-between items-end mt-auto text-[10px] font-mono font-bold">
                        <span class="text-amber-400">${eNumZh}</span>
                        <span class="text-orange-300">${wx.centerStem}</span>
                    </div>
                </div>`;
            } else {
                const isHouse = (pNum === housePalace);
                const isDoor = (pNum === wx.doorPalace);
                let badgeHtml = '';
                if (isHouse) badgeHtml += `<span class="bg-red-600 text-[8px] text-white px-0.5 rounded font-black">屋</span>`;
                if (isDoor) badgeHtml += `<span class="bg-blue-600 text-[8px] text-white px-0.5 rounded font-black">門</span>`;

                const eNumZh = wx.CHINESE_NUMS[wx.earthNum[pNum]];
                const god = wx.godPan[pNum];
                const star = wx.starPan[pNum];
                const door = wx.doorPan[pNum];
                const hStem = wx.heavenStemPan[pNum];
                const eStem = wx.earthStem[pNum];

                html += `
                <div class="flex flex-col justify-between p-1 bg-slate-950/95 border border-slate-800 rounded text-white overflow-hidden shadow">
                    <div class="flex justify-between items-center text-[9px] sm:text-[10px] font-black border-b border-slate-800 pb-0.5">
                        <span class="text-amber-300">${pInfo.name} ${pInfo.gua}</span>
                        <div class="flex items-center gap-0.5">${badgeHtml}</div>
                    </div>

                    <div class="flex flex-col items-start my-auto space-y-0.5 text-[10px] sm:text-[11px] font-black leading-tight w-full">
                        <span class="text-emerald-400 truncate w-full">${god}</span>
                        <span class="text-yellow-300 truncate w-full">${star}</span>
                        <span class="text-red-400 truncate w-full">${door}</span>
                    </div>

                    <div class="flex justify-between items-end mt-auto pt-0.5 border-t border-slate-800 text-[10px] sm:text-[11px] font-black leading-none">
                        <span class="text-amber-400 font-mono text-[9px]">${eNumZh}</span>
                        <div class="text-right">
                            <span class="text-cyan-300">${hStem}</span>
                            <span class="text-gray-600 mx-0.5">/</span>
                            <span class="text-orange-300">${eStem}</span>
                        </div>
                    </div>
                </div>`;
            }
        });
    }

    grid.innerHTML = html;
}

// 模式切換
function switchCompassPanMode(mode) {
    compassPanMode = mode;
    const btnShijia = document.getElementById('btn-mode-shijia');
    const btnWuxiang = document.getElementById('btn-mode-wuxiang');
    const subShijia = document.getElementById('compass-sub-shijia');
    const subWuxiang = document.getElementById('compass-sub-wuxiang');

    if (mode === 'shijia') {
        btnShijia.className = "px-2.5 py-1 text-xs font-black rounded bg-amber-500 text-slate-950 transition";
        btnWuxiang.className = "px-2.5 py-1 text-xs font-black rounded text-gray-300 hover:text-white transition";
        subShijia.classList.remove('hidden');
        subWuxiang.classList.add('hidden');
    } else {
        btnWuxiang.className = "px-2.5 py-1 text-xs font-black rounded bg-indigo-600 text-white transition";
        btnShijia.className = "px-2.5 py-1 text-xs font-black rounded text-gray-300 hover:text-white transition";
        subWuxiang.classList.remove('hidden');
        subShijia.classList.add('hidden');
    }
    renderCompassQimen();
}

// 朝向定為屋向
function setHouseByCurrentHeading() {
    const deg = parseInt(document.getElementById('compass-degree').innerText) || 0;
    const m = get24Mountain(deg);
    const houseMap = { '坎': 1, '艮': 8, '震': 3, '巽': 4, '離': 9, '坤': 2, '兌': 7, '乾': 6 };
    if (houseMap[m.gua]) {
        document.getElementById('sel-compass-house').value = houseMap[m.gua];
        renderCompassQimen();
        showToast(`已將當前朝向 (${m.gua}宮·${m.name}山) 設為屋向！`);
    }
}

// 打開指南針全螢幕模式
function openCompassMode() {
    if (!panData || !panData.ju) {
        generatePan();
    }
const modal = document.getElementById('compass-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
    const cFxSel = document.getElementById('sel-compass-feixing-year');
    if (cFxSel) {
        cFxSel.value = document.getElementById('sel-year').value;
    }
    
    renderCompassSvgDial();
    renderCompassQimen();
    startCompassSensor();
}

function changeCompassFeiXingYear() {
    renderCompassQimen();
}

function closeCompassMode() {
    const modal = document.getElementById('compass-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }

    const toggle = document.getElementById('toggle-compass');
    if (toggle && toggle.checked) toggle.checked = false;
}

// 鎖定切換
function toggleCompassLock() {
    isCompassLocked = !isCompassLocked;
    const icon = document.getElementById('compass-lock-icon');
    const txt = document.getElementById('compass-lock-text');
    const btn = document.getElementById('btn-compass-lock');
    
    if (isCompassLocked) {
        if (icon) icon.innerText = '🔒';
        if (txt) txt.innerText = '解鎖';
        if (btn) { 
            btn.classList.replace('border-gray-700', 'border-amber-500'); 
            btn.classList.add('text-amber-400'); 
        }
    } else {
        if (icon) icon.innerText = '🔓';
        if (txt) txt.innerText = '鎖定';
        if (btn) { 
            btn.classList.replace('border-amber-500', 'border-gray-700'); 
            btn.classList.remove('text-amber-400'); 
        }
    }
}

// 感測器監聽啟動
function startCompassSensor() {
    stopCompassSensor();

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permBtn = document.getElementById('btn-ios-perm');
        const hint = document.getElementById('compass-status-hint');
        
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleDeviceOrientation, true);
                    compassActiveListenerType = 'deviceorientation';
                    isCompassRunning = true;
                    if (permBtn) permBtn.classList.add('hidden');
                    if (hint) hint.innerText = '💡 轉動手機，奇門盤將自動對準方位實地堪輿';
                } else {
                    if (permBtn) permBtn.classList.remove('hidden');
                    if (hint) hint.innerText = '⚠️ 請授權指南針讀取：';
                }
            })
            .catch(err => {
                if (permBtn) permBtn.classList.remove('hidden');
                if (hint) hint.innerText = '⚠️ 請點擊按鈕啟用指南針：';
            });
    } else if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleDeviceOrientation, true);
        compassActiveListenerType = 'deviceorientationabsolute';
        isCompassRunning = true;
    } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation, true);
        compassActiveListenerType = 'deviceorientation';
        isCompassRunning = true;
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
    compassActiveListenerType = null;
    isCompassRunning = false;
    smoothedHeading = null;
}

function requestDeviceOrientationPerm() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(res => {
                if (res === 'granted') {
                    startCompassSensor();
                } else {
                    alert('指南針權限未開啟。');
                }
            })
            .catch(console.error);
    }
}

function handleDeviceOrientation(e) {
    if (isCompassLocked) return;
    let rawHeading = 0;

    if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
        rawHeading = e.webkitCompassHeading;
    } else if (e.alpha !== null && e.alpha !== undefined) {
        rawHeading = (360 - e.alpha) % 360;
    } else {
        return;
    }

    if (smoothedHeading === null) {
        smoothedHeading = rawHeading;
    } else {
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
    if (dial) {
        dial.style.transform = `rotate(${currentContinuousRotation}deg)`;
    }

    const degEl = document.getElementById('compass-degree');
    if (degEl) degEl.innerText = `${heading.toString().padStart(3, '0')}°`;

    const dirEl = document.getElementById('compass-direction-text');
    if (dirEl) dirEl.innerText = getDirectionName(heading);

    const mInfo = get24Mountain(heading);
    const mEl = document.getElementById('compass-mountain');
    if (mEl) mEl.innerText = `${mInfo.gua}宮 · ${mInfo.name}山 (${mInfo.center}°)`;
}