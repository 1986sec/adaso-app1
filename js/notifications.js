// Bildirim sistemi
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.init();
    }

    init() {
        this.loadNotifications();
        this.createNotificationButton();
        this.checkUpcomingVisits();
        // Her 5 dakikada bir kontrol et
        setInterval(() => this.checkUpcomingVisits(), 5 * 60 * 1000);
    }

    createNotificationButton() {
        const userSection = document.querySelector('.user-section');
        if (!userSection) return;

        // Bildirim butonu oluştur
        const notificationBtn = document.createElement('div');
        notificationBtn.className = 'notification-btn';
        notificationBtn.innerHTML = `
            <span class="notification-icon">🔔</span>
            <span class="notification-count" id="notificationCount">0</span>
        `;
        notificationBtn.onclick = () => this.showNotificationPanel();

        // User section'dan önce ekle
        userSection.parentNode.insertBefore(notificationBtn, userSection);

        // Bildirim paneli oluştur
        this.createNotificationPanel();
    }

    createNotificationPanel() {
        const notificationPanel = document.createElement('div');
        notificationPanel.className = 'notification-panel';
        notificationPanel.id = 'notificationPanel';
        notificationPanel.innerHTML = `
            <div class="notification-header">
                <h3>🔔 Bildirimler</h3>
                <button class="close-notifications" onclick="notificationSystem.closeNotificationPanel()">×</button>
            </div>
            <div class="notification-list" id="notificationList">
                <div class="no-notifications">Henüz bildirim yok</div>
            </div>
        `;
        document.body.appendChild(notificationPanel);
    }

    showNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.toggle('show');
        }
    }

    closeNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.classList.remove('show');
        }
    }

    addNotification(message, type = 'info', data = null) {
        const notification = {
            id: Date.now(),
            message,
            type,
            data,
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(notification);
        this.saveNotifications();
        this.updateNotificationCount();
        this.updateNotificationList();
        this.showToast(message, type);
    }

    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateNotificationCount();
            this.updateNotificationList();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.updateNotificationCount();
        this.updateNotificationList();
    }

    updateNotificationCount() {
        const countElement = document.getElementById('notificationCount');
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        if (countElement) {
            countElement.textContent = unreadCount;
            countElement.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    updateNotificationList() {
        const listElement = document.getElementById('notificationList');
        if (!listElement) return;

        if (this.notifications.length === 0) {
            listElement.innerHTML = '<div class="no-notifications">Henüz bildirim yok</div>';
            return;
        }

        const notificationsHTML = this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" onclick="notificationSystem.markAsRead(${notification.id})">
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                </div>
                <div class="notification-type ${notification.type}">${this.getTypeIcon(notification.type)}</div>
            </div>
        `).join('');

        listElement.innerHTML = notificationsHTML;
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Az önce';
        if (minutes < 60) return `${minutes} dakika önce`;
        if (hours < 24) return `${hours} saat önce`;
        return `${days} gün önce`;
    }

    getTypeIcon(type) {
        const icons = {
            'visit': '🚗',
            'reminder': '⏰',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌',
            'info': 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getTypeIcon(type)}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;

        document.body.appendChild(toast);

        // Animasyon için setTimeout
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 5000);
    }

    async checkUpcomingVisits() {
        try {
            const aktifKullanici = localStorage.getItem('aktifKullanici');
            let ziyaretler = [];

            if (aktifKullanici === 'admin') {
                ziyaretler = JSON.parse(localStorage.getItem('adminZiyaretler') || '[]');
            } else {
                const response = await fetch('https://adaso-backend.onrender.com/api/ziyaretler', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    ziyaretler = await response.json();
                }
            }

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            ziyaretler.forEach(ziyaret => {
                if (ziyaret.durum === 'Planlandı') {
                    const ziyaretDate = new Date(ziyaret.tarih);
                    const timeDiff = ziyaretDate - today;
                    const hoursDiff = timeDiff / (1000 * 60 * 60);

                    // 24 saat içinde olan ziyaretler için bildirim
                    if (hoursDiff > 0 && hoursDiff <= 24) {
                        const existingNotification = this.notifications.find(n => 
                            n.data && n.data.ziyaretId === ziyaret.id && n.type === 'visit'
                        );

                        if (!existingNotification) {
                            this.addNotification(
                                `Yarın ${ziyaret.saat} saatinde ${ziyaret.firma} firmasına ziyaret planlanmış`,
                                'visit',
                                { ziyaretId: ziyaret.id, firma: ziyaret.firma, tarih: ziyaret.tarih, saat: ziyaret.saat }
                            );
                        }
                    }

                    // 2 saat içinde olan ziyaretler için acil bildirim
                    if (hoursDiff > 0 && hoursDiff <= 2) {
                        const existingUrgentNotification = this.notifications.find(n => 
                            n.data && n.data.ziyaretId === ziyaret.id && n.data.urgent
                        );

                        if (!existingUrgentNotification) {
                            this.addNotification(
                                `⚠️ ACİL: ${ziyaret.saat} saatinde ${ziyaret.firma} firmasına ziyaret var!`,
                                'warning',
                                { ziyaretId: ziyaret.id, firma: ziyaret.firma, tarih: ziyaret.tarih, saat: ziyaret.saat, urgent: true }
                            );
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Ziyaret kontrolü hatası:', error);
        }
    }

    loadNotifications() {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            this.notifications = JSON.parse(saved);
        }
    }

    saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    // Manuel bildirim ekleme (test için)
    addTestNotification() {
        this.addNotification('Bu bir test bildirimidir', 'info');
    }
}

// Global bildirim sistemi instance'ı
let notificationSystem;

// Sayfa yüklendiğinde bildirim sistemini başlat
document.addEventListener('DOMContentLoaded', function() {
    notificationSystem = new NotificationSystem();
});

// Dışarıdan erişim için global fonksiyon
window.addNotification = function(message, type) {
    if (notificationSystem) {
        notificationSystem.addNotification(message, type);
    }
};
