// game.js

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------
    // 1. Кэширование элементов DOM
    // -------------------------
    const DOM = {
        gameContainer: document.getElementById('game-container'),
        openShopBtn: document.getElementById('open-shop-btn'), // Кнопка открытия магазина
        shopOverlay: document.getElementById('shop-overlay'), // Оверлей магазина
        closeShopBtn: document.getElementById('close-shop-btn'), // Кнопка закрытия магазина
        tabButtons: document.querySelectorAll('.tab-button'), // Кнопки вкладок
        tabContents: document.querySelectorAll('.tab-content'), // Содержимое вкладок
        scoreElement: document.getElementById('score'),
        nextBallElement: document.getElementById('next-ball'),
        currentBallElement: document.getElementById('current-ball'),
        neonArrow: document.getElementById('neon-arrow'),
        ballQueue: document.getElementById('ball-queue'),
        currentBalanceElement: document.getElementById('current-balance'),
        backgroundsContainer: document.getElementById('backgrounds-container'),
        statisticsContent: document.getElementById('statistics-content'),
        gameOverModal: document.getElementById('game-over-modal'),
        finalScoreElement: document.getElementById('final-score'),
        playAgainBtn: document.getElementById('play-again-btn'),
        exitBtn: document.getElementById('exit-btn'),
        resumeModal: document.getElementById('resume-modal'),
        resumeScoreElement: document.getElementById('resume-score'),
        continueGameBtn: document.getElementById('continue-game-btn'),
        startNewGameBtn: document.getElementById('start-new-game-btn'),
        bgmToggle: document.getElementById('bgm-toggle'),
        sfxToggle: document.getElementById('sfx-toggle'),
        restartGameBtn: document.getElementById('restart-game-btn'),
        disableBackgroundBtn: document.getElementById('disable-background'),
    };

    // Проверка наличия всех необходимых элементов
    const missingElements = Object.entries(DOM).filter(([key, element]) => element === null);
    if (missingElements.length > 0) {
        const missingIDs = missingElements.map(([key, element]) => key);
        console.error('Не удалось найти некоторые элементы в DOM. Проверьте ID элементов в HTML.', missingIDs);
        return;
    }

    // -------------------------
    // 2. Инициализация переменных состояния
    // -------------------------
    let state = {
        balance: parseInt(localStorage.getItem('balance')) || 500,
        selectedBackground: localStorage.getItem('selectedBackground') || 'linear-gradient(#1a1a2e, #1a1a2e)',
        score: parseInt(localStorage.getItem('score')) || 0,
        nextBallValue: parseInt(localStorage.getItem('nextBallValue')) || getRandomBallValue(),
        currentBallValue: parseInt(localStorage.getItem('currentBallValue')) || 1,
        statistics: JSON.parse(localStorage.getItem('statistics')) || {
            totalGames: 0,
            totalScore: 0,
            highScore: 0
        },
        purchasedBackgrounds: JSON.parse(localStorage.getItem('purchasedBackgrounds')) || [],
        isCooldown: false,
        bgmEnabled: JSON.parse(localStorage.getItem('bgmEnabled')) !== false, // По умолчанию включено
        sfxEnabled: JSON.parse(localStorage.getItem('sfxEnabled')) !== false, // По умолчанию включено
    };

    // Обновление UI
    DOM.currentBalanceElement.textContent = state.balance;
    DOM.scoreElement.textContent = `Очки: ${state.score}`;
    applyBackground(state.selectedBackground);
    updateNextBall();
    updateCurrentBall();
    displayStatistics(state.statistics);
    updateAudioSettings();

    // -------------------------
    // 3. Инициализация Matter.js
    // -------------------------
    const engine = Matter.Engine.create();
    const world = engine.world;
    world.gravity.y = 0.5;

    const renderEngine = Matter.Render.create({
        element: DOM.gameContainer,
        engine: engine,
        options: {
            width: DOM.gameContainer.clientWidth, // Адаптивная ширина
            height: DOM.gameContainer.clientHeight, // Адаптивная высота
            wireframes: false,
            background: 'transparent'
        }
    });

    const staticBodies = [
        Matter.Bodies.rectangle(DOM.gameContainer.clientWidth / 2, DOM.gameContainer.clientHeight - 10, DOM.gameContainer.clientWidth, 20, { 
            isStatic: true,
            render: { fillStyle: '#ffffff' }
        }),
        Matter.Bodies.rectangle(-10, DOM.gameContainer.clientHeight / 2, 20, DOM.gameContainer.clientHeight, { 
            isStatic: true,
            render: { fillStyle: '#ffffff' }
        }),
        Matter.Bodies.rectangle(DOM.gameContainer.clientWidth + 10, DOM.gameContainer.clientHeight / 2, 20, DOM.gameContainer.clientHeight, { 
            isStatic: true,
            render: { fillStyle: '#ffffff' }
        })
    ];

    Matter.World.add(world, staticBodies);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(renderEngine);

    // -------------------------
    // 4. Вспомогательные функции
    // -------------------------

    // Функция для отображения уведомлений
    function showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        notification.textContent = message;

        container.appendChild(notification);

        // Используем requestAnimationFrame для плавного появления
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Удаление уведомления после указанного времени
        setTimeout(() => {
            notification.classList.remove('show');
            // Удаление из DOM после завершения анимации
            setTimeout(() => {
                if (notification.parentElement === container) {
                    container.removeChild(notification);
                }
            }, 500); // Время должно совпадать с CSS transition
        }, duration);
    }

    // Ограничение значения между min и max
    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    // Создание шара
    function createBall(x, y, value) {
        if (value > 15) return null; // Максимальное значение 15

        const radius = 20 + value * 2; // Регулируемый размер в зависимости от значения
        const ball = Matter.Bodies.circle(x, y, radius, {
            restitution: 0.5,
            friction: 0.1,
            density: 0.001,
            render: {
                fillStyle: `hsl(${value * 24}, 100%, 50%)`,
                strokeStyle: '#000000',
                lineWidth: 2
            }
        });
        ball.label = value.toString();
        Matter.World.add(world, ball);
        // positionNeonArrow(); // Возможно, эта функция мешает. Проверьте необходимость вызова здесь.
        console.log(`Создан шар: ${ball.label} на позиции (${ball.position.x}, ${ball.position.y})`);
        return ball;
    }

    // Получение случайного значения шара с повышенной вероятностью 1, 2, 3
    function getRandomBallValue() {
        const values = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 5];
        return values[Math.floor(Math.random() * values.length)];
    }

    // Обновление следующего шара
    function updateNextBall() {
        DOM.nextBallElement.style.backgroundColor = `hsl(${state.nextBallValue * 24}, 100%, 50%)`;
        DOM.nextBallElement.textContent = state.nextBallValue;
    }

    // Обновление текущего шара
    function updateCurrentBall() {
        DOM.currentBallElement.style.backgroundColor = `hsl(${state.currentBallValue * 24}, 100%, 50%)`;
        DOM.currentBallElement.textContent = state.currentBallValue;
    }

    // Применение фона к игре
    function applyBackground(background) {
        document.body.style.background = background;
        DOM.gameContainer.style.background = background;
        state.selectedBackground = background;
        localStorage.setItem('selectedBackground', background);
    }

    // Начало кулдауна
    function startCooldown() {
        state.isCooldown = true;
        setTimeout(() => {
            state.isCooldown = false;
        }, 500); // Кулдаун 0.5 секунды
    }

    // Обновление баланса
    function updateBalance(newBalance) {
        state.balance = newBalance;
        DOM.currentBalanceElement.textContent = state.balance;
        localStorage.setItem('balance', state.balance);
    }

    // Отображение статистики
    function displayStatistics(statistics) {
        const statisticsContent = document.getElementById('statistics-content');
        if (!statisticsContent) return;

        statisticsContent.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Всего игр</span>
                <span class="stat-value">${statistics.totalGames}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Общий счёт</span>
                <span class="stat-value">${statistics.totalScore}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Рекорд</span>
                <span class="stat-value">${statistics.highScore}</span>
            </div>
        `;
    }  

    // Обновление статистики
    function updateStatistics(newScore) {
        state.statistics.totalGames += 1;
        state.statistics.totalScore += newScore;
        if (newScore > state.statistics.highScore) {
            state.statistics.highScore = newScore;
        }
        localStorage.setItem('statistics', JSON.stringify(state.statistics));
    }

    // Сохранение состояния игры
    function saveGameState() {
        const bodies = Matter.Composite.allBodies(world).filter(body => !body.isStatic && body.label);
        const balls = bodies.map(body => ({
            x: body.position.x,
            y: body.position.y,
            label: body.label,
            velocity: body.velocity
        }));
        localStorage.setItem('balls', JSON.stringify(balls));
        localStorage.setItem('score', state.score);
        localStorage.setItem('nextBallValue', state.nextBallValue);
        localStorage.setItem('currentBallValue', state.currentBallValue);
        localStorage.setItem('statistics', JSON.stringify(state.statistics));
        localStorage.setItem('balance', state.balance);
        localStorage.setItem('bgmEnabled', state.bgmEnabled);
        localStorage.setItem('sfxEnabled', state.sfxEnabled);
    }

    // Загрузка состояния игры
    function loadGameState() {
        const savedBalls = JSON.parse(localStorage.getItem('balls'));
        if (savedBalls && savedBalls.length > 0) {
            console.log('Загрузка сохранённых шаров:', savedBalls);
            savedBalls.forEach(ballData => {
                const ball = createBall(ballData.x, ballData.y, parseInt(ballData.label));
                if (ball) {
                    Matter.Body.setVelocity(ball, ballData.velocity);
                    console.log(`Создан шар: ${ball.label} на позиции (${ball.position.x}, ${ball.position.y}) с скоростью (${ball.velocity.x}, ${ball.velocity.y})`);
                }
            });
            state.score = parseInt(localStorage.getItem('score')) || 0;
            state.nextBallValue = parseInt(localStorage.getItem('nextBallValue')) || getRandomBallValue();
            state.currentBallValue = parseInt(localStorage.getItem('currentBallValue')) || 1;
            DOM.scoreElement.textContent = `Очки: ${state.score}`;
            updateNextBall();
            updateCurrentBall();

            // Восстановление статистики
            const savedStatistics = JSON.parse(localStorage.getItem('statistics'));
            if (savedStatistics) {
                state.statistics = savedStatistics;
            }

            // Восстановление фона
            applyBackground(state.selectedBackground);

            // Восстановление настроек аудио
            state.bgmEnabled = JSON.parse(localStorage.getItem('bgmEnabled'));
            state.sfxEnabled = JSON.parse(localStorage.getItem('sfxEnabled'));
            updateAudioSettings();

            // Обновление отображения статистики
            displayStatistics(state.statistics);
            
            console.log('Состояние игры успешно загружено.');
        } else {
            console.log('Сохранённые шары не найдены. Инициализация новой игры.');
        }
    }

    // Очистка сохранённого состояния игры
    function clearSavedGame() {
        localStorage.removeItem('balls');
        localStorage.removeItem('score');
        localStorage.removeItem('nextBallValue');
        localStorage.removeItem('currentBallValue');
        localStorage.removeItem('statistics');
        localStorage.removeItem('balance');
        localStorage.removeItem('bgmEnabled');
        localStorage.removeItem('sfxEnabled');
    }

    // -------------------------
    // 5. Обработчики модальных окон
    // -------------------------
    function setupModalHandlers() {
        DOM.playAgainBtn.addEventListener('click', restartGame);
        DOM.exitBtn.addEventListener('click', exitGame);
        DOM.continueGameBtn.addEventListener('click', () => {
            DOM.resumeModal.style.display = 'none';
            loadGameState();
        });
        DOM.startNewGameBtn.addEventListener('click', () => {
            DOM.resumeModal.style.display = 'none';
            clearSavedGame();
            restartGame();
        });
    }

    // -------------------------
    // 6. Обработчики магазина и меню
    // -------------------------
    function setupShopHandlers() {
        // Открытие магазина
        DOM.openShopBtn.addEventListener('click', () => {
            DOM.shopOverlay.style.display = 'flex';
            DOM.openShopBtn.classList.toggle('open');
        });

        // Закрытие магазина
        DOM.closeShopBtn.addEventListener('click', () => {
            DOM.shopOverlay.style.display = 'none';
            DOM.openShopBtn.classList.toggle('open');
        });

        // Обработка переключения вкладок
        DOM.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // Удалить активный класс у всех кнопок
                DOM.tabButtons.forEach(btn => btn.classList.remove('active'));

                // Добавить активный класс к выбранной кнопке
                button.classList.add('active');

                // Скрыть все вкладки
                DOM.tabContents.forEach(content => content.classList.remove('active'));

                // Показать выбранную вкладку
                const targetContent = document.getElementById(targetTab);
                if (targetContent) {
                    targetContent.classList.add('active');
                }

                // Если вкладка "Статистика", обновить её содержимое
                if (targetTab === 'statistics') {
                    displayStatistics(state.statistics);
                }
            });
        });

        // Обработка покупки и применения фонов
        renderBackgrounds();

        // Обработка кнопки отключения фона
        DOM.disableBackgroundBtn.addEventListener('click', () => {
            applyBackground('linear-gradient(#1a1a2e, #1a1a2e)');
            showNotification('Фон отключен и установлен на дефолтный!', 'info');
        });

        // Обработка кнопки перезапуска игры
        DOM.restartGameBtn.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите перезапустить игру?')) {
                restartGame();
                DOM.shopOverlay.style.display = 'none';
                DOM.openShopBtn.classList.remove('open');
            }
        });
    }

    function renderBackgrounds() {
        DOM.backgroundsContainer.innerHTML = ''; // Очистка контейнера

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
            itemName.classList.add('stat-label');
            itemName.textContent = bg.name;

            const itemPrice = document.createElement('div');
            itemPrice.classList.add('stat-value');
            itemPrice.textContent = `${bg.price} монет`;

            const buyBtn = document.createElement('button');
            buyBtn.classList.add('buy-btn');
            buyBtn.textContent = 'Купить';

            const applyBtn = document.createElement('button');
            applyBtn.classList.add('buy-btn');
            applyBtn.textContent = 'Применить';
            applyBtn.style.display = 'none'; // Скрыть изначально

            // Проверка, куплен ли фон
            if (state.purchasedBackgrounds.includes(bg.name)) {
                buyBtn.style.display = 'none';
                applyBtn.style.display = 'block';
            }

            // Обработчик покупки
            buyBtn.addEventListener('click', () => {
                if (state.balance >= bg.price) {
                    updateBalance(state.balance - bg.price);
                    state.purchasedBackgrounds.push(bg.name);
                    localStorage.setItem('purchasedBackgrounds', JSON.stringify(state.purchasedBackgrounds));

                    buyBtn.style.display = 'none';
                    applyBtn.style.display = 'block';

                    showNotification(`Вы купили "${bg.name}" за ${bg.price} монет!`, 'success');
                    // Автоматически применяем купленный фон
                    applyBackground(bg.background);
                    showNotification(`Фон "${bg.name}" применён!`, 'success');
                } else {
                    showNotification('Недостаточно монет для покупки этого фона!', 'error');
                }
            });

            // Обработчик применения фона
            applyBtn.addEventListener('click', () => {
                applyBackground(bg.background);
                showNotification(`Вы применили фон "${bg.name}"!`, 'info');
            });

            bgItem.appendChild(itemPreview);
            bgItem.appendChild(itemName);
            bgItem.appendChild(itemPrice);
            bgItem.appendChild(buyBtn);
            bgItem.appendChild(applyBtn);

            DOM.backgroundsContainer.appendChild(bgItem);
        });
    }

    // -------------------------
    // 7. Обработчики взаимодействия с шарами
    // -------------------------
    function setupInteractionHandlers() {
        let isDragging = false;
        let dragOffsetX = 0;
        let dragStartX = 0;
        let dragStartY = 0;

        // Перетаскивание мышью
        DOM.currentBallElement.addEventListener('mousedown', (e) => {
            if (state.isCooldown) return;

            isDragging = true;
            const rect = DOM.currentBallElement.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            DOM.neonArrow.style.opacity = '1';
            positionNeonArrow();
        });

        // Перетаскивание с помощью касаний
        DOM.currentBallElement.addEventListener('touchstart', (e) => {
            if (state.isCooldown) return;

            isDragging = true;
            const touch = e.touches[0];
            const rect = DOM.currentBallElement.getBoundingClientRect();
            dragOffsetX = touch.clientX - rect.left;
            dragStartX = touch.clientX;
            dragStartY = touch.clientY;
            DOM.neonArrow.style.opacity = '1';
            positionNeonArrow();
        });

        // Перемещение мышью или касанием
        function handleDragMove(clientX, clientY) {
            if (!isDragging) return;
            const gameRect = DOM.gameContainer.getBoundingClientRect();
            let x = clientX - gameRect.left - dragOffsetX + DOM.currentBallElement.offsetWidth / 2;
            x = clamp(x, DOM.currentBallElement.offsetWidth / 2, gameRect.width - DOM.currentBallElement.offsetWidth / 2);
            DOM.currentBallElement.style.left = `${x - DOM.currentBallElement.offsetWidth / 2}px`;
            positionNeonArrow();
        }

        document.addEventListener('mousemove', (e) => handleDragMove(e.clientX, e.clientY));
        document.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            handleDragMove(touch.clientX, touch.clientY);
        });

        // Завершение перетаскивания мышью или касанием
        function handleDragEnd(clientX, clientY) {
            if (!isDragging) return;
            isDragging = false;
            DOM.neonArrow.style.opacity = '0';

            const gameRect = DOM.gameContainer.getBoundingClientRect();
            const currentBallRect = DOM.currentBallElement.getBoundingClientRect();
            const ballX = currentBallRect.left + currentBallRect.width / 2 - gameRect.left;
            const ballY = currentBallRect.top + currentBallRect.height / 2 - gameRect.top;
            const dy = clientY - dragStartY;

            const velocityScale = 0.05;
            const velocityY = clamp(dy * velocityScale, 2, 10); // Ограничение скорости

            const newBall = createBall(ballX, ballY, state.currentBallValue);
            if (newBall) {
                Matter.Body.setVelocity(newBall, { x: 0, y: velocityY });
                startCooldown();
            }

            // Обновление текущего и следующего шара
            state.currentBallValue = state.nextBallValue;
            state.nextBallValue = getRandomBallValue();
            updateNextBall();
            updateCurrentBall();

            // Сохранение состояния
            saveGameState();
        }

        document.addEventListener('mouseup', (e) => handleDragEnd(e.clientX, e.clientY));
        document.addEventListener('touchend', (e) => {
            const touch = e.changedTouches[0];
            handleDragEnd(touch.clientX, touch.clientY);
        });

        // Клик по игровому полю для броска шара
        DOM.gameContainer.addEventListener('click', (e) => {
            if (e.target === DOM.currentBallElement) return;
            if (state.isCooldown) return;

            const gameRect = DOM.gameContainer.getBoundingClientRect();
            const x = e.clientX - gameRect.left;
            const y = e.clientY - gameRect.top;

            const currentBallRect = DOM.currentBallElement.getBoundingClientRect();
            const currentBallGameX = currentBallRect.left + currentBallRect.width / 2 - gameRect.left;
            const currentBallGameY = currentBallRect.top + currentBallRect.height / 2 - gameRect.top;

            const dx = x - currentBallGameX;
            const dy = y - currentBallGameY;

            const velocityScale = 0.05;
            const velocityX = clamp(dx * velocityScale, -10, 10);
            const velocityY = clamp(dy * velocityScale, 2, 10);

            const newBall = createBall(currentBallGameX, currentBallGameY, state.currentBallValue);
            if (newBall) {
                Matter.Body.setVelocity(newBall, { x: velocityX, y: velocityY });
                startCooldown();
            }

            // Обновление текущего и следующего шара
            state.currentBallValue = state.nextBallValue;
            state.nextBallValue = getRandomBallValue();
            updateNextBall();
            updateCurrentBall();

            // Сохранение состояния
            saveGameState();
        });
    }

    // -------------------------
    // 8. Обработчики столкновений и объединения шаров
    // -------------------------
    function setupCollisionHandlers(engine, renderEngine) {
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
                    Matter.World.remove(engine.world, [bodyA, bodyB]);

                    // Создание нового шара
                    const mergedBall = createBall(newX, newY, newValue);

                    // Обновление счета
                    state.score += newValue;
                    DOM.scoreElement.textContent = `Очки: ${state.score}`;

                    // Обновление статистики
                    state.statistics.totalScore += newValue;
                    if (newValue > state.statistics.highScore) {
                        state.statistics.highScore = newValue;
                    }

                    // Сохранение состояния
                    saveGameState();

                    // Обновление отображения статистики
                    displayStatistics(state.statistics);

                    // Проверка условия окончания игры
                    checkGameOver();
                }
            });
        });
    }

    // -------------------------
    // 9. Функция проверки окончания игры
    // -------------------------
    function checkGameOver() {
        const bodies = Matter.Composite.allBodies(engine.world).filter(body => !body.isStatic && body.label);
        for (const body of bodies) {
            if (body.position.y > DOM.gameContainer.clientHeight) { // Высота игры
                endGame();
                break;
            }
        }
    }

    // Завершение игры
    function endGame() {
        Matter.Runner.stop(runner);
        Matter.Render.stop(renderEngine);

        updateStatistics(state.score);
        displayStatistics(state.statistics);

        DOM.finalScoreElement.textContent = state.score;
        DOM.gameOverModal.style.display = 'block';

        clearSavedGame();
    }

    // Перезапуск игры
    function restartGame() {
        clearSavedGame();

        // Обновление статистики
        updateStatistics(state.score);
        displayStatistics(state.statistics);

        // Сброс текущего счета
        state.score = 0;
        DOM.scoreElement.textContent = `Очки: ${state.score}`;

        // Сброс текущего и следующего шара
        state.currentBallValue = 1;
        state.nextBallValue = getRandomBallValue();
        updateNextBall();
        updateCurrentBall();

        // Очистка мира, сохраняя статические тела
        Matter.World.clear(engine.world, false);
        Matter.Engine.clear(engine);
        Matter.Render.stop(renderEngine);
        Matter.Runner.stop(runner);

        // Воссоздание статических тел с обновлёнными размерами
        staticBodies.forEach(body => {
            Matter.World.add(engine.world, body);
        });

        // Запуск Runner и Render заново
        Matter.Runner.run(runner, engine);
        Matter.Render.run(renderEngine);

        // Создание начального шара
        createBall(DOM.gameContainer.clientWidth / 2, 100, state.currentBallValue);

        // Разрешить бросок
        state.isCooldown = false;

        // Сохранение состояния
        saveGameState();

        // Скрыть модальное окно окончания игры
        DOM.gameOverModal.style.display = 'none';
    }

    // Выход из игры
    function exitGame() {
        clearSavedGame();
        window.location.href = 'index.html'; // Перенаправление на главную страницу
    }

    // -------------------------
    // 10. Функция позиционирования неоновой стрелки
    // -------------------------
    function positionNeonArrow() {
        const rect = DOM.currentBallElement.getBoundingClientRect();
        const gameRect = DOM.gameContainer.getBoundingClientRect();

        // Расстояние от нижней части шара до пола
        const distanceToFloor = gameRect.height - (rect.top - gameRect.top + rect.height);

        // Обновление позиции стрелки
        DOM.neonArrow.style.left = `${rect.left - gameRect.left + rect.width / 2 - 1}px`; // 1px - половина ширины стрелки (2px)
        DOM.neonArrow.style.top = `${rect.bottom - gameRect.top}px`;

        // Обновление высоты стрелки
        DOM.neonArrow.style.height = `${distanceToFloor}px`;
    }

    // -------------------------
    // 11. Обработчики рендеринга и обновления
    // -------------------------
    function setupRenderHandlers(engine, renderEngine) {
        // Отрисовка текста на шарах после рендеринга
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

        // Сохранение состояния при каждом обновлении движка
        Matter.Events.on(engine, 'afterUpdate', saveGameState);
    }

    // -------------------------
    // 12. Обработчики аудио настроек
    // -------------------------
    function setupAudioHandlers() {
        // Обработка переключателя фоновой музыки
        DOM.bgmToggle.addEventListener('change', (e) => {
            state.bgmEnabled = e.target.checked;
            localStorage.setItem('bgmEnabled', state.bgmEnabled);
            // Реализуйте включение/выключение фоновой музыки здесь
            if (state.bgmEnabled) {
                // Включить музыку
                console.log('Фоновая музыка включена');
            } else {
                // Выключить музыку
                console.log('Фоновая музыка выключена');
            }
        });

        // Обработка переключателя звуковых эффектов
        DOM.sfxToggle.addEventListener('change', (e) => {
            state.sfxEnabled = e.target.checked;
            localStorage.setItem('sfxEnabled', state.sfxEnabled);
            // Реализуйте включение/выключение звуковых эффектов здесь
            if (state.sfxEnabled) {
                // Включить звуки
                console.log('Звуковые эффекты включены');
            } else {
                // Выключить звуки
                console.log('Звуковые эффекты выключены');
            }
        });
    }

    function updateAudioSettings() {
        DOM.bgmToggle.checked = state.bgmEnabled;
        DOM.sfxToggle.checked = state.sfxEnabled;
    }

    // -------------------------
    // 13. Инициализация всех обработчиков
    // -------------------------
    function initialize() {
        setupModalHandlers();
        setupShopHandlers();
        setupInteractionHandlers();
        setupCollisionHandlers(engine, renderEngine);
        setupRenderHandlers(engine, renderEngine);
        setupAudioHandlers();
        checkSavedGame();
    }

    // -------------------------
    // 14. Проверка наличия сохранённой игры
    // -------------------------
    function checkSavedGame() {
        if (localStorage.getItem('balls')) {
            const savedScore = parseInt(localStorage.getItem('score')) || 0;
            DOM.resumeScoreElement.textContent = savedScore;
            DOM.resumeModal.style.display = 'flex';
        } else {
            // Инициализация новой игры
            createBall(DOM.gameContainer.clientWidth / 2, 100, state.currentBallValue);
            positionNeonArrow();
        }
    }

    // -------------------------
    // 15. Глобальная функция для спавна шаров через консоль
    // -------------------------
    window.spawnBall = function(x, y, value) {
        if (state.isCooldown) {
            console.warn('Сейчас на кулдауне. Попробуйте позже.');
            return;
        }

        const newBall = createBall(x, y, value);
        if (newBall) {
            Matter.Body.setVelocity(newBall, { x: 0, y: 5 });
            startCooldown();

            // Обновление текущего и следующего шара
            state.currentBallValue = state.nextBallValue;
            state.nextBallValue = getRandomBallValue();
            updateNextBall();
            updateCurrentBall();

            // Сохранение состояния
            saveGameState();
        }
    };

    // -------------------------
    // 16. Инициализация
    // -------------------------
    initialize();
});
