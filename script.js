// script.js

// Инициализация Matter.js
const { Engine, Render, Runner, World, Bodies, Body, Events, Composite } = Matter;

// Создание движка и мира
const engine = Engine.create();
const world = engine.world;

// Настройка рендера
const canvas = document.getElementById('game-canvas');
const render = Render.create({
    canvas: canvas,
    engine: engine,
    options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#333'
    }
});

// Запуск рендера
Render.run(render);

// Создание Runner и запуск его
const runner = Runner.create();
Runner.run(runner, engine);

// Создание пола
const floor = Bodies.rectangle(400, 590, 810, 60, { 
    isStatic: true, 
    render: { fillStyle: '#060a19' } 
});
World.add(world, floor);

// Переменные игры
let score = parseInt(localStorage.getItem('score')) || 0;
const scoreElement = document.getElementById('score');
scoreElement.textContent = `Очки: ${score}`;
const nextBallDisplay = document.querySelector('#next-ball-display .next-ball');
let currentBall = null;
let nextBallColor = getRandomColor();
let isHolding = true; // Флаг удерживания шара игроком

// Загрузка купленных предметов из localStorage
let purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || [];

// Получение кнопки магазина
const openShopButton = document.getElementById('open-shop');

// Проверка наличия кнопки магазина
if (openShopButton) {
    console.log('Кнопка магазина найдена.');
    openShopButton.addEventListener('click', () => {
        console.log('Кнопка магазина нажата.');
        window.location.href = 'shop.html';
    });
} else {
    console.error('Кнопка магазина не найдена. Проверьте ID кнопки.');
}

// Функция для получения случайного цвета
function getRandomColor() {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Создание шаров
function createBall(x, y, color = null) {
    const ballColor = color || getRandomColor();
    const radius = 20 + Math.random() * 10; // Радиус от 20 до 30
    const ball = Bodies.circle(x, y, radius, {
        restitution: 0.9,
        friction: 0.005,
        density: 0.001 * radius,
        render: {
            fillStyle: ballColor
        }
    });
    ball.color = ballColor;
    return ball;
}

// Создание игрока (удерживаемый шар)
function createPlayer() {
    if (currentBall) {
        World.remove(world, currentBall);
        console.log('Удалён предыдущий шар игрока:', currentBall);
    }
    const playerRadius = 30; // Радиус игрока
    const playerY = 520; // Позиция под очками и поверх пола
    let playerColor = '#ffffff'; // Белый цвет по умолчанию

    currentBall = createBall(400, playerY, playerColor); // Применение цвета
    Body.setVelocity(currentBall, { x: 0, y: 0 });
    Body.setStatic(currentBall, true); // Сделать статическим
    World.add(world, currentBall);
    console.log('Создан новый игрок:', currentBall);
}

// Функция для применения фона
function applyBackground() {
    const appliedBackground = localStorage.getItem('appliedBackground');
    if (appliedBackground === 'Градиентный фон') {
        document.getElementById('game-container').style.background = 'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)';
    } else {
        document.getElementById('game-container').style.backgroundColor = '#333'; // Стандартный фон
    }
}

// Добавление следующего шара
function addNextBall() {
    const ball = createBall(400, 100, nextBallColor);
    World.add(world, ball);
    nextBallColor = getRandomColor();
    updateNextBallDisplay(nextBallColor);
    console.log('Добавлен следующий шар:', ball);
}

// Обновление отображения следующего шара
function updateNextBallDisplay(color) {
    if (nextBallDisplay) {
        nextBallDisplay.style.backgroundColor = color;
    } else {
        console.error('Элемент #next-ball-display .next-ball не найден.');
    }
}

// Управление игроком
document.addEventListener('keydown', (event) => {
    const moveDistance = 20; // Расстояние, на которое будет перемещаться шар

    if (event.key === 'ArrowLeft') {
        // Переместить шар влево, но не выходить за границы
        const newX = Math.max(currentBall.position.x - moveDistance, currentBall.circleRadius);
        Body.setPosition(currentBall, { x: newX, y: currentBall.position.y });
        console.log('Переместил влево:', newX);
    } else if (event.key === 'ArrowRight') {
        // Переместить шар вправо, но не выходить за границы
        const newX = Math.min(currentBall.position.x + moveDistance, 800 - currentBall.circleRadius);
        Body.setPosition(currentBall, { x: newX, y: currentBall.position.y });
        console.log('Переместил вправо:', newX);
    } else if (event.key === ' ') {
        // Пробел для выпуска шара
        if (isHolding && currentBall) {
            Body.setStatic(currentBall, false); // Сделать динамическим
            isHolding = false;
            console.log('Шар отпущен:', currentBall);
            // Создать новый игрок после небольшого времени, чтобы избежать одновременного создания
            setTimeout(() => {
                createPlayer();
                addNextBall();
                applyBackground(); // Применение выбранного фона
                isHolding = true;
            }, 500); // Задержка 0.5 сек
        }
    }
});

// Обработка коллизий
Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;

        // Проверка, включает ли коллизия текущий шар игрока
        if (bodyA === currentBall || bodyB === currentBall) {
            return; // Игрок не объединяется с другими шарами
        }

        if (bodyA.color === bodyB.color) {
            // Объединение шаров
            const newRadius = Math.sqrt(bodyA.circleRadius ** 2 + bodyB.circleRadius ** 2);
            const newBall = Bodies.circle(
                (bodyA.position.x + bodyB.position.x) / 2,
                (bodyA.position.y + bodyB.position.y) / 2,
                newRadius, {
                    restitution: 0.9,
                    friction: 0.005,
                    density: 0.001 * newRadius,
                    render: {
                        fillStyle: bodyA.color
                    }
                }
            );
            newBall.color = bodyA.color;
            World.add(world, newBall);
            World.remove(world, bodyA);
            World.remove(world, bodyB);
            score += Math.floor(newRadius);
            scoreElement.textContent = `Очки: ${score}`;
            localStorage.setItem('score', score); // Сохранение счета
            console.log('Шары объединены. Новый шар:', newBall, 'Текущий счёт:', score);
        }
    });
});

// Инициализация игры
createPlayer();
addNextBall();
applyBackground(); // Применение выбранного фона при инициализации

// Интервал для создания новых шаров (например, каждые 3 секунды)
setInterval(() => {
    if (isHolding && currentBall && currentBall.isStatic) { // Только если удерживаем текущий шар и он статический
        addNextBall();
    }
}, 3000);
