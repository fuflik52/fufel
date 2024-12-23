// Функция для получения Telegram ID пользователя
let telegramUser = null;

function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        telegramUser = window.Telegram.WebApp.initDataUnsafe.user;
        if (telegramUser) {
            loadUserBalance();
        }
    }
}

// Загрузка баланса пользователя
async function loadUserBalance() {
    if (!telegramUser) return;
    
    try {
        const response = await fetch(`/api/balance/${telegramUser.id}`);
        if (response.ok) {
            const data = await response.json();
            score = data.balance;
            updateBalanceDisplay();
        }
    } catch (error) {
        console.error('Ошибка при загрузке баланса:', error);
    }
}

// Сохранение баланса пользователя
async function saveUserBalance() {
    if (!telegramUser) return;
    
    try {
        await fetch(`/api/balance/${telegramUser.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ balance: score })
        });
    } catch (error) {
        console.error('Ошибка при сохранении баланса:', error);
    }
}

// Функция для проверки, авторизован ли пользователь через Telegram
function isTelegramUser() {
    return telegramUser !== null;
}

// Экспортируем функции
window.telegramApi = {
    init: initTelegram,
    saveBalance: saveUserBalance,
    loadBalance: loadUserBalance,
    isTelegramUser: isTelegramUser
};
