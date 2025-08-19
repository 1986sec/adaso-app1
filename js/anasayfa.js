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
    return false;
}

async function loadRecentMeetings() {
    const tbody = document.querySelector('#recentMeetings');
    if (!tbody) return;
    
    try {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Yükleniyor...</td></tr>';
        
        const [firmalar, ziyaretler] = await Promise.all([
            apiRequest('/firmalar'),
            apiRequest('/ziyaretler')
        ]);
        
        tbody.innerHTML = '';
        
        if (!firmalar || firmalar.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">Henüz firma kaydı bulunmuyor</td></tr>';
            return;
        }
        
        const ziyaretlerByFirma = {};
        if (ziyaretler) {
            ziyaretler.forEach(z => {
                if (!ziyaretlerByFirma[z.firma]) {
                    ziyaretlerByFirma[z.firma] = [];
                }
                ziyaretlerByFirma[z.firma].push(z);
            });
        }
        
        const recentFirms = firmalar.slice(-5).reverse();
        
        recentFirms.forEach(firma => {
            const firmaZiyaretleri = ziyaretlerByFirma[firma.firmaAdi] || [];
            const sonZiyaret = firmaZiyaretleri.length > 0 ? firmaZiyaretleri[firmaZiyaretleri.length - 1] : null;
            
            const row = document.createElement('tr');
            let statusClass = 'ziyaret-edilmedi';
            let durum = 'Ziyaret Edilmedi';
            
            if (sonZiyaret) {
                if (sonZiyaret.durum === 'Tamamlandı') {
                    statusClass = 'görüşme-yapılan';
                    durum = 'Görüşme Yapılan';
                } else if (sonZiyaret.durum === 'Planlandı') {
                    statusClass = 'planlandı';
                    durum = 'Planlandı';
                }
            }
            
            const tarihCell = document.createElement('td');
            tarihCell.textContent = sonZiyaret ? sonZiyaret.tarih : '-';
            const firmaCell = document.createElement('td');
            firmaCell.textContent = firma.firmaAdi;
            const yetkiliCell = document.createElement('td');
            yetkiliCell.textContent = firma.yetkiliKisi || '-';
            const durumCell = document.createElement('td');
            durumCell.innerHTML = `<span class="status ${statusClass}">${durum}</span>`;
            
            row.appendChild(tarihCell);
            row.appendChild(firmaCell);
            row.appendChild(yetkiliCell);
            row.appendChild(durumCell);
            tbody.appendChild(row);
        });
        
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #f44336;">Veriler yüklenirken hata oluştu</td></tr>';
        console.error('Recent meetings yüklenirken hata:', error);
    }
}

async function calculateFinancials() {
    try {
        const gelirGider = await apiRequest('/gelir-gider');
        
        let totalIncome = 0;
        let totalExpense = 0;
        
        if (gelirGider && Array.isArray(gelirGider)) {
            gelirGider.forEach(item => {
                const tutar = parseFloat(item.tutar) || 0;
                if (item.tur === 'Gelir') {
                    totalIncome += tutar;
                } else if (item.tur === 'Gider') {
                    totalExpense += tutar;
                }
            });
        }
        
        return { totalIncome, totalExpense };
    } catch (error) {
        return { totalIncome: 0, totalExpense: 0 };
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Kullanıcı bilgilerini yükle
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    if (aktifKullanici) {
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.querySelector('.user-avatar');
        if (userNameEl) userNameEl.innerText = aktifKullanici;
        if (userAvatarEl) userAvatarEl.innerText = aktifKullanici.charAt(0).toUpperCase();
    }
    
    // Dashboard verilerini yükle
    await loadDashboardData();
    await loadRecentMeetings();
});

async function loadDashboardData() {
    try {
        const [firmalar, ziyaretler, financials] = await Promise.all([
            apiRequest('/firmalar'),
            apiRequest('/ziyaretler'),
            calculateFinancials()
        ]);
        
        const gorusmeYapilanFirmalar = new Set();
        if (ziyaretler) {
            ziyaretler.forEach(ziyaret => {
                if (ziyaret.durum === 'Tamamlandı') {
                    gorusmeYapilanFirmalar.add(ziyaret.firma);
                }
            });
        }
        
        const totalFirmsEl = document.getElementById('totalFirms');
        const totalMeetingsEl = document.getElementById('totalMeetings');
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalExpenseEl = document.getElementById('totalExpense');
        
        if (totalFirmsEl) totalFirmsEl.textContent = firmalar ? firmalar.length : 0;
        if (totalMeetingsEl) totalMeetingsEl.textContent = gorusmeYapilanFirmalar.size;
        if (totalIncomeEl) totalIncomeEl.textContent = financials.totalIncome.toLocaleString('tr-TR') + ' ₺';
        if (totalExpenseEl) totalExpenseEl.textContent = financials.totalExpense.toLocaleString('tr-TR') + ' ₺';
        
    } catch (error) {
        console.error('Dashboard yükleme hatası:', error);
        // Hata durumunda kullanıcı dostu mesaj göster
        const totalFirmsEl = document.getElementById('totalFirms');
        const totalMeetingsEl = document.getElementById('totalMeetings');
        const totalIncomeEl = document.getElementById('totalIncome');
        const totalExpenseEl = document.getElementById('totalExpense');
        
        if (totalFirmsEl) totalFirmsEl.textContent = '0';
        if (totalMeetingsEl) totalMeetingsEl.textContent = '0';
        if (totalIncomeEl) totalIncomeEl.textContent = '0 ₺';
        if (totalExpenseEl) totalExpenseEl.textContent = '0 ₺';
    }
}

document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const hamburger = document.querySelector('.hamburger');
    
    if (sidebar && hamburger && !sidebar.contains(event.target) && !hamburger.contains(event.target)) {
        sidebar.classList.remove('open');
    }
});

async function globalSearch() {
    const searchTerm = document.querySelector('.search-input').value.toLowerCase().trim();
    const tableTitle = document.getElementById('tableTitle');
    const tbody = document.querySelector('#recentMeetings');
    
    if (!searchTerm) {
        if (tableTitle) tableTitle.innerHTML = '🏢 Son Eklenen Firmalar';
        await loadRecentMeetings();
        return;
    }
    
    if (tableTitle) tableTitle.innerHTML = '🔍 Arama Sonuçları';
    
    try {
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Aranıyor...</td></tr>';
        
        const searchResults = await apiRequest(`/search?q=${encodeURIComponent(searchTerm)}`);
        
        if (tbody) tbody.innerHTML = '';
        
        if (!searchResults || searchResults.length === 0) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">Arama sonucu bulunamadı</td></tr>';
            return;
        }
        
        searchResults.slice(0, 10).forEach(result => {
            const row = document.createElement('tr');
            
            const dateCell = document.createElement('td');
            dateCell.textContent = result.date || '-';
            const nameCell = document.createElement('td');
            nameCell.textContent = result.name;
            const detailCell = document.createElement('td');
            detailCell.textContent = result.detail;
            const statusCell = document.createElement('td');
            statusCell.innerHTML = `<span class="status ${result.status}">${result.type}</span>`;
            
            row.appendChild(dateCell);
            row.appendChild(nameCell);
            row.appendChild(detailCell);
            row.appendChild(statusCell);
            
            if (tbody) tbody.appendChild(row);
        });
        
    } catch (error) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #f44336;">Arama sırasında hata oluştu</td></tr>';
        console.error('Global arama hatası:', error);
    }
}

let searchBtn = document.querySelector('.search-btn');
let searchInput = document.querySelector('.search-input');

if (searchBtn) searchBtn.addEventListener('click', globalSearch);
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') globalSearch();
    });
    searchInput.addEventListener('input', function(e) {
        if (e.target.value === '') {
            loadRecentMeetings();
            hideSearchSuggestions();
        } else {
            showSearchSuggestions(e.target.value);
        }
    });
}

async function showSearchSuggestions(searchTerm) {
    try {
        const suggestions = await apiRequest(`/search/suggestions?q=${encodeURIComponent(searchTerm)}`);
        
        let suggestionBox = document.getElementById('searchSuggestions');
        if (!suggestionBox) {
            suggestionBox = document.createElement('div');
            suggestionBox.id = 'searchSuggestions';
            suggestionBox.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1000;
                max-height: 200px;
                overflow-y: auto;
            `;
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) {
                searchContainer.style.position = 'relative';
                searchContainer.appendChild(suggestionBox);
            }
        }
        
        if (!suggestions || suggestions.length === 0) {
            suggestionBox.style.display = 'none';
            return;
        }
        
        suggestionBox.innerHTML = '';
        suggestionBox.style.display = 'block';
        
        suggestions.slice(0, 5).forEach(suggestion => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                font-size: 14px;
            `;
            item.textContent = suggestion;
            item.addEventListener('mouseenter', () => item.style.background = '#f5f5f5');
            item.addEventListener('mouseleave', () => item.style.background = 'white');
            item.addEventListener('click', () => {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.value = suggestion;
                    hideSearchSuggestions();
                    globalSearch();
                }
            });
            suggestionBox.appendChild(item);
        });
        
    } catch (error) {
        hideSearchSuggestions();
    }
}

function hideSearchSuggestions() {
    const suggestionBox = document.getElementById('searchSuggestions');
    if (suggestionBox) {
        suggestionBox.style.display = 'none';
    }
}

document.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(e.target)) {
        hideSearchSuggestions();
    }
});

searchBtn = document.querySelector('.search-btn');
searchInput = document.querySelector('.search-input');

if (searchBtn) searchBtn.addEventListener('click', globalSearch);
if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') globalSearch();
    });
    searchInput.addEventListener('input', function(e) {
        if (e.target.value === '') {
            loadRecentMeetings();
            hideSearchSuggestions();
        } else {
            showSearchSuggestions(e.target.value);
        }
    });
}

async function showSearchSuggestions(searchTerm) {
    try {
        const suggestions = await apiRequest(`/search/suggestions?q=${encodeURIComponent(searchTerm)}`);
        
        let suggestionBox = document.getElementById('searchSuggestions');
        if (!suggestionBox) {
            suggestionBox = document.createElement('div');
            suggestionBox.id = 'searchSuggestions';
            suggestionBox.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1000;
                max-height: 200px;
                overflow-y: auto;
            `;
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) {
                searchContainer.style.position = 'relative';
                searchContainer.appendChild(suggestionBox);
            }
        }
        
        if (!suggestions || suggestions.length === 0) {
            suggestionBox.style.display = 'none';
            return;
        }
        
        suggestionBox.innerHTML = '';
        suggestionBox.style.display = 'block';
        
        suggestions.slice(0, 5).forEach(suggestion => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 10px 15px;
                cursor: pointer;
                border-bottom: 1px solid #eee;
                font-size: 14px;
            `;
            item.textContent = suggestion;
            item.addEventListener('mouseenter', () => item.style.background = '#f5f5f5');
            item.addEventListener('mouseleave', () => item.style.background = 'white');
            item.addEventListener('click', () => {
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.value = suggestion;
                    hideSearchSuggestions();
                    globalSearch();
                }
            });
            suggestionBox.appendChild(item);
        });
        
    } catch (error) {
        hideSearchSuggestions();
    }
}

function hideSearchSuggestions() {
    const suggestionBox = document.getElementById('searchSuggestions');
    if (suggestionBox) {
        suggestionBox.style.display = 'none';
    }
}

document.addEventListener('click', function(e) {
    const searchContainer = document.querySelector('.search-container');
    if (searchContainer && !searchContainer.contains(e.target)) {
        hideSearchSuggestions();
    }
});