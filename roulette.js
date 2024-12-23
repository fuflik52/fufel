let rouletteBalance = 0;
let isSpinning = false;
let currentBet = 0;
let selectedMultiplier = null;
let rouletteHistory = JSON.parse(localStorage.getItem('rouletteHistory')) || [];

const multipliers = [2, 3, 5, 10];
const colors = ['#4CAF50', '#2196F3', '#FFC107', '#f44336'];

function initRoulette() {
    const rouletteContainer = document.getElementById('roulette-container');
    if (!rouletteContainer) return;

    // Получаем актуальный баланс
    rouletteBalance = parseInt(localStorage.getItem('balance')) || 0;

    rouletteContainer.innerHTML = `
        <div class="game-header">
            <button class="back-button" onclick="goBack()">
                <i class="fas fa-arrow-left"></i> Назад
            </button>
            <button class="history-button" onclick="showRouletteHistory()">
                <img src="https://i.postimg.cc/rpfc0Jn2/image.png" alt="History" style="transform: rotate(180deg);">
            </button>
        </div>
        <div class="roulette-balance">
            <div class="balance-amount">
                <span>Баланс:</span>
                <span id="roulette-balance">${rouletteBalance}</span>
            </div>
            <div class="bet-controls">
                <input type="number" id="bet-amount" placeholder="Сумма ставки" min="1" value="0">
                <div class="quick-bet-buttons">
                    <button onclick="quickBet(10)">+10</button>
                    <button onclick="quickBet(50)">+50</button>
                    <button onclick="quickBet(100)">+100</button>
                    <button onclick="quickBet('max')">MAX</button>
                    <button onclick="quickBet('clear')">Clear</button>
                </div>
            </div>
        </div>
        <div class="roulette-wheel" id="roulette-wheel"></div>
        <div class="multipliers-section">
            ${multipliers.map((mult, index) => `
                <div class="multiplier-box" style="background-color: ${colors[index]}" onclick="selectMultiplier(${mult})">
                    ${mult}x
                </div>
            `).join('')}
        </div>
        <div class="spin-button-container">
            <button class="spin-button" id="spin-button" onclick="startSpin()">КРУТИТЬ</button>
        </div>
    `;

    // Скрываем меню выбора игр
    const gamesMenu = document.querySelector('.games-menu');
    if (gamesMenu) {
        gamesMenu.style.display = 'none';
    }

    // Обновляем баланс
    updateBalance(0);
}

function goBack() {
    const gamesSection = document.getElementById('games-section');
    if (gamesSection) {
        gamesSection.innerHTML = `
            <div class="games-menu">
                <button class="game-select-btn" onclick="selectGame('crash')">
                    <i class="fas fa-chart-line"></i>
                    Crash
                </button>
                <button class="game-select-btn" onclick="selectGame('roulette')">
                    <i class="fas fa-circle-notch"></i>
                    Рулетка
                </button>
            </div>
        `;
    }
}

function showRouletteHistory() {
    const modal = document.createElement('div');
    modal.className = 'history-modal';
    modal.innerHTML = `
        <div class="history-modal-content">
            <div class="history-modal-header">
                <h2>История игр</h2>
                <button class="close-history-btn" onclick="closeRouletteHistory()">&times;</button>
            </div>
            <div class="history-modal-body">
                <div class="roulette-history-items">
                    ${rouletteHistory.map(item => `
                        <div class="history-item" style="background: ${colors[multipliers.indexOf(item.multiplier)]}">
                            ${item.multiplier}x
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeRouletteHistory() {
    const modal = document.querySelector('.history-modal');
    if (modal) modal.remove();
}

function quickBet(amount) {
    const betInput = document.getElementById('bet-amount');
    if (amount === 'clear') {
        betInput.value = '';
        currentBet = 0;
        return;
    }
    if (amount === 'max') {
        betInput.value = rouletteBalance;
        currentBet = rouletteBalance;
        return;
    }
    currentBet = parseInt(betInput.value) || 0;
    currentBet += amount;
    if (currentBet > rouletteBalance) currentBet = rouletteBalance;
    betInput.value = currentBet;
}

function selectMultiplier(mult) {
    if (isSpinning) return;
    
    const boxes = document.querySelectorAll('.multiplier-box');
    boxes.forEach(box => box.classList.remove('selected'));
    
    selectedMultiplier = mult;
    boxes[multipliers.indexOf(mult)].classList.add('selected');
}

function startSpin() {
    if (isSpinning) return;

    const betInput = document.getElementById('bet-amount');
    const betAmount = parseInt(betInput.value) || 0;

    if (!selectedMultiplier) return;
    if (betAmount <= 0) return;
    if (betAmount > rouletteBalance) return;

    isSpinning = true;
    updateBalance(-betAmount);
    
    const wheel = document.getElementById('roulette-wheel');
    const spinButton = document.getElementById('spin-button');
    spinButton.disabled = true;

    // Генерируем случайный результат
    const result = Math.random() * 100;
    let winMultiplier = 0;
    
    // Вероятности выигрыша для каждого множителя
    if (result < 45) winMultiplier = 2;
    else if (result < 70) winMultiplier = 3;
    else if (result < 85) winMultiplier = 5;
    else if (result < 92) winMultiplier = 10;

    // Добавляем в историю
    rouletteHistory.unshift({ multiplier: winMultiplier });
    if (rouletteHistory.length > 50) rouletteHistory.pop();
    localStorage.setItem('rouletteHistory', JSON.stringify(rouletteHistory));

    // Анимация вращения
    const spinDuration = 5000;
    const spins = 5;
    const finalRotation = spins * 360 + (360 / multipliers.length) * multipliers.indexOf(winMultiplier);
    
    wheel.style.transition = `transform ${spinDuration}ms cubic-bezier(0.2, 0.8, 0.3, 0.9)`;
    wheel.style.transform = `rotate(${finalRotation}deg)`;

    setTimeout(() => {
        isSpinning = false;
        spinButton.disabled = false;

        if (winMultiplier === selectedMultiplier) {
            const winAmount = betAmount * winMultiplier;
            updateBalance(winAmount);
            showWinAnimation(winAmount);
        }
    }, spinDuration);
}

function updateBalance(amount) {
    rouletteBalance += amount;
    localStorage.setItem('balance', rouletteBalance);
    
    // Обновляем баланс в рулетке
    const rouletteBalanceElement = document.getElementById('roulette-balance');
    if (rouletteBalanceElement) {
        rouletteBalanceElement.textContent = rouletteBalance;
    }

    // Обновляем общий баланс
    const mainBalanceElement = document.querySelector('.balance');
    if (mainBalanceElement) {
        mainBalanceElement.textContent = rouletteBalance;
    }
}

function showWinAnimation(amount) {
    const animation = document.createElement('div');
    animation.className = 'win-animation';
    animation.innerHTML = `+${amount}`;
    document.body.appendChild(animation);
    
    setTimeout(() => {
        animation.remove();
    }, 2000);
}
