const API_BASE_URL = 'https://adaso-backend.onrender.com/api';

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
}

async function viewDetail(id) {
    const existingDetail = document.querySelector('.detail-row');
    if (existingDetail) {
        existingDetail.remove();
        return;
    }
    
    try {
        const ziyaretler = await apiRequest('/ziyaretler');
        const ziyaret = ziyaretler.find(z => z.id === id);
        
        if (ziyaret) {
            const rows = document.querySelectorAll('#raporTable tr');
            let targetRow = null;
            
            rows.forEach(row => {
                const detailBtn = row.querySelector('.detail-btn');
                if (detailBtn && detailBtn.onclick.toString().includes(id)) {
                    targetRow = row;
                }
            });
            
            if (targetRow) {
                const detailRow = document.createElement('tr');
                detailRow.className = 'detail-row';
                
                const detailCell = document.createElement('td');
                detailCell.colSpan = 5;
                detailCell.style.padding = '0';
                
                const detailDiv = document.createElement('div');
                detailDiv.style.cssText = 'padding: 15px; background: #f8f9fa; border-left: 3px solid #B22222;';
                
                const gridDiv = document.createElement('div');
                gridDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; margin-bottom: 10px; text-align: left;';
                
                const fields = [
                    ['Firma', ziyaret.firma],
                    ['Tarih', ziyaret.tarih],
                    ['Ziyaretçi', ziyaret.ziyaretci],
                    ['Durum', ziyaret.durum],
                    ['Amaç', ziyaret.amac],
                    ['Saat', ziyaret.saat || '-']
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
                
                if (ziyaret.detayliBilgi) {
                    const detayDiv = document.createElement('div');
                    detayDiv.style.cssText = 'margin-bottom: 10px; font-size: 0.9rem;';
                    detayDiv.innerHTML = '<strong>Detaylı Bilgi:</strong> ';
                    const detaySpan = document.createElement('span');
                    detaySpan.textContent = ziyaret.detayliBilgi;
                    detayDiv.appendChild(detaySpan);
                    detailDiv.appendChild(detayDiv);
                }
                
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

function downloadFile(fileName) {
    alert(`${fileName} dosyası indiriliyor...\n\nNot: Gerçek bir dosya sistemi olmadığı için dosya indirme simüle edilmektedir.`);
}

function editReport(id) {
    localStorage.setItem('editZiyaretId', id);
    window.location.href = 'ziyaretler.html';
}

function deleteReport(id) {
    window.location.href = 'ziyaretler.html';
}

async function loadZiyaretRaporlari() {
    const tbody = document.querySelector('#raporTable');
    
    try {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Yükleniyor...</td></tr>';
        const ziyaretler = await apiRequest('/ziyaretler');
        
        tbody.innerHTML = '';
        
        if (!ziyaretler || ziyaretler.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">Henüz ziyaret raporu bulunmuyor</td></tr>';
            return;
        }
        
        ziyaretler.forEach(ziyaret => {
            const row = document.createElement('tr');
            let statusClass = 'inactive';
            if (ziyaret.durum === 'Tamamlandı') statusClass = 'active';
            
            const firmaAmacCell = document.createElement('td');
            firmaAmacCell.textContent = `${ziyaret.firma} - ${ziyaret.amac}`;
            const tipCell = document.createElement('td');
            tipCell.textContent = 'Ziyaret Raporu';
            const tarihCell = document.createElement('td');
            tarihCell.textContent = ziyaret.tarih;
            const durumCell = document.createElement('td');
            durumCell.innerHTML = `<span class="status ${statusClass}">${ziyaret.durum === 'Tamamlandı' ? 'Aktif' : 'Pasif'}</span>`;
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="detail-btn" onclick="viewDetail(${ziyaret.id})" title="Detay Gör">👁️</button>
                <button class="edit-btn" onclick="editReport(${ziyaret.id})" title="Düzenle">✏️</button>
                <button class="delete-btn" onclick="deleteReport(${ziyaret.id})" title="Sil">🗑️</button>
            `;
            
            row.appendChild(firmaAmacCell);
            row.appendChild(tipCell);
            row.appendChild(tarihCell);
            row.appendChild(durumCell);
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #f44336;">Raporlar yüklenirken hata oluştu</td></tr>';
        console.error('Raporlar yükleme hatası:', error);
    }
}

async function searchReports() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase();
    const tbody = document.querySelector('#raporTable');
    
    try {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Aranıyor...</td></tr>';
        const ziyaretler = await apiRequest('/ziyaretler');
        tbody.innerHTML = '';
        
        const filteredReports = ziyaretler.filter(ziyaret => 
            ziyaret.firma.toLowerCase().includes(searchTerm) ||
            ziyaret.amac.toLowerCase().includes(searchTerm) ||
            ziyaret.ziyaretci.toLowerCase().includes(searchTerm)
        );
        
        if (filteredReports.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">Arama sonucu bulunamadı</td></tr>';
            return;
        }
        
        filteredReports.forEach(ziyaret => {
            const row = document.createElement('tr');
            let statusClass = 'inactive';
            if (ziyaret.durum === 'Tamamlandı') statusClass = 'active';
            
            const firmaAmacCell = document.createElement('td');
            firmaAmacCell.textContent = `${ziyaret.firma} - ${ziyaret.amac}`;
            const tipCell = document.createElement('td');
            tipCell.textContent = 'Ziyaret Raporu';
            const tarihCell = document.createElement('td');
            tarihCell.textContent = ziyaret.tarih;
            const durumCell = document.createElement('td');
            durumCell.innerHTML = `<span class="status ${statusClass}">${ziyaret.durum === 'Tamamlandı' ? 'Aktif' : 'Pasif'}</span>`;
            const actionsCell = document.createElement('td');
            actionsCell.innerHTML = `
                <button class="detail-btn" onclick="viewDetail(${ziyaret.id})" title="Detay Gör">👁️</button>
                <button class="edit-btn" onclick="editReport(${ziyaret.id})" title="Düzenle">✏️</button>
                <button class="delete-btn" onclick="deleteReport(${ziyaret.id})" title="Sil">🗑️</button>
            `;
            
            row.appendChild(firmaAmacCell);
            row.appendChild(tipCell);
            row.appendChild(tarihCell);
            row.appendChild(durumCell);
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #f44336;">Arama sırasında hata oluştu</td></tr>';
        console.error('Arama hatası:', error);
    }
}

async function drawLineChart() {
    const canvas = document.getElementById('lineChart');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    
    const width = canvas.width;
    const height = canvas.height;
    const padding = 50;
    
    ctx.clearRect(0, 0, width, height);
    
    try {
        const ziyaretler = await apiRequest('/ziyaretler') || [];
        const aylikVeri = {};
        
        ziyaretler.forEach(ziyaret => {
            if (ziyaret.tarih) {
                const ay = ziyaret.tarih.substring(0, 7);
                if (!aylikVeri[ay]) {
                    aylikVeri[ay] = { gelir: 0, gider: 0 };
                }
                aylikVeri[ay].gelir += ziyaret.gelirTutari || 0;
                aylikVeri[ay].gider += ziyaret.giderTutari || 0;
            }
        });
        
        const months = Object.keys(aylikVeri).sort().slice(-6);
        const gelir = months.map(ay => aylikVeri[ay]?.gelir || 0);
        const gider = months.map(ay => aylikVeri[ay]?.gider || 0);
        
        if (months.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Henüz veri bulunmuyor', width/2, height/2);
            return;
        }
        
        const maxValue = Math.max(...gelir, ...gider, 1000);
        const stepX = months.length > 1 ? (width - 2 * padding) / (months.length - 1) : 0;
        const stepY = (height - 2 * padding) / maxValue;
        
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        ctx.strokeStyle = '#28a745';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < gelir.length; i++) {
            const x = padding + i * stepX;
            const y = height - padding - gelir[i] * stepY;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        ctx.strokeStyle = '#dc3545';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < gider.length; i++) {
            const x = padding + i * stepX;
            const y = height - padding - gider[i] * stepY;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        for (let i = 0; i < months.length; i++) {
            const x = padding + i * stepX;
            const monthParts = months[i].split('-');
            const ayAdi = monthParts[1] + '/' + monthParts[0].substring(2);
            ctx.fillText(ayAdi, x, height - padding + 20);
        }
        
        ctx.fillStyle = '#28a745';
        ctx.fillRect(width - 150, 20, 15, 15);
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Gelir', width - 130, 32);
        
        ctx.fillStyle = '#dc3545';
        ctx.fillRect(width - 150, 45, 15, 15);
        ctx.fillStyle = '#333';
        ctx.fillText('Gider', width - 130, 57);
    } catch (error) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Veri yüklenirken hata oluştu', width/2, height/2);
        console.error('Grafik çizim hatası:', error);
    }
}

async function drawPieChart() {
    const canvas = document.getElementById('pieChart');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 300;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 50;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    try {
        const ziyaretler = await apiRequest('/ziyaretler') || [];
        
        let tamamlanan = 0, planlanan = 0, iptal = 0;
        ziyaretler.forEach(z => {
            if (z.durum === 'Tamamlandı') tamamlanan++;
            else if (z.durum === 'Planlandı') planlanan++;
            else if (z.durum === 'İptal Edildi') iptal++;
        });
        
        const total = tamamlanan + planlanan + iptal;
        
        if (total === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Henüz veri bulunmuyor', centerX, centerY);
            return;
        }
        
        const data = [
            { label: 'Tamamlandı', value: tamamlanan, color: '#28a745' },
            { label: 'Planlandı', value: planlanan, color: '#ffc107' },
            { label: 'İptal Edildi', value: iptal, color: '#dc3545' }
        ];
        
        let currentAngle = -Math.PI / 2;
        
        data.forEach(item => {
            if (item.value > 0) {
                const sliceAngle = (item.value / total) * 2 * Math.PI;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                ctx.fillStyle = item.color;
                ctx.fill();
                
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
                const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(item.value, labelX, labelY);
                
                currentAngle += sliceAngle;
            }
        });
        
        let legendY = 20;
        data.forEach(item => {
            ctx.fillStyle = item.color;
            ctx.fillRect(20, legendY, 15, 15);
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${item.label} (${item.value})`, 45, legendY + 12);
            legendY += 25;
        });
    } catch (error) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Veri yüklenirken hata oluştu', centerX, centerY);
        console.error('Pasta grafik hatası:', error);
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
    
    await loadZiyaretRaporlari();
    await drawLineChart();
    await drawPieChart();
});

window.addEventListener('popstate', function() {
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

if (searchBtn) searchBtn.addEventListener('click', searchReports);
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchReports();
    });
}