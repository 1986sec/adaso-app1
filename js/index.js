const API_BASE_URL = 'http://localhost:3000/api';

function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
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

    if (girilen === "admin" && sifre === "123") {
        mesaj.textContent = "✅ Giriş Başarılı!";
        localStorage.setItem("aktifKullanici", "admin");
        
        if (hatirla) {
            localStorage.setItem("hatirlaKullanici", girilen);
        }
        
        setTimeout(() => {
            window.location.href = 'anasayfa.html';
        }, 500);
        return;
    }

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

let bulunanKullanici = null;

const sifreSifirla = () => {
    const girilen = document.getElementById("sifreUnuttumKullanici").value.trim();
    const mesaj = document.getElementById("sifreUnuttumMesaj");

    if (!girilen) {
        mesaj.textContent = "⚠️ Kullanıcı adı veya e-posta giriniz.";
        mesaj.style.color = "#dc3545";
        return;
    }

    let bulundu = false;
    for(let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === "aktifKullanici" || key === "hatirlaKullanici") continue;

        try {
            const veri = JSON.parse(localStorage.getItem(key));
            if (key === girilen || veri.email === girilen) {
                bulunanKullanici = key;
                mesaj.textContent = "✅ Kullanıcı bulundu! Yeni şifrenizi belirleyin.";
                mesaj.style.color = "#28a745";
                document.getElementById("yeniSifreAlani").style.display = "block";
                document.getElementById("sifreSifirlaBtn").style.display = "none";
                bulundu = true;
                break;
            }
        } catch (error) {}
    }

    if (!bulundu) {
        mesaj.textContent = "❌ Kullanıcı bulunamadı!";
        mesaj.style.color = "#dc3545";
    }
};

const sifreGuncelle = () => {
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
        const veri = JSON.parse(localStorage.getItem(bulunanKullanici));
        veri.sifre = yeniSifre;
        localStorage.setItem(bulunanKullanici, JSON.stringify(veri));
        mesaj.textContent = "✅ Şifreniz başarıyla güncellendi!";
        mesaj.style.color = "#28a745";
        
        setTimeout(() => {
            sifreUnuttumKapat();
        }, 2000);
    } catch (error) {
        mesaj.textContent = "❌ Bir hata oluştu!";
        mesaj.style.color = "#dc3545";
        console.error('Şifre güncelleme hatası:', error);
    }
};

function validatePassword(password, elementPrefix) {
    const lengthReq = document.getElementById(`${elementPrefix}-req-length`);
    const upperReq = document.getElementById(`${elementPrefix}-req-upper`);
    const lowerReq = document.getElementById(`${elementPrefix}-req-lower`);
    const numberReq = document.getElementById(`${elementPrefix}-req-number`);
    
    if (lengthReq) {
        lengthReq.classList.toggle('valid', password.length >= 6);
    }
    if (upperReq) {
        upperReq.classList.toggle('valid', /[A-Z]/.test(password));
    }
    if (lowerReq) {
        lowerReq.classList.toggle('valid', /[a-z]/.test(password));
    }
    if (numberReq) {
        numberReq.classList.toggle('valid', /[0-9]/.test(password));
    }
}

function checkPasswordStrength() {
    const password = document.getElementById('kayitSifre').value;
    validatePassword(password, 'req');
    checkPasswordMatch();
}

function checkPasswordMatch() {
    const password = document.getElementById('kayitSifre').value;
    const password2 = document.getElementById('kayitSifre2').value;
    const matchReq = document.getElementById('req-match');
    
    if (matchReq) {
        matchReq.classList.toggle('valid', password2 && timingSafeEqual(password, password2));
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
        matchReq.classList.toggle('valid', password2 && timingSafeEqual(password, password2));
    }
}

document.addEventListener('DOMContentLoaded', function() {
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