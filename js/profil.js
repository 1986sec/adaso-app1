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
        return false;
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

const profileForm = document.getElementById('profileForm');
if (profileForm) {
    profileForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const newFullName = document.getElementById('newFullName').value;
    const newUsername = document.getElementById('newUsername').value;
    const newEmail = document.getElementById('newEmail').value;
    const newPhone = document.getElementById('newPhone').value;
    
    const updateData = {};
    if (newFullName) updateData.adsoyad = newFullName;
    if (newUsername) updateData.kullaniciAdi = newUsername;
    if (newEmail) updateData.email = newEmail;
    if (newPhone) updateData.telefon = newPhone;
    
    try {
        await apiRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        
        alert('Profil başarıyla güncellendi!');
        document.getElementById('profileForm').reset();
        
        setTimeout(() => {
            window.location.href = 'anasayfa.html';
        }, 1000);
    } catch (error) {
        alert('Profil güncellenirken hata oluştu: ' + error.message);
    }
    });
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
            
            const currentFullNameEl = document.getElementById('currentFullName');
            const currentEmailEl = document.getElementById('currentEmail');
            const currentPhoneEl = document.getElementById('currentPhone');
            const currentUsernameEl = document.getElementById('currentUsername');
            
            if (userInfo.adsoyad && currentFullNameEl) currentFullNameEl.textContent = userInfo.adsoyad;
            if (userInfo.email && currentEmailEl) currentEmailEl.textContent = userInfo.email;
            if (userInfo.telefon && currentPhoneEl) currentPhoneEl.textContent = userInfo.telefon;
            if (currentUsernameEl) currentUsernameEl.textContent = userInfo.kullaniciAdi || aktifKullanici;
        } catch {
            const userNameEl = document.getElementById('userName');
            const userAvatarEl = document.querySelector('.user-avatar');
            const currentUsernameEl = document.getElementById('currentUsername');
            
            if (userNameEl) userNameEl.innerText = aktifKullanici;
            if (userAvatarEl) userAvatarEl.innerText = aktifKullanici.charAt(0).toUpperCase();
            if (currentUsernameEl) currentUsernameEl.textContent = aktifKullanici;
        }
    }
});