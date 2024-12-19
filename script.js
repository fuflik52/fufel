function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function getTaskProgress(task) {
    switch(task.type) {
        case 'clicks':
            return `${formatNumber(Math.floor(totalClicks))} / ${formatNumber(task.requirement)} кликов`;
        case 'purchases':
            const totalPurchases = shopItems.reduce((sum, item) => sum + item.level, 0);
            return `${totalPurchases} / ${task.requirement} покупок`;
        case 'cps':
            return `${formatNumber(Math.floor(autoClickPower))} / ${formatNumber(task.requirement)} кликов/сек`;
        case 'time':
            const playTime = Math.floor((Date.now() - (lastUpdateTime || Date.now())) / 1000);
            return `${Math.floor(playTime / 3600)}ч ${Math.floor((playTime % 3600) / 60)}м ${playTime % 60}с / ${Math.floor(task.requirement / 3600)}ч`;
        case 'hourly':
            const hourlyRate = Math.floor(autoClickPower * 3600);
            return `${formatNumber(hourlyRate)} / ${formatNumber(task.requirement)} кликов/час`;
        default:
            return 'Прогресс неизвестен';
    }
}

function renderTasks() {
    const completedTasks = tasks.filter(task => task.claimed);
    const uncompletedTasks = tasks.filter(task => !task.claimed);
    
    return `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #fff; margin-bottom: 15px;">Активные задания</h2>
            ${uncompletedTasks.map(task => `
                <div class="task-item">
                    ${task.isNew ? `<span class="task-new">NEW</span>` : ''}
                    <div class="task-title">${task.title}</div>
                    <div class="task-description">${task.description}</div>
                    <div class="task-reward">
                        Награда: ${formatNumber(task.reward)} 
                        <img src="https://i.postimg.cc/mrTkbdNm/coin-us-dollar-40536.png" 
                             style="width: 16px; height: 16px; vertical-align: middle;">
                    </div>
                    <div class="task-progress" style="color: #ff3366; font-size: 12px; margin: 5px 0;">
                        ${getTaskProgress(task)}
                    </div>
                    <button class="task-claim-button" 
                            data-task-id="${task.id}"
                            ${canClaimTask(task) ? '' : 'disabled'}>
                        ${canClaimTask(task) ? 'Получить' : 'Не выполнено'}
                    </button>
                </div>
            `).join('')}
        </div>
        ${completedTasks.length > 0 ? `
            <div>
                <h2 style="color: #fff; margin-bottom: 15px;">Выполненные задания</h2>
                ${completedTasks.map(task => `
                    <div class="task-item claimed">
                        <div class="task-title">${task.title}</div>
                        <div class="task-description">${task.description}</div>
                        <div class="task-reward">
                            Получено: ${formatNumber(task.reward)} 
                            <img src="https://i.postimg.cc/mrTkbdNm/coin-us-dollar-40536.png" 
                                 style="width: 16px; height: 16px; vertical-align: middle;">
                        </div>
                        <button class="task-claim-button" disabled>
                            Выполнено
                        </button>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

function canClaimTask(task) {
    switch(task.type) {
        case 'clicks':
            return Math.floor(totalClicks) >= task.requirement;
        case 'purchases':
            return shopItems.reduce((sum, item) => sum + item.level, 0) >= task.requirement;
        case 'cps':
            return Math.floor(autoClickPower) >= task.requirement;
        case 'time':
            const playTime = Math.floor((Date.now() - (lastUpdateTime || Date.now())) / 1000);
            return playTime >= task.requirement;
        case 'hourly':
            return Math.floor(autoClickPower * 3600) >= task.requirement;
        case 'streak':
            return false;
        case 'total_achievements':
            const claimedCount = tasks.filter(t => t.claimed && t.id !== task.id).length;
            return claimedCount >= task.requirement;
        default:
            return false;
    }
}

function purchaseItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    if (Math.floor(score) < item.price) {
        showNotification(`Недостаточно для покупки ${item.title}`);
        return;
    }

    score -= item.price;
    item.level++;
    item.price = Math.floor(item.basePrice * Math.pow(1.2, item.level));
    autoClickPower += item.power;
    
    updateScoreDisplay();
    updateShopItems();
    showNotification(`Улучшение "${item.title}" куплено! Уровень: ${item.level}`);
}

function updateShopItems() {
    const shopGrid = document.querySelector('.shop-grid');
    shopGrid.innerHTML = shopItems.map(item => `
        <div class="shop-item">
            <span class="shop-item-new">LVL ${item.level}</span>
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-title">${item.title}</div>
            <div class="shop-item-description">${item.description}</div>
            <div class="shop-item-price">
                ${formatNumber(item.price)} <img src="https://example.com/path/to/coin.png" style="width: 16px; height: 16px; vertical-align: middle;">
            </div>
            <button class="shop-item-button" data-item-id="${item.id}">
                Улучшить
            </button>
        </div>
    `).join('');
}

function updateScoreDisplay() {
    scoreElement.innerHTML = `
        <img src="https://i.postimg.cc/mrTkbdNm/coin-us-dollar-40536.png" alt="Coins">
        ${formatNumber(Math.floor(score))}
    `;
}

document.addEventListener('DOMContentLoaded', function() {
    // Убедитесь, что Telegram WebApp инициализирован
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Загрузить состояние игры и инициализировать другие функции
        loadGameState();
        initTelegramUser();
        // Инициализировать другие компоненты
    } else {
        console.error('Telegram WebApp не инициализирован.');
    }
});

function loadGameState() {
    if (!window.Telegram || !window.Telegram.WebApp || !window.Telegram.WebApp.initDataUnsafe?.user?.id) {
        console.error('Telegram WebApp объект не определен или отсутствует ID пользователя.');
        return;
    }
    
    const tg = window.Telegram.WebApp; // Убедитесь, что tg определен
    const savedState = localStorage.getItem(`gameState_${tg.initDataUnsafe.user.id}`);
    if (savedState) {
        const state = JSON.parse(savedState);
        const now = Date.now();
        
        if (state.lastUpdateTime) {
            const offlineTime = (now - state.lastUpdateTime) / 1000;
            const offlineEarnings = state.autoClickPower * offlineTime;
            state.score += offlineEarnings;
            
            if (offlineEarnings > 0) {
                showNotification(`Вы заработали ${formatNumber(Math.floor(offlineEarnings))} пока были офлайн!`);
            }
        }
        
        score = state.score || 0;
        autoClickPower = state.autoClickPower || 0;
        shopItems = state.shopItems || shopItems;
        tasks = state.tasks || tasks;
        totalClicks = state.totalClicks || 0;
        maxBalance = state.maxBalance || 0;
        totalEarned = state.totalEarned || 0;
        
        updateScoreDisplay();
        updateShopItems();
        
        const tasksGrid = document.querySelector('.tasks-grid');
        if (tasksGrid) {
            tasksGrid.innerHTML = renderTasks();
        }
    }
    
    lastUpdateTime = Date.now();
}

function initTelegramUser() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        const user = tg.initDataUnsafe?.user;
        if (user) {
            document.getElementById('username').textContent = user.username || 'Anonymous User';
            document.getElementById('userId').textContent = `ID: ${user.id || 'Unknown'}`;
            
            if (user.photo_url) {
                document.getElementById('userPhoto').src = user.photo_url;
            }
        }
        tg.ready();
    }
}

function saveGameState() {
    if (!window.Telegram || !window.Telegram.WebApp || !window.Telegram.WebApp.initDataUnsafe?.user?.id) return;
    
    const tg = window.Telegram.WebApp; // Убедитесь, что tg определен
    const now = Date.now();
    const gameState = {
        score: Math.floor(score),
        autoClickPower,
        lastUpdateTime: now,
        shopItems,
        tasks,
        totalClicks: Math.floor(totalClicks),
        maxBalance: Math.floor(maxBalance),
        totalEarned: Math.floor(totalEarned)
    };
    
    localStorage.setItem(`gameState_${tg.initDataUnsafe.user.id}`, JSON.stringify(gameState));
}

document.addEventListener('DOMContentLoaded', function() {
    const clickCircle = document.querySelector('.click-circle');
    const savedVibration = localStorage.getItem('vibrationEnabled');
    vibrationEnabled = savedVibration === null ? true : savedVibration === 'true';
    
    const vibrationToggle = document.getElementById('vibrationToggle');
    if (vibrationToggle) {
        vibrationToggle.checked = vibrationEnabled;
    }

    if (clickCircle) {
        clickCircle.addEventListener('click', () => {
            const effect = document.createElement('div');
            effect.className = 'click-effect';
            clickCircle.appendChild(effect);
            
            effect.addEventListener('animationend', () => {
                effect.remove();
            });
            
            score = Math.floor(score + 1);
            totalClicks = Math.floor(totalClicks + 1);
            totalEarned = Math.floor(totalEarned + 1);
            updateScoreDisplay();
            
            const tasksGrid = document.querySelector('.tasks-grid');
            if (tasksGrid) {
                tasksGrid.innerHTML = renderTasks();
            }
            
            if (vibrationEnabled) {
                try {
                    window.navigator.vibrate(15);
                } catch (e) {
                    console.log('Vibration failed:', e);
                }
            }
            
            saveGameState();
        });
    }
    
    initializeNavigation();
    loadGameState();
    initTelegramUser();
    updateShopItems();
    updateGame();
    const tasksGrid = document.querySelector('.tasks-grid');
    if (tasksGrid) {
        tasksGrid.innerHTML = renderTasks();
    }
});

document.addEventListener('click', function(e) {
    if (e.target.classList.contains('shop-item-button')) {
        const itemId = parseInt(e.target.getAttribute('data-item-id'));
        if (!isNaN(itemId)) {
            purchaseItem(itemId);
        }
    }
    
    if (e.target.classList.contains('task-claim-button')) {
        const taskId = parseInt(e.target.getAttribute('data-task-id'));
        if (!isNaN(taskId)) {
            claimTask(taskId);
        }
    }
});

function showNotification(message) {
    const notification = document.querySelector('.notification');
    
    if (window.notificationTimeout) {
        clearTimeout(window.notificationTimeout);
    }
    
    const isError = message.toLowerCase().includes('недостаточно');
    
    notification.style.background = isError ? 'rgba(255, 51, 102, 0.95)' : 'rgba(40, 167, 69, 0.95)';
    
    const modifiedMessage = message.replace(/клики?в?/g, '<img src="https://i.postimg.cc/mrTkbdNm/coin-us-dollar-40536.png" style="width: 16px; height: 16px; vertical-align: middle;">');
    
    notification.innerHTML = modifiedMessage;
    notification.classList.add('show');
    
    window.notificationTimeout = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.style.visibility = 'hidden';
        }, 300);
    }, 3000);
}

const sectionContents = document.querySelectorAll('.section-content');
const gameArea = document.querySelector('.game-area');
const scoreContainer = document.querySelector('.score-container');
const scoreElement = document.querySelector('.score');

let score = 0;
let autoClickPower = 0;
let lastUpdateTime = Date.now();
let totalClicks = 0;
let maxBalance = 0;
let totalEarned = 0;
let lastSaveTime = Date.now();

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

let tasks = [
    {
        id: 1,
        icon: '',
        title: 'Первые шаги',
        description: 'Накопите 100 кликов',
        reward: 50,
        requirement: 100,
        type: 'clicks',
        claimed: false,
        isNew: true
    },
    {
        id: 2,
        icon: '',
        title: 'Начинающий кликер',
        description: 'Накопите 1,000 кликов',
        reward: 200,
        requirement: 1000,
        type: 'clicks',
        claimed: false,
        isNew: true
    },
    {
        id: 3,
        icon: '',
        title: 'Опытный кликер',
        description: 'Накопите 10,000 кликов',
        reward: 1000,
        requirement: 10000,
        type: 'clicks',
        claimed: false,
        isNew: true
    },
    {
        id: 4,
        icon: '',
        title: 'Мастер кликер',
        description: 'Накопите 100,000 кликов',
        reward: 5000,
        requirement: 100000,
        type: 'clicks',
        claimed: false,
        isNew: true
    },
    {
        id: 5,
        icon: '',
        title: 'Король кликов',
        description: 'Накопите 1,000,000 кликов',
        reward: 25000,
        requirement: 1000000,
        type: 'clicks',
        claimed: false,
        isNew: true
    },
    {
        id: 6,
        icon: '',
        title: 'Первая покупка',
        description: 'Купите любое улучшение',
        reward: 100,
        requirement: 1,
        type: 'purchases',
        claimed: false,
        isNew: true
    },
    {
        id: 7,
        icon: '',
        title: 'Шопоголик',
        description: 'Купите 5 улучшений',
        reward: 500,
        requirement: 5,
        type: 'purchases',
        claimed: false,
        isNew: true
    },
    {
        id: 8,
        icon: '',
        title: 'Коллекционер',
        description: 'Купите 10 улучшений',
        reward: 1000,
        requirement: 10,
        type: 'purchases',
        claimed: false,
        isNew: true
    },
    {
        id: 9,
        icon: '',
        title: 'Энергичный старт',
        description: 'Достигните 10 кликов в секунду',
        reward: 2000,
        requirement: 10,
        type: 'cps',
        claimed: false,
        isNew: true
    },
    {
        id: 10,
        icon: '',
        title: 'Скоростной кликер',
        description: 'Достигните 100 кликов в секунду',
        reward: 5000,
        requirement: 100,
        type: 'cps',
        claimed: false,
        isNew: true
    },
    {
        id: 11,
        icon: '',
        title: 'Звездный путь',
        description: 'Достигните 1000 кликов в секунду',
        reward: 10000,
        requirement: 1000,
        type: 'cps',
        claimed: false,
        isNew: true
    },
    {
        id: 12,
        icon: '',
        title: 'Мировое господство',
        description: 'Достигните 10000 кликов в секунду',
        reward: 50000,
        requirement: 10000,
        type: 'cps',
        claimed: false,
        isNew: true
    },
    {
        id: 13,
        icon: '',
        title: 'Игровой марафон',
        description: 'Играйте 1 час',
        reward: 1000,
        requirement: 3600,
        type: 'time',
        claimed: false,
        isNew: true
    },
    {
        id: 14,
        icon: '',
        title: 'Временной магнат',
        description: 'Играйте 24 часа',
        reward: 10000,
        requirement: 86400,
        type: 'time',
        claimed: false,
        isNew: true
    },
    {
        id: 15,
        icon: '',
        title: 'Быстрый рост',
        description: 'Получите 1000 кликов за час',
        reward: 500,
        requirement: 1000,
        type: 'hourly',
        claimed: false,
        isNew: true
    },
    {
        id: 16,
        icon: '',
        title: 'Богатство',
        description: 'Получите 10000 кликов за час',
        reward: 2000,
        requirement: 10000,
        type: 'hourly',
        claimed: false,
        isNew: true
    },
    {
        id: 17,
        icon: '',
        title: 'Фабрика кликов',
        description: 'Получите 100000 кликов за час',
        reward: 10000,
        requirement: 100000,
        type: 'hourly',
        claimed: false,
        isNew: true
    },
    {
        id: 18,
        icon: '',
        title: 'Точность',
        description: 'Кликните 100 раз подряд',
        reward: 1000,
        requirement: 100,
        type: 'streak',
        claimed: false,
        isNew: true
    },
    {
        id: 19,
        icon: '',
        title: 'Цирковой артист',
        description: 'Кликните 1000 раз подряд',
        reward: 5000,
        requirement: 1000,
        type: 'streak',
        claimed: false,
        isNew: true
    },
    {
        id: 20,
        icon: '',
        title: 'Радужный путь',
        description: 'Соберите все достижения',
        reward: 100000,
        requirement: 19,
        type: 'total_achievements',
        claimed: false,
        isNew: true
    }
];

let vibrationEnabled = true;

document.getElementById('vibrationToggle').addEventListener('change', function() {
    vibrationEnabled = this.checked;
    localStorage.setItem('vibrationEnabled', vibrationEnabled);
    showNotification(`Вибрация ${vibrationEnabled ? 'включена' : 'выключена'}`);
});

function showChangelog() {
    const modal = document.getElementById('changelogModal');
    modal.innerHTML = `
        <div class="modal-content">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 100%; padding-top: 20px;">
                <div class="development-header" style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, rgba(255, 51, 102, 0.2) 0%, rgba(255, 51, 102, 0.1) 100%); padding: 15px 30px; border-radius: 20px; border: 2px solid rgba(255, 51, 102, 0.5); backdrop-filter: blur(5px);">
                    <h3 style="margin: 0; color: white; font-size: 24px;">Раздел в разработке</h3>
                </div>
                <img src="https://i.postimg.cc/5NHn3gzK/free-icon-web-development-1352837.png" 
                     alt="Development" 
                     style="width: 300px; 
                            height: 300px; 
                            object-fit: contain;
                            filter: drop-shadow(0 0 20px rgba(255, 51, 102, 0.3));">
                <button class="close-btn" style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
            </div>
        </div>
    `;
    modal.style.display = 'block';

    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

function closeChangelog() {
    document.getElementById('changelogModal').style.display = 'none';
}

document.getElementById('changelogBtn').addEventListener('click', showChangelog);

document.addEventListener('click', function(e) {
    const modal = document.getElementById('changelogModal');
    const btn = document.getElementById('changelogBtn');
    if (e.target !== modal && !modal.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        modal.style.display = 'none';
    }
});

function updateShopItems() {
    const shopGrid = document.querySelector('.shop-grid');
    shopGrid.innerHTML = shopItems.map(item => `
        <div class="shop-item">
            <span class="shop-item-new">LVL ${item.level}</span>
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-title">${item.title}</div>
            <div class="shop-item-description">${item.description}</div>
            <div class="shop-item-price">
                ${formatNumber(item.price)} <img src="https://example.com/path/to/coin.png" style="width: 16px; height: 16px; vertical-align: middle;">
            </div>
            <button class="shop-item-button" data-item-id="${item.id}">
                Улучшить
            </button>
        </div>
    `).join('');
}

function updateScoreDisplay() {
    scoreElement.innerHTML = `
        <img src="https://i.postimg.cc/mrTkbdNm/coin-us-dollar-40536.png" alt="Coins">
        ${formatNumber(Math.floor(score))}
    `;
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

function purchaseItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    if (Math.floor(score) < item.price) {
        showNotification(`Недостаточно для покупки ${item.title}`);
        return;
    }

    score -= item.price;
    item.level++;
    item.price = Math.floor(item.basePrice * Math.pow(1.2, item.level));
    autoClickPower += item.power;
    
    updateScoreDisplay();
    updateShopItems();
    showNotification(`Улучшение "${item.title}" куплено! Уровень: ${item.level}`);
}

function claimTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.claimed) return;

    let canClaim = canClaimTask(task);

    if (!canClaim) {
        showNotification('Условия задания еще не выполнены');
        return;
    }

    task.claimed = true;
    score += task.reward;
    totalEarned += task.reward;
    if (score > maxBalance) maxBalance = score;
    
    showNotification(`Задание "${task.title}" выполнено! +${formatNumber(task.reward)} кликов`);
    updateScoreDisplay();
    
    const tasksGrid = document.querySelector('.tasks-grid');
    if (tasksGrid) {
        tasksGrid.innerHTML = renderTasks();
    }
    
    saveGameState();
}

function updateStatsSection() {
    const statsSection = document.getElementById('stats-section');
    if (!statsSection) return;
    
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const perHour = Math.floor(autoClickPower * 3600);
    
    statsSection.innerHTML = `
        <div class="profile-container">
            <div class="profile-header">
                <img class="profile-photo" src="https://i.postimg.cc/qM9QZKXJ/free-icon-boy-avatar-17479088.png" alt="Profile Photo">
                <div class="profile-info">
                    <div id="username">${user?.username || 'Anonymous User'}</div>
                    <div id="userId">ID: ${user?.id || 'Unknown'}</div>
                </div>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stats-item">
                <div style="font-size: 24px; color: #0088ff;">
                    <img src="https://i.postimg.cc/mrTkbdNm/coin-us-dollar-40536.png" style="width: 24px; height: 24px; vertical-align: middle;"> 
                    ${formatNumber(Math.floor(maxBalance))}
                </div>
                <div style="color: #fff; margin-top: 5px;">Максимальный баланс</div>
            </div>
            
            <div class="stats-item">
                <div style="font-size: 24px; color: #0088ff;">
                    <img src="https://i.postimg.cc/5yjT8FLh/image.png" style="width: 24px; height: 24px; vertical-align: middle;">
                    ${formatNumber(perHour)}/час
                </div>
                <div style="color: #fff; margin-top: 5px;">Прибыль в час</div>
            </div>
            
            <div class="stats-item">
                <div style="font-size: 24px; color: #0088ff;">
                    <img src="https://i.postimg.cc/mrTkbdNm/coin-us-dollar-40536.png" style="width: 24px; height: 24px; vertical-align: middle;">
                    ${formatNumber(totalClicks)}
                </div>
                <div style="color: #fff; margin-top: 5px;">Всего монет</div>
            </div>
            
            <div class="stats-item">
                <div style="font-size: 24px; color: #0088ff;">
                    <img src="https://i.postimg.cc/65HRHjFJ/image.png" style="width: 24px; height: 24px; vertical-align: middle;">
                    ${formatNumber(totalEarned)}
                </div>
                <div style="color: #fff; margin-top: 5px;">Всего заработано</div>
            </div>
        </div>
    `;
}

function initializeNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section-content');
    const changelogBtn = document.getElementById('changelogBtn');

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
                changelogBtn.style.display = 'flex';
            } else {
                changelogBtn.style.display = 'none';
                if (btnText === 'магазин') {
                    document.getElementById('shop-section').classList.add('active');
                } else if (btnText === 'награды' || btnText === 'город' || btnText === 'инвестиции') {
                    document.getElementById('development-section').classList.add('active');
                    document.getElementById('development-section').innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; height: 100%; padding-top: 20px;">
                            <div class="development-header" style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, rgba(255, 51, 102, 0.2) 0%, rgba(255, 51, 102, 0.1) 100%); padding: 15px 30px; border-radius: 20px; border: 2px solid rgba(255, 51, 102, 0.5); backdrop-filter: blur(5px);">
                                <h3 style="margin: 0; color: white; font-size: 24px;">Раздел в разработке</h3>
                            </div>
                            <img src="https://i.postimg.cc/5NHn3gzK/free-icon-web-development-1352837.png" 
                                 alt="Development" 
                                 style="width: 300px; 
                                        height: 300px; 
                                        object-fit: contain;
                                        filter: drop-shadow(0 0 20px rgba(255, 51, 102, 0.3));">
                        </div>
                    `;
                } else if (btnText === 'задания') {
                    document.getElementById('tasks-section').classList.add('active');
                } else if (btnText === 'настройки') {
                    document.getElementById('settings-section').classList.add('active');
                    document.getElementById('settings-section').innerHTML = `
                        <div class="settings-options" style="margin-top: 20px; background: rgba(0, 136, 255, 0.1); padding: 20px; border-radius: 15px;">
                            <div class="settings-option" style="display: flex; align-items: center; justify-content: space-between;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <img src="https://i.postimg.cc/nVTK9hF1/image.png" style="width: 24px; height: 24px;">
                                    <div>
                                        <h3 style="margin-bottom: 5px;">Вибрация</h3>
                                        <p style="font-size: 14px; color: #aaa;">Включить вибрацию при клике</p>
                                    </div>
                                </div>
                                <label class="toggle-switch" style="position: relative; display: inline-block; width: 60px; height: 34px;">
                                    <input type="checkbox" id="vibrationToggle" checked style="opacity: 0; width: 0; height: 0;">
                                    <span class="toggle-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;">
                                        <span style="position: absolute; content: ''; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .2s; border-radius: 50%;"></span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    `;
                } else if (btnText === 'статистика') {
                    document.getElementById('stats-section').classList.add('active');
                    updateStatsSection();
                }
            }
        });
    });
}

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
