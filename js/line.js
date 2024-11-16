// js/line.js

document.addEventListener('DOMContentLoaded', () => {
    // Убедимся, что engine и world доступны
    if (typeof engine === 'undefined' || typeof world === 'undefined') {
        console.error('Matter.js engine или world не определены. Убедитесь, что game.js подключается перед line.js.');
        return;
    }

    // Получаем элемент game-container
    const gameContainer = document.getElementById('game-container');
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;

    // Параметры линии
    const lineWidth = containerWidth * 0.8; // Ширина линии (80% от ширины контейнера)
    const lineHeight = 4; // Толщина линии (должна совпадать с CSS)
    const lineX = containerWidth / 2;
    const lineY = containerHeight - 50; // Расположение линии от нижней границы

    // Создаём линию как статическое тело
    const neonLine = Matter.Bodies.rectangle(lineX, lineY, lineWidth, lineHeight, {
        isStatic: true,
        label: 'neon-line',
        render: {
            visible: false // Визуализация линии осуществляется через CSS
        }
    });

    // Добавляем линию в мир
    Matter.World.add(world, neonLine);

    // Функция для обновления позиции линии при изменении размера окна
    function updateLinePosition() {
        const newWidth = gameContainer.clientWidth;
        const newHeight = gameContainer.clientHeight;
        const newLineWidth = newWidth * 0.8;
        const newLineX = newWidth / 2;
        const newLineY = newHeight - 50;

        Matter.Body.setPosition(neonLine, { x: newLineX, y: newLineY });
        Matter.Body.setVertices(neonLine, [
            { x: newLineX - newLineWidth / 2, y: newLineY - lineHeight / 2 },
            { x: newLineX + newLineWidth / 2, y: newLineY - lineHeight / 2 },
            { x: newLineX + newLineWidth / 2, y: newLineY + lineHeight / 2 },
            { x: newLineX - newLineWidth / 2, y: newLineY + lineHeight / 2 }
        ]);
    }

    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        updateLinePosition();
    });

    // Обработчик столкновений
    Matter.Events.on(engine, 'collisionStart', (event) => {
        const pairs = event.pairs;

        pairs.forEach(pair => {
            const { bodyA, bodyB } = pair;

            // Проверяем, столкнулись ли с линией
            if (bodyA.label === 'neon-line' && bodyB.label && bodyB.label.startsWith('ball')) {
                handleLineCollision(bodyB);
            } else if (bodyB.label === 'neon-line' && bodyA.label && bodyA.label.startsWith('ball')) {
                handleLineCollision(bodyA);
            }
        });
    });

    /**
     * Обрабатывает столкновение шара с линией
     * @param {Matter.Body} ball - Шар, столкнувшийся с линией
     */
    function handleLineCollision(ball) {
        // Проверяем, является ли пересекающийся шар текущим бросаемым шаром
        if (typeof currentBall === 'undefined') {
            console.error('currentBall не определён в game.js');
            return;
        }

        if (ball.id === currentBall.id) {
            // Не завершаем игру, так как это текущий бросаемый шар
            return;
        }

        // Завершаем игру
        endGame();
    }

    /**
     * Функция для завершения игры
     */
    function endGame() {
        // Проверяем, доступна ли функция endGame
        if (typeof window.endGame === 'function') {
            window.endGame();
        } else {
            console.error('Функция endGame() не определена в game.js');
        }
    }
});
