const API_BASE_URL = 'https://adaso-backend.onrender.com/api';

async function apiRequest(endpoint, options = {}) {
    try {
        const token = localStorage.getItem('authToken');
        const aktifKullanici = localStorage.getItem('aktifKullanici');
        
        // Token yoksa ve aktif kullanıcı varsa, admin kullanıcısı için özel kontrol
        if (!token && aktifKullanici === 'admin') {
            // Admin kullanıcısı için özel durum
            return { 
                kullaniciAdi: 'admin',
                adsoyad: 'Yönetici',
                email: 'admin@adaso.com',
                telefon: '+90 322 123 45 67'
            };
        }
        
        // Token yoksa ve admin değilse, giriş sayfasına yönlendir
        if (!token && aktifKullanici !== 'admin') {
            localStorage.removeItem('aktifKullanici');
            window.location.href = 'index.html';
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Admin kullanıcısı için özel durum - çıkış yapma
                if (aktifKullanici === 'admin') {
                    return { 
                        kullaniciAdi: 'admin',
                        adsoyad: 'Yönetici',
                        email: 'admin@adaso.com',
                        telefon: '+90 322 123 45 67'
                    };
                }
                
                localStorage.removeItem('authToken');
                localStorage.removeItem('aktifKullanici');
                window.location.href = 'index.html';
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        // Admin kullanıcısı için özel durum - hata durumunda bile devam et
        const aktifKullanici = localStorage.getItem('aktifKullanici');
        if (aktifKullanici === 'admin') {
            return { 
                kullaniciAdi: 'admin',
                adsoyad: 'Yönetici',
                email: 'admin@adaso.com',
                telefon: '+90 322 123 45 67'
            };
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
    return false;
}

document.addEventListener('DOMContentLoaded', async function() {
    const aktifKullanici = localStorage.getItem('aktifKullanici');
    if (!aktifKullanici) {
        window.location.href = 'index.html';
        return;
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
            // Fallback için varsayılan değerler
            const userNameEl = document.getElementById('userName');
            const userAvatarEl = document.querySelector('.user-avatar');
            if (userNameEl) userNameEl.innerText = aktifKullanici;
            if (userAvatarEl) userAvatarEl.innerText = aktifKullanici.charAt(0).toUpperCase();
        }
    } catch (error) {
        console.error('Kullanıcı bilgileri yüklenirken hata:', error);
        
        // Hata durumunda varsayılan değerler
        const userNameEl = document.getElementById('userName');
        const userAvatarEl = document.querySelector('.user-avatar');
        if (userNameEl) userNameEl.innerText = aktifKullanici;
        if (userAvatarEl) userAvatarEl.innerText = aktifKullanici.charAt(0).toUpperCase();
    }
});