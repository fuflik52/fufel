// Crash Game
let crashGame = {
    isRunning: false,
    currentMultiplier: 1,
    betAmount: 0,
    chart: null,
    gameInterval: null,
    crashPoint: 1,
    hasPlayerCashed: false,
    lastCrashPoint: null,
    history: [],
    coefficientsByUser: {}
};

function initCrashGame() {
    const canvas = document.getElementById('crash-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (crashGame.chart) {
        crashGame.chart.destroy();
    }
    
    crashGame.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['', ''],
            datasets: [{
                label: 'Multiplier',
                data: [1, 1],
                borderColor: '#00ff00',
                borderWidth: 3, 
                fill: false,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            layout: {
                padding: {
                    top: 5,
                    right: 5,
                    bottom: 5,
                    left: 35 
                }
            },
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
                    }
                },
                y: {
                    min: 1,
                    max: 3, 
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false,
                        tickLength: 5,
                        lineWidth: 1 
                    },
                    ticks: {
                        color: 'white',
                        padding: 5,
                        stepSize: 0.5, 
                        font: {
                            size: 12, 
                            weight: 'bold' 
                        },
                        callback: function(value) {
                            return value.toFixed(1) + 'x';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Обработчики для быстрых ставок
    document.querySelectorAll('.quick-bet-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const percent = parseInt(btn.dataset.percent);
            const betAmount = Math.floor(score * (percent / 100));
            document.getElementById('bet-amount').value = betAmount;
        });
    });

    // Обработчик для кнопки истории
    const historyBtn = document.getElementById('historyBtn');
    const historyModal = document.getElementById('historyModal');
    const closeHistoryBtn = document.querySelector('.close-history-btn');

    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            showHistory();
        });
    }

    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', () => {
            hideHistory();
        });
    }

    // Сброс состояния игры
    crashGame.isRunning = false;
    crashGame.currentMultiplier = 1;
    crashGame.hasPlayerCashed = false;
    
    // Обновление UI
    updateCrashUI();
    updateBalanceDisplay();

    // Добавляем обработчики событий
    document.getElementById('place-bet').addEventListener('click', startCrashGame);
    document.getElementById('cash-out').addEventListener('click', cashOut);
}

function updateBalanceDisplay() {
    const balanceElement = document.querySelector('.balance-amount');
    if (balanceElement) {
        balanceElement.textContent = formatNumber(score);
    }
}

function showHistory() {
    const modal = document.getElementById('historyModal');
    const historyContainer = document.querySelector('.history-items');
    
    if (modal && historyContainer) {
        historyContainer.innerHTML = '';
        // Показываем последние 10 игр
        crashGame.history.slice(-10).reverse().forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${item.won ? 'win' : 'lose'}`;
            historyItem.textContent = item.multiplier.toFixed(2) + 'x';
            historyContainer.appendChild(historyItem);
        });
        
        modal.style.display = 'block';
        
        // Добавляем обработчик клика вне модального окна для закрытия
        window.onclick = function(event) {
            if (event.target == modal) {
                hideHistory();
            }
        };
    }
}

function hideHistory() {
    const modal = document.getElementById('historyModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateCrashUI(crashed = false) {
    const multiplierElement = document.querySelector('.crash-multiplier');
    if (multiplierElement) {
        if (crashed && crashGame.lastCrashPoint) {
            multiplierElement.textContent = `CRASH ${crashGame.lastCrashPoint.toFixed(2)}x`;
            multiplierElement.style.color = '#ff3366';
        } else {
            multiplierElement.textContent = crashGame.currentMultiplier.toFixed(2) + 'x';
            multiplierElement.style.color = '#00ff00';
        }
    }
    
    const placeBetBtn = document.getElementById('place-bet');
    const cashOutBtn = document.getElementById('cash-out');
    const betInput = document.getElementById('bet-amount');
    
    if (placeBetBtn) placeBetBtn.disabled = crashGame.isRunning;
    if (cashOutBtn) cashOutBtn.disabled = !crashGame.isRunning || crashGame.hasPlayerCashed;
    if (betInput) betInput.disabled = crashGame.isRunning;
    
    updateBalanceDisplay();
}

function startCrashGame() {
    const betInput = document.getElementById('bet-amount');
    const betAmount = parseFloat(betInput.value);
    
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > score) {
        showCrashNotification('Введите корректную ставку!', false);
        return;
    }

    crashGame.betAmount = betAmount;
    score -= betAmount;
    
    crashGame.isRunning = true;
    crashGame.currentMultiplier = 1;
    crashGame.hasPlayerCashed = false;
    crashGame.crashPoint = generateCrashPoint();
    
    updateCrashUI();
    
    crashGame.chart.data.labels = ['', ''];
    crashGame.chart.data.datasets[0].data = [1, 1];
    
    crashGame.gameInterval = setInterval(updateCrashGame, 50);
}

function updateCrashGame() {
    if (crashGame.currentMultiplier >= crashGame.crashPoint) {
        endCrashGame();
        return;
    }

    crashGame.currentMultiplier = Math.max(1, crashGame.currentMultiplier * 1.002);
    updateCrashUI();
    
    // Очищаем предыдущие данные и всегда начинаем с 1.0
    crashGame.chart.data.labels = ['', ''];
    crashGame.chart.data.datasets[0].data = [1, crashGame.currentMultiplier];
    
    // Динамически обновляем шкалу в зависимости от текущего множителя
    const currentMultiplier = crashGame.currentMultiplier;
    let newMin, newMax, stepSize;
    
    if (currentMultiplier <= 1.5) {
        newMin = 1;
        newMax = 1.5;
        stepSize = 0.1;
    } else if (currentMultiplier <= 2) {
        newMin = 1;
        newMax = 2;
        stepSize = 0.2;
    } else if (currentMultiplier <= 3) {
        newMin = 1;
        newMax = 3;
        stepSize = 0.5;
    } else if (currentMultiplier <= 5) {
        newMin = 1;
        newMax = 5;
        stepSize = 1;
    } else {
        newMin = 1;
        newMax = Math.ceil(currentMultiplier + 1);
        stepSize = 1;
    }

    // Обновляем настройки шкалы
    crashGame.chart.options.scales.y.min = newMin;
    crashGame.chart.options.scales.y.max = newMax;
    crashGame.chart.options.scales.y.ticks.stepSize = stepSize;
    
    crashGame.chart.update('none');
}

function cashOut() {
    if (!crashGame.isRunning || crashGame.hasPlayerCashed) return;
    
    crashGame.hasPlayerCashed = true;
    const winAmount = Math.floor(crashGame.betAmount * crashGame.currentMultiplier);
    score += winAmount;
    
    addHistoryItem(crashGame.currentMultiplier, true);
    updateCrashUI();
    
    // Показываем уведомление о выигрыше
    showCrashNotification(`Выигрыш: ${formatNumber(winAmount)} (+${(crashGame.currentMultiplier - 1).toFixed(2)}x)`, true);
}

function endCrashGame() {
    clearInterval(crashGame.gameInterval);
    crashGame.isRunning = false;
    crashGame.lastCrashPoint = crashGame.currentMultiplier;
    
    // Добавляем в историю
    addHistoryItem(crashGame.currentMultiplier, crashGame.hasPlayerCashed);
    
    // Очищаем поле ставки
    document.getElementById('bet-amount').value = '';
    
    updateCrashUI(true);
}

function addHistoryItem(multiplier, won) {
    const historyItem = { multiplier, won, timestamp: Date.now() };
    crashGame.history.push(historyItem);
    
    if (crashGame.history.length > 100) {
        crashGame.history.shift();
    }
    
    const historyItems = document.querySelector('.history-items');
    if (historyItems) {
        const item = document.createElement('div');
        item.className = `history-item ${won ? 'win' : 'lose'}`;
        item.textContent = multiplier.toFixed(2) + 'x';
        
        if (historyItems.children.length >= 10) {
            historyItems.removeChild(historyItems.firstChild);
        }
        
        historyItems.appendChild(item);
    }
}

function generateCrashPoint() {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (!telegramId) return 1 + Math.random() * 4; // Default range from 1 to 5
    
    if (!crashGame.coefficientsByUser[telegramId]) {
        crashGame.coefficientsByUser[telegramId] = [];
    }
    
    const newPoint = 1 + Math.random() * 4; // Generate between 1 and 5
    crashGame.coefficientsByUser[telegramId].push(newPoint);
    
    // Keep only last 50 coefficients per user
    if (crashGame.coefficientsByUser[telegramId].length > 50) {
        crashGame.coefficientsByUser[telegramId].shift();
    }
    
    return newPoint;
}

function showCrashNotification(message, isSuccess = true) {
    const notification = document.createElement('div');
    notification.className = `crash-notification ${isSuccess ? 'success' : 'error'}`;
    notification.textContent = message;
    
    document.querySelector('.crash-game-container').appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }, 100);
}

// Initialize crash game when mini-games section is shown
document.querySelectorAll('.nav-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
        if (index === 4) { // Mini-games section
            setTimeout(initCrashGame, 100);
        }
    });
});
