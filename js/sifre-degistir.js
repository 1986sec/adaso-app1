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
        } catch {
            const userNameEl = document.getElementById('userName');
            const userAvatarEl = document.querySelector('.user-avatar');
            if (userNameEl) userNameEl.innerText = aktifKullanici;
            if (userAvatarEl) userAvatarEl.innerText = aktifKullanici.charAt(0).toUpperCase();
        }
    }
    setupForm();
});

function setupForm() {
    const passwordForm = document.getElementById('passwordForm');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
    
    if (newPassword) {
        newPassword.addEventListener('input', function() {
            checkPasswordMatch();
        });
    }
    
    if (confirmPassword) {
        confirmPassword.addEventListener('input', function() {
            checkPasswordMatch();
        });
    }
}

function checkPasswordRequirements(password) {
    // Sadece şifre eşleşme kontrolü yapılacak
    console.log('Password requirements check disabled - only match validation active');
}

function checkPasswordMatch() {
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchReq = document.getElementById('matchReq');
    
    if (confirmPassword.length > 0) {
        if (password === confirmPassword) {
            matchReq.style.color = '#28a745';
            matchReq.innerHTML = '✓ Şifreler uyuşuyor';
            matchReq.style.fontWeight = '600';
            matchReq.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
            matchReq.style.padding = '6px 12px';
            matchReq.style.borderRadius = '4px';
        } else {
            matchReq.style.color = '#dc3545';
            matchReq.innerHTML = '• Şifreler uyuşuyor';
            matchReq.style.fontWeight = '500';
            matchReq.style.backgroundColor = 'transparent';
            matchReq.style.padding = '4px 0';
            matchReq.style.borderRadius = '0';
        }
    } else {
        matchReq.style.color = '#dc3545';
        matchReq.innerHTML = '• Şifreler uyuşuyor';
        matchReq.style.fontWeight = '500';
        matchReq.style.backgroundColor = 'transparent';
        matchReq.style.padding = '4px 0';
        matchReq.style.borderRadius = '0';
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        alert('Yeni şifreler eşleşmiyor!');
        return;
    }
    
    // Şifre güçlülük kontrolü kaldırıldı - sadece eşleşme kontrolü yapılıyor
    
    if (currentPassword === newPassword) {
        alert('Yeni şifre mevcut şifre ile aynı olamaz!');
        return;
    }
    
    try {
        await apiRequest('/user/change-password', {
            method: 'POST',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        document.getElementById('passwordForm').reset();
        alert('Şifreniz başarıyla değiştirildi! Güvenliğiniz için bu bilgiyi kimseyle paylaşmayın.');
        
        setTimeout(() => {
            window.location.href = 'anasayfa.html';
        }, 1500);
    } catch (error) {
        alert('Şifre değiştirilirken hata oluştu: ' + error.message);
    }
}

function isStrongPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers;
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

document.addEventListener('click', function(event) {
    const userDropdown = document.getElementById('userDropdown');
    const userProfile = document.querySelector('.user-profile');
    
    if (userProfile && !userProfile.contains(event.target) && userDropdown) {
        userDropdown.classList.remove('show');
    }
});