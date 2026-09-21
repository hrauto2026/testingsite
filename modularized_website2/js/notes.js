// ==========================================
// js/notes.js
// 處理注解功能、匯出 TXT 與分享連結
// ==========================================

function updateNoteCounter() {
    const input = document.getElementById('note-input');
    const counter = document.getElementById('note-counter');
    if (input && counter) {
        counter.innerText = input.value.length;
    }
}

function exportNoteTxt() {
    const noteText = document.getElementById('note-input').value.trim();
    if (!noteText) {
        alert("注解內容為空，請先輸入注解文字。");
        return;
    }
    
    // panData 與 currentYiMaPalace 來自於主程式域，將在 engine-chaibu 中宣告為全域變數
    const baziLine = (typeof panData !== 'undefined' && panData.bazi) 
        ? (panData.bazi + (panData.special ? " " + panData.special : "") + (panData.stemStatus ? " " + panData.stemStatus : "")) 
        : "";
    
    let content = `【奇門遁甲 - 排盤資料與注解】\n`;
    if (baziLine) {
        content += `時間：${baziLine}\n`;
        content += `局數：${panData.ju || '-'}\n`;
        content += `旬首：${panData.xun || '-'}\n`;
        content += `值符：${panData.zf || '-'} ｜ 值使：${panData.zs || '-'}\n`;
        content += `空亡：${panData.kw || '-'} ｜ 驛馬：${typeof currentYiMaPalace !== 'undefined' ? currentYiMaPalace : '-'}\n`;
    }
    content += `--------------------------------------------------\n`;
    content += `【注解內容】\n`;
    content += `${noteText}\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "奇門注解.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
}

function sharePanWithNote() {
    const noteText = document.getElementById('note-input').value.trim();
    if (!noteText) {
        alert("注解內容為空，如只需分享起盤時間，請點擊「分享起盤連結」。");
        return;
    }

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

    // 使用 LZString 壓縮注解文字縮短網址
    let compressed = "";
    if (typeof LZString !== 'undefined') {
        compressed = LZString.compressToEncodedURIComponent(noteText);
    } else {
        compressed = encodeURIComponent(noteText);
    }
    url.searchParams.set('note', compressed);

    navigator.clipboard.writeText(url.toString()).then(() => {
        alert("包含注解的分享連結已複製！另一位使用者開啟該 URL 即會顯示此排盤與注解。");
    }).catch(() => {
        let t = document.createElement("textarea"); 
        t.value = url.toString(); 
        document.body.appendChild(t); 
        t.select(); 
        document.execCommand("Copy"); 
        t.remove(); 
        alert("包含注解的分享連結已複製！另一位使用者開啟該 URL 即會顯示此排盤與注解。");
    });
}

function deleteNote() {
    const input = document.getElementById('note-input');
    if (!input || !input.value) return;
    if (confirm("確定要清除現有的注解文字嗎？")) {
        input.value = "";
        updateNoteCounter();
    }
}

function copyPan() {
    // 依賴於全局變數 panData, useXianTian, PALACES_XIAN, PALACES_HOU, currentYiMaPalace
    const ACTIVE_PALACES = (typeof useXianTian !== 'undefined' && useXianTian) ? PALACES_XIAN : PALACES_HOU;
    if (!panData) return;
    
    const baziLine = panData.bazi + (panData.special ? " " + panData.special : "") + (panData.stemStatus ? " " + panData.stemStatus : "");
    let text = `【奇門遁甲 - 拆補法排盤】\n時間：${baziLine}\n局數：${panData.ju}\n旬首：${panData.xun}\n值符：${panData.zf} | 值使：${panData.zs}\n空亡：${panData.kw} | 驛馬：${currentYiMaPalace}\n**解讀方法："奇門宮位：[穿壬十二天將(地支)] 神/星/門/天盤/地盤/驛馬或空亡(如有)"**\n----------------------\n`;
    for (let i = 1; i <= 9; i++) {
        if(i !== 5) {
            let pName = ACTIVE_PALACES[i].name;
            text += `${pName}：${panData.palaces[pName]}\n`;
        }
    }
    navigator.clipboard.writeText(text).then(() => alert("資料已複製！")).catch(() => { 
        let t = document.createElement("textarea"); 
        t.value = text; document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); alert("資料已複製！"); 
    });
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
        t.value = url.toString(); document.body.appendChild(t); t.select(); document.execCommand("Copy"); t.remove(); 
        alert("分享連結已複製！貼上即可分享目前的排盤時間。");
    });
}