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
            checkPasswordRequirements(this.value);
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
    const lengthReq = document.getElementById('lengthReq');
    const upperReq = document.getElementById('upperReq');
    const lowerReq = document.getElementById('lowerReq');
    const numberReq = document.getElementById('numberReq');
    const passwordCheck = document.getElementById('passwordCheck');
    
    if (password.length >= 8) {
        lengthReq.style.color = '#28a745';
        lengthReq.innerHTML = '✓ En az 8 karakter';
    } else {
        lengthReq.style.color = '#dc3545';
        lengthReq.innerHTML = '• En az 8 karakter';
    }
    
    if (/[A-Z]/.test(password)) {
        upperReq.style.color = '#28a745';
        upperReq.innerHTML = '✓ En az 1 büyük harf';
    } else {
        upperReq.style.color = '#dc3545';
        upperReq.innerHTML = '• En az 1 büyük harf';
    }
    
    if (/[a-z]/.test(password)) {
        lowerReq.style.color = '#28a745';
        lowerReq.innerHTML = '✓ En az 1 küçük harf';
    } else {
        lowerReq.style.color = '#dc3545';
        lowerReq.innerHTML = '• En az 1 küçük harf';
    }
    
    if (/\d/.test(password)) {
        numberReq.style.color = '#28a745';
        numberReq.innerHTML = '✓ En az 1 rakam';
    } else {
        numberReq.style.color = '#dc3545';
        numberReq.innerHTML = '• En az 1 rakam';
    }
    
    if (isStrongPassword(password)) {
        passwordCheck.style.display = 'block';
    } else {
        passwordCheck.style.display = 'none';
    }
}

function checkPasswordMatch() {
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchReq = document.getElementById('matchReq');
    const confirmCheck = document.getElementById('confirmCheck');
    
    if (confirmPassword.length > 0) {
        if (password === confirmPassword) {
            matchReq.style.color = '#28a745';
            matchReq.innerHTML = '✓ Şifreler aynı';
            confirmCheck.style.display = 'block';
        } else {
            matchReq.style.color = '#dc3545';
            matchReq.innerHTML = '• Şifreler aynı olmalı';
            confirmCheck.style.display = 'none';
        }
    } else {
        matchReq.style.color = '#dc3545';
        matchReq.innerHTML = '• Şifreler aynı olmalı';
        confirmCheck.style.display = 'none';
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
    
    if (!isStrongPassword(newPassword)) {
        alert('Şifre gereksinimleri karşılanmıyor! Lütfen en az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içeren bir şifre girin.');
        return;
    }
    
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