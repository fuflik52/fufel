// shop.js

// Получение элементов
const buyButtons = document.querySelectorAll('.buy-button');
const applyButtons = document.querySelectorAll('.apply-button');
const backToGameButton = document.getElementById('back-to-game');
const scoreDisplay = document.getElementById('score-display') || document.createElement('div');

// Если элемент 'score-display' не существует, создаём его
if (!document.getElementById('score-display')) {
    scoreDisplay.id = 'score-display';
    document.getElementById('shop-container').insertBefore(scoreDisplay, document.getElementById('shop-items'));
}

// Загрузка текущего счета из localStorage
let score = parseInt(localStorage.getItem('score')) || 0;
scoreDisplay.textContent = `Очки: ${score}`;

// Загрузка купленных предметов из localStorage
let purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || [];

// Функция для обновления кнопок после покупки и применения
function updateButtons() {
    buyButtons.forEach(button => {
        const item = button.getAttribute('data-item');
        if (purchasedItems.includes(item)) {
            button.textContent = 'Куплено';
            button.disabled = true;
            button.style.backgroundColor = '#2ecc71'; // Зеленый цвет
            button.style.cursor = 'default';
        }
    });

    applyButtons.forEach(button => {
        const item = button.getAttribute('data-item');
        const appliedBackground = localStorage.getItem('appliedBackground');
        if (appliedBackground === item) {
            button.textContent = 'Применено';
            button.disabled = true;
            button.style.backgroundColor = '#2ecc71'; // Зеленый цвет
            button.style.cursor = 'default';
        }
    });
}

// Вызов функции при загрузке страницы
updateButtons();

// Обработчик покупки
buyButtons.forEach(button => {
    button.addEventListener('click', () => {
        const price = parseInt(button.getAttribute('data-price'));
        const item = button.getAttribute('data-item');

        if (score >= price) {
            if (purchasedItems.includes(item)) {
                alert(`Вы уже купили: ${item}`);
                return;
            }

            score -= price;
            localStorage.setItem('score', score);
            purchasedItems.push(item);
            localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
            alert(`Вы купили: ${item}`);

            // Обновление кнопок после покупки
            updateButtons();

            // Обновление отображаемого счета
            scoreDisplay.textContent = `Очки: ${score}`;
        } else {
            alert('Недостаточно очков для покупки этого предмета.');
        }
    });
});

// Обработчик применения фона
applyButtons.forEach(button => {
    button.addEventListener('click', () => {
        const item = button.getAttribute('data-item');

        if (purchasedItems.includes(item)) {
            // Сохранение выбранного фона в localStorage
            localStorage.setItem('appliedBackground', item);
            alert(`Фон "${item}" применен!`);

            // Обновление кнопок после применения
            updateButtons();
        } else {
            alert('Сначала купите этот предмет.');
        }
    });
});

// Обработчик возврата в игру
backToGameButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});
