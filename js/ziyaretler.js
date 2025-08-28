const API_BASE_URL = 'https://adaso-backend.onrender.com/api';
let editingZiyaretId = null;
let cachedZiyaretler = null;

async function apiRequest(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('authToken');
        const aktifKullanici = localStorage.getItem('aktifKullanici');
        
        // Token yoksa ve aktif kullanıcı varsa, admin kullanıcısı için özel kontrol
        if (!token && aktifKullanici === 'admin') {
            // Admin kullanıcısı için özel durum - boş veri döndür
            return [];
        }
        
        // Token yoksa ve admin değilse, giriş sayfasına yönlendir
        if (!token && aktifKullanici !== 'admin') {
            localStorage.removeItem('aktifKullanici');
            if (!/index\.html$/.test(window.location.pathname)) {
                window.location.href = 'index.html';
            }
            return;
        }
        
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
                // Admin kullanıcısı için özel durum - çıkış yapma
                if (aktifKullanici === 'admin') {
                    return [];
                }
                
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
        // Admin kullanıcısı için özel durum - hata durumunda bile devam et
        const aktifKullanici = localStorage.getItem('aktifKullanici');
        if (aktifKullanici === 'admin') {
            return [];
        }
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
}

function openAddModal() {
    editingZiyaretId = null;
    document.getElementById('modalTitle').innerText = '🚗 Yeni Ziyaret Ekle';
    document.getElementById('ziyaretModal').style.display = 'block';
    clearForm();
    history.pushState({modal: true}, '', '');
}

function closeModal() {
    document.getElementById('ziyaretModal').style.display = 'none';
}

function clearForm() {
    document.getElementById('ziyaretTarihi').value = '';
    document.getElementById('ziyaretSaati').value = '';
    document.getElementById('firma').value = '';
    document.getElementById('customFirma').value = '';
    document.getElementById('customFirma').style.display = 'none';
    document.getElementById('ziyaretci').value = '';
    document.getElementById('amac').value = '';
    document.getElementById('durum').value = 'Planlandı';
    document.getElementById('notlar').value = '';
    document.getElementById('detayliBilgi').value = '';
    document.getElementById('katilimcilar').value = '';
    document.getElementById('lokasyon').value = '';
    document.getElementById('gelirTutari').value = '';
    document.getElementById('giderTutari').value = '';
    document.getElementById('finansalAciklama').value = '';
    document.getElementById('dosya').value = '';
}

function createZiyaretRow(ziyaret) {
    const row = document.createElement('tr');
    let statusClass = 'planned';
    if (ziyaret.durum === 'Tamamlandı') statusClass = 'completed';
    if (ziyaret.durum === 'İptal Edildi') statusClass = 'cancelled';
    
    row.setAttribute('data-ziyaret-id', ziyaret.id);
    
    const tarihCell = document.createElement('td');
    tarihCell.textContent = ziyaret.tarih;
    const firmaCell = document.createElement('td');
    firmaCell.textContent = ziyaret.firma;
    const ziyaretciCell = document.createElement('td');
    ziyaretciCell.textContent = ziyaret.ziyaretci;
    const amacCell = document.createElement('td');
    amacCell.textContent = ziyaret.amac;
    const durumCell = document.createElement('td');
    durumCell.innerHTML = `<span class="status ${statusClass}">${ziyaret.durum}</span>`;
    const actionsCell = document.createElement('td');
    actionsCell.innerHTML = `
        <button class="detail-btn" onclick="viewDetail(${ziyaret.id})" title="Detay Gör">👁️</button>
        <button class="edit-btn" onclick="editZiyaret(${ziyaret.id})" title="Düzenle">✏️</button>
        <button class="delete-btn" onclick="deleteZiyaret(${ziyaret.id})" title="Sil">🗑️</button>
    `;
    
    row.appendChild(tarihCell);
    row.appendChild(firmaCell);
    row.appendChild(ziyaretciCell);
    row.appendChild(amacCell);
    row.appendChild(durumCell);
    row.appendChild(actionsCell);
    return row;
}

async function saveZiyaret() {
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    const tarih = document.getElementById('ziyaretTarihi').value;
    const saat = document.getElementById('ziyaretSaati').value;
    const firmaSelect = document.getElementById('firma').value;
    const customFirma = document.getElementById('customFirma').value;
    const firma = firmaSelect === 'custom' ? customFirma : firmaSelect;
    const ziyaretci = document.getElementById('ziyaretci').value;
    const amac = document.getElementById('amac').value;
    const durum = document.getElementById('durum').value;
    const notlar = document.getElementById('notlar').value;
    const detayliBilgi = document.getElementById('detayliBilgi').value;
    const katilimcilar = document.getElementById('katilimcilar').value;
    const lokasyon = document.getElementById('lokasyon').value;
    const gelirTutari = parseFloat(document.getElementById('gelirTutari').value) || 0;
    const giderTutari = parseFloat(document.getElementById('giderTutari').value) || 0;
    const finansalAciklama = document.getElementById('finansalAciklama').value;
    const dosyalar = document.getElementById('dosya').files;
    
    if (!tarih || !saat || !firma || !ziyaretci || !amac) {
        alert('Lütfen tüm zorunlu alanları doldurun!');
        return;
    }
    
    const dosyaIsimleri = [];
    for (let i = 0; i < dosyalar.length; i++) {
        dosyaIsimleri.push(dosyalar[i].name);
    }
    
    const ziyaretData = {
        tarih,
        saat,
        firma,
        ziyaretci,
        amac,
        durum,
        notlar,
        detayliBilgi,
        katilimcilar,
        lokasyon,
        dosyalar: dosyaIsimleri,
        gelirTutari,
        giderTutari,
        finansalAciklama
    };
    
    try {
        // Admin kullanıcısı için local storage tabanlı kaydetme
        if (aktifKullanici === 'admin') {
            const adminZiyaretler = JSON.parse(localStorage.getItem('adminZiyaretler') || '[]');
            
            if (editingZiyaretId) {
                const index = adminZiyaretler.findIndex(z => z.id === editingZiyaretId);
                if (index !== -1) {
                    adminZiyaretler[index] = { ...adminZiyaretler[index], ...ziyaretData };
                }
                editingZiyaretId = null;
            } else {
                const nextId = adminZiyaretler.length ? Math.max(...adminZiyaretler.map(x => x.id || 0)) + 1 : 1;
                ziyaretData.id = nextId;
                adminZiyaretler.push(ziyaretData);
            }
            
            localStorage.setItem('adminZiyaretler', JSON.stringify(adminZiyaretler));
            cachedZiyaretler = null;
            await loadZiyaretler();
            await updateZiyaretStats();
            closeModal();
            alert('Ziyaret başarıyla kaydedildi!');
            return;
        }
        
        // Normal kullanıcılar için API isteği
        if (editingZiyaretId) {
            await apiRequest(`/ziyaretler/${editingZiyaretId}`, {
                method: 'PUT',
                body: JSON.stringify(ziyaretData)
            });
            editingZiyaretId = null;
        } else {
            await apiRequest('/ziyaretler', {
                method: 'POST',
                body: JSON.stringify(ziyaretData)
            });
        }
        
        cachedZiyaretler = null;
        await loadZiyaretler();
        await updateZiyaretStats();
        closeModal();
    } catch (error) {
        alert('Ziyaret kaydedilirken hata oluştu: ' + error.message);
    }
}

async function viewDetail(id) {
    const existingDetail = document.querySelector('.detail-row');
    if (existingDetail) {
        existingDetail.remove();
        return;
    }
    
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    
    try {
        let ziyaret;
        
        if (cachedZiyaretler) {
            ziyaret = cachedZiyaretler.find(z => z.id === id);
        } else if (aktifKullanici === 'admin') {
            const adminZiyaretler = JSON.parse(localStorage.getItem('adminZiyaretler') || '[]');
            ziyaret = adminZiyaretler.find(z => z.id === id);
        } else {
            const apiZiyaretler = await apiRequest('/ziyaretler');
            ziyaret = apiZiyaretler.find(z => z.id === id);
        }
        
        if (ziyaret) {
            const rows = document.querySelectorAll('#ziyaretTable tr');
            let targetRow = null;
            
            rows.forEach(row => {
                if (row.getAttribute('data-ziyaret-id') == id) {
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
                    ['Tarih', ziyaret.tarih],
                    ['Saat', ziyaret.saat],
                    ['Firma', ziyaret.firma],
                    ['Ziyaretçi', ziyaret.ziyaretci],
                    ['Amaç', ziyaret.amac],
                    ['Durum', ziyaret.durum]
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
                
                if (ziyaret.notlar) {
                    const notlarDiv = document.createElement('div');
                    notlarDiv.style.cssText = 'margin-bottom: 10px; font-size: 0.9rem;';
                    notlarDiv.innerHTML = '<strong>Notlar:</strong> ';
                    const notlarSpan = document.createElement('span');
                    notlarSpan.textContent = ziyaret.notlar;
                    notlarDiv.appendChild(notlarSpan);
                    detailDiv.appendChild(notlarDiv);
                }
                
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
        console.error('Detay yükleme hatası:', error);
    }
}

function hideDetail() {
    const detailRow = document.querySelector('.detail-row');
    if (detailRow) {
        detailRow.remove();
    }
}

async function loadFirmalar() {
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    
    try {
        let firmalar;
        
        if (aktifKullanici === 'admin') {
            firmalar = JSON.parse(localStorage.getItem('adminFirmalar') || '[]');
        } else {
            firmalar = await apiRequest('/firmalar');
        }
        
        const firmaSelect = document.getElementById('firma');
        
        while (firmaSelect.children.length > 2) {
            firmaSelect.removeChild(firmaSelect.lastChild);
        }
        
        if (firmalar) {
            firmalar.forEach(firma => {
                const option = document.createElement('option');
                option.value = firma.firmaAdi;
                option.textContent = firma.firmaAdi;
                firmaSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Firmalar yükleme hatası:', error);
    }
}

function toggleCustomFirma() {
    const firmaSelect = document.getElementById('firma');
    const customFirma = document.getElementById('customFirma');
    
    if (firmaSelect.value === 'custom') {
        customFirma.style.display = 'block';
        customFirma.required = true;
        firmaSelect.required = false;
    } else {
        customFirma.style.display = 'none';
        customFirma.required = false;
        firmaSelect.required = true;
        customFirma.value = '';
    }
}

async function editZiyaret(id) {
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    
    try {
        let ziyaret;
        
        if (cachedZiyaretler) {
            ziyaret = cachedZiyaretler.find(z => z.id === id);
        } else if (aktifKullanici === 'admin') {
            const adminZiyaretler = JSON.parse(localStorage.getItem('adminZiyaretler') || '[]');
            ziyaret = adminZiyaretler.find(z => z.id === id);
        } else {
            const apiZiyaretler = await apiRequest('/ziyaretler');
            ziyaret = apiZiyaretler.find(z => z.id === id);
        }
        
        if (ziyaret) {
            editingZiyaretId = id;
            document.getElementById('modalTitle').innerText = '✏️ Ziyaret Düzenle';
            document.getElementById('ziyaretTarihi').value = ziyaret.tarih;
            document.getElementById('ziyaretSaati').value = ziyaret.saat;
            document.getElementById('firma').value = ziyaret.firma;
            document.getElementById('ziyaretci').value = ziyaret.ziyaretci;
            document.getElementById('amac').value = ziyaret.amac;
            document.getElementById('durum').value = ziyaret.durum;
            document.getElementById('notlar').value = ziyaret.notlar || '';
            document.getElementById('ziyaretModal').style.display = 'block';
            history.pushState({modal: true}, '', '');
        }
    } catch (error) {
        alert('Ziyaret bilgileri yüklenirken hata: ' + error.message);
    }
}

async function loadZiyaretler() {
    const tbody = document.querySelector('#ziyaretTable');
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Yükleniyor...</td></tr>';
        
        // Admin kullanıcısı için local storage'dan veri al
        if (aktifKullanici === 'admin') {
            cachedZiyaretler = JSON.parse(localStorage.getItem('adminZiyaretler') || '[]');
        } else {
            cachedZiyaretler = await apiRequest('/ziyaretler');
        }
        
        tbody.innerHTML = '';
        
        if (!cachedZiyaretler || cachedZiyaretler.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Henüz ziyaret kaydı bulunmuyor</td></tr>';
            return;
        }
        
        cachedZiyaretler.forEach(ziyaret => {
            tbody.appendChild(createZiyaretRow(ziyaret));
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #f44336;">Ziyaretler yüklenirken hata oluştu</td></tr>';
    }
}

async function deleteZiyaret(id) {
    if (confirm('Bu ziyareti silmek istediğinizden emin misiniz?')) {
        const aktifKullanici = localStorage.getItem('aktifKullanici');
        
        try {
            // Admin kullanıcısı için local storage'dan sil
            if (aktifKullanici === 'admin') {
                const adminZiyaretler = JSON.parse(localStorage.getItem('adminZiyaretler') || '[]');
                const filteredZiyaretler = adminZiyaretler.filter(z => z.id !== id);
                localStorage.setItem('adminZiyaretler', JSON.stringify(filteredZiyaretler));
                cachedZiyaretler = null;
                await loadZiyaretler();
                alert('Ziyaret başarıyla silindi!');
            } else {
                await apiRequest(`/ziyaretler/${id}`, { method: 'DELETE' });
                cachedZiyaretler = null;
                await loadZiyaretler();
            }
        } catch (error) {
            alert('Ziyaret silinirken hata oluştu: ' + error.message);
        }
    }
}

async function searchZiyaretler() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    const tbody = document.querySelector('#ziyaretTable');
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    
    if (!searchTerm) {
        await loadZiyaretler();
        return;
    }
    
    try {
        if (!cachedZiyaretler) {
            if (aktifKullanici === 'admin') {
                cachedZiyaretler = JSON.parse(localStorage.getItem('adminZiyaretler') || '[]');
            } else {
                cachedZiyaretler = await apiRequest('/ziyaretler');
            }
        }
        
        tbody.innerHTML = '';
        
        const filteredZiyaretler = cachedZiyaretler.filter(ziyaret => 
            ziyaret.firma.toLowerCase().includes(searchTerm) ||
            ziyaret.ziyaretci.toLowerCase().includes(searchTerm) ||
            ziyaret.amac.toLowerCase().includes(searchTerm)
        );
        
        if (filteredZiyaretler.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Arama sonucu bulunamadı</td></tr>';
            return;
        }
        
        filteredZiyaretler.forEach(ziyaret => {
            tbody.appendChild(createZiyaretRow(ziyaret));
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #f44336;">Arama sırasında hata oluştu</td></tr>';
    }
}

async function updateZiyaretStats() {
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    
    try {
        let ziyaretler;
        
        if (aktifKullanici === 'admin') {
            ziyaretler = cachedZiyaretler || JSON.parse(localStorage.getItem('adminZiyaretler') || '[]');
        } else {
            ziyaretler = cachedZiyaretler || await apiRequest('/ziyaretler');
        }
        
        if (ziyaretler) {
            const totalZiyaret = ziyaretler.length;
            const tamamlananZiyaret = ziyaretler.filter(z => z.durum === 'Tamamlandı').length;
            const planlananZiyaret = ziyaretler.filter(z => z.durum === 'Planlandı').length;
            
            const totalEl = document.getElementById('totalZiyaret');
            const tamamlananEl = document.getElementById('tamamlananZiyaret');
            const planlananEl = document.getElementById('planlananZiyaret');
            
            if (totalEl) totalEl.textContent = totalZiyaret;
            if (tamamlananEl) tamamlananEl.textContent = tamamlananZiyaret;
            if (planlananEl) planlananEl.textContent = planlananZiyaret;
        }
    } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    if (!aktifKullanici) {
        window.location.href = 'index.html';
        return;
    }
    
    // Admin kullanıcısı için örnek veriler ekle
    if (aktifKullanici === 'admin') {
        // Örnek firmalar ekle
        if (!localStorage.getItem('adminFirmalar')) {
            const ornekFirmalar = [
                {
                    id: 1,
                    firmaAdi: 'ABC Teknoloji',
                    sektor: 'Teknoloji',
                    telefon: '+90 322 123 45 67',
                    email: 'info@abcteknoloji.com',
                    yetkiliKisi: 'Ahmet Yılmaz',
                    yetkiliNumara: '+90 532 123 45 67',
                    adres: 'Adana, Türkiye'
                },
                {
                    id: 2,
                    firmaAdi: 'XYZ Sanayi',
                    sektor: 'Sanayi',
                    telefon: '+90 322 234 56 78',
                    email: 'iletisim@xyzsanayi.com',
                    yetkiliKisi: 'Fatma Demir',
                    yetkiliNumara: '+90 533 234 56 78',
                    adres: 'Mersin, Türkiye'
                }
            ];
            localStorage.setItem('adminFirmalar', JSON.stringify(ornekFirmalar));
        }
        
        // Örnek ziyaretler ekle
        if (!localStorage.getItem('adminZiyaretler')) {
            const ornekZiyaretler = [
                {
                    id: 1,
                    tarih: '2024-01-15',
                    saat: '10:00',
                    firma: 'ABC Teknoloji',
                    ziyaretci: 'Mehmet Özkan',
                    amac: 'Ürün tanıtımı',
                    durum: 'Tamamlandı',
                    notlar: 'Başarılı görüşme yapıldı',
                    detayliBilgi: 'Yeni ürünlerimiz tanıtıldı',
                    katilimcilar: 'Mehmet Özkan, Ahmet Yılmaz',
                    lokasyon: 'ABC Teknoloji Ofisi',
                    gelirTutari: 5000,
                    giderTutari: 200,
                    finansalAciklama: 'Ürün satışı gerçekleşti'
                }
            ];
            localStorage.setItem('adminZiyaretler', JSON.stringify(ornekZiyaretler));
        }
    }
    
    try {
        const userInfo = await apiRequest('/user/profile');
        if (userInfo) {
            const isim = userInfo.adsoyad ? userInfo.adsoyad.split(' ')[0] : aktifKullanici;
            const userNameEl = document.getElementById('userName');
            const userAvatarEl = document.querySelector('.user-avatar');
            if (userNameEl) userNameEl.innerText = isim;
            if (userAvatarEl) userAvatarEl.innerText = isim.charAt(0).toUpperCase();
        } else {
            const userNameEl = document.getElementById('userName');
            const userAvatarEl = document.querySelector('.user-avatar');
            if (userNameEl) userNameEl.innerText = aktifKullanici;
            if (userAvatarEl) userAvatarEl.innerText = aktifKullanici.charAt(0).toUpperCase();
        }
    } catch (error) {
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.querySelector('.user-avatar');
        if (userNameEl) userNameEl.innerText = aktifKullanici;
        if (userAvatarEl) userAvatarEl.innerText = aktifKullanici.charAt(0).toUpperCase();
    }
    
    await loadZiyaretler();
    await loadFirmalar();
    await updateZiyaretStats();
    
    const editZiyaretId = localStorage.getItem('editZiyaretId');
    if (editZiyaretId) {
        localStorage.removeItem('editZiyaretId');
        setTimeout(() => {
            editZiyaret(parseInt(editZiyaretId));
        }, 500);
    }
});

window.addEventListener('popstate', function() {
    if (document.getElementById('ziyaretModal').style.display === 'block') {
        closeModal();
    }
    if (document.querySelector('.detail-row')) {
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

if (searchBtn) searchBtn.addEventListener('click', searchZiyaretler);
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchZiyaretler();
    });
}