// js/game.js

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------
    // 1. Получение элементов DOM
    // -------------------------

    // Элементы интерфейса игры
    const gameContainer = document.getElementById('game-container');
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

    // Кнопка перезапуска игры
    const restartGameBtn = document.getElementById('restart-game-btn');

    // Вкладки
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Неоновая стрелка под шаром
    const neonArrow = document.getElementById('neon-arrow');

    // Получение shopOverlay
    const shopOverlay = document.getElementById('shop-overlay');

    // Проверка наличия всех элементов
    if (
        !gameContainer ||
        !openShopBtn ||
        !closeShopBtn ||
        !backgroundsContainer ||
        !currentBalanceElement ||
        !statisticsContent ||
        !scoreElement ||
        !nextBallElement ||
        !currentBallElement ||
        !dustFlash ||
        !gameOverModal ||
        !finalScoreElement ||
        !playAgainBtn ||
        !exitBtn ||
        !restartGameBtn ||
        !neonArrow ||
        !shopOverlay
    ) {
        console.error('Не удалось найти некоторые элементы в DOM. Проверьте ID элементов в HTML.');
        return;
    }

    // -------------------------
    // 2. Инициализация переменных
    // -------------------------

    // Функция для ограничения значения между min и max
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

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
        // Добавьте остальные фоны до id:15 с различными цветовыми градиентами
    ];

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

    // Флаг для контроля кулдауна между бросками
    let isCooldown = false;

    // -------------------------
    // 3. Инициализация Matter.js
    // -------------------------

    // Создание Matter.js двигателя и мира
    const engine = Matter.Engine.create();
    const world = engine.world;

    // Установка гравитации (по умолчанию 1)
    world.gravity.y = 1;

    // Создание Renderer
    const renderEngine = Matter.Render.create({
        element: gameContainer,
        engine: engine,
        options: {
            width: 500,
            height: 700,
            wireframes: false,
            background: 'transparent' // Фон задаётся через CSS
        }
    });

    // Создание пола
    const floor = Matter.Bodies.rectangle(250, 690, 500, 20, { 
        isStatic: true,
        render: {
            fillStyle: '#ffffff'
        }
    });

    // Создание левой стены
    const leftWall = Matter.Bodies.rectangle(-10, 350, 20, 700, { 
        isStatic: true,
        render: {
            fillStyle: '#ffffff'
        }
    });

    // Создание правой стены
    const rightWall = Matter.Bodies.rectangle(510, 350, 20, 700, { 
        isStatic: true,
        render: {
            fillStyle: '#ffffff'
        }
    });

    // Добавление пола и стен в мир
    Matter.World.add(world, [floor, leftWall, rightWall]);

    // Создание Runner и запуск
    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    // Запуск Renderer
    Matter.Render.run(renderEngine);

    // -------------------------
    // 4. Функции игры
    // -------------------------

    // Функция для создания шара
    function createBall(x, y, value) {
        if (value > 15) return; // Максимальное значение 15

        const radius = 20 + value * 2; // Регулируемый размер в зависимости от значения
        const ball = Matter.Bodies.circle(x, y, radius, {
            restitution: 0.5,
            friction: 0.1,
            density: 0.001,
            render: {
                fillStyle: `hsl(${value * 24}, 100%, 50%)`, // Яркие цвета
                strokeStyle: '#000000',
                lineWidth: 2
            }
        });
        ball.label = value;
        Matter.World.add(world, ball);
        console.log(`Создан шар: ${value} в (${x}, ${y})`);
        positionNeonArrow();
        return ball;
    }

    // Функция для получения случайного значения шара с повышенной вероятностью 1, 2, 3
    function getRandomBallValue() {
        const values = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 5]; // Увеличенная вероятность 1,2,3
        return values[Math.floor(Math.random() * values.length)];
    }

    // Функция для обновления следующего шара
    function updateNextBall() {
        nextBallElement.style.backgroundColor = `hsl(${nextBallValue * 24}, 100%, 50%)`;
        nextBallElement.textContent = nextBallValue;
    }

    // Функция для обновления текущего шара
    function updateCurrentBall() {
        currentBallElement.style.backgroundColor = `hsl(${currentBallValue * 24}, 100%, 50%)`;
        currentBallElement.textContent = currentBallValue;
    }

    // Функция для отображения анимации пыли
    function showDustFlash(x, y) {
        dustFlash.style.left = `${x - 50}px`;
        dustFlash.style.top = `${y - 50}px`;
        dustFlash.style.opacity = '1';
        dustFlash.style.animation = 'none';
        void dustFlash.offsetWidth; // Триггер reflow для перезапуска анимации
        dustFlash.style.animation = 'dustAnimation 0.6s forwards'; // Обновлённая длительность
    }

    // Функция для применения фона к игре
    function applyBackground(background) {
        document.body.style.background = background;
        gameContainer.style.background = background;

        // Сохранение выбранного фона в localStorage
        localStorage.setItem('selectedBackground', background);
    }

    // Функция для деактивации других фонов
    function deactivateOthers(activeId) {
        backgrounds.forEach(bg => {
            if (bg.id !== activeId && bg.active) {
                bg.active = false;
            }
        });
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
                        positionNeonArrow(); // Обновить позицию стрелки
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
                        positionNeonArrow(); // Обновить позицию стрелки
                    } else {
                        // Деактивация фона, возвращение к дефолтному
                        bg.active = false;
                        applyBackground('linear-gradient(#222, #222)');
                        localStorage.removeItem('selectedBackgroundId');
                        createBackgroundItems();
                        positionNeonArrow(); // Обновить позицию стрелки
                    }
                }
            });

            bgItem.appendChild(preview);
            bgItem.appendChild(name);
            bgItem.appendChild(buyBtn);
            backgroundsContainer.appendChild(bgItem);
        });
    }

    // Функция для рендеринга магазина (обновление кнопок покупки и выделение активного фона)
    function renderShop() {
        createBackgroundItems();
    }

    // Функция для отображения статистики
    function displayStatistics() {
        statisticsContent.innerHTML = `
            <p>Всего игр: ${statistics.totalGames}</p>
            <p>Общий счёт: ${statistics.totalScore}</p>
            <p>Рекорд: ${statistics.highScore}</p>
        `;
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

    // -------------------------
    // 5. Обработчики событий
    // -------------------------

    // Обработчики вкладок магазина
    function setupTabButtons() {
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
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                }

                // Если вкладка "Статистика", обновить её содержимое
                if (targetTab === 'statistics') {
                    displayStatistics();
                }
            });
        });
    }

    // Обработчики кнопок открытия и закрытия магазина
    function setupShopHandlers() {
        openShopBtn.addEventListener('click', () => {
            shopOverlay.style.display = 'flex';
            openShopBtn.classList.add('open'); // Добавить класс для анимации
            positionNeonArrow(); // Обновить позицию стрелки при открытии магазина
        });

        closeShopBtn.addEventListener('click', () => {
            shopOverlay.style.display = 'none';
            openShopBtn.classList.remove('open'); // Удалить класс после закрытия
            neonArrow.style.opacity = '0'; // Скрыть стрелку при закрытии магазина
        });
    }

    // Обработчики кнопок модального окна
    function setupModalHandlers() {
        playAgainBtn.addEventListener('click', () => {
            restartGame();
        });

        exitBtn.addEventListener('click', () => {
            exitGame();
        });

        restartGameBtn.addEventListener('click', () => {
            restartGame();
        });
    }

    // Обработчики перетаскивания шара и броска по клику
    function setupInteractionHandlers() {
        let isDragging = false;
        let dragOffsetX = 0;
        let dragStartX = 0;
        let dragStartY = 0;

        // Обработчик мыши для перетаскивания
        currentBallElement.addEventListener('mousedown', (e) => {
            if (isCooldown) return; // Запретить бросок, если на кулдауне

            isDragging = true;
            const rect = currentBallElement.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            neonArrow.style.opacity = '1';
            positionNeonArrow();
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const gameRect = gameContainer.getBoundingClientRect();
                let x = e.clientX - gameRect.left - dragOffsetX + currentBallElement.offsetWidth / 2;
                x = clamp(x, currentBallElement.offsetWidth / 2, gameRect.width - currentBallElement.offsetWidth / 2);
                currentBallElement.style.left = `${x - currentBallElement.offsetWidth / 2}px`;
                positionNeonArrow();
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                neonArrow.style.opacity = '0';

                const gameRect = gameContainer.getBoundingClientRect();
                const currentBallRect = currentBallElement.getBoundingClientRect();
                const ballX = currentBallRect.left + currentBallRect.width / 2 - gameRect.left;
                const ballY = currentBallRect.top + currentBallRect.height / 2 - gameRect.top;
                const dx = e.clientX - dragStartX;
                const dy = e.clientY - dragStartY;

                // Преобразование drag vector в скорость (строго вниз)
                const velocityScale = 0.1; // Коэффициент масштабирования скорости
                const velocityX = 0; // Нулевая скорость по X
                const velocityY = dy * velocityScale;

                // Ограничение максимальной скорости
                const maxVelocity = 20;
                const finalVelocityY = clamp(velocityY, 5, maxVelocity); // Минимальная скорость 5

                // Создание шара
                const newBall = createBall(ballX, ballY, currentBallValue);
                if (newBall) {
                    Matter.Body.setVelocity(newBall, { x: velocityX, y: finalVelocityY });
                    // Запуск кулдауна
                    startCooldown();
                }

                // Обновление значений текущего и следующего шара
                currentBallValue = nextBallValue;
                nextBallValue = getRandomBallValue();
                updateNextBall();
                updateCurrentBall();

                // Сохранение состояния
                saveGameState();
            }
        });

        // Обработчики касаний для мобильных устройств
        currentBallElement.addEventListener('touchstart', (e) => {
            if (isCooldown) return; // Запретить бросок, если на кулдауне

            isDragging = true;
            const touch = e.touches[0];
            const rect = currentBallElement.getBoundingClientRect();
            dragOffsetX = touch.clientX - rect.left;
            dragStartX = touch.clientX;
            dragStartY = touch.clientY;
            neonArrow.style.opacity = '1';
            positionNeonArrow();
        });

        document.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = e.touches[0];
                const gameRect = gameContainer.getBoundingClientRect();
                let x = touch.clientX - gameRect.left - dragOffsetX + currentBallElement.offsetWidth / 2;
                x = clamp(x, currentBallElement.offsetWidth / 2, gameRect.width - currentBallElement.offsetWidth / 2);
                currentBallElement.style.left = `${x - currentBallElement.offsetWidth / 2}px`;
                positionNeonArrow();
            }
        });

        document.addEventListener('touchend', (e) => {
            if (isDragging) {
                isDragging = false;
                neonArrow.style.opacity = '0';

                const touch = e.changedTouches[0];
                const gameRect = gameContainer.getBoundingClientRect();
                const currentBallRect = currentBallElement.getBoundingClientRect();
                const ballX = currentBallRect.left + currentBallRect.width / 2 - gameRect.left;
                const ballY = currentBallRect.top + currentBallRect.height / 2 - gameRect.top;
                const dx = touch.clientX - dragStartX;
                const dy = touch.clientY - dragStartY;

                // Преобразование drag vector в скорость (строго вниз)
                const velocityScale = 0.1; // Коэффициент масштабирования скорости
                const velocityX = 0; // Нулевая скорость по X
                const velocityY = dy * velocityScale;

                // Ограничение максимальной скорости
                const maxVelocity = 20;
                const finalVelocityY = clamp(velocityY, 5, maxVelocity); // Минимальная скорость 5

                // Создание шара
                const newBall = createBall(ballX, ballY, currentBallValue);
                if (newBall) {
                    Matter.Body.setVelocity(newBall, { x: velocityX, y: finalVelocityY });
                    // Запуск кулдауна
                    startCooldown();
                }

                // Обновление значений текущего и следующего шара
                currentBallValue = nextBallValue;
                nextBallValue = getRandomBallValue();
                updateNextBall();
                updateCurrentBall();

                // Сохранение состояния
                saveGameState();
            }
        });

        // Обработчик клика по игровому полю для броска шара
        gameContainer.addEventListener('click', (e) => {
            // Исключаем клик по самому шару
            if (e.target === currentBallElement) return;

            if (isCooldown) return; // Запретить бросок, если на кулдауне

            const gameRect = gameContainer.getBoundingClientRect();
            const x = e.clientX - gameRect.left;
            const y = e.clientY - gameRect.top;

            // Создание шара в позиции текущего шара
            const currentBallRect = currentBallElement.getBoundingClientRect();
            const currentBallGameX = currentBallRect.left + currentBallRect.width / 2 - gameRect.left;
            const currentBallGameY = currentBallRect.top + currentBallRect.height / 2 - gameRect.top;

            // Вычисление направления и скорости
            const dx = x - currentBallGameX;
            const dy = y - currentBallGameY;

            const velocityScale = 0.1; // Коэффициент масштабирования скорости
            const velocityX = dx * velocityScale;
            const velocityY = dy * velocityScale;

            // Ограничение максимальной скорости
            const maxVelocity = 20;
            const finalVelocityX = clamp(velocityX, -maxVelocity, maxVelocity);
            const finalVelocityY = clamp(velocityY, 5, maxVelocity); // Минимальная скорость 5 по Y

            // Создание шара
            const newBall = createBall(currentBallGameX, currentBallGameY, currentBallValue);
            if (newBall) {
                Matter.Body.setVelocity(newBall, { x: finalVelocityX, y: finalVelocityY });
                // Запуск кулдауна
                startCooldown();
            }

            // Обновление значений текущего и следующего шара
            currentBallValue = nextBallValue;
            nextBallValue = getRandomBallValue();
            updateNextBall();
            updateCurrentBall();

            // Сохранение состояния
            saveGameState();
        });
    }

    // -------------------------
    // 4. Функции управления игрой
    // -------------------------

    // Функция для окончания игры
    function endGame() {
        // Остановить физический движок и отрисовку
        Matter.Runner.stop(runner);
        Matter.Render.stop(renderEngine);

        // Обновить статистику
        updateStatistics(score);
        displayStatistics();

        // Показать финальный счёт
        finalScoreElement.textContent = score;

        // Показать модальное окно
        gameOverModal.style.display = 'block';

        // Очистить сохранённое состояние игры
        localStorage.removeItem('balls');
        localStorage.removeItem('score');
        localStorage.removeItem('nextBallValue');
        localStorage.removeItem('currentBallValue');
    }

    // Функция для перезапуска игры
    function restartGame() {
        // Обновление статистики
        updateStatistics(score);
        displayStatistics();

        // Сброс текущего счета
        score = 0;
        scoreElement.textContent = `Очки: ${score}`;

        // Сброс текущего и следующего шара
        currentBallValue = 1;
        nextBallValue = getRandomBallValue();
        updateNextBall();
        updateCurrentBall();

        // Очистка мира, сохраняя статические тела
        Matter.World.clear(world, false); // Не удалять рендер
        Matter.Engine.clear(engine);
        Matter.Render.stop(renderEngine);
        Matter.Runner.stop(runner);

        // Воссоздание пола и стен
        Matter.World.add(world, [floor, leftWall, rightWall]);

        // Запуск Runner и Render заново
        Matter.Runner.run(runner, engine);
        Matter.Render.run(renderEngine);

        // Создание начального шара
        createBall(250, 100, currentBallValue);

        // Разрешить бросок
        isCooldown = false;

        // Сохранение состояния
        saveGameState();

        // Скрыть модальное окно
        gameOverModal.style.display = 'none';
    }

    // Функция для выхода из игры (перенаправление на главную страницу)
    function exitGame() {
        // Очистить сохранённое состояние игры
        localStorage.removeItem('balls');
        localStorage.removeItem('score');
        localStorage.removeItem('nextBallValue');
        localStorage.removeItem('currentBallValue');

        // Перенаправление на главную страницу
        window.location.href = 'index.html';
    }

    // Функция для сохранения состояния игры
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

    // Функция для загрузки состояния игры
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
            positionNeonArrow();
        }
    }

    // -------------------------
    // 5. Обработка столкновений
    // -------------------------

    // Обработка столкновений для объединения шаров
    Matter.Events.on(engine, 'collisionStart', (event) => {
        const pairs = event.pairs;
        pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;
            if (bodyA.label && bodyB.label && bodyA.label === bodyB.label) {
                const newValue = parseInt(bodyA.label) + 1;
                if (newValue > 15) return; // Максимальное значение 15

                const newX = (bodyA.position.x + bodyB.position.x) / 2;
                const newY = (bodyA.position.y + bodyB.position.y) / 2;

                // Удаление старых шаров
                Matter.World.remove(world, [bodyA, bodyB]);
                console.log(`Объединение шаров в новый шар: ${newValue} в (${newX}, ${newY})`);

                // Создание нового шара
                const mergedBall = createBall(newX, newY, newValue);

                // Обновление счета
                score += newValue;
                scoreElement.textContent = `Очки: ${score}`;

                // Анимация пыли
                showDustFlash(newX, newY);

                // Сохранение состояния
                saveGameState();

                // Проверка условия окончания игры
                checkGameOver();
            }
        });
    });

    // Функция для проверки условия окончания игры
    function checkGameOver() {
        // Пример условия: если последний шар вылетает за нижнюю границу экрана
        const bodies = Matter.Composite.allBodies(engine.world).filter(body => !body.isStatic && body.label);
        bodies.forEach(body => {
            if (body.position.y > 700) { // Высота игры
                endGame();
            }
        });
    }

    // -------------------------
    // 6. Функции позиционирования стрелки
    // -------------------------

    // Функция для позиционирования неоновой стрелки под текущим шаром до пола
    function positionNeonArrow() {
        const rect = currentBallElement.getBoundingClientRect();
        const gameRect = gameContainer.getBoundingClientRect();

        // Вычислить расстояние от нижней части шара до пола
        const distanceToFloor = gameRect.height - (rect.top - gameRect.top + rect.height);

        // Обновить позицию стрелки
        neonArrow.style.left = `${rect.left - gameRect.left + rect.width / 2 - 1}px`; // 1px - половина ширины стрелки (2px)
        neonArrow.style.top = `${rect.bottom - gameRect.top}px`;

        // Обновить высоту стрелки
        neonArrow.style.height = `${distanceToFloor}px`;
    }

    // -------------------------
    // 7. Добавление нумерации внутри шаров
    // -------------------------

    // Функция для рисования текста на шарах после рендеринга
    Matter.Events.on(renderEngine, 'afterRender', () => {
        const context = renderEngine.context;

        const bodies = Matter.Composite.allBodies(engine.world).filter(body => !body.isStatic && body.label);

        context.font = '16px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        bodies.forEach(body => {
            context.save();
            context.translate(body.position.x, body.position.y);
            context.rotate(body.angle);
            context.fillText(body.label, 0, 0);
            context.restore();
        });
    });

    // -------------------------
    // 8. Функции управления магазином и статистикой
    // -------------------------

    // Функция для отображения статистики
    function displayStatistics() {
        statisticsContent.innerHTML = `
            <p>Всего игр: ${statistics.totalGames}</p>
            <p>Общий счёт: ${statistics.totalScore}</p>
            <p>Рекорд: ${statistics.highScore}</p>
        `;
    }

    // -------------------------
    // 9. Функция для инициализации всех обработчиков
    // -------------------------

    function setupHandlers() {
        setupTabButtons();
        setupShopHandlers();
        setupModalHandlers();
        setupInteractionHandlers();
    }

    // Функция для запуска игры
    function initializeGame() {
        // Создание начального шара, если нет сохранённых
        if (!localStorage.getItem('balls')) {
            createBall(250, 100, currentBallValue);
            positionNeonArrow();
        }

        // Загрузка сохранённого состояния игры
        loadGameState();

        // Сохранение состояния при каждом обновлении движка
        Matter.Events.on(engine, 'afterUpdate', () => {
            saveGameState();
        });
    }

    // -------------------------
    // 10. Кулдаун между бросками
    // -------------------------

    function startCooldown() {
        isCooldown = true;
        setTimeout(() => {
            isCooldown = false;
        }, 500); // 0.5 секунды
    }

    // -------------------------
    // 11. Инициализация и запуск
    // -------------------------

    // Инициализация обработчиков и игры
    setupHandlers();
    renderShop();
    initializeGame();
    displayStatistics();
});
