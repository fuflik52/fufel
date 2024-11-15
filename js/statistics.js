// statistics.js

/**
 * Функция для отображения статистики.
 * @param {Object} statistics - Объект с данными статистики.
 */
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
