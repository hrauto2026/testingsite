// ==========================================
// js/storage.js
// Local-First 案例儲存庫引擎 (IndexedDB)
// ==========================================

const DB_NAME = 'QimenDB';
const STORE_NAME = 'cases';
let dbInstance = null;

// 初始化資料庫
async function initDB() {
    if (dbInstance) return dbInstance;
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
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

// 開啟「儲存本局案例」彈窗
async function openSaveCaseModal() {
    if (!panData || !panData.ju) {
        alert("請先起盤後再進行儲存！");
        return;
    }
    document.getElementById('save-case-modal').classList.remove('hidden');
    document.getElementById('case-client-name').value = '';
    document.getElementById('case-notes').value = '';
    document.getElementById('case-status').value = '等待反饋';
    
    document.getElementById('save-case-time-info').innerText = `${panData.bazi}\n局數：${panData.ju}`;
}

// 關閉儲存彈窗
function closeSaveCaseModal() {
    document.getElementById('save-case-modal').classList.add('hidden');
}

// 確認儲存至 IndexedDB
async function confirmSaveCase() {
    const name = document.getElementById('case-client-name').value.trim() || '未命名案例';
    const status = document.getElementById('case-status').value;
    const notes = document.getElementById('case-notes').value.trim();

    const y = document.getElementById('sel-year').value;
    const m = document.getElementById('sel-month').value;
    const d = document.getElementById('sel-day').value;
    const h = document.getElementById('sel-hour24').value;
    const min = document.getElementById('sel-minute').value;

    const caseData = {
        clientName: name,
        status: status,
        notes: notes,
        baziStr: panData.bazi,
        ju: panData.ju,
        timeData: { y, m, d, h, min },
        createdAt: new Date().getTime()
    };

    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(caseData);
    tx.oncomplete = () => {
        closeSaveCaseModal();
        showToast('💾 案例已安全儲存至本機設備！');
    };
}

// 開啟「我的案例庫」彈窗
async function openCaseLibraryModal() {
    document.getElementById('case-library-modal').classList.remove('hidden');
    await renderCaseList();
}

// 關閉案例庫彈窗
function closeCaseLibraryModal() {
    document.getElementById('case-library-modal').classList.add('hidden');
}

// 渲染案例列表
async function renderCaseList(searchTerm = "") {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
        // 依據時間反向排序 (最新的在最上面)
        let cases = req.result.sort((a, b) => b.createdAt - a.createdAt);
        
        if (searchTerm) {
            searchTerm = searchTerm.toLowerCase();
            cases = cases.filter(c => c.clientName.toLowerCase().includes(searchTerm) || (c.notes && c.notes.toLowerCase().includes(searchTerm)));
        }

        const container = document.getElementById('case-list-container');
        if (cases.length === 0) {
            container.innerHTML = `<div class="text-center text-gray-500 py-10 font-bold">目前沒有符合的案例資料。</div>`;
            return;
        }

        let html = '';
        cases.forEach(c => {
            const date = new Date(c.createdAt);
            const dateStr = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`;
            
            const statusColors = {
                '等待反饋': 'bg-yellow-100 text-yellow-800 border-yellow-300',
                '完全應驗': 'bg-green-100 text-green-800 border-green-300',
                '待覆盤': 'bg-red-100 text-red-800 border-red-300'
            };
            const sc = statusColors[c.status] || statusColors['等待反饋'];

            html += `
            <div class="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm mb-3 text-left">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-black text-lg text-indigo-950">${c.clientName}</h4>
                        <div class="text-xs text-gray-400 font-bold mt-0.5">收錄於 ${dateStr}</div>
                    </div>
                    <span class="text-xs px-2 py-1 rounded border font-bold ${sc}">${c.status}</span>
                </div>
                <div class="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-2 font-bold leading-relaxed border border-gray-100">
                    <span class="text-gray-900">${c.ju}</span><br>${c.baziStr}
                </div>
                ${c.notes ? `<div class="text-sm text-gray-800 mb-3 whitespace-pre-wrap font-bold bg-amber-50/50 p-2 rounded">${c.notes}</div>` : ''}
                <div class="flex justify-end gap-2 border-t border-gray-100 pt-3">
                    <button onclick="deleteCase(${c.id})" class="text-xs text-red-600 hover:text-red-800 font-bold px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition">🗑️ 刪除</button>
                    <button onclick="loadCase(${c.id})" class="text-xs text-white bg-indigo-600 hover:bg-indigo-700 font-bold px-4 py-1.5 rounded-lg shadow transition">🔄 載入此盤</button>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    };
}

// 載入指定的案例盤面
async function loadCase(id) {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
        const c = req.result;
        if (c && typeof applyBaziResult === 'function') {
            closeCaseLibraryModal();
            applyBaziResult(c.timeData.y, c.timeData.m, c.timeData.d, c.timeData.h, c.timeData.min);
            showToast(`✅ 已還原案例：${c.clientName}`);
            
            // 手機版自動滾動回頂部
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
}

// 刪除案例
async function deleteCase(id) {
    if (!confirm("確定要永久刪除此案例嗎？刪除後無法還原。")) return;
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => {
        renderCaseList(document.getElementById('case-search-input').value);
        showToast('🗑️ 案例已刪除');
    };
}

// 匯出全部案例 (JSON)
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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
}

// 匯入案例備份檔
function triggerImport() { document.getElementById('case-import-file').click(); }

function importCasesDB(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) throw new Error("檔案格式不正確");
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            let imported = 0;
            data.forEach(item => {
                delete item.id; // 刪除舊ID讓系統重新遞增，避免衝突
                store.add(item);
                imported++;
            });
            tx.oncomplete = () => {
                renderCaseList();
                showToast(`✅ 成功匯入 ${imported} 筆案例！`);
                event.target.value = ''; // 重置 input
            };
        } catch (err) {
            alert("匯入失敗：檔案格式不正確或損毀。");
        }
    };
    reader.readAsText(file);
}