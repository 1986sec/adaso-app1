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

function openAddModal() {
    editingFirmaId = null;
    document.getElementById('modalTitle').innerText = '🏢 Yeni Firma Ekle';
    document.getElementById('firmaModal').style.display = 'block';
    clearForm();
    history.pushState({modal: true}, '', '');
}

function closeModal() {
    document.getElementById('firmaModal').style.display = 'none';
}

function clearForm() {
    document.getElementById('firmaAdi').value = '';
    document.getElementById('sektor').value = '';
    document.getElementById('telefon').value = '';
    document.getElementById('email').value = '';
    document.getElementById('yetkiliKisi').value = '';
    document.getElementById('yetkiliNumara').value = '';
    document.getElementById('adres').value = '';
}

async function saveFirma() {
    const firmaAdi = document.getElementById('firmaAdi').value;
    const sektor = document.getElementById('sektor').value;
    const telefon = document.getElementById('telefon').value;
    const email = document.getElementById('email').value;
    const yetkiliKisi = document.getElementById('yetkiliKisi').value;
    const yetkiliNumara = document.getElementById('yetkiliNumara').value;
    const adres = document.getElementById('adres').value;
    
    if (!firmaAdi || !sektor || !telefon || !yetkiliKisi || !yetkiliNumara) {
        alert('Lütfen tüm zorunlu alanları doldurun!');
        return;
    }
    
    const firmaData = {
        firmaAdi,
        sektor,
        telefon,
        email: email || '-',
        yetkiliKisi,
        yetkiliNumara,
        adres
    };
    
    try {
        if (editingFirmaId) {
            await apiRequest(`/firmalar/${editingFirmaId}`, {
                method: 'PUT',
                body: JSON.stringify(firmaData)
            });
            editingFirmaId = null;
        } else {
            await apiRequest('/firmalar', {
                method: 'POST',
                body: JSON.stringify(firmaData)
            });
        }
        
        await loadFirmalar();
        closeModal();
    } catch (error) {
        alert('Firma kaydedilirken hata oluştu: ' + error.message);
    }
}

let editingFirmaId = null;

async function editFirma(id) {
    try {
        const firmalar = await apiRequest('/firmalar');
        const firma = firmalar.find(f => f.id === id);
        
        if (firma) {
            editingFirmaId = id;
            document.getElementById('modalTitle').innerText = '✏️ Firma Düzenle';
            document.getElementById('firmaAdi').value = firma.firmaAdi;
            document.getElementById('sektor').value = firma.sektor;
            document.getElementById('telefon').value = firma.telefon;
            document.getElementById('email').value = firma.email;
            document.getElementById('yetkiliKisi').value = firma.yetkiliKisi || '';
            document.getElementById('yetkiliNumara').value = firma.yetkiliNumara || '';
            document.getElementById('adres').value = firma.adres || '';
            document.getElementById('firmaModal').style.display = 'block';
            history.pushState({modal: true}, '', '');
        }
    } catch (error) {
        alert('Firma bilgileri yüklenirken hata: ' + error.message);
    }
}

async function viewDetail(id) {
    const existingDetail = document.querySelector('.detail-row');
    if (existingDetail) {
        existingDetail.remove();
        return;
    }
    
    try {
        const [firmalar, ziyaretler] = await Promise.all([
            apiRequest('/firmalar'),
            apiRequest('/ziyaretler')
        ]);
        const firma = firmalar.find(f => f.id === id);
    
    if (firma) {
        const firmaGorusmeleri = ziyaretler.filter(z => z.firma === firma.firmaAdi);
        
        const rows = document.querySelectorAll('#firmaTable tr');
        let targetRow = null;
        
        rows.forEach(row => {
            if (row.getAttribute('data-firma-id') == id) {
                targetRow = row;
            }
        });
        
        if (targetRow) {
            let gorusmelerHTML = '';
            if (firmaGorusmeleri.length > 0) {
                gorusmelerHTML = '<div style="margin-top: 15px;"><strong>Görüşmeler:</strong></div>';
                firmaGorusmeleri.forEach(gorusme => {
                    let statusClass = 'planned';
                    if (gorusme.durum === 'Tamamlandı') statusClass = 'completed';
                    if (gorusme.durum === 'İptal Edildi') statusClass = 'cancelled';
                    
                    gorusmelerHTML += `
                        <div style="background: white; padding: 8px; margin: 5px 0; border-radius: 4px; border-left: 2px solid #B22222; font-size: 0.85rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span><strong>${gorusme.tarih}</strong> - ${gorusme.ziyaretci}</span>
                                <span class="status ${statusClass}" style="font-size: 0.75rem; padding: 2px 6px;">${gorusme.durum}</span>
                            </div>
                            <div style="color: #666; margin-top: 3px;">${gorusme.amac}</div>
                        </div>
                    `;
                });
            } else {
                gorusmelerHTML = '<div style="margin-top: 15px; color: #666; font-style: italic;">Henüz görüşme kaydı bulunmuyor</div>';
            }
            
            const detailRow = document.createElement('tr');
            detailRow.className = 'detail-row';
            detailRow.innerHTML = `
                <td colspan="7" style="padding: 0;">
                    <div style="padding: 15px; background: #f8f9fa; border-left: 3px solid #B22222;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; margin-bottom: 10px; text-align: left;">
                            <div><strong>Firma Adı:</strong> ${firma.firmaAdi}</div>
                            <div><strong>Sektör:</strong> ${firma.sektor}</div>
                            <div><strong>Telefon:</strong> ${firma.telefon}</div>
                            <div><strong>E-posta:</strong> ${firma.email || '-'}</div>
                            <div><strong>Yetkili Kişi:</strong> ${firma.yetkiliKisi || '-'}</div>
                            <div><strong>Yetkili Numarası:</strong> ${firma.yetkiliNumara || '-'}</div>
                        </div>
                        ${firma.adres ? `<div style="margin-bottom: 10px; font-size: 0.9rem;"><strong>Adres:</strong> ${firma.adres}</div>` : ''}
                        ${gorusmelerHTML}
                        <button onclick="hideDetail()" style="background: #6c757d; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; margin-top: 10px; font-size: 0.8rem;">Gizle</button>
                    </div>
                </td>
            `;
            
            targetRow.parentNode.insertBefore(detailRow, targetRow.nextSibling);
            history.pushState({detail: true}, '', '');
        }
    }
} catch (error) {
    console.error('Detay yüklenirken hata:', error);
    alert('Detay yüklenirken hata oluştu: ' + (error.message || error));
}

}

function hideDetail() {
    const detailRow = document.querySelector('.detail-row');
    if (detailRow) {
        detailRow.remove();
    }
}

async function loadFirmalar() {
    const tbody = document.querySelector('#firmaTable');
    
    try {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Yükleniyor...</td></tr>';
        const firmalar = await apiRequest('/firmalar');
        
        tbody.innerHTML = '';
        
        if (!firmalar || firmalar.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">Henüz firma kaydı bulunmuyor</td></tr>';
            return;
        }
        
        firmalar.forEach(firma => {
            const row = document.createElement('tr');
            row.setAttribute('data-firma-id', firma.id);
            
            const firmaAdiCell = document.createElement('td');
            firmaAdiCell.textContent = firma.firmaAdi;
            const sektorCell = document.createElement('td');
            sektorCell.textContent = firma.sektor;
            const telefonCell = document.createElement('td');
            telefonCell.textContent = firma.telefon;
            const emailCell = document.createElement('td');
            emailCell.textContent = firma.email;
            const yetkiliKisiCell = document.createElement('td');
            yetkiliKisiCell.textContent = firma.yetkiliKisi || '-';
            const yetkiliNumaraCell = document.createElement('td');
            yetkiliNumaraCell.textContent = firma.yetkiliNumara || '-';
            
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="detail-btn" onclick="viewDetail(${firma.id})" title="Detay Gör">👁️</button>
                <button class="edit-btn" onclick="editFirma(${firma.id})" title="Düzenle">✏️</button>
                <button class="delete-btn" onclick="deleteFirma(${firma.id})" title="Sil">🗑️</button>
            `;
            
            row.appendChild(firmaAdiCell);
            row.appendChild(sektorCell);
            row.appendChild(telefonCell);
            row.appendChild(emailCell);
            row.appendChild(yetkiliKisiCell);
            row.appendChild(yetkiliNumaraCell);
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #f44336;">Firmalar yüklenirken hata oluştu</td></tr>';
        console.error('Firmalar yüklenirken hata:', error);
    }
}

async function deleteFirma(id) {
    if (confirm('Bu firmayı silmek istediğinizden emin misiniz?')) {
        try {
            await apiRequest(`/firmalar/${id}`, { method: 'DELETE' });
            await loadFirmalar();
        } catch (error) {
            alert('Firma silinirken hata oluştu: ' + error.message);
        }
    }
}

async function updateStats() {
    try {
        const [firmalar, ziyaretler] = await Promise.all([
            apiRequest('/firmalar'),
            apiRequest('/ziyaretler')
        ]);
        
        const firmaCount = firmalar ? firmalar.length : 0;
        const statEl1 = document.querySelector('.stat-card:nth-child(1) h3');
        if (statEl1) statEl1.textContent = firmaCount;
        
        if (ziyaretler) {
            const ziyaretEdilenFirmalar = new Set(ziyaretler.filter(z => z.durum === 'Tamamlandı').map(z => z.firma));
            const statEl2 = document.querySelector('.stat-card:nth-child(2) h3');
            if (statEl2) statEl2.textContent = ziyaretEdilenFirmalar.size;
            
            const bekleyenZiyaretler = ziyaretler.filter(z => z.durum === 'Planlandı').length;
            const statEl3 = document.querySelector('.stat-card:nth-child(3) h3');
            if (statEl3) statEl3.textContent = bekleyenZiyaretler;
        }
    } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    if (aktifKullanici) {
        try {
            const userInfo = await apiRequest('/user/profile');
            const isim = userInfo.adsoyad ? userInfo.adsoyad.split(' ')[0] : aktifKullanici;
            document.getElementById('userName').innerText = isim;
            document.querySelector('.user-avatar').innerText = isim.charAt(0).toUpperCase();
        } catch (error) {
            const userNameEl = document.getElementById('userName');
            const userAvatarEl = document.querySelector('.user-avatar');
            if (userNameEl) userNameEl.innerText = aktifKullanici;
            if (userAvatarEl) userAvatarEl.innerText = aktifKullanici.charAt(0).toUpperCase();
            console.warn('Kullanıcı bilgileri alınamadı:', error);
        }
    }
    await loadFirmalar();
    await updateStats();
});

window.addEventListener('popstate', function(event) {
    if (document.getElementById('firmaModal').style.display === 'block') {
        closeModal();
    }
    if (document.querySelector('.detail-row')) {
        hideDetail();
    }
});

async function searchFirmalar() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    const tbody = document.querySelector('#firmaTable');
    
    try {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Aranıyor...</td></tr>';
        const firmalar = await apiRequest('/firmalar');
        tbody.innerHTML = '';
        
        const filteredFirmalar = firmalar.filter(firma => 
            firma.firmaAdi.toLowerCase().includes(searchTerm) ||
            firma.sektor.toLowerCase().includes(searchTerm) ||
            (firma.yetkiliKisi && firma.yetkiliKisi.toLowerCase().includes(searchTerm))
        );
        
        if (filteredFirmalar.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">Arama sonucu bulunamadı</td></tr>';
            return;
        }
        
        filteredFirmalar.forEach(firma => {
            const row = document.createElement('tr');
            row.setAttribute('data-firma-id', firma.id);
            
            const firmaAdiCell = document.createElement('td');
            firmaAdiCell.textContent = firma.firmaAdi;
            const sektorCell = document.createElement('td');
            sektorCell.textContent = firma.sektor;
            const telefonCell = document.createElement('td');
            telefonCell.textContent = firma.telefon;
            const emailCell = document.createElement('td');
            emailCell.textContent = firma.email;
            const yetkiliKisiCell = document.createElement('td');
            yetkiliKisiCell.textContent = firma.yetkiliKisi || '-';
            const yetkiliNumaraCell = document.createElement('td');
            yetkiliNumaraCell.textContent = firma.yetkiliNumara || '-';
            
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="detail-btn" onclick="viewDetail(${firma.id})" title="Detay Gör">👁️</button>
                <button class="edit-btn" onclick="editFirma(${firma.id})" title="Düzenle">✏️</button>
                <button class="delete-btn" onclick="deleteFirma(${firma.id})" title="Sil">🗑️</button>
            `;
            
            row.appendChild(firmaAdiCell);
            row.appendChild(sektorCell);
            row.appendChild(telefonCell);
            row.appendChild(emailCell);
            row.appendChild(yetkiliKisiCell);
            row.appendChild(yetkiliNumaraCell);
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #f44336;">Arama sırasında hata oluştu</td></tr>';
        console.error('Arama sırasında hata oluştu:', error);
    }
}

const searchBtn = document.querySelector('.search-btn');
const searchInput = document.querySelector('.search-input');

if (searchBtn) {
    if (searchBtn) searchBtn.addEventListener('click', searchFirmalar);
}
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchFirmalar();
    });
}
