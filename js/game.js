// js/game.js

// Массив доступных фонов
const backgrounds = [
    {
        id: 1,
        name: "Зимний лес",
        price: 100,
        background: "linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), #222",
        purchased: true, // Предустановленный купленный фон
        active: true     // Предустановленный активный фон
    },
    {
        id: 2,
        name: "Солнечный день",
        price: 150,
        background: "linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)",
        purchased: false,
        active: false
    },
    {
        id: 3,
        name: "Ночной город",
        price: 200,
        background: "linear-gradient(to bottom, #000428, #004e92)",
        purchased: false,
        active: false
    },
    {
        id: 4,
        name: "Рассвет",
        price: 250,
        background: "linear-gradient(to right, #ff7e5f, #feb47b)",
        purchased: false,
        active: false
    },
    // Добавьте остальные фоны до id:15 с различными цветовыми градиентами
];

// Получение элементов DOM
const shopOverlay = document.getElementById('shop-overlay');
const openShopBtn = document.getElementById('open-shop-btn');
const closeShopBtn = document.getElementById('close-shop-btn');
const backgroundsContainer = document.getElementById('backgrounds-container');
const currentBalanceElement = document.getElementById('current-balance');
const statisticsContent = document.getElementById('statistics-content');

const scoreElement = document.getElementById('score');
const nextBallElement = document.getElementById('next-ball');
const currentBallElement = document.getElementById('current-ball');
const dustFlash = document.getElementById('dust-flash');
const endLine = document.getElementById('end-line');
const trajectoryLine = document.createElement('div');
trajectoryLine.id = 'trajectory-line';
document.getElementById('game-container').appendChild(trajectoryLine);

// Модальное окно окончания игры
const gameOverModal = document.getElementById('game-over-modal');
const finalScoreElement = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again-btn');
const exitBtn = document.getElementById('exit-btn');

// Вкладки
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Инициализация баланса из localStorage или установка по умолчанию
let balance = localStorage.getItem('balance') ? parseInt(localStorage.getItem('balance')) : 500;
currentBalanceElement.textContent = balance;

// Инициализация выбранного фона из localStorage
let selectedBackgroundId = localStorage.getItem('selectedBackgroundId');
if (selectedBackgroundId) {
    selectedBackgroundId = parseInt(selectedBackgroundId);
    const bg = backgrounds.find(b => b.id === selectedBackgroundId);
    if (bg && bg.purchased) {
        applyBackground(bg.background);
        bg.active = true;
    }
} else {
    // Если фон не выбран, установить предустановленный фон
    const initialBg = backgrounds.find(b => b.id === 1);
    if (initialBg && initialBg.purchased) {
        applyBackground(initialBg.background);
    }
}

// Инициализация баланса и статистики
let score = localStorage.getItem('score') ? parseInt(localStorage.getItem('score')) : 0;
let nextBallValue = localStorage.getItem('nextBallValue') ? parseInt(localStorage.getItem('nextBallValue')) : getRandomBallValue();
let currentBallValue = localStorage.getItem('currentBallValue') ? parseInt(localStorage.getItem('currentBallValue')) : 1;

// Инициализация статистики
let statistics = JSON.parse(localStorage.getItem('statistics')) || {
    totalGames: 0,
    totalScore: 0,
    highScore: 0
};

// Отображение начальных значений
scoreElement.textContent = `Очки: ${score}`;
updateNextBall();
updateCurrentBall();

// Флаг для отслеживания первого шара
let firstBallFallen = false;

// Создание Matter.js двигателя и мира
const engine = Matter.Engine.create();
const world = engine.world;
const renderEngine = Matter.Render.create({
    element: document.getElementById('game-container'),
    engine: engine,
    options: {
        width: 500,
        height: 700,
        wireframes: false,
        background: 'transparent' // Фон задаётся через CSS
    }
});

// Добавление стен
const walls = [
    Matter.Bodies.rectangle(250, 710, 500, 20, { isStatic: true }), // Нижняя стена
    Matter.Bodies.rectangle(-10, 350, 20, 700, { isStatic: true }), // Левая стена
    Matter.Bodies.rectangle(510, 350, 20, 700, { isStatic: true }) // Правая стена
];
Matter.World.add(world, walls);

// Создание шара
function createBall(x, y, value) {
    if (value > 15) return; // Максимальное значение 15

    const radius = 30 + value * 2; // Увеличенные размеры
    const ball = Matter.Bodies.circle(x, y, radius, {
        restitution: 0.5,
        friction: 0.1,
        density: 0.001,
        render: {
            fillStyle: `hsl(${value * 24}, 100%, 50%)`, // Яркие цвета
        }
    });
    ball.label = value;
    Matter.World.add(world, ball);
    return ball;
}

// Функция для получения случайного значения шара от 1 до 5
function getRandomBallValue() {
    return Math.floor(Math.random() * 5) + 1; // 1-5
}

// Обработка столкновений
Matter.Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    for (let i = 0; i < pairs.length; i++) {
        const { bodyA, bodyB } = pairs[i];
        if (bodyA.label && bodyB.label && bodyA.label === bodyB.label) {
            const newValue = parseInt(bodyA.label) + 1;
            if (newValue > 15) continue; // Максимальное значение 15
            const newX = (bodyA.position.x + bodyB.position.x) / 2;
            const newY = (bodyA.position.y + bodyB.position.y) / 2;
            Matter.World.remove(world, [bodyA, bodyB]);
            createBall(newX, newY, newValue);
            score += newValue;
            scoreElement.textContent = `Очки: ${score}`;

            // Анимация пыли
            showDustFlash(newX, newY);

            // Сохранение состояния
            saveGameState();
        }
    }
});

// Обновление следующего шара
function updateNextBall() {
    nextBallElement.style.backgroundColor = `hsl(${nextBallValue * 24}, 100%, 50%)`;
    nextBallElement.textContent = nextBallValue;
}

// Обновление текущего шара
function updateCurrentBall() {
    currentBallElement.style.backgroundColor = `hsl(${currentBallValue * 24}, 100%, 50%)`;
    currentBallElement.textContent = currentBallValue;
}

// Функция для отображения статистики
function displayStatistics() {
    statisticsContent.innerHTML = `
        <p>Всего игр: ${statistics.totalGames}</p>
        <p>Общий счёт: ${statistics.totalScore}</p>
        <p>Рекорд: ${statistics.highScore}</p>
    `;
}

// Функция для применения фона к игре
function applyBackground(background) {
    document.body.style.background = background;
    const gameContainer = document.getElementById('game-container');
    gameContainer.style.background = background;

    // Сохранение выбранного фона в localStorage
    localStorage.setItem('selectedBackground', background);
}

// Функция для создания элементов фона в магазине
function createBackgroundItems() {
    backgroundsContainer.innerHTML = ''; // Очистить предыдущие элементы
    backgrounds.forEach(bg => {
        const bgItem = document.createElement('div');
        bgItem.classList.add('background-item');
        if (bg.active) {
            bgItem.classList.add('selected');
        }

        const preview = document.createElement('div');
        preview.classList.add('preview');
        preview.style.background = bg.background;

        const name = document.createElement('p');
        name.textContent = bg.name;

        const buyBtn = document.createElement('button');
        buyBtn.classList.add('buy-btn');
        if (bg.purchased) {
            buyBtn.textContent = 'Использовать';
            buyBtn.style.background = bg.active ? '#2196F3' : '#4CAF50';
        } else {
            buyBtn.textContent = `Купить (${bg.price})`;
            buyBtn.style.background = '#4CAF50';
        }

        buyBtn.addEventListener('click', () => {
            if (!bg.purchased) {
                if (balance >= bg.price) {
                    // Покупка фона
                    bg.purchased = true;
                    bg.active = true;
                    balance -= bg.price;
                    localStorage.setItem('balance', balance);
                    currentBalanceElement.textContent = balance;
                    deactivateOthers(bg.id);
                    applyBackground(bg.background);
                    localStorage.setItem('selectedBackgroundId', bg.id);
                    createBackgroundItems();
                } else {
                    alert('Недостаточно монет для покупки этого фона!');
                }
            } else {
                if (!bg.active) {
                    bg.active = true;
                    deactivateOthers(bg.id);
                    applyBackground(bg.background);
                    localStorage.setItem('selectedBackgroundId', bg.id);
                    createBackgroundItems();
                } else {
                    // Деактивация фона, возвращение к дефолтному
                    bg.active = false;
                    applyBackground('linear-gradient(#222, #222)');
                    localStorage.removeItem('selectedBackgroundId');
                    createBackgroundItems();
                }
            }
        });

        bgItem.appendChild(preview);
        bgItem.appendChild(name);
        bgItem.appendChild(buyBtn);
        backgroundsContainer.appendChild(bgItem);
    });
}

// Функция для деактивации других фонов
function deactivateOthers(activeId) {
    backgrounds.forEach(bg => {
        if (bg.id !== activeId && bg.active) {
            bg.active = false;
        }
    });
}

// Функция для рендеринга магазина (обновление кнопок покупки и выделение активного фона)
function renderShop() {
    createBackgroundItems();
}

// Функция для отображения статистики при загрузке магазина
function displayStatisticsOnShop() {
    displayStatistics();
}

// Функция для отображения пути броска
function showTrajectoryLine() {
    trajectoryLine.style.display = 'block';
}

function hideTrajectoryLine() {
    trajectoryLine.style.display = 'none';
}

function updateTrajectoryLine(x) {
    const gameContainer = document.getElementById('game-container');
    const rect = gameContainer.getBoundingClientRect();
    const gameX = x;
    const gameY = 100; // Позиция Y фиксирована для всех бросков
    const endY = gameContainer.offsetHeight - 100; // Полоска на 100px от нижнего края

    const deltaY = endY - gameY;

    trajectoryLine.style.left = `${gameX}px`;
    trajectoryLine.style.height = `${deltaY}px`;
    trajectoryLine.style.top = `${gameY}px`;
}

// Функция для отображения анимации пыли
function showDustFlash(x, y) {
    dustFlash.style.left = `${x - 50}px`;
    dustFlash.style.top = `${y - 50}px`;
    dustFlash.style.opacity = '1';
    dustFlash.style.animation = 'none';
    void dustFlash.offsetWidth; // Триггер reflow для перезапуска анимации
    dustFlash.style.animation = 'dustAnimation 0.3s forwards';
}

// Рисование номеров на шарах после рендеринга
Matter.Events.on(renderEngine, 'afterRender', () => {
    const context = renderEngine.context;
    context.font = "20px Arial";
    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";
    world.bodies.forEach(body => {
        if (body.label) {
            context.fillText(body.label, body.position.x, body.position.y);
        }
    });
});

// Функция для отображения статистики
function displayStatistics() {
    statisticsContent.innerHTML = `
        <p>Всего игр: ${statistics.totalGames}</p>
        <p>Общий счёт: ${statistics.totalScore}</p>
        <p>Рекорд: ${statistics.highScore}</p>
    `;
}

// Функция для окончания игры
function endGame() {
    // Остановить физический движок
    Matter.Runner.stop(runner);
    Matter.Render.stop(renderEngine);

    // Обновить статистику
    updateStatistics(score);
    displayStatistics();

    // Показать финальный счёт
    finalScoreElement.textContent = score;

    // Показать модальное окно
    gameOverModal.style.display = 'block';

    // Очистить сохраненное состояние игры
    localStorage.removeItem('balls');
    localStorage.removeItem('score');
    localStorage.removeItem('nextBallValue');
    localStorage.removeItem('currentBallValue');
}

// Обработчики кнопок модального окна
playAgainBtn.addEventListener('click', () => {
    // Сброс состояния игры
    score = 0;
    nextBallValue = getRandomBallValue();
    currentBallValue = 1;
    scoreElement.textContent = `Очки: ${score}`;
    updateNextBall();
    updateCurrentBall();

    // Очистить мир и добавить стены
    Matter.World.clear(world);
    Matter.Engine.clear(engine);
    Matter.Render.stop(renderEngine);
    Matter.Render.run(renderEngine);
    Matter.World.add(world, walls);
    Matter.Runner.run(runner);

    // Скрыть модальное окно
    gameOverModal.style.display = 'none';

    // Сохранение состояния
    saveGameState();
});

exitBtn.addEventListener('click', () => {
    // Сброс состояния игры
    score = 0;
    nextBallValue = getRandomBallValue();
    currentBallValue = 1;
    scoreElement.textContent = `Очки: ${score}`;
    updateNextBall();
    updateCurrentBall();

    // Очистить мир и добавить стены
    Matter.World.clear(world);
    Matter.Engine.clear(engine);
    Matter.Render.stop(renderEngine);
    Matter.Render.run(renderEngine);
    Matter.World.add(world, walls);
    Matter.Runner.run(runner);

    // Скрыть модальное окно
    gameOverModal.style.display = 'none';

    // Очистить сохраненное состояние игры
    localStorage.removeItem('balls');
    localStorage.removeItem('score');
    localStorage.removeItem('nextBallValue');
    localStorage.removeItem('currentBallValue');

    // Перенаправление на главную страницу
    window.location.href = 'index.html';
});

// Функции для сохранения и загрузки состояния

function saveGameState() {
    const bodies = Matter.Composite.allBodies(world).filter(body => !body.isStatic && body.label);
    const balls = bodies.map(body => ({
        x: body.position.x,
        y: body.position.y,
        label: body.label,
        velocity: body.velocity
    }));
    localStorage.setItem('balls', JSON.stringify(balls));
    localStorage.setItem('score', score);
    localStorage.setItem('nextBallValue', nextBallValue);
    localStorage.setItem('currentBallValue', currentBallValue);
}

function loadGameState() {
    const savedBalls = JSON.parse(localStorage.getItem('balls'));
    if (savedBalls && savedBalls.length > 0) {
        savedBalls.forEach(ballData => {
            const ball = createBall(ballData.x, ballData.y, ballData.label);
            Matter.Body.setVelocity(ball, ballData.velocity);
        });
        score = parseInt(localStorage.getItem('score')) || 0;
        nextBallValue = parseInt(localStorage.getItem('nextBallValue')) || getRandomBallValue();
        currentBallValue = parseInt(localStorage.getItem('currentBallValue')) || 1;
        scoreElement.textContent = `Очки: ${score}`;
        updateNextBall();
        updateCurrentBall();
    }
}

// Функция для обновления статистики
function updateStatistics(gameScore) {
    statistics.totalGames += 1;
    statistics.totalScore += gameScore;
    if (gameScore > statistics.highScore) {
        statistics.highScore = gameScore;
    }
    localStorage.setItem('statistics', JSON.stringify(statistics));
}

// Функция для инициализации аудио (удалена вся аудио логика)

// Инициализация игры
function initializeGame() {
    // Перетаскивание текущего шара (управление)
    let isDragging = false;
    let dragOffsetX = 0;

    currentBallElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragOffsetX = e.clientX - currentBallElement.getBoundingClientRect().left;
        showTrajectoryLine();
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const rect = document.getElementById('game-container').getBoundingClientRect();
            let x = e.clientX - rect.left - dragOffsetX + currentBallElement.offsetWidth / 2;
            x = Math.max(currentBallElement.offsetWidth / 2, Math.min(rect.width - currentBallElement.offsetWidth / 2, x));
            currentBallElement.style.left = `${x - currentBallElement.offsetWidth / 2}px`;
            updateTrajectoryLine(x);
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        hideTrajectoryLine();
    });

    // Для мобильных устройств
    currentBallElement.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        dragOffsetX = touch.clientX - currentBallElement.getBoundingClientRect().left;
        showTrajectoryLine();
    });

    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const touch = e.touches[0];
            const rect = document.getElementById('game-container').getBoundingClientRect();
            let x = touch.clientX - rect.left - dragOffsetX + currentBallElement.offsetWidth / 2;
            x = Math.max(currentBallElement.offsetWidth / 2, Math.min(rect.width - currentBallElement.offsetWidth / 2, x));
            currentBallElement.style.left = `${x - currentBallElement.offsetWidth / 2}px`;
            updateTrajectoryLine(x);
        }
    });

    document.addEventListener('touchend', () => {
        isDragging = false;
        hideTrajectoryLine();
    });

    // Бросок шара при клике
    document.getElementById('game-container').addEventListener('click', (event) => {
        // Получаем значение текущего шара и проверяем, что оно от 1 до 5
        if (currentBallValue < 1 || currentBallValue > 5) {
            alert('Можно бросать только шары с номерами 1-5!');
            return;
        }

        // Проверка, можно ли бросать шар (только если первый шар упал)
        if (!firstBallFallen && score > 0) {
            alert('Первый шар ещё не упал!');
            return;
        }

        const gameContainer = document.getElementById('game-container');
        const rect = gameContainer.getBoundingClientRect();
        const x = parseFloat(currentBallElement.style.left) + currentBallElement.offsetWidth / 2;
        const y = 100; // Позиция Y фиксирована для всех бросков
        createBall(x, y, currentBallValue);
        currentBallValue = nextBallValue;
        nextBallValue = getRandomBallValue();
        updateNextBall();
        updateCurrentBall();

        // Сохранение состояния
        saveGameState();
    });

    // Отслеживание падения первого шара
    Matter.Events.on(engine, 'afterUpdate', () => {
        if (!firstBallFallen) {
            const bodies = Matter.Composite.allBodies(world);
            for (let body of bodies) {
                if (body.label === 1 && body.position.y > 600) { // Порог падения первого шара
                    firstBallFallen = true;
                    console.log('Первый шар упал!');
                    break;
                }
            }
        }
    });

    // Проверка пересечения полоски
    Matter.Events.on(engine, 'afterUpdate', () => {
        const bodies = Matter.Composite.allBodies(world);
        for (let body of bodies) {
            if (body.label && body.position.y > (700 - 100)) { // Полоска на 100px от нижнего края
                if (!body.isStatic && body.speed < 0.5) { // Проверка, что шар не находится в движении
                    endGame();
                    break;
                }
            }
        }
    });

    // Проверка сохраненного состояния
    loadGameState();

    // Инициализация Runner и запускаем его с Engine
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(renderEngine);

    // Инициализация без автоматического создания шаров
    updateNextBall();
    updateCurrentBall();
}

// Обработчики кнопок открытия и закрытия магазина
openShopBtn.addEventListener('click', () => {
    shopOverlay.style.display = 'flex';
    openShopBtn.style.display = 'none'; // Скрыть кнопку открытия магазина
});

closeShopBtn.addEventListener('click', () => {
    shopOverlay.style.display = 'none';
    openShopBtn.style.display = 'block'; // Показать кнопку открытия магазина
});

// Обработчики вкладок магазина
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.getAttribute('data-tab');

        // Удалить активный класс у всех кнопок
        tabButtons.forEach(btn => btn.classList.remove('active'));

        // Добавить активный класс к выбранной кнопке
        button.classList.add('active');

        // Скрыть все вкладки
        tabContents.forEach(content => content.classList.remove('active'));

        // Показать выбранную вкладку
        document.getElementById(targetTab).classList.add('active');
    });
});

// Инициализация статистики при загрузке магазина
document.querySelector('.tab-button[data-tab="statistics"]').addEventListener('click', () => {
    displayStatistics();
});

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    renderShop();
    initializeGame();
    displayStatistics();
});
