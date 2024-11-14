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
    }
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
function applyBackground(background) {
    document.body.style.background = background;
    const gameContainer = document.getElementById('game-container');
    gameContainer.style.background = background;

    // Сохранение выбранного фона в localStorage
    localStorage.setItem('selectedBackground', background);
}

let selectedBackgroundId = localStorage.getItem('selectedBackgroundId');
if (selectedBackgroundId) {
    selectedBackgroundId = parseInt(selectedBackgroundId);
    const bg = backgrounds.find(b => b.id === selectedBackgroundId);
    if (bg && bg.purchased) {
        applyBackground(bg.background);
        bg.active = true;
    }
} else {
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

// Создание Matter.js двигателя и мира
const engine = Matter.Engine.create();
const world = engine.world;

console.log("Gravity Y:", world.gravity.y); // Должно быть 1

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

const floor = Matter.Bodies.rectangle(250, 690, 500, 20, { 
    isStatic: true,
    render: {
        fillStyle: '#ffffff'
    }
});
const leftWall = Matter.Bodies.rectangle(0, 350, 20, 700, { 
    isStatic: true, 
    render: { fillStyle: '#ffffff' }
});
const rightWall = Matter.Bodies.rectangle(500, 350, 20, 700, { 
    isStatic: true, 
    render: { fillStyle: '#ffffff' }
});
Matter.World.add(world, [floor, leftWall, rightWall]);

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
    console.log(`Создан шар: ${value} в (${x}, ${y})`);
    return ball;
}

function getRandomBallValue() {
    return Math.floor(Math.random() * 5) + 1; // 1-5
}

Matter.Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        if (bodyA.label && bodyB.label && bodyA.label === bodyB.label) {
            const newValue = parseInt(bodyA.label) + 1;
            if (newValue > 15) return; // Максимальное значение 15

            const newX = (bodyA.position.x + bodyB.position.x) / 2;
            const newY = (bodyA.position.y + bodyB.position.y) / 2;

            Matter.World.remove(world, [bodyA, bodyB]);
            console.log(`Объединение шаров в новый шар: ${newValue} в (${newX}, ${newY})`);
            createBall(newX, newY, newValue);
            score += newValue;
            scoreElement.textContent = `Очки: ${score}`;
            saveGameState();
        }
    });
});

function updateNextBall() {
    nextBallElement.style.backgroundColor = `hsl(${nextBallValue * 24}, 100%, 50%)`;
    nextBallElement.textContent = nextBallValue;
}

function updateCurrentBall() {
    currentBallElement.style.backgroundColor = `hsl(${currentBallValue * 24}, 100%, 50%)`;
    currentBallElement.textContent = currentBallValue;
}

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

function initializeGame() {
    let isDragging = false;
    let dragOffsetX = 0;

    currentBallElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragOffsetX = e.clientX - currentBallElement.getBoundingClientRect().left;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const rect = document.getElementById('game-container').getBoundingClientRect();
            let x = e.clientX - rect.left - dragOffsetX + currentBallElement.offsetWidth / 2;
            x = Math.max(currentBallElement.offsetWidth / 2, Math.min(rect.width - currentBallElement.offsetWidth / 2, x));
            currentBallElement.style.left = `${x - currentBallElement.offsetWidth / 2}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });

    document.getElementById('game-container').addEventListener('click', (event) => {
        const gameContainer = document.getElementById('game-container');
        const x = parseFloat(currentBallElement.style.left) + currentBallElement.offsetWidth / 2;
        const y = 100;
        createBall(x, y, currentBallValue);
        currentBallValue = nextBallValue;
        nextBallValue = getRandomBallValue();
        updateNextBall();
        updateCurrentBall();
        saveGameState();
    });

    loadGameState();

    Matter.Runner.run(Matter.Runner.create(), engine);
    Matter.Render.run(renderEngine);

    updateNextBall();
    updateCurrentBall();
}

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});
