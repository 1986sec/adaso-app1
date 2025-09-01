const API_BASE_URL = 'https://adaso-backend.onrender.com/api';

function timingSafeEqual(a, b) {
    return a === b;
}

const showForm = (tab) => {
    document.getElementById("girisForm").classList.remove("active");
    document.getElementById("kayitForm").classList.remove("active");
    document.getElementById("girisTab").classList.remove("active");
    document.getElementById("kayitTab").classList.remove("active");
    document.getElementById(tab+"Form").classList.add("active");
    document.getElementById(tab+"Tab").classList.add("active");
};

const kayitOl = async () => {
    const adsoyad = document.getElementById("kayitAdSoyad").value.trim();
    const email = document.getElementById("kayitEmail").value.trim();
    const kullanici = document.getElementById("kayitKullanici").value.trim();
    const sifre = document.getElementById("kayitSifre").value;
    const sifre2 = document.getElementById("kayitSifre2").value;
    const mesaj = document.getElementById("kayitMesaj");

    if (!adsoyad || !email || !kullanici || !sifre || !sifre2) {
        mesaj.textContent = "⚠️ Tüm Alanları Doldurun.";
        return;
    }
    if (!email.includes("@") || !email.includes(".")) {
        mesaj.textContent = "❌ Geçerli Bir E-posta Girin.";
        return;
    }

    if (!timingSafeEqual(sifre, sifre2)) {
        mesaj.textContent = "❌ Şifreler Uyuşmuyor!";
        return;
    }
    
    if (sifre.length < 6) {
        mesaj.textContent = "⚠️ Şifre en az 6 karakter olmalıdır!";
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adsoyad,
                email,
                kullaniciAdi: kullanici,
                sifre
            })
        });

        if (response.ok) {
            mesaj.textContent = "✅ Kayıt Başarılı";
            
            setTimeout(() => {
                document.getElementById('kayitAdSoyad').value = '';
                document.getElementById('kayitEmail').value = '';
                document.getElementById('kayitKullanici').value = '';
                document.getElementById('kayitSifre').value = '';
                document.getElementById('kayitSifre2').value = '';
                showForm('giris');
                document.getElementById('girisKullanici').value = kullanici;
                mesaj.textContent = '';
            }, 1500);
        } else {
            const errorData = await response.json();
            mesaj.textContent = "❌ " + (errorData.message || "Kayıt sırasında hata oluştu!");
        }
    } catch (error) {
        mesaj.textContent = "❌ Bağlantı hatası! Lütfen tekrar deneyin.";
        console.error('Kayıt hatası:', error);
    }
};

const girisYap = async () => {
    const girilen = document.getElementById("girisKullanici").value.trim();
    const sifre = document.getElementById("girisSifre").value;
    const mesaj = document.getElementById("girisMesaj");
    const hatirla = document.getElementById("hatirlaCheckbox").checked;

    // Hardcoded bypass kaldırıldı: tüm girişler API üzerinden yapılır

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                kullaniciAdi: girilen,
                sifre: sifre
            })
        });

        if (response.ok) {
            const data = await response.json();
            mesaj.textContent = "✅ Giriş Başarılı!";
            localStorage.setItem("aktifKullanici", data.user.kullaniciAdi);
            localStorage.setItem("authToken", data.token);

            if (hatirla) {
                localStorage.setItem("hatirlaKullanici", girilen);
            } else {
                localStorage.removeItem("hatirlaKullanici");
            }

            setTimeout(() => {
                window.location.href = 'anasayfa.html';
            }, 500);
        } else {
            mesaj.textContent = "❌ Kullanıcı Adı Veya Şifre Hatalı!";
        }
    } catch (error) {
        mesaj.textContent = "❌ Bağlantı hatası! Lütfen tekrar deneyin.";
        console.error('Giriş hatası:', error);
    }
};

const sifreUnuttumAc = () => {
    document.getElementById("sifreUnuttumModal").style.display = "block";
};

const sifreUnuttumKapat = () => {
    document.getElementById("sifreUnuttumModal").style.display = "none";
    document.getElementById("sifreUnuttumKullanici").value = "";
    document.getElementById("yeniSifre").value = "";
    document.getElementById("yeniSifre2").value = "";
    document.getElementById("sifreUnuttumMesaj").textContent = "";
    document.getElementById("yeniSifreAlani").style.display = "none";
    document.getElementById("sifreSifirlaBtn").style.display = "block";
};

let resetTokenGlobal = null;

const sifreSifirla = async () => {
    const girilen = document.getElementById("sifreUnuttumKullanici").value.trim();
    const mesaj = document.getElementById("sifreUnuttumMesaj");
    if (!girilen) {
        mesaj.textContent = "⚠️ Kullanıcı adı veya e-posta giriniz.";
        mesaj.style.color = "#dc3545";
        return;
    }
    try {
        const resp = await fetch(`${API_BASE_URL}/auth/forgot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: girilen })
        });
        if (!resp.ok) {
            mesaj.textContent = "❌ Kullanıcı bulunamadı!";
            mesaj.style.color = "#dc3545";
            return;
        }
        const data = await resp.json();
        resetTokenGlobal = data.resetToken;
        mesaj.textContent = "✅ Kullanıcı bulundu! Yeni şifrenizi belirleyin.";
        mesaj.style.color = "#28a745";
        document.getElementById("yeniSifreAlani").style.display = "block";
        document.getElementById("sifreSifirlaBtn").style.display = "none";
    } catch (e) {
        mesaj.textContent = "❌ İşlem sırasında hata oluştu";
        mesaj.style.color = "#dc3545";
    }
};

const sifreGuncelle = async () => {
    const yeniSifre = document.getElementById("yeniSifre").value;
    const yeniSifre2 = document.getElementById("yeniSifre2").value;
    const mesaj = document.getElementById("sifreUnuttumMesaj");

    if (!yeniSifre || !yeniSifre2) {
        mesaj.textContent = "⚠️ Tüm alanları doldurun.";
        mesaj.style.color = "#dc3545";
        return;
    }

    if (!timingSafeEqual(yeniSifre, yeniSifre2)) {
        mesaj.textContent = "❌ Şifreler uyuşmuyor!";
        mesaj.style.color = "#dc3545";
        return;
    }

    if (yeniSifre.length < 6) {
        mesaj.textContent = "⚠️ Şifre en az 6 karakter olmalıdır.";
        mesaj.style.color = "#dc3545";
        return;
    }

    try {
        if (!resetTokenGlobal) {
            mesaj.textContent = "❌ İşlem geçersiz, lütfen tekrar deneyin.";
            mesaj.style.color = "#dc3545";
            return;
        }
        const resp = await fetch(`${API_BASE_URL}/auth/reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: resetTokenGlobal, newPassword: yeniSifre })
        });
        if (!resp.ok) {
            mesaj.textContent = "❌ Token geçersiz veya süresi doldu";
            mesaj.style.color = "#dc3545";
            return;
        }
        mesaj.textContent = "✅ Şifreniz başarıyla güncellendi!";
        mesaj.style.color = "#28a745";
        setTimeout(() => {
            sifreUnuttumKapat();
            resetTokenGlobal = null;
        }, 2000);
    } catch (error) {
        mesaj.textContent = "❌ Bir hata oluştu!";
        mesaj.style.color = "#dc3545";
    }
};

function validatePassword(password, elementPrefix) {
    console.log('=== VALIDATION START ===');
    console.log('Password:', password);
    console.log('Element prefix:', elementPrefix);
    
    const lengthReq = document.getElementById(`${elementPrefix}-req-length`);
    const upperReq = document.getElementById(`${elementPrefix}-req-upper`);
    const lowerReq = document.getElementById(`${elementPrefix}-req-lower`);
    const numberReq = document.getElementById(`${elementPrefix}-req-number`);

    console.log('Elements found:', {
        lengthReq: lengthReq ? 'Found' : 'Not found',
        upperReq: upperReq ? 'Found' : 'Not found',
        lowerReq: lowerReq ? 'Found' : 'Not found',
        numberReq: numberReq ? 'Found' : 'Not found'
    });

    // Length check
    if (lengthReq) {
        const isLengthValid = password.length >= 6;
        console.log('Length check:', password.length, '>= 6 =', isLengthValid);
        if (isLengthValid) {
            lengthReq.classList.add('valid');
            console.log('✅ Length requirement met - class added');
        } else {
            lengthReq.classList.remove('valid');
            console.log('❌ Length requirement not met - class removed');
        }
    }

    // Upper case check
    if (upperReq) {
        const hasUpper = /[A-Z]/.test(password);
        console.log('Upper check:', password, 'has uppercase =', hasUpper);
        if (hasUpper) {
            upperReq.classList.add('valid');
            console.log('✅ Upper requirement met - class added');
        } else {
            upperReq.classList.remove('valid');
            console.log('❌ Upper requirement not met - class removed');
        }
    }

    // Lower case check
    if (lowerReq) {
        const hasLower = /[a-z]/.test(password);
        console.log('Lower check:', password, 'has lowercase =', hasLower);
        if (hasLower) {
            lowerReq.classList.add('valid');
            console.log('✅ Lower requirement met - class added');
        } else {
            lowerReq.classList.remove('valid');
            console.log('❌ Lower requirement not met - class removed');
        }
    }

    // Number check
    if (numberReq) {
        const hasNumber = /[0-9]/.test(password);
        console.log('Number check:', password, 'has number =', hasNumber);
        if (hasNumber) {
            numberReq.classList.add('valid');
            console.log('✅ Number requirement met - class added');
        } else {
            numberReq.classList.remove('valid');
            console.log('❌ Number requirement not met - class removed');
        }
    }
    
    console.log('=== VALIDATION END ===');
}

function checkPasswordStrength() {
    console.log('=== CHECK PASSWORD STRENGTH CALLED ===');
    const passwordInput = document.getElementById('kayitSifre');
    if (!passwordInput) {
        console.error('Password input not found!');
        return;
    }
    const password = passwordInput.value;
    console.log('Password from input:', password);
    console.log('Password length:', password.length);
    validatePassword(password, 'req');
    checkPasswordMatch();
}

function checkPasswordMatch() {
    const password = document.getElementById('kayitSifre').value;
    const password2 = document.getElementById('kayitSifre2').value;
    const matchReq = document.getElementById('req-match');
    
    if (matchReq) {
        if (password2 && timingSafeEqual(password, password2)) {
            matchReq.classList.add('valid');
        } else {
            matchReq.classList.remove('valid');
        }
    }
}

function checkModalPasswordStrength() {
    const password = document.getElementById('yeniSifre').value;
    validatePassword(password, 'modal-req');
    checkModalPasswordMatch();
}

function checkModalPasswordMatch() {
    const password = document.getElementById('yeniSifre').value;
    const password2 = document.getElementById('yeniSifre2').value;
    const matchReq = document.getElementById('modal-req-match');
    
    if (matchReq) {
        if (password2 && timingSafeEqual(password, password2)) {
            matchReq.classList.add('valid');
        } else {
            matchReq.classList.remove('valid');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM LOADED ===');
    
    // Ana form event listener'ları
    const kayitSifreInput = document.getElementById('kayitSifre');
    const kayitSifre2Input = document.getElementById('kayitSifre2');
    
    if (kayitSifreInput) {
        console.log('Adding event listener to kayitSifre input');
        kayitSifreInput.addEventListener('input', function(e) {
            console.log('Input event fired on kayitSifre, value:', e.target.value);
            checkPasswordStrength();
        });
        kayitSifreInput.addEventListener('keyup', function(e) {
            console.log('Keyup event fired on kayitSifre, value:', e.target.value);
            checkPasswordStrength();
        });
    }
    
    if (kayitSifre2Input) {
        console.log('Adding event listener to kayitSifre2 input');
        kayitSifre2Input.addEventListener('input', function(e) {
            console.log('Input event fired on kayitSifre2, value:', e.target.value);
            checkPasswordMatch();
        });
        kayitSifre2Input.addEventListener('keyup', function(e) {
            console.log('Keyup event fired on kayitSifre2, value:', e.target.value);
            checkPasswordMatch();
        });
    }
    
    // Modal form event listener'ları
    const yeniSifreInput = document.getElementById('yeniSifre');
    const yeniSifre2Input = document.getElementById('yeniSifre2');
    
    if (yeniSifreInput) {
        console.log('Adding event listener to yeniSifre input');
        yeniSifreInput.addEventListener('input', function(e) {
            console.log('Input event fired on yeniSifre, value:', e.target.value);
            checkModalPasswordStrength();
        });
    }
    
    if (yeniSifre2Input) {
        console.log('Adding event listener to yeniSifre2 input');
        yeniSifre2Input.addEventListener('input', function(e) {
            console.log('Input event fired on yeniSifre2, value:', e.target.value);
            checkModalPasswordMatch();
        });
    }
    
    const hatirla = localStorage.getItem("hatirlaKullanici");
    if(hatirla) {
        const girisKullaniciEl = document.getElementById("girisKullanici");
        const hatirlaCheckboxEl = document.getElementById("hatirlaCheckbox");
        if (girisKullaniciEl) girisKullaniciEl.value = hatirla;
        if (hatirlaCheckboxEl) hatirlaCheckboxEl.checked = true;
    }

    window.onclick = (event) => {
        const modal = document.getElementById("sifreUnuttumModal");
        if (modal && event.target === modal) {
            sifreUnuttumKapat();
        }
    };
});