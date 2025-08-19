const API_BASE_URL = 'http://localhost:3000/api';

async function apiRequest(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('authToken');
        const authHeaders = token
            ? {
                'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
                'x-auth-token': token
            }
            : {};
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('aktifKullanici');
                if (!/index\.html$/.test(window.location.pathname)) {
                    window.location.href = 'index.html';
                }
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function cikisYap() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('aktifKullanici');
        localStorage.removeItem('authToken');
        window.location.href = 'index.html';
    }
    return false;
}

async function loadGelirGider() {
    const tbody = document.querySelector('#recordsTable');
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Yükleniyor...</td></tr>';
        const gelirGider = await apiRequest('/gelir-gider');
        
        tbody.innerHTML = '';
        
        if (!gelirGider || gelirGider.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Henüz gelir-gider kaydı bulunmuyor</td></tr>';
            return;
        }
        
        gelirGider.forEach(kayit => {
            const row = document.createElement('tr');
            const typeClass = kayit.tur === 'Gelir' ? 'income' : 'expense';
            const amountPrefix = kayit.tur === 'Gelir' ? '+' : '-';
            const statusClass = kayit.tur === 'Gelir' ? 'visited' : 'not-visited';
            
            row.setAttribute('data-record-id', kayit.id);
            
            const tarihCell = document.createElement('td');
            tarihCell.textContent = kayit.tarih;
            const aciklamaCell = document.createElement('td');
            aciklamaCell.textContent = kayit.aciklama;
            const kategoriCell = document.createElement('td');
            kategoriCell.textContent = kayit.kategori || '-';
            const tutarCell = document.createElement('td');
            tutarCell.className = typeClass;
            tutarCell.textContent = `${amountPrefix}${parseFloat(kayit.tutar).toLocaleString('tr-TR')} ₺`;
            const turCell = document.createElement('td');
            turCell.innerHTML = `<span class="status ${statusClass}">${kayit.tur}</span>`;
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="detail-btn" onclick="viewDetail(${kayit.id})" title="Detay Gör">👁️</button>
                <button class="edit-btn" onclick="editRecord(${kayit.id})" title="Düzenle">✏️</button>
                <button class="delete-btn" onclick="deleteRecord(${kayit.id})" title="Sil">🗑️</button>
            `;
            
            row.appendChild(tarihCell);
            row.appendChild(aciklamaCell);
            row.appendChild(kategoriCell);
            row.appendChild(tutarCell);
            row.appendChild(turCell);
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #f44336;">Veriler yüklenirken hata oluştu</td></tr>';
        console.error('Gelir-gider verileri yüklenirken hata:', error);
    }
}

let editingRecordId = null;

async function saveRecord() {
    const tarih = document.getElementById('recordDate').value;
    const aciklama = document.getElementById('recordDescription').value;
    const kategori = document.getElementById('recordCategory').value;
    const tur = document.getElementById('recordType').value;
    const tutar = parseFloat(document.getElementById('recordAmount').value);
    
    if (!tarih || !aciklama || !kategori || !tur || isNaN(tutar)) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }
    
    const kayitData = { tarih, aciklama, kategori, tur, tutar };
    
    try {
        if (editingRecordId) {
            await apiRequest(`/gelir-gider/${editingRecordId}`, {
                method: 'PUT',
                body: JSON.stringify(kayitData)
            });
            editingRecordId = null;
        } else {
            await apiRequest('/gelir-gider', {
                method: 'POST',
                body: JSON.stringify(kayitData)
            });
        }
        
        await loadGelirGider();
        await updateStats();
        closeModal();
    } catch (error) {
        alert('Kayıt kaydedilirken hata oluştu: ' + error.message);
    }
}

async function deleteRecord(id) {
    if (confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
        try {
            await apiRequest(`/gelir-gider/${id}`, { method: 'DELETE' });
            await loadGelirGider();
            await updateStats();
        } catch (error) {
            alert('Kayıt silinirken hata oluştu: ' + error.message);
        }
    }
}

function openAddModal() {
    editingRecordId = null;
    document.getElementById('modalTitle').innerText = '💰 Yeni Kayıt Ekle';
    document.getElementById('recordModal').style.display = 'block';
    clearForm();
    history.pushState({modal: true}, '', '');
}

function closeModal() {
    document.getElementById('recordModal').style.display = 'none';
}

function clearForm() {
    document.getElementById('recordDate').value = '';
    document.getElementById('recordDescription').value = '';
    document.getElementById('recordCategory').value = '';
    document.getElementById('recordType').value = '';
    document.getElementById('recordAmount').value = '';
}

async function editRecord(id) {
    try {
        const gelirGider = await apiRequest('/gelir-gider');
        const kayit = gelirGider.find(k => k.id === id);
        
        if (kayit) {
            editingRecordId = id;
            document.getElementById('modalTitle').innerText = '✏️ Kayıt Düzenle';
            document.getElementById('recordDate').value = kayit.tarih;
            document.getElementById('recordDescription').value = kayit.aciklama;
            document.getElementById('recordCategory').value = kayit.kategori || '';
            document.getElementById('recordType').value = kayit.tur;
            document.getElementById('recordAmount').value = kayit.tutar;
            document.getElementById('recordModal').style.display = 'block';
            history.pushState({modal: true}, '', '');
        }
    } catch (error) {
        alert('Kayıt bilgileri yüklenirken hata: ' + error.message);
    }
}

async function viewDetail(id) {
    const existingDetail = document.querySelector('.detail-row');
    if (existingDetail) {
        existingDetail.remove();
        return;
    }
    
    try {
        const gelirGider = await apiRequest('/gelir-gider');
        const kayit = gelirGider.find(k => k.id === id);
        
        if (kayit) {
            const rows = document.querySelectorAll('#recordsTable tr');
            let targetRow = null;
            
            rows.forEach(row => {
                if (row.getAttribute('data-record-id') == id) {
                    targetRow = row;
                }
            });
            
            if (targetRow) {
                const detailRow = document.createElement('tr');
                detailRow.className = 'detail-row';
                const detailCell = document.createElement('td');
                detailCell.colSpan = 6;
                detailCell.style.padding = '0';
                
                const detailDiv = document.createElement('div');
                detailDiv.style.cssText = 'padding: 15px; background: #f8f9fa; border-left: 3px solid #B22222;';
                
                const gridDiv = document.createElement('div');
                gridDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; margin-bottom: 10px; text-align: left;';
                
                const fields = [
                    ['Tarih', kayit.tarih],
                    ['Tip', kayit.tur],
                    ['Tutar', kayit.tutar + ' ₺'],
                    ['Kategori', kayit.kategori || '-']
                ];
                
                fields.forEach(([label, value]) => {
                    const fieldDiv = document.createElement('div');
                    fieldDiv.innerHTML = `<strong>${label}:</strong> `;
                    const valueSpan = document.createElement('span');
                    valueSpan.textContent = value;
                    fieldDiv.appendChild(valueSpan);
                    gridDiv.appendChild(fieldDiv);
                });
                
                detailDiv.appendChild(gridDiv);
                
                const aciklamaDiv = document.createElement('div');
                aciklamaDiv.style.cssText = 'margin-bottom: 10px; font-size: 0.9rem;';
                aciklamaDiv.innerHTML = '<strong>Açıklama:</strong> ';
                const aciklamaSpan = document.createElement('span');
                aciklamaSpan.textContent = kayit.aciklama;
                aciklamaDiv.appendChild(aciklamaSpan);
                detailDiv.appendChild(aciklamaDiv);
                
                const hideBtn = document.createElement('button');
                hideBtn.textContent = 'Gizle';
                hideBtn.style.cssText = 'background: #6c757d; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-size: 0.8rem;';
                hideBtn.onclick = hideDetail;
                detailDiv.appendChild(hideBtn);
                
                detailCell.appendChild(detailDiv);
                detailRow.appendChild(detailCell);
                
                targetRow.parentNode.insertBefore(detailRow, targetRow.nextSibling);
                history.pushState({detail: true}, '', '');
            }
        }
    } catch (error) {
        // Detay yükleme hatası
    }
}

function hideDetail() {
    const detailRow = document.querySelector('.detail-row');
    if (detailRow) {
        detailRow.remove();
    }
}

async function updateStats() {
    try {
        const gelirGider = await apiRequest('/gelir-gider');
        
        let totalIncome = 0;
        let totalExpense = 0;
        
        if (gelirGider) {
            gelirGider.forEach(kayit => {
                const tutar = parseFloat(kayit.tutar) || 0;
                if (kayit.tur === 'Gelir') {
                    totalIncome += tutar;
                } else if (kayit.tur === 'Gider') {
                    totalExpense += tutar;
                }
            });
        }
        
        const netProfit = totalIncome - totalExpense;
        
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalExpenseEl = document.getElementById('totalExpense');
        const netProfitEl = document.getElementById('netProfit');
        
        if (totalIncomeEl) totalIncomeEl.textContent = totalIncome.toLocaleString('tr-TR') + ' ₺';
        if (totalExpenseEl) totalExpenseEl.textContent = totalExpense.toLocaleString('tr-TR') + ' ₺';
        if (netProfitEl) netProfitEl.textContent = netProfit.toLocaleString('tr-TR') + ' ₺';
    } catch (error) {
        // İstatistik hesaplama hatası
    }
}

async function searchRecords() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    const tbody = document.querySelector('#recordsTable');
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Aranıyor...</td></tr>';
        const gelirGider = await apiRequest('/gelir-gider');
        tbody.innerHTML = '';
        
        if (!gelirGider) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Veri bulunamadı</td></tr>';
            return;
        }
        
        const filteredRecords = gelirGider.filter(kayit => 
            kayit.aciklama.toLowerCase().includes(searchTerm) ||
            kayit.tur.toLowerCase().includes(searchTerm) ||
            (kayit.kategori && kayit.kategori.toLowerCase().includes(searchTerm))
        );
        
        if (filteredRecords.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Arama sonucu bulunamadı</td></tr>';
            return;
        }
        
        filteredRecords.forEach(kayit => {
            const row = document.createElement('tr');
            const typeClass = kayit.tur === 'Gelir' ? 'income' : 'expense';
            const amountPrefix = kayit.tur === 'Gelir' ? '+' : '-';
            const statusClass = kayit.tur === 'Gelir' ? 'visited' : 'not-visited';
            
            row.setAttribute('data-record-id', kayit.id);
            
            const tarihCell = document.createElement('td');
            tarihCell.textContent = kayit.tarih;
            const aciklamaCell = document.createElement('td');
            aciklamaCell.textContent = kayit.aciklama;
            const kategoriCell = document.createElement('td');
            kategoriCell.textContent = kayit.kategori || '-';
            const tutarCell = document.createElement('td');
            tutarCell.className = typeClass;
            tutarCell.textContent = `${amountPrefix}${parseFloat(kayit.tutar).toLocaleString('tr-TR')} ₺`;
            const turCell = document.createElement('td');
            turCell.innerHTML = `<span class="status ${statusClass}">${kayit.tur}</span>`;
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="detail-btn" onclick="viewDetail(${kayit.id})" title="Detay Gör">👁️</button>
                <button class="edit-btn" onclick="editRecord(${kayit.id})" title="Düzenle">✏️</button>
                <button class="delete-btn" onclick="deleteRecord(${kayit.id})" title="Sil">🗑️</button>
            `;
            
            row.appendChild(tarihCell);
            row.appendChild(aciklamaCell);
            row.appendChild(kategoriCell);
            row.appendChild(tutarCell);
            row.appendChild(turCell);
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #f44336;">Arama sırasında hata oluştu</td></tr>';
        console.error('Gelir-gider arama hatası:', error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    if (aktifKullanici) {
        try {
            const userInfo = await apiRequest('/user/profile');
            const isim = userInfo.adsoyad ? userInfo.adsoyad.split(' ')[0] : aktifKullanici;
            const userNameEl = document.getElementById('userName');
            const userAvatarEl = document.querySelector('.user-avatar');
            if (userNameEl) userNameEl.innerText = isim;
            if (userAvatarEl) userAvatarEl.innerText = isim.charAt(0).toUpperCase();
        } catch (error) {
            const userNameEl = document.getElementById('userName');
            const userAvatarEl = document.querySelector('.user-avatar');
            if (userNameEl) userNameEl.innerText = aktifKullanici;
            if (userAvatarEl) userAvatarEl.innerText = aktifKullanici.charAt(0).toUpperCase();
        }
    }
    
    await loadGelirGider();
    await updateStats();
});

window.addEventListener('popstate', function() {
    const modal = document.getElementById('recordModal');
    if (modal && modal.style.display === 'block') {
        closeModal();
    }
    const detailRow = document.querySelector('.detail-row');
    if (detailRow) {
        hideDetail();
    }
});

document.addEventListener('click', function(event) {
    const userSection = document.querySelector('.user-section');
    const dropdown = document.getElementById('userDropdown');
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    
    if (userSection && !userSection.contains(event.target) && dropdown) {
        dropdown.classList.remove('show');
    }
    
    if (sidebar && hamburger && !sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        sidebar.classList.remove('open');
    }
});

const searchBtn = document.querySelector('.search-btn');
const searchInput = document.querySelector('.search-input');

if (searchBtn) searchBtn.addEventListener('click', searchRecords);
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchRecords();
    });
}