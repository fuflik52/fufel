// Функция форматирования чисел
function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }
    return num.toLocaleString('en-US');
}

// В начале файла добавим переменную для Telegram WebApp
const tg = window.Telegram.WebApp;

// Функция показа уведомлений
function showNotification(message) {
    const notification = document.querySelector('.notification');
    
    if (window.notificationTimeout) {
        clearTimeout(window.notificationTimeout);
    }
    
    const isError = message.toLowerCase().includes('недостаточно');
    notification.style.background = isError ? 'rgba(255, 51, 102, 0.95)' : 'rgba(40, 167, 69, 0.95)';
    notification.textContent = message;
    notification.classList.add('show');
    
    window.notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.style.visibility = 'hidden';
        }, 300);
    }, 3000);
}

// Массив заданий
const tasks = [
    {
        id: 4,
        title: "Первые шаги",
        description: "Сделайте свой первый клик",
        icon: "🎯",
        reward: 100,
        completed: false,
        claimed: false
    },
    {
        id: 5,
        title: "Начинающий кликер",
        description: "Наберите 1,000 кликов",
        icon: "⭐",
        reward: 1000,
        completed: false,
        claimed: false
    },
    {
        id: 6,
        title: "Опытный кликер",
        description: "Наберите 10,000 кликов",
        icon: "🌟",
        reward: 10000,
        completed: false,
        claimed: false
    },
    {
        id: 7,
        title: "Мастер кликер",
        description: "Наберите 100,000 кликов",
        icon: "💫",
        reward: 100000,
        completed: false,
        claimed: false
    },
    {
        id: 8,
        title: "Король кликов",
        description: "Наберите 1,000,000 кликов",
        icon: "👑",
        reward: 1000000,
        completed: false,
        claimed: false
    },
    {
        id: 9,
        title: "Первая покупка",
        description: "Купите любой предмет в магазине",
        icon: "🛍️",
        reward: 5000,
        completed: false,
        claimed: false
    },
    {
        id: 10,
        title: "Шопоголик",
        description: "Купите 5 разных предметов",
        icon: "🛒",
        reward: 50000,
        completed: false,
        claimed: false
    },
    {
        id: 11,
        title: "Коллекционер",
        description: "Купите 10 разных предметов",
        icon: "💎",
        reward: 500000,
        completed: false,
        claimed: false
    },
    {
        id: 12,
        title: "Энергичный старт",
        description: "Достигните 10 кликов в секунду",
        icon: "⚡",
        reward: 10000,
        completed: false,
        claimed: false
    },
    {
        id: 13,
        title: "Скоростной кликер",
        description: "Достигните 100 кликов в секунду",
        icon: "🚀",
        reward: 100000,
        completed: false,
        claimed: false
    },
    {
        id: 14,
        title: "Звездный путь",
        description: "Достигните 1,000 кликов в секунду",
        icon: "✨",
        reward: 1000000,
        completed: false,
        claimed: false
    },
    {
        id: 15,
        title: "Мировое господство",
        description: "Достигните 10,000 кликов в секунду",
        icon: "🌍",
        reward: 10000000,
        completed: false,
        claimed: false
    },
    {
        id: 21,
        title: "Точность",
        description: "Сделайте 100 кликов подряд",
        icon: "🎯",
        reward: 10000,
        completed: false,
        claimed: false
    },
    {
        id: 22,
        title: "Цирковой артист",
        description: "Сделайте 1000 кликов подряд",
        icon: "🎪",
        reward: 100000,
        completed: false,
        claimed: false
    }
];

// Игровые переменные
let score = 0;
let clickCount = 0;
let consecutiveClicks = 0;
let autoClickPower = 0;
let clickPower = 1;
let totalClicks = 0;
let clicksPerHour = 0;
let currentStreak = 0;
let maxBalance = 0;
let totalEarned = 0;
let gameStartTime = Date.now();
let lastClickTime = Date.now();
let totalPurchases = 0;
let lastUpdateTime = Date.now();
let lastSaveTime = Date.now();

// Глобальные переменные
let vibrationEnabled = true;

// DOM элементы
const sectionContents = document.querySelectorAll('.section-content');
const gameArea = document.querySelector('.game-area');
const scoreContainer = document.querySelector('.score-container');
const scoreElement = document.querySelector('.score');

// Функция подсчета оффлайн прогресса
function calculateOfflineProgress() {
    const lastTime = localStorage.getItem('lastOnlineTime');
    if (lastTime) {
        const timeDiff = (Date.now() - parseInt(lastTime)) / 1000; // разница в секундах
        const offlineEarnings = autoClickPower * timeDiff;
        if (offlineEarnings > 0) {
            score += offlineEarnings;
            showNotification(`Пока вас не было, вы заработали: ${formatNumber(Math.floor(offlineEarnings))}`);
        }
    }
    localStorage.setItem('lastOnlineTime', Date.now().toString());
}

// Функция сохранения состояния игры
function saveGameState() {
    // Обновляем максимальный баланс
    maxBalance = Math.max(score, maxBalance);

    const state = {
        score,
        autoClickPower,
        totalClicks,
        clicksPerHour,
        currentStreak,
        maxBalance,
        totalEarned,
        gameStartTime,
        totalPurchases,
        tasks,
        shopItems: shopItems.map(item => ({
            id: item.id,
            level: item.level,
            price: item.price
        }))
    };
    localStorage.setItem('gameState', JSON.stringify(state));
    localStorage.setItem('lastOnlineTime', Date.now().toString());
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const mainSection = document.querySelector('.game-area');
    const savedVibration = localStorage.getItem('vibrationEnabled');
    vibrationEnabled = savedVibration === null ? true : savedVibration === 'true';

    // Добавляем обработчик клика для игровой области
    if (mainSection) {
        mainSection.addEventListener('click', handleClick);
    }

    // Загружаем состояние игры и проверяем оффлайн прогресс
    loadGameState();
    calculateOfflineProgress();
    
    // Инициализируем остальные компоненты
    initializeNavigation();
    updateScoreDisplay();
    updateShopItems(); // Добавляем инициализацию магазина
    renderTasks();
    updateStatsSection();

    // Показываем главную страницу
    const homeBtn = document.querySelector('.nav-btn');
    if (homeBtn) {
        homeBtn.click();
    }
});

// Обновляем функцию getTaskProgress
function getTaskProgress(task) {
    if (!task) return 0;
    
    switch(task.id) {
        case 4:
            return totalClicks >= 1 ? 1 : 0;
        case 5:
            return totalClicks >= 1000 ? 1 : 0;
        case 6:
            return totalClicks >= 10000 ? 1 : 0;
        case 7:
            return totalClicks >= 100000 ? 1 : 0;
        case 8:
            return totalClicks >= 1000000 ? 1 : 0;
        case 9:
            return shopItems.some(item => item.level > 0) ? 1 : 0;
        case 10:
            return shopItems.filter(item => item.level > 0).length >= 5 ? 1 : 0;
        case 11:
            return shopItems.filter(item => item.level > 0).length >= 10 ? 1 : 0;
        case 12:
            return autoClickPower >= 10 ? 1 : 0;
        case 13:
            return autoClickPower >= 100 ? 1 : 0;
        case 14:
            return autoClickPower >= 1000 ? 1 : 0;
        case 15:
            return autoClickPower >= 10000 ? 1 : 0;
        case 21:
            return currentStreak >= 100 ? 1 : 0;
        case 22:
            return currentStreak >= 1000 ? 1 : 0;
        default:
            return 0;
    }
}

// Обновляем функцию handleClick
function handleClick(e) {
    if (!e || !e.target) return;
    
    const clickCircle = e.target.closest('.click-circle');
    if (!clickCircle) return;
    
    // Обновляем счетчики
    totalClicks++;
    score++;
    
    // Обновляем максимальный баланс
    if (score > maxBalance) {
        maxBalance = score;
    }
    
    // Обновляем общий заработок
    totalEarned++;
    
    // Обновляем текущую серию кликов
    const now = Date.now();
    if (now - lastClickTime < 1000) {
        currentStreak++;
    } else {
        currentStreak = 1;
    }
    lastClickTime = now;
    
    // Обновляем клики в час
    const timeSinceStart = (now - gameStartTime) / 1000;
    clicksPerHour = Math.floor(totalClicks * (3600 / timeSinceStart));
    
    // Обновляем отображение
    updateScoreDisplay();
    updateStatsSection();
    
    // Сохраняем состояние и проверяем задания
    saveGameState();
    checkTasks();
}

// Функция для создания эффекта клика
function createClickEffect(x, y) {
    const clickEffect = document.createElement('div');
    clickEffect.className = 'click-effect';
    clickEffect.style.left = x + 'px';
    clickEffect.style.top = y + 'px';
    clickEffect.textContent = '+1';
    
    document.body.appendChild(clickEffect);
    
    // Удаляем эффект после анимации
    setTimeout(() => {
        clickEffect.remove();
    }, 1000);
}

// Обновляем функцию checkTasksProgress
function checkTasksProgress() {
    tasks.forEach(task => {
        const progress = getTaskProgress(task);
        if (progress >= 1 && !task.completed) {
            task.completed = true;
            // Обновляем состояние игры
            saveGameState();
        }
    });
    renderTasks();
}

// Обновляем функцию loadGameState
function loadGameState() {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
        const state = JSON.parse(savedState);
        score = state.score || 0;
        autoClickPower = state.autoClickPower || 0;
        totalClicks = state.totalClicks || 0;
        clicksPerHour = state.clicksPerHour || 0;
        currentStreak = state.currentStreak || 0;
        maxBalance = state.maxBalance || 0;
        totalEarned = state.totalEarned || 0;
        gameStartTime = state.gameStartTime || Date.now();
        totalPurchases = state.totalPurchases || 0;

        // Load tasks state
        if (state.tasks) {
            tasks.forEach((task, index) => {
                task.completed = state.tasks[index].completed;
                task.claimed = state.tasks[index].claimed;
            });
        }

        // Загружаем состояние предметов магазина
        if (state.shopItems) {
            state.shopItems.forEach(savedItem => {
                const item = shopItems.find(i => i.id === savedItem.id);
                if (item) {
                    item.level = savedItem.level || 0;
                    item.price = savedItem.price || item.basePrice;
                }
            });
        }
    }
    updateScoreDisplay();
    updateShopItems();
    renderTasks();
}

// Обновляем функцию updateScoreDisplay
function updateScoreDisplay() {
    if (scoreElement) {
        const displayScore = Math.floor(score || 0);
        scoreElement.innerHTML = `
            <img src="https://i.postimg.cc/mrTkbdNm/coin-us-dollar-40536.png" alt="Coins">
            ${formatNumber(displayScore)}
        `;
    }
}

// Обновляем функцию getTaskProgressText
function getTaskProgressText(task, progress) {
    switch(task.id) {
        case 4:
            return `${progress} / 1`;
        case 5:
            return `${progress} / 1000`;
        case 6:
            return `${progress} / 10000`;
        case 7:
            return `${progress} / 100000`;
        case 8:
            return `${progress} / 1000000`;
        case 9:
            return `${progress} / 1`;
        case 10:
            return `${progress} / 5`;
        case 11:
            return `${progress} / 10`;
        case 12:
            return `${progress} / 10`;
        case 13:
            return `${progress} / 100`;
        case 14:
            return `${progress} / 1000`;
        case 15:
            return `${progress} / 10000`;
        case 21:
            return `${progress} / 100`;
        case 22:
            return `${progress} / 1000`;
        default:
            return `${progress} / 1`;
    }
}

// Обновляем функцию renderTasks
function renderTasks() {
    const tasksGrid = document.querySelector('.tasks-grid');
    if (!tasksGrid) return;

    // Разделяем задания на выполненные и невыполненные
    const completedTasks = tasks.filter(task => task.completed);
    const uncompletedTasks = tasks.filter(task => !task.completed);

    tasksGrid.innerHTML = `
        <div class="tasks-section">
            <h2 class="tasks-section-title">Активные задания</h2>
            ${uncompletedTasks.map(task => {
                const progress = getTaskProgress(task);
                
                return `
                    <div class="task-item">
                        <div class="task-icon">${task.icon}</div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-description">${task.description}</div>
                        <div class="task-reward">Награда: ${formatNumber(task.reward)} </div>
                        <div class="task-progress-container">
                            <div class="task-progress-bar" style="width: ${progress * 100}%"></div>
                            <div class="task-progress-text">${getTaskProgressText(task, progress)}</div>
                        </div>
                        <button class="task-button claim-task-btn" 
                                data-task-id="${task.id}" 
                                ${progress >= 1 ? '' : 'disabled'}>
                            ${progress >= 1 ? 'Получить' : 'Не выполнено'}
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
        ${completedTasks.length > 0 ? `
            <div class="tasks-section">
                <h2 class="tasks-section-title">Выполненные задания</h2>
                ${completedTasks.map(task => {
                    return `
                        <div class="task-item completed">
                            <div class="task-icon">${task.icon}</div>
                            <div class="task-title">${task.title}</div>
                            <div class="task-description">${task.description}</div>
                            <div class="task-reward">Получено: ${formatNumber(task.reward)} </div>
                            <div class="task-progress-container">
                                <div class="task-progress-bar" style="width: 100%"></div>
                                <div class="task-progress-text">Выполнено!</div>
                            </div>
                            <button class="task-button completed" disabled>
                                Выполнено
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : ''}
    `;
}

// Обновляем функцию updateStatsSection
function updateStatsSection() {
    const statsSection = document.getElementById('stats-section');
    if (!statsSection) return;

    const clicksPerSecond = autoClickPower;
    const clicksPerHour = clicksPerSecond * 3600;
    const totalTime = Math.floor((Date.now() - gameStartTime) / 1000);
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);

    // Получаем имя пользователя из Telegram WebApp
    const username = tg.initDataUnsafe?.user?.username || 'Игрок';

    // Добавляем заголовок с именем пользователя
    statsSection.innerHTML = `
        <div class="user-header">
            <h2>👤 ${username}</h2>
        </div>
        <div class="stats-container">
            <div class="stat-item">
                <div class="stat-emoji">🖱️</div>
                <div class="stat-info">
                    <h3>Всего кликов</h3>
                    <p>${formatNumber(totalClicks)}</p>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-emoji">⚡</div>
                <div class="stat-info">
                    <h3>Кликов в секунду</h3>
                    <p>${formatNumber(clicksPerSecond)}</p>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-emoji">🚀</div>
                <div class="stat-info">
                    <h3>Кликов в час</h3>
                    <p>${formatNumber(clicksPerHour)}</p>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-emoji">⏰</div>
                <div class="stat-info">
                    <h3>Время в игре</h3>
                    <p>${hours}ч ${minutes}м</p>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-emoji">💰</div>
                <div class="stat-info">
                    <h3>Максимальный баланс</h3>
                    <p>${formatNumber(Math.max(score, maxBalance))}</p>
                </div>
            </div>
        </div>
    `;
}

// Обновляем игру каждую секунду
setInterval(() => {
    const now = Date.now();
    const deltaTime = (now - lastUpdateTime) / 1000;
    
    // Добавляем очки от автокликера
    if (autoClickPower > 0) {
        score += autoClickPower * deltaTime;
        totalEarned += autoClickPower * deltaTime;
    }
    
    // Обновляем максимальный баланс
    if (score > maxBalance) {
        maxBalance = score;
    }
    
    // Обновляем отображение
    updateScoreDisplay();
    updateStatsSection();
    
    // Сохраняем состояние каждые 5 секунд
    if (now - lastSaveTime >= 5000) {
        saveGameState();
        lastSaveTime = now;
    }
    
    lastUpdateTime = now;
}, 1000);

function canClaimTask(task) {
    switch(task.id) {
        case 4:
            return totalClicks >= 1;
        case 5:
            return totalClicks >= 1000;
        case 6:
            return totalClicks >= 10000;
        case 7:
            return totalClicks >= 100000;
        case 8:
            return totalClicks >= 1000000;
        case 9:
            return shopItems.some(item => item.level > 0);
        case 10:
            return shopItems.filter(item => item.level > 0).length >= 5;
        case 11:
            return shopItems.filter(item => item.level > 0).length >= 10;
        case 12:
            return autoClickPower >= 10;
        case 13:
            return autoClickPower >= 100;
        case 14:
            return autoClickPower >= 1000;
        case 15:
            return autoClickPower >= 10000;
        case 21:
            return currentStreak >= 100;
        case 22:
            return currentStreak >= 1000;
        default:
            return false;
    }
}

function canAfford(price) {
    return score >= price;
}

function updateGame() {
    const now = Date.now();
    const deltaTime = (now - lastUpdateTime) / 1000;
    lastUpdateTime = now;
    
    score += autoClickPower * deltaTime;
    updateScoreDisplay();
    
    if (now - lastSaveTime > 5000) {
        saveGameState();
        lastSaveTime = now;
    }
    
    requestAnimationFrame(updateGame);
}

function initializeNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section-content');
    const changelogBtn = document.getElementById('changelogBtn');
    const tasksSection = document.getElementById('tasks-section');

    // Create tasks section if it doesn't exist
    if (!tasksSection) {
        const newTasksSection = document.createElement('div');
        newTasksSection.id = 'tasks-section';
        newTasksSection.className = 'section-content';
        document.querySelector('.game-area').appendChild(newTasksSection);
    }

    navBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = '#1c1c2e';
            });
            
            sections.forEach(s => s.classList.remove('active'));
            
            btn.classList.add('active');
            btn.style.background = '#ff3366';
            
            const btnText = btn.textContent.trim().toLowerCase();
            
            if (btnText === 'главная') {
                sections.forEach(s => s.classList.remove('active'));
                changelogBtn.style.display = 'block';
            } else {
                changelogBtn.style.display = 'none';
                if (btnText === 'магазин') {
                    const shopSection = document.getElementById('shop-section');
                    if (shopSection) {
                        shopSection.classList.add('active');
                        updateShopItems(); // Обновляем магазин при показе
                    }
                } else if (btnText === 'задания') {
                    const tasksSection = document.getElementById('tasks-section');
                    if (tasksSection) {
                        tasksSection.classList.add('active');
                        renderTasks(); // Re-render tasks when showing tasks section
                    }
                } else if (btnText === 'настройки') {
                    const settingsSection = document.getElementById('settings-section');
                    if (settingsSection) {
                        settingsSection.classList.add('active');
                        settingsSection.innerHTML = `
                            <div class="settings-options" style="margin-top: 20px; background: rgba(0, 136, 255, 0.1); padding: 20px; border-radius: 15px;">
                                <div class="settings-option" style="display: flex; align-items: center; justify-content: space-between;">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <img src="https://i.postimg.cc/nVTK9hF1/image.png" style="width: 24px; height: 24px;">
                                        <div>
                                            <h3 style="margin-bottom: 5px;">Вибрация</h3>
                                            <p style="font-size: 14px; color: #aaa;">Включить вибрацию при клике</p>
                                        </div>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="vibrationToggle" ${vibrationEnabled ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        `;
                        
                        // Добавляем обработчик для переключателя вибрации
                        const vibrationToggle = document.getElementById('vibrationToggle');
                        if (vibrationToggle) {
                            vibrationToggle.addEventListener('change', function() {
                                vibrationEnabled = this.checked;
                                localStorage.setItem('vibrationEnabled', vibrationEnabled);
                            });
                        }
                    }
                } else if (btnText === 'награды' || btnText === 'город' || btnText === 'инвестиции') {
                    const devSection = document.getElementById('development-section');
                    if (!devSection) {
                        const newDevSection = document.createElement('div');
                        newDevSection.id = 'development-section';
                        newDevSection.className = 'section-content';
                        document.querySelector('.game-area').appendChild(newDevSection);
                    }
                    const currentDevSection = document.getElementById('development-section');
                    if (currentDevSection) {
                        currentDevSection.classList.add('active');
                        currentDevSection.innerHTML = `
                            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 100%; padding-top: 20px;">
                                <div class="development-header" style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, rgba(255, 51, 102, 0.2) 0%, rgba(255, 51, 102, 0.1) 100%); padding: 15px 30px; border-radius: 20px; border: 2px solid rgba(255, 51, 102, 0.5); backdrop-filter: blur(5px);">
                                    <h3 style="margin: 0; color: white; font-size: 24px;">Раздел ${btnText} в разработке</h3>
                                </div>
                                <img src="https://i.postimg.cc/5NHn3gzK/free-icon-web-development-1352837.png" 
                                     alt="Development" 
                                     style="width: 300px; height: 300px; object-fit: contain; filter: drop-shadow(0 0 20px rgba(255, 51, 102, 0.3));">
                            </div>
                        `;
                    }
                } else if (btnText === 'статистика') {
                    const statsSection = document.getElementById('stats-section');
                    if (statsSection) {
                        statsSection.classList.add('active');
                        updateStatsSection();
                    }
                }
            }
        });
    });
}

document.addEventListener('click', function(e) {
    if (e.target.matches('.nav-btn')) {
        const section = e.target.getAttribute('data-section');
        if (section) {
            showSection(section);
        }
    }
});

let shopItems = [
    {
        id: 1,
        icon: `<img src="https://i.postimg.cc/44zLpwFY/image.png" alt="Автокликер">`,
        title: 'Автокликер',
        price: 500,
        basePrice: 500,
        level: 0,
        power: 1,
        description: 'Добавляет 1 клик/сек'
    },
    {
        id: 2,
        icon: `<img src="https://i.postimg.cc/1znsJbL0/image.png" alt="Робот-помощник">`,
        title: 'Робот-помощник',
        price: 1000,
        basePrice: 1000,
        level: 0,
        power: 2,
        description: 'Добавляет 2 клика/сек'
    },
    {
        id: 3,
        icon: `<img src="https://i.postimg.cc/KcLt8XP6/free-icon-business-12761812.png" alt="Мини-фабрика">`,
        title: 'Мини-фабрика',
        price: 2000,
        basePrice: 2000,
        level: 0,
        power: 5,
        description: 'Добавляет 5 кликов/сек'
    },
    {
        id: 4,
        icon: `<img src="https://i.postimg.cc/xCQnGbZy/free-icon-medical-laboratory-2971555.png" alt="Лаборатория">`,
        title: 'Лаборатория',
        price: 5000,
        basePrice: 5000,
        level: 0,
        power: 10,
        description: 'Добавляет 10 кликов/сек'
    },
    {
        id: 5,
        icon: `<img src="https://i.postimg.cc/pVsMydD7/free-icon-factories-273152.png" alt="Завод">`,
        title: 'Завод',
        price: 10000,
        basePrice: 10000,
        level: 0,
        power: 20,
        description: 'Добавляет 20 кликов/сек'
    },
    {
        id: 6,
        icon: `<img src="https://i.postimg.cc/2SdHbb4f/free-icon-robot-assistant-12003464.png" alt="Сеть роботов">`,
        title: 'Сеть роботов',
        price: 20000,
        basePrice: 20000,
        level: 0,
        power: 50,
        description: 'Добавляет 50 кликов/сек'
    },
    {
        id: 7,
        icon: `<img src="https://i.postimg.cc/Hs8WgHbM/free-icon-artificial-intelligence-2104411.png" alt="Искусственный интеллект">`,
        title: 'Искусственный интеллект',
        price: 50000,
        basePrice: 50000,
        level: 0,
        power: 100,
        description: 'Добавляет 100 кликов/сек'
    },
    {
        id: 8,
        icon: `<img src="https://i.postimg.cc/QxC9KR1N/free-icon-satellite-2536704.png" alt="Спутник">`,
        title: 'Спутник',
        price: 100000,
        basePrice: 100000,
        level: 0,
        power: 200,
        description: 'Добавляет 200 кликов/сек'
    },
    {
        id: 9,
        icon: `<img src="https://i.postimg.cc/GtQf04qR/free-icon-base-6257298.png" alt="Космическая станция">`,
        title: 'Космическая станция',
        price: 200000,
        basePrice: 200000,
        level: 0,
        power: 500,
        description: 'Добавляет 500 кликов/сек'
    },
    {
        id: 10,
        icon: `<img src="https://i.postimg.cc/xTXDzRCV/free-icon-quantum-computer-6554108.png" alt="Квантовый компьютер">`,
        title: 'Квантовый компьютер',
        price: 500000,
        basePrice: 500000,
        level: 0,
        power: 1000,
        description: 'Добавляет 1000 кликов/сек'
    },
    {
        id: 11,
        icon: `<img src="https://i.postimg.cc/xCQnGbZy/free-icon-time-machine-6642136.png" alt="Машина времени">`,
        title: 'Машина времени',
        price: 1000000,
        basePrice: 1000000,
        level: 0,
        power: 2000,
        description: 'Добавляет 2000 кликов/сек'
    },
    {
        id: 12,
        icon: `<img src="https://i.postimg.cc/pVsMydD7/free-icon-teleport-1636923.png" alt="Телепорт">`,
        title: 'Телепорт',
        price: 2000000,
        basePrice: 2000000,
        level: 0,
        power: 5000,
        description: 'Добавляет 5000 кликов/сек'
    },
    {
        id: 13,
        icon: `<img src="https://i.postimg.cc/Hs8WgHbM/free-icon-cloning-8595286.png" alt="Клонирование">`,
        title: 'Клонирование',
        price: 5000000,
        basePrice: 5000000,
        level: 0,
        power: 10000,
        description: 'Добавляет 10000 кликов/сек'
    },
    {
        id: 14,
        icon: `<img src="https://i.postimg.cc/vm5cdnxC/free-icon-virtual-7009709.png" alt="Виртуальная реальность">`,
        title: 'Виртуальная реальность',
        price: 10000000,
        basePrice: 10000000,
        level: 0,
        power: 20000,
        description: 'Добавляет 20000 кликов/сек'
    },
    {
        id: 15,
        icon: `<img src="https://i.postimg.cc/VsCHPLKn/free-icon-hologram-1387354.png" alt="Голограмма">`,
        title: 'Голограмма',
        price: 20000000,
        basePrice: 20000000,
        level: 0,
        power: 50000,
        description: 'Добавляет 50000 кликов/сек'
    },
    {
        id: 16,
        icon: `<img src="https://i.postimg.cc/ZRkp8Z6z/free-icon-robot-4136152.png" alt="Армия роботов">`,
        title: 'Армия роботов',
        price: 50000000,
        basePrice: 50000000,
        level: 0,
        power: 100000,
        description: 'Добавляет 100000 кликов/сек'
    },
    {
        id: 17,
        icon: `<img src="https://i.postimg.cc/sfGDF7Fm/free-icon-moon-2949268.png" alt="Колонизация планет">`,
        title: 'Колонизация планет',
        price: 100000000,
        basePrice: 100000000,
        level: 0,
        power: 200000,
        description: 'Добавляет 200000 кликов/сек'
    },
    {
        id: 18,
        icon: `<img src="https://i.postimg.cc/RVmGr16x/free-icon-galactic-empire-10659391.png" alt="Галактическая империя">`,
        title: 'Галактическая империя',
        price: 200000000,
        basePrice: 200000000,
        level: 0,
        power: 500000,
        description: 'Добавляет 500000 кликов/сек'
    },
    {
        id: 19,
        icon: `<img src="https://i.postimg.cc/RVmGr16x/free-icon-multiverse-10659390.png" alt="Контроль вселенной">`,
        title: 'Контроль вселенной',
        price: 500000000,
        basePrice: 500000000,
        level: 0,
        power: 1000000,
        description: 'Добавляет 1000000 кликов/сек'
    },
    {
        id: 20,
        icon: `<img src="https://i.postimg.cc/RVmGr16x/free-icon-multiverse-10659390.png" alt="Мультивселенная">`,
        title: 'Мультивселенная',
        price: 1000000000,
        basePrice: 1000000000,
        level: 0,
        power: 2000000,
        description: 'Добавляет 2000000 кликов/сек'
    }
];

// Обработчик кликов
function handleClick(e) {
    if (!e || !e.target) return;
    
    const clickCircle = e.target.closest('.click-circle');
    if (!clickCircle) return;
    
    // Обновляем счетчики
    totalClicks++;
    score++;
    
    // Обновляем максимальный баланс
    if (score > maxBalance) {
        maxBalance = score;
    }
    
    // Обновляем общий заработок
    totalEarned++;
    
    // Обновляем текущую серию кликов
    const now = Date.now();
    if (now - lastClickTime < 1000) {
        currentStreak++;
    } else {
        currentStreak = 1;
    }
    lastClickTime = now;
    
    // Обновляем клики в час
    const timeSinceStart = (now - gameStartTime) / 1000;
    clicksPerHour = Math.floor(totalClicks * (3600 / timeSinceStart));
    
    // Обновляем отображение
    updateScoreDisplay();
    updateStatsSection();
    
    // Сохраняем состояние и проверяем задания
    saveGameState();
    checkTasks();
}

// Добавляем обработчик кликов
document.addEventListener('DOMContentLoaded', function() {
    const mainSection = document.querySelector('.game-area');
    if (mainSection) {
        mainSection.addEventListener('click', handleClick);
    }
});

// Обновляем функцию buyItem
function buyItem(itemId) {
    const item = shopItems.find(item => item.id === itemId);
    if (!item) return;

    if (score >= item.price) {
        score -= item.price;
        item.level++;
        totalPurchases++;
        
        // Обновляем цену предмета
        item.price = Math.floor(item.basePrice * Math.pow(1.15, item.level));
        
        // Обновляем автоматический доход
        autoClickPower = shopItems.reduce((total, item) => {
            return total + (item.power * (item.level || 0));
        }, 0);
        
        // Обновляем отображение
        updateScoreDisplay();
        updateShopItems();
        updateStatsSection();
        
        // Сохраняем состояние
        saveGameState();
        checkTasks();
    } else {
        showNotification('Недостаточно средств!');
    }
}

// Добавляем обработчик кликов по кнопкам покупки
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('buy-button')) {
        const itemId = parseInt(e.target.closest('.shop-item').getAttribute('data-item-id'));
        if (!isNaN(itemId)) {
            buyItem(itemId);
        }
    }
});

// Обновляем функцию updateShopItems
function updateShopItems() {
    const shopSection = document.getElementById('shop-section');
    if (!shopSection) return;
    
    shopSection.innerHTML = `<div class="shop-window">` + 
        shopItems.map((item) => `
            <div class="shop-item" data-item-id="${item.id}">
                <div class="item-icon">
                    ${item.icon}
                </div>
                <div class="item-info">
                    <h3 class="item-title">${item.title}</h3>
                    <div class="item-level">Ур. ${item.level || 0}</div>
                </div>
                <div class="item-right">
                    <div class="item-profit">+${formatNumber(item.power || 0)} в сек</div>
                    <button class="buy-button" ${canAfford(item.price) ? '' : 'disabled'}>
                        <span class="coin-icon"></span>
                        ${formatNumber(item.price)}
                    </button>
                </div>
            </div>
        `).join('') + `</div>`;
}

// Changelog Modal functionality
const changelogBtn = document.getElementById('changelogBtn');
const changelogModal = document.getElementById('changelogModal');
const closeBtn = document.querySelector('.close-btn');

if (changelogBtn && changelogModal) {
    changelogBtn.addEventListener('click', () => {
        changelogModal.style.display = 'block';
        renderChangelog(); // Вызываем функцию из changelog.js
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        changelogModal.style.display = 'none';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === changelogModal) {
        changelogModal.style.display = 'none';
    }
});

document.getElementById('vibrationToggle').addEventListener('change', function() {
    vibrationEnabled = this.checked;
    localStorage.setItem('vibrationEnabled', vibrationEnabled);
    showNotification(`Вибрация ${vibrationEnabled ? 'включена' : 'выключена'}`);
});

document.body.addEventListener('change', function(e) {
    if (e.target.id === 'vibrationToggle') {
        vibrationEnabled = e.target.checked;
        localStorage.setItem('vibrationEnabled', vibrationEnabled);
        showNotification(`Вибрация ${vibrationEnabled ? 'включена' : 'выключена'}`);
        
        if (vibrationEnabled) {
            try {
                window.navigator.vibrate(15);
            } catch (e) {
                console.log('Vibration test failed:', e);
            }
        }
    }
});

// Обновляем функцию checkTasks
function checkTasks() {
    tasks.forEach(task => {
        if (!task.completed) {
            let completed = false;
            
            switch(task.id) {
                case 4: // Первые шаги
                    completed = clickCount >= 1;
                    break;
                case 5: // Начинающий кликер
                    completed = score >= 1000;
                    break;
                case 6: // Опытный кликер
                    completed = score >= 10000;
                    break;
                case 7: // Мастер кликер
                    completed = score >= 100000;
                    break;
                case 8: // Король кликов
                    completed = score >= 1000000;
                    break;
                case 9: // Первая покупка
                    completed = shopItems.some(item => item.level > 0);
                    break;
                case 10: // Шопоголик
                    completed = shopItems.filter(item => item.level > 0).length >= 5;
                    break;
                case 11: // Коллекционер
                    completed = shopItems.filter(item => item.level > 0).length >= 10;
                    break;
                case 12: // Энергичный старт
                    completed = autoClickPower >= 10;
                    break;
                case 13: // Скоростной кликер
                    completed = autoClickPower >= 100;
                    break;
                case 14: // Звездный путь
                    completed = autoClickPower >= 1000;
                    break;
                case 15: // Мировое господство
                    completed = autoClickPower >= 10000;
                    break;
                case 21: // Точность
                    completed = consecutiveClicks >= 100;
                    break;
                case 22: // Цирковой артист
                    completed = consecutiveClicks >= 1000;
                    break;
                // Добавьте другие задания по необходимости
            }

            if (completed) {
                task.completed = true;
                // Обновляем состояние игры
                saveGameState();
            }
        }
    });
    
    renderTasks(); // Обновляем отображение заданий
}

// Функция получения награды за задание
function claimTaskReward(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.completed && !task.claimed) {
        score += task.reward;
        task.claimed = true;
        updateScoreDisplay();
        saveGameState();
        showNotification(`Получена награда: ${formatNumber(task.reward)} кликов!`);
        renderTasks(); // Обновляем отображение заданий
    }
}

// Обновляем функцию renderTasks
function renderTasks() {
    const tasksSection = document.getElementById('tasks-section');
    if (!tasksSection) return;

    tasksSection.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''} ${task.claimed ? 'claimed' : ''}" data-task-id="${task.id}">
            <div class="task-icon">${task.icon}</div>
            <div class="task-info">
                <h3 class="task-title">${task.title}</h3>
                <div class="task-description">${task.description}</div>
                <div class="task-reward">Награда: ${formatNumber(task.reward)} кликов</div>
            </div>
            <button class="claim-button" onclick="claimTaskReward(${task.id})" 
                ${task.completed && !task.claimed ? '' : 'disabled'}>
                ${task.claimed ? 'Получено' : (task.completed ? 'Забрать награду' : 'Не выполнено')}
            </button>
        </div>
    `).join('');
}