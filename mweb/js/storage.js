// ==========================================
// js/storage.js
// Local-First 案例儲存庫引擎 (修復斷語空格 · 深色高亮載入卡片)
// ==========================================

const DB_NAME = 'QimenDB';
const STORE_NAME = 'cases';
let dbInstance = null;

// 記錄目前盤面正在檢視的案例
let activeCase = null;
// 記錄當前彈窗是「儲存/更新」還是「另存新案」
let isSaveAsNewMode = false;

// 產生唯一的案例編號 (UUID)
function generateCaseId() {
    const d = new Date();
    const datePart = `${d.getFullYear().toString().slice(-2)}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}`;
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CASE-${datePart}-${randomPart}`;
}

// 初始化資料庫
async function initDB() {
    if (dbInstance) return dbInstance;
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 2);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => { dbInstance = req.result; resolve(dbInstance); };
        req.onerror = () => reject(req.error);
    });
}

// 輕量古風 Toast 提示訊息 (無 Emoji)
function showToast(msg) {
    let toast = document.getElementById('qm-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'qm-toast';
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D2319] text-[#F8F4EC] border border-[#C5A06A]/60 px-5 py-2 rounded-xl text-sm font-bold shadow-2xl z-[100] transition-opacity duration-300 pointer-events-none opacity-0';
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.classList.remove('opacity-0');
    toast.classList.add('opacity-100');
    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0');
    }, 2000);
}

// ====== 右側欄 Tab 切換邏輯 ======
function openRightPanelTab(tabName) {
    const panel = document.getElementById('right-side-panel');
    const mainPanel = document.getElementById('main-panel');
    if (!panel || !mainPanel) return;
    
    panel.classList.remove('hidden');
    mainPanel.classList.replace('lg:col-span-12', 'lg:col-span-8');
    
    if (window.innerWidth < 1024) {
        setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }

    switchRightTab(tabName);
}

function closeRightPanel() {
    const panel = document.getElementById('right-side-panel');
    const mainPanel = document.getElementById('main-panel');
    if (!panel || !mainPanel) return;

    panel.classList.add('hidden');
    mainPanel.classList.replace('lg:col-span-8', 'lg:col-span-12');
}

function switchRightTab(tabName) {
    const btnCases = document.getElementById('tab-btn-cases');
    const btnFilter = document.getElementById('tab-btn-filter');
    const contentCases = document.getElementById('tab-content-cases');
    const contentFilter = document.getElementById('tab-content-filter');
    if (!btnCases || !btnFilter || !contentCases || !contentFilter) return;

    if (tabName === 'cases') {
        btnCases.className = "px-3 py-1.5 rounded-lg font-black text-sm transition-colors bg-[#2D2319] text-[#F8F4EC] shadow-sm";
        btnFilter.className = "px-3 py-1.5 rounded-lg font-black text-sm transition-colors bg-[#F5EFE4] text-[#786C5E] hover:bg-[#EAE1D0]";
        contentCases.classList.remove('hidden');
        contentFilter.classList.add('hidden');
        
        const searchInput = document.getElementById('case-search-input');
        renderCaseList(searchInput ? searchInput.value : '');
    } else {
        btnFilter.className = "px-3 py-1.5 rounded-lg font-black text-sm transition-colors bg-[#9E2A2B] text-[#F9F6F0] shadow-sm";
        btnCases.className = "px-3 py-1.5 rounded-lg font-black text-sm transition-colors bg-[#F5EFE4] text-[#786C5E] hover:bg-[#EAE1D0]";
        contentFilter.classList.remove('hidden');
        contentCases.classList.add('hidden');
    }
}

// ====== 案例儲存核心 (喚醒表單彈窗) ======
function saveCurrentCase(isSaveAsNew = false, customData = null) {
    if (!panData || !panData.ju) {
        showToast("請先起盤後再儲存案例！");
        return;
    }

    if (customData) {
        executeSaveCase(isSaveAsNew, customData);
        return;
    }

    isSaveAsNewMode = isSaveAsNew;
    const modal = document.getElementById('save-case-modal');
    if (!modal) return;

    const timeInfoEl = document.getElementById('save-case-time-info');
    if (timeInfoEl) {
        timeInfoEl.innerText = panData.bazi || '當前排盤時間';
    }

    const nameInput = document.getElementById('case-client-name');
    const notesTextarea = document.getElementById('case-notes');
    const statusSelect = document.getElementById('case-status');

    if (!isSaveAsNew && activeCase) {
        if (nameInput) nameInput.value = activeCase.clientName || '';
        if (notesTextarea) notesTextarea.value = (activeCase.notes || '').trim();
        if (statusSelect) statusSelect.value = activeCase.status || '等待反饋';
    } else {
        if (nameInput) nameInput.value = '';
        if (notesTextarea) notesTextarea.value = '';
        if (statusSelect) statusSelect.value = '等待反饋';
    }

    modal.classList.remove('hidden');
    if (nameInput) setTimeout(() => nameInput.focus(), 80);
}

function closeSaveCaseModal() {
    const modal = document.getElementById('save-case-modal');
    if (modal) modal.classList.add('hidden');
}

async function confirmSaveCase() {
    if (!panData || !panData.ju) {
        showToast("請先起盤後再儲存案例！");
        return;
    }

    const nameInput = document.getElementById('case-client-name');
    const notesTextarea = document.getElementById('case-notes');
    const statusSelect = document.getElementById('case-status');

    const clientName = nameInput ? nameInput.value.trim() : "";
    if (!clientName) {
        alert("請輸入問事人或案例標籤！");
        if (nameInput) nameInput.focus();
        return;
    }

    const status = statusSelect ? statusSelect.value : "等待反饋";
    const notes = notesTextarea ? notesTextarea.value.trim() : "";

    closeSaveCaseModal();

    await executeSaveCase(isSaveAsNewMode, {
        clientName: clientName,
        status: status,
        notes: notes
    });

    openRightPanelTab('cases');
}

async function executeSaveCase(isSaveAsNew, data) {
    const y = document.getElementById('sel-year')?.value || 2026;
    const m = document.getElementById('sel-month')?.value || 1;
    const d = document.getElementById('sel-day')?.value || 1;
    const h = document.getElementById('sel-hour24')?.value || 12;
    const min = document.getElementById('sel-minute')?.value || 0;
    const qimenMethod = document.getElementById('sel-qimen-method') ? document.getElementById('sel-qimen-method').value : 'chaibu';
    const now = Date.now();

    const caseData = {
        caseId: (activeCase && !isSaveAsNew && activeCase.caseId) ? activeCase.caseId : generateCaseId(),
        clientName: data.clientName || "未命名案例",
        status: data.status || "等待反饋",
        notes: (data.notes || "").trim(),
        baziStr: panData.bazi || "",
        ju: panData.ju || "",
        qimenMethod: qimenMethod,
        timeData: { y, m, d, h, min },
        createdAt: (activeCase && !isSaveAsNew && activeCase.createdAt) ? activeCase.createdAt : now,
        updatedAt: now
    };

    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    if (activeCase && !isSaveAsNew && activeCase.id) {
        store.delete(activeCase.id);
    }
    
    return new Promise((resolve) => {
        const req = store.add(caseData);
        req.onsuccess = (e) => {
            caseData.id = e.target.result;
            setActiveCase(caseData);
            showToast(isSaveAsNew ? '已另存為新案例！' : '案例已更新儲存！');
            renderCaseList(document.getElementById('case-search-input')?.value || '');
            resolve(caseData);
        };
    });
}

function setActiveCase(caseData) {
    activeCase = caseData;
    const bar = document.getElementById('active-case-bar');
    if (!bar) return;

    if (!caseData) {
        bar.classList.add('hidden');
        bar.classList.remove('flex');
        return;
    }
    
    bar.classList.remove('hidden');
    bar.classList.add('flex');
    
    const idEl = document.getElementById('active-case-id');
    const nameEl = document.getElementById('active-case-name');
    const statusEl = document.getElementById('active-case-status');

    if (idEl) idEl.innerText = caseData.caseId;
    if (nameEl) nameEl.innerText = caseData.clientName;
    
    const statusColors = {
        '等待反饋': 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]',
        '完全應驗': 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]',
        '待覆盤': 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
    };
    const sc = statusColors[caseData.status] || statusColors['等待反饋'];
    if (statusEl) {
        statusEl.className = `text-xs px-1.5 py-0.5 rounded border font-bold ${sc}`;
        statusEl.innerText = caseData.status;
    }
}

function clearActiveCase() {
    activeCase = null;
    setActiveCase(null);
    showToast("已解除案例關聯，恢復自由起盤模式");
}

// ====== 案例列表與行內編輯 (修復空格與深色高亮) ======
async function renderCaseList(searchTerm = "") {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();

    req.onsuccess = () => {
        let cases = req.result;
        
        const groups = {};
        cases.forEach(c => {
            if (!c.caseId) c.caseId = `OLD-${c.id}`; 
            if (!groups[c.caseId]) groups[c.caseId] = [];
            groups[c.caseId].push(c);
        });

        let displayList = [];
        for (let caseId in groups) {
            let sortedGrp = groups[caseId].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
            sortedGrp.forEach((item, index) => {
                item.isOldVersion = (index > 0);
                displayList.push(item);
            });
        }

        displayList.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));

        if (searchTerm) {
            searchTerm = searchTerm.toLowerCase();
            displayList = displayList.filter(c => c.clientName.toLowerCase().includes(searchTerm) || (c.notes && c.notes.toLowerCase().includes(searchTerm)) || c.caseId.toLowerCase().includes(searchTerm));
        }

        const container = document.getElementById('case-list-container');
        if (!container) return;

        if (displayList.length === 0) {
            container.innerHTML = `<div class="text-center text-[#8C887B] py-10 font-bold text-sm">目前沒有符合條件的案例資料。</div>`;
            return;
        }

        let html = '';
        displayList.forEach(c => {
            const validTime = c.updatedAt || c.createdAt || Date.now();
            const date = new Date(validTime);
            const dateStr = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
            
            const statusColors = {
                '等待反饋': 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]',
                '完全應驗': 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]',
                '待覆盤': 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
            };
            const sc = statusColors[c.status] || statusColors['等待反饋'];
            
            // 🌟 1. 徹底解決樣式覆蓋衝突：明確區分當前導入 vs 歷史版本 vs 一般案例
            const isActive = activeCase && (activeCase.id === c.id || activeCase.caseId === c.caseId);
            let cardBgBorderClass = '';
            let activeBadge = '';

            if (isActive) {
                // 深色高亮：深雅松柏綠底色、加粗墨綠外框與微立體陰影
                cardBgBorderClass = 'border-2 border-[#2A5235] bg-[#DCECE2] shadow-md';
                activeBadge = `<span class="text-xs bg-[#2A5235] text-white px-2 py-0.5 rounded font-black tracking-wider ml-1.5 shadow-sm">當前載入</span>`;
            } else if (c.isOldVersion) {
                cardBgBorderClass = 'border-[#E6BAB9] bg-[#FDF2F0]/50';
            } else {
                cardBgBorderClass = 'border-[#C5A06A]/50 bg-white/90 hover:border-[#9E2A2B]';
            }

            const oldBadge = c.isOldVersion ? `<span class="text-xs bg-[#FEE2E2] text-[#991B1B] px-1.5 py-0.5 rounded border border-[#FCA5A5] ml-1.5 font-bold">歷史舊版</span>` : '';

            // 🌟 2. 徹底消除前導無用空格：將文字與 div 標籤緊貼，不產生任何樣板字串縮排空白
            const cleanNotes = (c.notes || '').trim();
            const notesBlock = cleanNotes ? `
                <div class="mt-2 mb-3 p-3 bg-[rgba(248,241,227,0.7)] border border-[#C5A06A]/40 rounded-xl text-left shadow-sm">
                    <div class="text-xs font-black text-[#4A3319] mb-1">斷語與筆記：</div>
                    <div class="text-sm text-[#26211C] whitespace-pre-wrap font-bold leading-relaxed max-h-52 overflow-y-auto pr-1">${cleanNotes}</div>
                </div>
            ` : `<div class="text-xs text-[#8C887B] italic mb-2">（暫無斷語筆記）</div>`;

            html += `
            <div id="case-card-${c.id}" class="rounded-xl p-3.5 shadow-sm mb-3 text-left transition-all ${cardBgBorderClass}">
                
                <div id="case-view-${c.id}">
                    <div class="flex justify-between items-start mb-1.5">
                        <div>
                            <div class="flex items-center flex-wrap gap-1">
                                <h4 class="font-black text-lg text-[#26211C] leading-snug">${c.clientName}</h4>
                                ${activeBadge}
                                ${oldBadge}
                            </div>
                            <div class="text-xs text-[#8C887B] font-mono mt-0.5">${c.caseId}</div>
                        </div>
                        <span class="text-xs px-2 py-0.5 rounded border font-black ${sc}">${c.status}</span>
                    </div>
                    <div class="text-xs text-[#8C887B] font-bold mb-1.5">更新於 ${dateStr}</div>
                    <div class="text-xs text-[#4A3319] bg-[rgba(248,241,227,0.5)] p-2 rounded-lg mb-2 font-bold leading-relaxed border border-[#C5A06A]/30 break-words">
                        ${c.ju} ｜ ${c.baziStr}
                    </div>
                    
                    ${notesBlock}
                    
                    <div class="flex justify-end gap-1.5 border-t border-[#C5A06A]/30 pt-2.5">
                        <button onclick="deleteCase(${c.id})" class="text-xs text-[#9E2A2B] hover:text-[#7A2021] font-bold px-2.5 py-1 rounded border border-[#E6BAB9] hover:bg-[#FDF2F0] transition">刪除</button>
                        <button onclick="openInlineEdit(${c.id})" class="text-xs text-[#4A3319] hover:text-black font-bold px-2.5 py-1 rounded border border-[#D1C2A5] hover:bg-[#FAF6EE] transition">編輯</button>
                        <button onclick="loadCase(${c.id})" class="text-xs text-white bg-[#2D2319] hover:bg-[#443526] font-bold px-3 py-1 rounded-lg shadow transition">${isActive ? '重新載入' : '載入盤面'}</button>
                    </div>
                </div>

                <div id="case-edit-${c.id}" class="hidden space-y-2">
                    <input type="text" id="edit-name-${c.id}" value="${c.clientName}" class="w-full p-1.5 text-sm border border-[#C5A06A]/60 rounded-lg font-bold outline-none focus:border-[#9E2A2B] bg-white text-[#26211C]">
                    <select id="edit-status-${c.id}" class="w-full p-1.5 text-xs border border-[#C5A06A]/60 rounded-lg font-bold outline-none bg-white text-[#26211C]">
                        <option value="等待反饋" ${c.status === '等待反饋' ? 'selected' : ''}>等待反饋</option>
                        <option value="完全應驗" ${c.status === '完全應驗' ? 'selected' : ''}>完全應驗</option>
                        <option value="待覆盤" ${c.status === '待覆盤' ? 'selected' : ''}>有待覆盤</option>
                    </select>
                    <textarea id="edit-notes-${c.id}" rows="5" class="w-full p-2 text-xs border border-[#C5A06A]/60 rounded-lg font-bold outline-none resize-none focus:border-[#9E2A2B] bg-white text-[#26211C]">${(c.notes || '').trim()}</textarea>
                    <div class="flex justify-end gap-2 pt-1">
                        <button onclick="cancelInlineEdit(${c.id})" class="text-xs bg-[#F5EFE4] hover:bg-[#EAE1D0] text-[#3C2A1E] font-bold px-3 py-1.5 rounded-lg border border-[#D1C2A5] transition">取消</button>
                        <button onclick="saveInlineEdit(${c.id})" class="text-xs bg-[#385E48] hover:bg-[#2C4A38] text-white font-bold px-4 py-1.5 rounded-lg shadow transition">儲存修改</button>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    };
}

function openInlineEdit(id) {
    document.getElementById(`case-view-${id}`)?.classList.add('hidden');
    document.getElementById(`case-edit-${id}`)?.classList.remove('hidden');
}

function cancelInlineEdit(id) {
    document.getElementById(`case-edit-${id}`)?.classList.add('hidden');
    document.getElementById(`case-view-${id}`)?.classList.remove('hidden');
}

async function saveInlineEdit(id) {
    const newName = document.getElementById(`edit-name-${id}`).value.trim();
    const newStatus = document.getElementById(`edit-status-${id}`).value;
    const newNotes = document.getElementById(`edit-notes-${id}`).value.trim();
    const now = Date.now();

    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => {
        let caseData = req.result;
        if (!caseData) return;
        
        caseData.clientName = newName || "未命名案例";
        caseData.status = newStatus;
        caseData.notes = newNotes;
        caseData.updatedAt = now;

        store.put(caseData);
        tx.oncomplete = () => {
            showToast('案例資料已更新');
            if (activeCase && activeCase.id === id) setActiveCase(caseData);
            renderCaseList(document.getElementById('case-search-input')?.value || '');
        };
    };
}

async function loadCase(id) {
    const db = await initDB();
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
        const c = req.result;
        if (c && typeof applyBaziResult === 'function') {
            const methodSel = document.getElementById('sel-qimen-method');
            if (methodSel) {
                if (c.qimenMethod) {
                    methodSel.value = c.qimenMethod;
                } else if (c.ju) {
                    if (c.ju.includes('陰盤')) methodSel.value = 'yinpan';
                    else if (c.ju.includes('置閏')) methodSel.value = 'zhirun';
                    else methodSel.value = 'chaibu';
                }
            }

            setActiveCase(c);
            applyBaziResult(c.timeData.y, c.timeData.m, c.timeData.d, c.timeData.h, c.timeData.min);
            renderCaseList(document.getElementById('case-search-input')?.value || '');
            showToast(`已載入案例：${c.clientName}`);
            
            if (window.innerWidth < 1024) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                closeRightPanel();
            }
        }
    };
}

async function deleteCase(id) {
    if (!confirm("確定要永久刪除此案例嗎？")) return;
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
        if (activeCase && activeCase.id === id) clearActiveCase();
        renderCaseList(document.getElementById('case-search-input')?.value || '');
        showToast('案例已刪除');
    };
}

function triggerImport() { 
    document.getElementById('case-import-file')?.click(); 
}

async function exportCasesDB() {
    const db = await initDB();
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
        const data = req.result;
        if (data.length === 0) { alert("沒有案例可以匯出。"); return; }
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `奇門案例備份_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
}

function importCasesDB(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importData = JSON.parse(e.target.result);
            if (!Array.isArray(importData)) throw new Error("格式錯誤");
            
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const existReq = store.getAll();

            existReq.onsuccess = () => {
                const existingCases = existReq.result;
                let importedCount = 0;

                importData.forEach(incoming => {
                    const isExactDuplicate = existingCases.some(local => local.caseId === incoming.caseId && local.updatedAt === incoming.updatedAt);
                    if (!isExactDuplicate) {
                        delete incoming.id;
                        store.add(incoming);
                        importedCount++;
                    }
                });

                tx.oncomplete = () => {
                    renderCaseList();
                    showToast(`成功匯入 ${importedCount} 筆新資料！`);
                    event.target.value = ''; 
                };
            };
        } catch (err) {
            alert("匯入失敗：檔案格式不正確或損毀。");
        }
    };
    reader.readAsText(file);
}

function saveAiResultToCase() {
    const aiContent = document.getElementById('ai-result-content');
    if (!aiContent || !aiContent.innerText.trim()) {
        showToast("無可儲存的 AI 斷語內容。");
        return;
    }
    const aiText = aiContent.innerText.trim();
    const cat = document.getElementById('ai-question-category')?.value || 'AI 解盤';
    
    saveCurrentCase(false, {
        clientName: activeCase ? activeCase.clientName : `${cat}`,
        notes: (activeCase && activeCase.notes) ? `${activeCase.notes}\n\n【AI 宗師斷語】\n${aiText}` : `【AI 宗師斷語】\n${aiText}`,
        status: activeCase ? activeCase.status : "等待反饋"
    });
}
