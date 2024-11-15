// game.js

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------
    // 1. Получение элементов DOM
    // -------------------------
    const gameContainer = document.getElementById('game-container');
    const openShopBtn = document.getElementById('open-shop-btn');
    const closeShopBtn = document.getElementById('close-shop-btn');
    const scoreElement = document.getElementById('score');
    const nextBallElement = document.getElementById('next-ball');
    const currentBallElement = document.getElementById('current-ball');
    const neonArrow = document.getElementById('neon-arrow');
    const ballQueue = document.getElementById('ball-queue');
    const currentBalanceElement = document.getElementById('current-balance');
    const backgroundsContainer = document.getElementById('backgrounds-container');
    const statisticsContent = document.getElementById('statistics-content');
    const gameOverModal = document.getElementById('game-over-modal');
    const finalScoreElement = document.getElementById('final-score');
    const playAgainBtn = document.getElementById('play-again-btn');
    const exitBtn = document.getElementById('exit-btn');
    const resumeModal = document.getElementById('resume-modal');
    const resumeScoreElement = document.getElementById('resume-score');
    const continueGameBtn = document.getElementById('continue-game-btn');
    const startNewGameBtn = document.getElementById('start-new-game-btn');

    // Проверка наличия всех необходимых элементов
    const requiredElements = [
        gameContainer,
        openShopBtn,
        closeShopBtn,
        scoreElement,
        nextBallElement,
        currentBallElement,
        neonArrow,
        ballQueue,
        currentBalanceElement,
        backgroundsContainer,
        statisticsContent,
        gameOverModal,
        finalScoreElement,
        playAgainBtn,
        exitBtn,
        resumeModal,
        resumeScoreElement,
        continueGameBtn,
        startNewGameBtn
    ];

    const missingElements = requiredElements.filter(element => !element);
    if (missingElements.length > 0) {
        console.error('Не удалось найти некоторые элементы в DOM. Проверьте ID элементов в HTML.', missingElements);
        return;
    }

    // -------------------------
    // 2. Инициализация переменных
    // -------------------------
    let balance = parseInt(localStorage.getItem('balance')) || 500;
    currentBalanceElement.textContent = balance;

    let selectedBackground = localStorage.getItem('selectedBackground') || 'linear-gradient(#1a1a2e, #1a1a2e)';
    applyBackground(selectedBackground);

    let score = parseInt(localStorage.getItem('score')) || 0;
    let nextBallValue = parseInt(localStorage.getItem('nextBallValue')) || getRandomBallValue();
    let currentBallValue = parseInt(localStorage.getItem('currentBallValue')) || 1;

    let statistics = JSON.parse(localStorage.getItem('statistics')) || {
        totalGames: 0,
        totalScore: 0,
        highScore: 0
    };

    scoreElement.textContent = `Очки: ${score}`;
    updateNextBall();
    updateCurrentBall();

    displayStatistics(statistics);

    let isCooldown = false; // Флаг для контроля кулдауна между бросками

    // -------------------------
    // 3. Определение функции startCooldown
    // -------------------------
    function startCooldown() {
        isCooldown = true;
        setTimeout(() => {
            isCooldown = false;
        }, 500); // Кулдаун 0.5 секунды
    }

    // -------------------------
    // 4. Инициализация Matter.js
    // -------------------------
    const engine = Matter.Engine.create();
    const world = engine.world;
    world.gravity.y = 0.5;

    const renderEngine = Matter.Render.create({
        element: gameContainer,
        engine: engine,
        options: {
            width: 500,
            height: 700,
            wireframes: false,
            background: 'transparent'
        }
    });

    const floor = Matter.Bodies.rectangle(250, 690, 500, 20, { 
        isStatic: true,
        render: {
            fillStyle: '#ffffff'
        }
    });

    const leftWall = Matter.Bodies.rectangle(-10, 350, 20, 700, { 
        isStatic: true,
        render: {
            fillStyle: '#ffffff'
        }
    });

    const rightWall = Matter.Bodies.rectangle(510, 350, 20, 700, { 
        isStatic: true,
        render: {
            fillStyle: '#ffffff'
        }
    });

    Matter.World.add(world, [floor, leftWall, rightWall]);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(renderEngine);

    // -------------------------
    // 5. Вспомогательные функции
    // -------------------------

    // Функция для ограничения значения между min и max
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

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
        ball.label = value.toString();
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

    // Функция для применения фона к игре
    function applyBackground(background) {
        document.body.style.background = background;
        gameContainer.style.background = background;

        // Сохранение выбранного фона в localStorage
        localStorage.setItem('selectedBackground', background);
    }

    // -------------------------
    // 6. Обработчики вкладок магазина
    // -------------------------
    function setupTabButtons() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

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
                    displayStatistics(statistics);
                }
            });
        });
    }

    // -------------------------
    // 7. Обработчики кнопок открытия и закрытия магазина
    // -------------------------
    function setupShopHandlers() {
        openShopBtn.addEventListener('click', () => {
            document.getElementById('shop-overlay').style.display = 'flex';
            openShopBtn.classList.add('open');
        });

        closeShopBtn.addEventListener('click', () => {
            document.getElementById('shop-overlay').style.display = 'none';
            openShopBtn.classList.remove('open');
        });
    }

    // -------------------------
    // 8. Обработчики кнопок модальных окон
    // -------------------------
    function setupModalHandlers() {
        playAgainBtn.addEventListener('click', () => {
            restartGame();
        });

        exitBtn.addEventListener('click', () => {
            exitGame();
        });

        continueGameBtn.addEventListener('click', () => {
            // Установить счёт в модальном окне resume-modal
            const savedScore = parseInt(localStorage.getItem('score')) || 0;
            resumeScoreElement.textContent = savedScore;

            // Скрыть модальное окно
            resumeModal.style.display = 'none';
            // Загрузить сохранённое состояние игры
            loadGameState();
        });

        startNewGameBtn.addEventListener('click', () => {
            // Скрыть модальное окно
            resumeModal.style.display = 'none';
            // Очистить сохранённое состояние
            clearSavedGame();
            // Инициализировать новую игру
            restartGame();
        });
    }

    // -------------------------
    // 9. Функция для управления магазином
    // -------------------------
    function setupShopTabHandlersFunction() {
        // Обработка покупок фонов и применения фонов

        // Получение текущих купленных фонов из localStorage
        let purchasedBackgrounds = JSON.parse(localStorage.getItem('purchasedBackgrounds')) || [];

        // Функция для обновления баланса
        function updateBalance(newBalance) {
            balance = newBalance;
            currentBalanceElement.textContent = balance;
            localStorage.setItem('balance', balance);
        }

        // Функция для отображения доступных фонов
        function renderBackgrounds() {
            backgroundsContainer.innerHTML = ''; // Очистка контейнера

            // Пример фонов (можно заменить на динамическое добавление из другого источника)
            const backgrounds = [
                {
                    name: "Зимний лес",
                    price: 100,
                    background: "linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), #222"
                },
                {
                    name: "Солнечный день",
                    price: 150,
                    background: "linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)"
                },
                {
                    name: "Ночной город",
                    price: 200,
                    background: "linear-gradient(to bottom, #000428, #004e92)"
                },
                {
                    name: "Рассвет",
                    price: 250,
                    background: "linear-gradient(to right, #ff7e5f, #feb47b)"
                },
                {
                    name: "Туманное утро",
                    price: 300,
                    background: "linear-gradient(to right, #ada996, #f2f2f2, #dbdbdb, #eaeaea)"
                },
                {
                    name: "Магическое небо",
                    price: 350,
                    background: "linear-gradient(to right, #6a11cb 0%, #2575fc 100%)"
                },
                {
                    name: "Пустынный песок",
                    price: 400,
                    background: "linear-gradient(120deg, #f6d365 0%, #fda085 100%)"
                },
                {
                    name: "Темная тема",
                    price: 450,
                    background: "linear-gradient(to right, #434343 0%, black 100%)"
                },
                {
                    name: "Глубины океана",
                    price: 500,
                    background: "linear-gradient(to top, #30cfd0 0%, #330867 100%)"
                }
            ];

            backgrounds.forEach(bg => {
                const bgItem = document.createElement('div');
                bgItem.classList.add('background-item');

                const itemPreview = document.createElement('div');
                itemPreview.classList.add('preview');
                itemPreview.style.background = bg.background;

                const itemName = document.createElement('div');
                itemName.classList.add('stat-label'); // Используем тот же стиль для меток
                itemName.textContent = bg.name;

                const itemPrice = document.createElement('div');
                itemPrice.classList.add('stat-value'); // Используем тот же стиль для значений
                itemPrice.textContent = `${bg.price} монет`;

                const buyBtn = document.createElement('button');
                buyBtn.classList.add('buy-btn');
                buyBtn.textContent = 'Купить';

                const applyBtn = document.createElement('button');
                applyBtn.classList.add('buy-btn'); // Используем тот же стиль для простоты
                applyBtn.textContent = 'Применить';
                applyBtn.style.display = 'none'; // Скрыть изначально

                // Проверка, куплен ли фон
                if (purchasedBackgrounds.includes(bg.name)) {
                    buyBtn.style.display = 'none';
                    applyBtn.style.display = 'block';
                }

                // Обработчик покупки
                buyBtn.addEventListener('click', () => {
                    if (balance >= bg.price) {
                        updateBalance(balance - bg.price);
                        purchasedBackgrounds.push(bg.name);
                        localStorage.setItem('purchasedBackgrounds', JSON.stringify(purchasedBackgrounds));

                        buyBtn.style.display = 'none';
                        applyBtn.style.display = 'block';
                    } else {
                        alert('Недостаточно монет для покупки этого фона!');
                    }
                });

                // Обработчик применения фона
                applyBtn.addEventListener('click', () => {
                    applyBackground(bg.background);
                });

                bgItem.appendChild(itemPreview);
                bgItem.appendChild(itemName);
                bgItem.appendChild(itemPrice);
                bgItem.appendChild(buyBtn);
                bgItem.appendChild(applyBtn);

                backgroundsContainer.appendChild(bgItem);
            });
        }

        // Инициализация фонов
        renderBackgrounds();
    }

    // -------------------------
    // 10. Обработчики перетаскивания и броска шара
    // -------------------------
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
                const velocityScale = 0.05; // Уменьшен с 0.1 до 0.05
                const velocityX = 0; // Нулевая скорость по X
                const velocityY = dy * velocityScale;

                // Ограничение максимальной скорости
                const maxVelocity = 10; // Уменьшено с 20 до 10
                const finalVelocityY = clamp(velocityY, 2, maxVelocity); // Минимальная скорость 2

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
                const velocityScale = 0.05; // Уменьшен с 0.1 до 0.05
                const velocityX = 0; // Нулевая скорость по X
                const velocityY = dy * velocityScale;

                // Ограничение максимальной скорости
                const maxVelocity = 10; // Уменьшено с 20 до 10
                const finalVelocityY = clamp(velocityY, 2, maxVelocity); // Минимальная скорость 2

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

            const velocityScale = 0.05; // Уменьшен с 0.1 до 0.05
            const velocityX = dx * velocityScale;
            const velocityY = dy * velocityScale;

            // Ограничение максимальной скорости
            const maxVelocity = 10; // Уменьшено с 20 до 10
            const finalVelocityX = clamp(velocityX, -maxVelocity, maxVelocity);
            const finalVelocityY = clamp(velocityY, 2, maxVelocity); // Минимальная скорость 2

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
    // 10. Функция окончания игры
    // -------------------------
    function endGame() {
        // Остановить физический движок и отрисовку
        Matter.Runner.stop(runner);
        Matter.Render.stop(renderEngine);

        // Обновить статистику
        updateStatistics(score);
        displayStatistics(statistics);

        // Показать финальный счёт
        finalScoreElement.textContent = score;

        // Показать модальное окно окончания игры
        gameOverModal.style.display = 'block';

        // Очистить сохранённое состояние игры
        clearSavedGame();
    }

    // -------------------------
    // 11. Функция перезапуска игры
    // -------------------------
    function restartGame() {
        // Очистка сохранённого состояния
        clearSavedGame();

        // Обновление статистики
        updateStatistics(score);
        displayStatistics(statistics);

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
        const floor = Matter.Bodies.rectangle(250, 690, 500, 20, { 
            isStatic: true,
            render: {
                fillStyle: '#ffffff'
            }
        });

        const leftWall = Matter.Bodies.rectangle(-10, 350, 20, 700, { 
            isStatic: true,
            render: {
                fillStyle: '#ffffff'
            }
        });

        const rightWall = Matter.Bodies.rectangle(510, 350, 20, 700, { 
            isStatic: true,
            render: {
                fillStyle: '#ffffff'
            }
        });

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

        // Скрыть модальное окно окончания игры, если оно было открыто
        gameOverModal.style.display = 'none';
    }

    // -------------------------
    // 12. Функция выхода из игры
    // -------------------------
    function exitGame() {
        // Очистить сохранённое состояние игры
        clearSavedGame();

        // Перенаправление на главную страницу (если имеется)
        window.location.href = 'index.html';
    }

    // -------------------------
    // 13. Функции для сохранения и загрузки состояния игры
    // -------------------------
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
        
        // Сохранение статистики
        localStorage.setItem('statistics', JSON.stringify(statistics));
    }

    function loadGameState() {
        const savedBalls = JSON.parse(localStorage.getItem('balls'));
        if (savedBalls && savedBalls.length > 0) {
            savedBalls.forEach(ballData => {
                const ball = createBall(ballData.x, ballData.y, parseInt(ballData.label));
                Matter.Body.setVelocity(ball, ballData.velocity);
            });
            score = parseInt(localStorage.getItem('score')) || 0;
            nextBallValue = parseInt(localStorage.getItem('nextBallValue')) || getRandomBallValue();
            currentBallValue = parseInt(localStorage.getItem('currentBallValue')) || 1;
            scoreElement.textContent = `Очки: ${score}`;
            updateNextBall();
            updateCurrentBall();

            // Восстановление статистики
            const savedStatistics = JSON.parse(localStorage.getItem('statistics'));
            if (savedStatistics) {
                statistics = savedStatistics;
            }

            // Применение сохранённого фона
            const savedBackground = localStorage.getItem('selectedBackground');
            if (savedBackground) {
                applyBackground(savedBackground);
            } else {
                applyBackground('linear-gradient(#1a1a2e, #1a1a2e)');
            }

            // Обновление статистики на экране
            displayStatistics(statistics);
        }
    }

    // -------------------------
    // 14. Обработка столкновений для объединения шаров
    // -------------------------
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

                // Обновление статистики
                statistics.totalScore += newValue;
                if (newValue > statistics.highScore) {
                    statistics.highScore = newValue;
                }

                // Сохранение состояния
                saveGameState();

                // Обновление отображения статистики
                displayStatistics(statistics);

                // Проверка условия окончания игры
                checkGameOver();
            }
        });
    });

    // -------------------------
    // 15. Функция проверки окончания игры
    // -------------------------
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
    // 16. Функция позиционирования неоновой стрелки
    // -------------------------
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
    // 17. Рендеринг текста на шарах после отрисовки
    // -------------------------
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
    // 18. Функция для управления статистикой
    // -------------------------
    // Эта функция уже определена в statistics.js и вызывается через displayStatistics(statistics)

    // -------------------------
    // 19. Функция для управления магазином
    // -------------------------
    setupShopTabHandlersFunction();

    // -------------------------
    // 20. Обработчики вкладок магазина
    // -------------------------
    setupTabButtons();

    // -------------------------
    // 21. Обработчики кнопок открытия и закрытия магазина
    // -------------------------
    setupShopHandlers();

    // -------------------------
    // 22. Обработчики кнопок модальных окон
    // -------------------------
    setupModalHandlers();

    // -------------------------
    // 23. Обработчики перетаскивания и броска шара
    // -------------------------
    setupInteractionHandlers();

    // -------------------------
    // 24. Проверка наличия сохранённой игры
    // -------------------------
    if (localStorage.getItem('balls')) {
        // Установить счёт в модальном окне resume-modal
        const savedScore = parseInt(localStorage.getItem('score')) || 0;
        resumeScoreElement.textContent = savedScore;

        // Показать модальное окно выбора
        resumeModal.style.display = 'flex';
    } else {
        // Если сохранённого состояния нет, инициализировать новую игру
        createBall(250, 100, currentBallValue);
        positionNeonArrow();
    }

    // -------------------------
    // 25. Сохранение состояния при каждом обновлении движка
    // -------------------------
    Matter.Events.on(engine, 'afterUpdate', () => {
        saveGameState();
    });

    // -------------------------
    // 26. Функция для спавна шаров через консоль
    // -------------------------
    // Объявим функцию глобально, чтобы её можно было вызывать из консоли
    window.spawnBall = function(x, y, value) {
        if (isCooldown) {
            console.warn('Сейчас на кулдауне. Попробуйте позже.');
            return;
        }

        // Создание шара
        const newBall = createBall(x, y, value);
        if (newBall) {
            Matter.Body.setVelocity(newBall, { x: 0, y: 5 }); // Пример скорости
            // Запуск кулдауна
            startCooldown();

            // Обновление значений текущего и следующего шара
            currentBallValue = nextBallValue;
            nextBallValue = getRandomBallValue();
            updateNextBall();
            updateCurrentBall();

            // Сохранение состояния
            saveGameState();
        }
    };
});
