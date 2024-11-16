// effects.js

document.addEventListener('DOMContentLoaded', () => {
    // Получаем элемент game-container
    const gameContainer = document.getElementById('game-container');

    // Проверяем, существует ли контейнер для эффектов, если нет — создаём его внутри game-container
    let effectsContainer = document.getElementById('effects-container');
    if (!effectsContainer) {
        effectsContainer = document.createElement('div');
        effectsContainer.id = 'effects-container';
        gameContainer.appendChild(effectsContainer);
    }

    /**
     * Создаёт эффект вспышки пыли в заданных координатах.
     * @param {number} x - Координата X относительно game-container.
     * @param {number} y - Координата Y относительно game-container.
     */
    window.createDustFlash = function(x, y) {
        console.log(`Создаётся эффект пыли в координатах: (${x}, ${y})`); // Для отладки
        const dust = document.createElement('div');
        dust.classList.add('dust-flash');

        // Центрируем эффект
        dust.style.left = `${x - 15}px`; // 15px = половина нового размера (30px / 2)
        dust.style.top = `${y - 15}px`;  // Центрируем эффект

        effectsContainer.appendChild(dust);

        // Удаляем элемент после завершения анимации
        dust.addEventListener('animationend', () => {
            if (dust.parentElement === effectsContainer) {
                effectsContainer.removeChild(dust);
            }
        });
    };
});
