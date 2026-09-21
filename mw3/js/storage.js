// ==========================================
// js/storage.js
// Local-First 案例儲存庫引擎 (支援 Tab 切換、防撞車機制與版本控制)
// ==========================================

const DB_NAME = 'QimenDB';
const STORE_NAME = 'cases';
let dbInstance = null;

// 記錄目前盤面正在檢視的案例
let activeCase = null;

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
        const req = indexedDB.open(DB_NAME, 2); // 提升版本號
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

// ====== 右側欄 Tab 切換邏輯 ======
function openRightPanelTab(tabName) {
    const panel = document.getElementById('right-side-panel');
    const mainPanel = document.getElementById('main-panel');
    
    panel.classList.remove('hidden');
    mainPanel.classList.replace('lg:col-span-12', 'lg:col-span-8');
    
    // 手機版自動捲動
    if (window.innerWidth < 1024) {
        setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }

    switchRightTab(tabName);
}

function closeRightPanel() {
    document.getElementById('right-side-panel').classList.add('hidden');
    document.getElementById('main-panel').classList.replace('lg:col-span-8', 'lg:col-span-12');
}

function switchRightTab(tabName) {
    const btnCases = document.getElementById('tab-btn-cases');
    const btnFilter = document.getElementById('tab-btn-filter');
    const contentCases = document.getElementById('tab-content-cases');
    const contentFilter = document.getElementById('tab-content-filter');

    if (tabName === 'cases') {
        btnCases.className = "px-3 py-1.5 rounded-lg font-black text-sm transition-colors bg-indigo-600 text-white shadow-sm";
        btnFilter.className = "px-3 py-1.5 rounded-lg font-black text-sm transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200";
        contentCases.classList.remove('hidden');
        contentFilter.classList.add('hidden');
        renderCaseList();
    } else {
        btnFilter.className = "px-3 py-1.5 rounded-lg font-black text-sm transition-colors bg-amber-600 text-white shadow-sm";
        btnCases.className = "px-3 py-1.5 rounded-lg font-black text-sm transition-colors bg-gray-100 text-gray-500 hover:bg-gray-200";
        contentFilter.classList.remove('hidden');
        contentCases.classList.add('hidden');
    }
}

// ====== 案例儲存與更新 ======
async function saveCurrentCase(isSaveAsNew = false) {
    if (!panData || !panData.ju) {
        showToast("⚠️ 請先起盤後再儲存案例！");
        return;
    }

    const y = document.getElementById('sel-year').value;
    const m = document.getElementById('sel-month').value;
    const d = document.getElementById('sel-day').value;
    const h = document.getElementById('sel-hour24').value;
    const min = document.getElementById('sel-minute').value;
    const now = new Date().getTime();

    let caseData = {};

    if (!activeCase || isSaveAsNew) {
        // 新增個案
        let clientName = prompt("請輸入問事人姓名或事件標籤：", "未命名案例");
        if (clientName === null) return; // 按下取消
        
        caseData = {
            caseId: generateCaseId(),
            clientName: clientName.trim() || "未命名案例",
            status: "等待反饋",
            notes: "",
            baziStr: panData.bazi,
            ju: panData.ju,
            timeData: { y, m, d, h, min },
            createdAt: now,
            updatedAt: now
        };
    } else {
        // 更新現有個案 (保持相同的 caseId)
        caseData = {
            ...activeCase,
            baziStr: panData.bazi,
            ju: panData.ju,
            timeData: { y, m, d, h, min },
            updatedAt: now
        };
    }

    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // 若為更新，先刪除舊 ID，以新資料寫入 (確保 autoIncrement 推進，且 updatedAt 更新)
    if (activeCase && !isSaveAsNew && activeCase.id) {
        store.delete(activeCase.id);
    }
    
    const req = store.add(caseData);
    req.onsuccess = (e) => {
        caseData.id = e.target.result;
        setActiveCase(caseData);
        showToast(isSaveAsNew ? '💾 已另存為新案例！' : '💾 案例已更新儲存！');
        if (!document.getElementById('right-side-panel').classList.contains('hidden')) {
            renderCaseList();
        }
    };
}

function setActiveCase(caseData) {
    activeCase = caseData;
    const bar = document.getElementById('active-case-bar');
    if (!caseData) {
        bar.classList.add('hidden');
        bar.classList.remove('flex');
        return;
    }
    
    bar.classList.remove('hidden');
    bar.classList.add('flex');
    
    document.getElementById('active-case-id').innerText = caseData.caseId;
    document.getElementById('active-case-name').innerText = caseData.clientName;
    
    const statusColors = {
        '等待反饋': 'bg-yellow-100 text-yellow-800 border-yellow-300',
        '完全應驗': 'bg-green-100 text-green-800 border-green-300',
        '待覆盤': 'bg-red-100 text-red-800 border-red-300'
    };
    const sc = statusColors[caseData.status] || statusColors['等待反饋'];
    const statusEl = document.getElementById('active-case-status');
    statusEl.className = `text-xs px-1.5 py-0.5 rounded border font-bold ${sc}`;
    statusEl.innerText = caseData.status;
}

function clearActiveCase() {
    activeCase = null;
    setActiveCase(null);
    showToast("✖ 已解除案例關聯，恢復自由起盤模式");
}

// ====== 案例列表與行內編輯 ======
async function renderCaseList(searchTerm = "") {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();

    req.onsuccess = () => {
        let cases = req.result;
        
        // 核心邏輯：將案例依據 caseId 分組，藉此找出最新版與舊版 (防撞車機制)
        const groups = {};
        cases.forEach(c => {
            if (!groups[c.caseId]) groups[c.caseId] = [];
            groups[c.caseId].push(c);
        });

        let displayList = [];
        for (let caseId in groups) {
            // 依更新時間降序排列
            let sortedGrp = groups[caseId].sort((a, b) => b.updatedAt - a.updatedAt);
            // 第一筆為最新主版本，後續皆為衝突舊版
            sortedGrp.forEach((item, index) => {
                item.isOldVersion = (index > 0);
                displayList.push(item);
            });
        }

        // 全域排序：依照 updatedAt 降序
        displayList.sort((a, b) => b.updatedAt - a.updatedAt);

        if (searchTerm) {
            searchTerm = searchTerm.toLowerCase();
            displayList = displayList.filter(c => c.clientName.toLowerCase().includes(searchTerm) || (c.notes && c.notes.toLowerCase().includes(searchTerm)) || c.caseId.toLowerCase().includes(searchTerm));
        }

        const container = document.getElementById('case-list-container');
        if (displayList.length === 0) {
            container.innerHTML = `<div class="text-center text-gray-500 py-10 font-bold">目前沒有案例資料。</div>`;
            return;
        }

        let html = '';
        displayList.forEach(c => {
            const date = new Date(c.updatedAt);
            const dateStr = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
            
            const statusColors = {
                '等待反饋': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                '完全應驗': 'bg-green-100 text-green-800 border-green-300',
                '待覆盤': 'bg-red-100 text-red-800 border-red-300'
            };
            const sc = statusColors[c.status] || statusColors['等待反饋'];
            
            // 判斷是否為舊版，若是則加上紅色外框與警告
            const borderClass = c.isOldVersion ? 'border-red-400 shadow-md ring-1 ring-red-200 bg-red-50/20' : 'border-indigo-100 hover:border-indigo-300';
            const highlightActive = (activeCase && activeCase.id === c.id) ? 'ring-2 ring-indigo-500 bg-indigo-50' : '';
            const oldBadge = c.isOldVersion ? `<span class="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 ml-2 font-black">⚠️ 歷史舊版</span>` : '';

            html += `
            <div id="case-card-${c.id}" class="bg-white border rounded-xl p-4 shadow-sm mb-3 text-left transition-all ${borderClass} ${highlightActive}">
                
                <!-- 檢視模式 -->
                <div id="case-view-${c.id}">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h4 class="font-black text-base text-indigo-950">${c.clientName} ${oldBadge}</h4>
                            <div class="text-[10px] text-gray-400 font-mono mt-0.5">${c.caseId}</div>
                        </div>
                        <span class="text-[10px] px-1.5 py-0.5 rounded border font-bold ${sc}">${c.status}</span>
                    </div>
                    <div class="text-[11px] text-gray-500 font-bold mb-1.5">更新於 ${dateStr}</div>
                    <div class="text-[11px] text-gray-600 bg-gray-50 p-1.5 rounded mb-2 font-bold leading-relaxed border border-gray-100 truncate">
                        ${c.ju} | ${c.baziStr}
                    </div>
                    ${c.notes ? `<div class="text-xs text-gray-800 mb-3 whitespace-pre-wrap font-bold bg-amber-50/50 p-2 rounded line-clamp-3">${c.notes}</div>` : ''}
                    
                    <div class="flex justify-end gap-1.5 border-t border-gray-100 pt-2.5">
                        <button onclick="deleteCase(${c.id})" class="text-[11px] text-red-600 hover:text-red-800 font-bold px-2.5 py-1 rounded border border-red-100 hover:bg-red-50 transition">刪除</button>
                        <button onclick="openInlineEdit(${c.id})" class="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold px-2.5 py-1 rounded border border-indigo-100 hover:bg-indigo-50 transition">✏️ 編輯</button>
                        <button onclick="loadCase(${c.id})" class="text-[11px] text-white bg-indigo-600 hover:bg-indigo-700 font-bold px-3 py-1 rounded shadow transition">🔄 載入盤面</button>
                    </div>
                </div>

                <!-- 編輯模式 (預設隱藏) -->
                <div id="case-edit-${c.id}" class="hidden space-y-2">
                    <input type="text" id="edit-name-${c.id}" value="${c.clientName}" class="w-full p-1.5 text-sm border border-indigo-300 rounded font-bold outline-none focus:ring-1 focus:ring-indigo-500">
                    <select id="edit-status-${c.id}" class="w-full p-1.5 text-sm border border-indigo-300 rounded font-bold outline-none">
                        <option value="等待反饋" ${c.status === '等待反饋' ? 'selected' : ''}>🟡 等待反饋</option>
                        <option value="完全應驗" ${c.status === '完全應驗' ? 'selected' : ''}>🟢 完全應驗</option>
                        <option value="待覆盤" ${c.status === '待覆盤' ? 'selected' : ''}>🔴 有待覆盤</option>
                    </select>
                    <textarea id="edit-notes-${c.id}" rows="4" class="w-full p-1.5 text-sm border border-indigo-300 rounded font-bold outline-none resize-none focus:ring-1 focus:ring-indigo-500">${c.notes || ''}</textarea>
                    <div class="flex justify-end gap-2 pt-1">
                        <button onclick="cancelInlineEdit(${c.id})" class="text-xs bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded transition">取消</button>
                        <button onclick="saveInlineEdit(${c.id})" class="text-xs bg-teal-600 text-white font-bold px-4 py-1.5 rounded shadow transition">💾 儲存修改</button>
                    </div>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    };
}

function openInlineEdit(id) {
    document.getElementById(`case-view-${id}`).classList.add('hidden');
    document.getElementById(`case-edit-${id}`).classList.remove('hidden');
}

function cancelInlineEdit(id) {
    document.getElementById(`case-edit-${id}`).classList.add('hidden');
    document.getElementById(`case-view-${id}`).classList.remove('hidden');
}

async function saveInlineEdit(id) {
    const newName = document.getElementById(`edit-name-${id}`).value.trim();
    const newStatus = document.getElementById(`edit-status-${id}`).value;
    const newNotes = document.getElementById(`edit-notes-${id}`).value.trim();
    const now = new Date().getTime();

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
            showToast('✅ 案例資料已更新');
            // 如果剛好是正在查看的案例，更新頂部狀態條
            if (activeCase && activeCase.id === id) setActiveCase(caseData);
            renderCaseList(document.getElementById('case-search-input').value);
        };
    };
}

async function loadCase(id) {
    const db = await initDB();
    const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
        const c = req.result;
        if (c && typeof applyBaziResult === 'function') {
            setActiveCase(c);
            applyBaziResult(c.timeData.y, c.timeData.m, c.timeData.d, c.timeData.h, c.timeData.min);
            renderCaseList(document.getElementById('case-search-input').value); // 刷新列表以顯示高亮
            showToast(`✅ 已載入案例：${c.clientName}`);
            
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
        renderCaseList(document.getElementById('case-search-input').value);
        showToast('🗑️ 案例已刪除');
    };
}

// ====== 匯出與智慧匯入機制 ======
function triggerImport() { document.getElementById('case-import-file').click(); }

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
                    // 尋找本機是否有相同 caseId 且 updatedAt 也完全相同的資料
                    const isExactDuplicate = existingCases.some(local => local.caseId === incoming.caseId && local.updatedAt === incoming.updatedAt);
                    
                    if (!isExactDuplicate) {
                        delete incoming.id; // 讓 IndexedDB 重新分配主鍵 ID，避免主鍵衝突
                        store.add(incoming);
                        importedCount++;
                    }
                });

                tx.oncomplete = () => {
                    renderCaseList();
                    showToast(`✅ 成功匯入 ${importedCount} 筆新資料！(已自動略過重複)`);
                    event.target.value = ''; 
                };
            };
        } catch (err) {
            alert("匯入失敗：檔案格式不正確或損毀。");
        }
    };
    reader.readAsText(file);
}