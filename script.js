// Функция форматирования чисел
function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    num = Number(num);
    if (isNaN(num)) return '0';
    
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
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
    }, 3000); // Изменено на 3 секунды
}

// Массив заданий
let tasks = [
    {
        id: 1,
        title: "Начинающий кликер",
        description: "Сделайте 100 кликов",
        type: "clicks",
        target: 100,
        reward: 500,
        claimed: false
    },
    {
        id: 2,
        title: "Первый час",
        description: "Играйте в игру 1 час",
        type: "time",
        target: 1,
        reward: 1000,
        claimed: false
    },
    {
        id: 3,
        title: "Быстрые пальцы",
        description: "Достигните серии из 10 кликов подряд",
        type: "hourly",
        target: 10,
        reward: 750,
        claimed: false
    },
    {
        id: 4,
        title: "Первые шаги",
        description: "Сделайте первый клик",
        type: "clicks",
        target: 1,
        reward: 100,
        claimed: false
    },
    {
        id: 5,
        title: "Начинающий кликер",
        description: "Накопите 1,000 кликов",
        type: "clicks",
        target: 1000,
        reward: 200,
        claimed: false
    }
];

// Массив для отслеживания времени кликов
let clickTimes = [];

// Глобальные переменные
let score = 0;
let clickPower = 1;
let autoClickPower = 0;
let totalClicks = 0;
let clicksPerHour = 0;
let maxBalance = 0;
let totalEarned = 0;
let totalPurchases = 0;
let gameStartTime = Date.now();
let lastSaveTime = Date.now();
let lastUpdateTime = Date.now();
let vibrationEnabled = true;

// DOM элементы
const sectionContents = document.querySelectorAll('.section-content');
const gameArea = document.querySelector('.game-area');
const scoreContainer = document.querySelector('.score-container');
const scoreElement = document.querySelector('.score');

// Обработчик клика
gameArea.addEventListener('click', function(e) {
    if (e.target === gameArea || e.target === scoreContainer || e.target === scoreElement) {
        score += clickPower;
        totalClicks++; // Увеличиваем счетчик кликов
        totalEarned += clickPower; // Увеличиваем общий заработок
        
        // Обновляем максимальный баланс
        maxBalance = Math.max(score, maxBalance);
        
        // Обновляем статистику кликов в час
        const now = Date.now();
        clickTimes.push(now);
        // Оставляем только клики за последний час
        clickTimes = clickTimes.filter(time => now - time <= 3600000);
        clicksPerHour = clickTimes.length;
        
        if (vibrationEnabled && navigator.vibrate) {
            navigator.vibrate(25);
        }
        
        updateScoreDisplay();
        checkTasksProgress();
        saveGameState();
        
        // Создаем эффект клика
        const clickEffect = document.createElement('div');
        clickEffect.className = 'click-effect';
        clickEffect.style.left = (e.clientX - 10) + 'px';
        clickEffect.style.top = (e.clientY - 10) + 'px';
        document.body.appendChild(clickEffect);
        
        setTimeout(() => {
            document.body.removeChild(clickEffect);
        }, 1000);
    }
});

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
        maxBalance,
        totalEarned,
        gameStartTime,
        totalPurchases,
        tasks,
        shopItems: shopItems.map(item => ({ count: item.count }))
    };
    localStorage.setItem('gameState', JSON.stringify(state));
    localStorage.setItem('lastOnlineTime', Date.now().toString());
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const mainSection = document.querySelector('.main-section');
    const savedVibration = localStorage.getItem('vibrationEnabled');
    vibrationEnabled = savedVibration === null ? true : savedVibration === 'true';

    // Загружаем состояние игры и проверяем оффлайн прогресс
    loadGameState();
    calculateOfflineProgress();
    
    // Инициализируем остальные компоненты
    initializeNavigation();
    updateScoreDisplay();
    updateShopItems();
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
    
    switch(task.type) {
        case 'clicks':
            return totalClicks || 0;
        case 'cps':
            return autoClickPower || 0;
        case 'time':
            const timeInHours = (Date.now() - gameStartTime) / (1000 * 60 * 60);
            return Math.floor(timeInHours) || 0;
        case 'hourly':
            return clicksPerHour || 0;
        case 'purchases':
            return totalPurchases || 0;
        case 'streak':
            return 0;
        default:
            return 0;
    }
}

// Обновляем функцию handleClick
function handleClick(x, y) {
    const now = Date.now();
    
    // Обновляем счетчики
    totalClicks++;
    score += clickPower;
    
    // Обновляем максимальный баланс
    if (score > maxBalance) {
        maxBalance = score;
    }
    
    // Обновляем общий заработок
    totalEarned += clickPower;
    
    // Обновляем клики в час (простая формула: текущие клики * (3600 / прошедшее время в секундах))
    const timeSinceStart = (now - gameStartTime) / 1000;
    clicksPerHour = Math.floor(totalClicks * (3600 / timeSinceStart));
    
    // Обновляем отображение
    updateScoreDisplay();
    
    // Создаем визуальный эффект
    createClickEffect(x, y);
    
    // Проверяем выполнение заданий
    checkTasksProgress();
    
    // Вибрация при клике
    if (vibrationEnabled && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
    }
}

// Функция для создания эффекта клика
function createClickEffect(x, y) {
    const clickEffect = document.createElement('div');
    clickEffect.className = 'click-effect';
    clickEffect.style.left = x + 'px';
    clickEffect.style.top = y + 'px';
    clickEffect.textContent = '+' + clickPower;
    
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
        if (progress >= task.target && !task.claimed) {
            // Показываем уведомление только если задание выполнено впервые
            showNotification(`Задание "${task.title}" выполнено! Нажмите, чтобы получить награду.`);
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
        maxBalance = state.maxBalance || 0;
        totalEarned = state.totalEarned || 0;
        gameStartTime = state.gameStartTime || Date.now();
        totalPurchases = state.totalPurchases || 0;

        // Load tasks state
        if (state.tasks) {
            tasks = state.tasks;
        }
    }
    updateScoreDisplay();
    renderTasks();
}

// Обновляем функцию updateShopItems
function updateShopItems() {
    const shopSection = document.getElementById('shop-section');
    if (!shopSection) return;
    
    shopSection.innerHTML = `
        <div class="shop-grid">
            ${shopItems.map((item, index) => `
                <div class="shop-item ${canAfford(item.price) ? 'can-afford' : ''}">
                    <img src="${item.icon.match(/src="([^"]+)"/)[1]}" alt="${item.title}" class="shop-item-image">
                    <div class="shop-item-info">
                        <div class="shop-item-name">${item.title}</div>
<div class="shop-item-level">LVL ${item.level}</div>    
                        <div class="shop-item-description">${item.description}</div>
                        <div class="price-container">
                            <span class="price-amount">${formatNumber(item.price)}</span>
                        </div>
                        <button class="shop-item-button" data-index="${index}" ${canAfford(item.price) ? '' : 'disabled'}>
                            ${canAfford(item.price) ? 'Купить' : 'Недостаточно средств'}
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function purchaseItem(index) {
    const item = shopItems[index];
    if (!item || !canAfford(item.price)) {
        showNotification(`Недостаточно средств для покупки ${item.title}`);
        return;
    }

    score -= item.price;
    item.level++;
    item.price = Math.floor(item.basePrice * Math.pow(1.2, item.level));
    autoClickPower += item.power;
    
    updateScoreDisplay();
    updateShopItems();
    saveGameState();
    
    showNotification(`Улучшение "${item.title}" куплено! Уровень: ${item.level}`);
}

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
        icon: `<img src="https://i.postimg.cc/1znsJbL0/image.png " alt="Робот-помощник">`,
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
        icon: `<img src="https://i.postimg.cc/hvTmyYbQ/free-icon-quantum-computer-6554108.png" alt="Квантовый компьютер">`,
        title: 'Квантовый компьютер',
        price: 500000,
        basePrice: 500000,
        level: 0,
        power: 1000,
        description: 'Добавляет 1000 кликов/сек'
    },
    {
        id: 11,
        icon: `<img src="https://i.postimg.cc/xTXDzRCV/free-icon-time-machine-6642136.png" alt="Машина времени">`,
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
        icon: `<img src="https://i.postimg.cc/Wzky9sHm/free-icon-cloning-8595286.png" alt="Клонирование">`,
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
        icon: `<img src="https://i.postimg.cc/Y0v7tcyj/free-icon-moon-2949268.png" alt="Колонизация планет">`,
        title: 'Колонизация планет',
        price: 100000000,
        basePrice: 100000000,
        level: 0,
        power: 200000,
        description: 'Добавляет 200000 кликов/сек'
    },
    {
        id: 18,
        icon: `<img src="https://i.postimg.cc/YChnJ78P/image.png" alt="Галактическая империя">`,
        title: 'Галактическая империя',
        price: 200000000,
        basePrice: 200000000,
        level: 0,
        power: 500000,
        description: 'Добавляет 500000 кликов/сек'
    },
    {
        id: 19,
        icon: `<img src="https://i.postimg.cc/sfGDF7Fm/free-icon-space-15300331.png" alt="Контроль вселенной">`,
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

function updateScoreDisplay() {
    scoreElement.innerHTML = `
        <img src="https://i.postimg.cc/mrTkbdNm/coin-us-dollar-40536.png" alt="Coins">
        ${formatNumber(Math.floor(score))}
    `;
}

function getTaskProgressText(task, progress) {
    switch (task.type) {
        case 'clicks':
            return `${formatNumber(progress)} / ${formatNumber(task.target)} кликов`;
        case 'cps':
            return `${formatNumber(progress)} / ${formatNumber(task.target)} кликов/сек`;
        case 'time':
            const hours = Math.floor(progress / 3600);
            const minutes = Math.floor((progress % 3600) / 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} / ${Math.floor(task.target / 3600)}ч`;
        case 'hourly':
            return `${formatNumber(progress)} / ${formatNumber(task.target)} кликов/час`;
        case 'purchases':
            return `${progress} / ${task.target} покупок`;
        case 'balance':
            return `${progress} / ${task.target}`;
        default:
            return `${progress} / ${task.target}`;
    }
}

function renderTasks() {
    const tasksSection = document.getElementById('tasks-section');
    if (!tasksSection) return;

    tasksSection.innerHTML = `
        <div class="tasks-container">
            ${tasks.map((task, index) => {
                const isCompleted = canClaimTask(task);
                const currentValue = getTaskCurrentValue(task);
                const progress = getTaskProgress(task);
                const buttonStyle = isCompleted ? 
                    'background: #28a745; color: white; cursor: pointer;' : 
                    'background: #6c757d; color: rgba(255,255,255,0.5); cursor: not-allowed;';

                // Формируем текст прогресса в зависимости от типа задания
                let progressText = '';
                switch(task.type) {
                    case 'clicks':
                        progressText = `${formatNumber(currentValue)} / ${formatNumber(task.target)} кликов`;
                        break;
                    case 'time':
                        progressText = `${formatNumber(currentValue)} / ${formatNumber(task.target)} час.`;
                        break;
                    case 'hourly':
                        progressText = `${formatNumber(currentValue)} / ${formatNumber(task.target)} кл/сек`;
                        break;
                    case 'purchases':
                        progressText = `${formatNumber(currentValue)} / ${formatNumber(task.target)} покупок`;
                        break;
                    default:
                        progressText = `${formatNumber(currentValue)} / ${formatNumber(task.target)}`;
                }

                return `
                    <div class="task-item" style="background: rgba(255, 51, 102, 0.1); border-radius: 15px; padding: 15px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="margin: 0; color: white;">${task.title}</h3>
                                <p style="margin: 5px 0; color: #aaa;">${task.description}</p>
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <img src="https://i.postimg.cc/mrTkbdNm/coin-us-dollar-40536.png" style="width: 20px; height: 20px;">
                                    <span style="color: gold;">${formatNumber(task.reward)}</span>
                                </div>
                            </div>
                            <button 
                                class="task-claim-btn" 
                                data-index="${index}"
                                style="padding: 10px 20px; border: none; border-radius: 10px; ${buttonStyle}"
                                ${isCompleted ? '' : 'disabled'}
                            >
                                Получить
                            </button>
                        </div>
                        <div class="task-progress" style="margin-top: 10px;">
                            <div class="progress-bar" style="background: rgba(255,255,255,0.1); border-radius: 5px; height: 10px; overflow: hidden;">
                                <div style="background: ${isCompleted ? '#28a745' : '#ff3366'}; width: ${progress}%; height: 100%; transition: width 0.3s;"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                                <span style="color: #aaa;">${progressText}</span>
                                <span style="color: #aaa;">${progress}%</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    // Добавляем обработчики для кнопок
    const claimButtons = tasksSection.querySelectorAll('.task-claim-btn');
    claimButtons.forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.getAttribute('data-index'));
            const task = tasks[index];
            if (canClaimTask(task) && !task.claimed) {
                score += task.reward;
                totalEarned += task.reward;
                task.claimed = true;
                showNotification(`Задание "${task.title}" выполнено! Награда: ${formatNumber(task.reward)}`);
                updateScoreDisplay();
                saveGameState();
                renderTasks();
            }
        });
    });
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

// Функция получения текущего значения для задания
function getTaskCurrentValue(task) {
    if (!task || !task.type) return 0;
    
    switch(task.type) {
        case 'clicks':
            return totalClicks || 0;
        case 'cps':
            return autoClickPower || 0;
        case 'time':
            return Math.floor((Date.now() - gameStartTime) / (1000 * 60 * 60)) || 0;
        case 'hourly':
            return clicksPerHour || 0;
        case 'purchases':
            return totalPurchases || 0;
        case 'balance':
            return maxBalance || 0;
        default:
            return 0;
    }
}

// Функция получения прогресса задания в процентах
function getTaskProgress(task) {
    if (!task || !task.target) return 0;
    const currentValue = getTaskCurrentValue(task);
    return Math.min(100, Math.floor((currentValue / task.target) * 100)) || 0;
}

// Функция проверки возможности получения награды за задание
function canClaimTask(task) {
    if (!task || task.claimed) return false;
    const currentValue = getTaskCurrentValue(task);
    return currentValue >= (task.target || 0);
}

// Функция автоматического сохранения
function autoSave() {
    const now = Date.now();
    if (now - lastSaveTime >= 10000) { // Сохраняем каждые 10 секунд
        saveGameState();
        lastSaveTime = now;
    }
}

// Функция автоматического обновления
function autoUpdate() {
    const now = Date.now();
    if (now - lastUpdateTime >= 1000) { // Обновляем каждую секунду
        score += autoClickPower;
        totalEarned += autoClickPower;
        maxBalance = Math.max(score, maxBalance);
        updateScoreDisplay();
        checkTasksProgress();
        lastUpdateTime = now;
    }
    
    autoSave(); // Проверяем, нужно ли сохранить игру
    
    requestAnimationFrame(autoUpdate);
}

// Запускаем автоматическое обновление
requestAnimationFrame(autoUpdate);

function canAfford(price) {
    return score >= price;
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
                        updateShopItems(); // Update shop items when showing shop
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
    if (e.target.classList.contains('shop-item-button')) {
        const index = parseInt(e.target.getAttribute('data-index'));
        if (!isNaN(index)) {
            const item = shopItems[index];
            if (item && canAfford(item.price)) {
                score -= item.price;
                item.level++;
                item.price = Math.floor(item.basePrice * Math.pow(1.2, item.level));
                autoClickPower += item.power;
                
                updateScoreDisplay();
                updateShopItems();
                saveGameState();
                
                showNotification(`Улучшение "${item.title}" куплено! Уровень: ${item.level}`);
            } else if (item) {
                showNotification(`Недостаточно средств для покупки ${item.title}`);
            }
        }
    }
});

tasks = [
    ...tasks,
    {
        id: 20,
        icon: '<img src="https://i.postimg.cc/Xq7mZQW9/free-icon-footprint-2790690.png" alt="Первые шаги">',
        title: 'Первые шаги',
        description: 'Сделайте первый клик',
        type: 'clicks',
        target: 1,
        reward: 100,
        claimed: false
    },
    {
        id: 21,
        icon: '<img src="https://i.postimg.cc/Xq7mZQW9/free-icon-footprint-2790690.png" alt="Начинающий кликер">',
        title: 'Начинающий кликер',
        description: 'Накопите 1,000 кликов',
        type: 'clicks',
        target: 1000,
        reward: 200,
        claimed: false
    },
    {
        id: 22,
        icon: '<img src="https://i.postimg.cc/Xq7mZQW9/free-icon-footprint-2790690.png" alt="Опытный кликер">',
        title: 'Опытный кликер',
        description: 'Накопите 10,000 кликов',
        type: 'clicks',
        target: 10000,
        reward: 1000,
        claimed: false
    },
    {
        id: 23,
        icon: '<img src="https://i.postimg.cc/Xq7mZQW9/free-icon-footprint-2790690.png" alt="Мастер кликер">',
        title: 'Мастер кликер',
        description: 'Накопите 100,000 кликов',
        type: 'clicks',
        target: 100000,
        reward: 5000,
        claimed: false
    },
    {
        id: 24,
        icon: '<img src="https://i.postimg.cc/Xq7mZQW9/free-icon-footprint-2790690.png" alt="Король кликов">',
        title: 'Король кликов',
        description: 'Накопите 1,000,000 кликов',
        type: 'clicks',
        target: 1000000,
        reward: 25000,
        claimed: false
    },
    {
        id: 25,
        icon: '<img src="https://i.postimg.cc/Xq7mZQW9/free-icon-footprint-2790690.png" alt="Первая покупка">',
        title: 'Первая покупка',
        description: 'Купите любое улучшение',
        type: 'purchases',
        target: 1,
        reward: 100,
        claimed: false
    },
    {
        id: 26,
        icon: '<img src="https://i.postimg.cc/Xq7mZQW9/free-icon-footprint-2790690.png" alt="Шопоголик">',
        title: 'Шопоголик',
        description: 'Купите 5 улучшений',
        type: 'purchases',
        target: 5,
        reward: 500,
        claimed: false
    },
    {
        id: 27,
        icon: '<img src="https://i.postimg.cc/Xq7mZQW9/free-icon-footprint-2790690.png" alt="Коллекционер">',
        title: 'Коллекционер',
        description: 'Купите 10 улучшений',
        type: 'purchases',
        target: 10,
        reward: 1000,
        claimed: false
    },
    {
        id: 28,
        icon: '<img src="https://i.postimg.cc/Xq7mZQW9/free-icon-footprint-2790690.png" alt="Энергичный старт">',
        title: 'Энергичный старт',
        description: 'Достигните 10 кликов в секунду',
        type: 'cps',
        target: 10,
        reward: 2000,
        claimed: false
    },
    {
        id: 29,
        icon: '<img src="https://i.postimg.cc/Xq7mZQW9/free-icon-footprint-2790690.png" alt="Скоростной кликер">',
        title: 'Скоростной кликер',
        description: 'Достигните 100 кликов в секунду',
        type: 'cps',
        target: 100,
        reward: 5000,
        claimed: false
    }
];

// Changelog Modal functionality
const changelogBtn = document.getElementById('changelogBtn');
const changelogModal = document.getElementById('changelogModal');
const closeBtn = document.querySelector('.close-btn');

changelogBtn.addEventListener('click', () => {
    changelogModal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    changelogModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === changelogModal) {
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