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
    history: []
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
            labels: [],
            datasets: [{
                label: 'Multiplier',
                data: [],
                borderColor: '#00ff00',
                borderWidth: 2,
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: false
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'white'
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
    const historyContainer = document.querySelector('.full-history-items');
    
    if (modal && historyContainer) {
        historyContainer.innerHTML = '';
        crashGame.history.slice().reverse().forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${item.won ? 'win' : 'lose'}`;
            historyItem.textContent = item.multiplier.toFixed(2) + 'x';
            historyContainer.appendChild(historyItem);
        });
        
        modal.style.display = 'block';
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
    updateScoreDisplay(); // Обновляем общий баланс
}

function startCrashGame() {
    const betInput = document.getElementById('bet-amount');
    const betAmount = parseFloat(betInput.value);
    
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > score) {
        alert('Введите корректную ставку!');
        return;
    }

    crashGame.betAmount = betAmount;
    score -= betAmount;
    
    crashGame.isRunning = true;
    crashGame.currentMultiplier = 1;
    crashGame.hasPlayerCashed = false;
    crashGame.crashPoint = generateCrashPoint();
    
    updateCrashUI();
    
    crashGame.chart.data.labels = [];
    crashGame.chart.data.datasets[0].data = [];
    
    crashGame.gameInterval = setInterval(updateCrashGame, 50);
}

function updateCrashGame() {
    if (crashGame.currentMultiplier >= crashGame.crashPoint) {
        endCrashGame();
        return;
    }

    crashGame.currentMultiplier *= 1.002;
    updateCrashUI();
    
    crashGame.chart.data.labels.push('');
    crashGame.chart.data.datasets[0].data.push(crashGame.currentMultiplier);
    crashGame.chart.update('none');
}

function cashOut() {
    if (!crashGame.isRunning || crashGame.hasPlayerCashed) return;
    
    crashGame.hasPlayerCashed = true;
    const winAmount = Math.floor(crashGame.betAmount * crashGame.currentMultiplier);
    score += winAmount;
    
    addHistoryItem(crashGame.currentMultiplier, true);
    updateCrashUI();
}

function endCrashGame() {
    clearInterval(crashGame.gameInterval);
    crashGame.isRunning = false;
    crashGame.lastCrashPoint = crashGame.crashPoint;
    
    if (!crashGame.hasPlayerCashed) {
        addHistoryItem(crashGame.crashPoint, false);
    }
    
    updateCrashUI(true);
    
    setTimeout(() => {
        if (!crashGame.isRunning) {
            crashGame.currentMultiplier = 1;
            updateCrashUI();
        }
    }, 2000);
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
    const random = Math.random();
    return Math.max(1, Math.pow(2, random * 4));
}

// Initialize crash game when mini-games section is shown
document.querySelectorAll('.nav-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
        if (index === 4) { // Mini-games section
            setTimeout(initCrashGame, 100);
        }
    });
});
