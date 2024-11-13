// js/shop.js

// Массив доступных фонов (должен совпадать с массивом в game.js)
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
    {
        id: 3,
        name: "Ночной город",
        price: 200,
        background: "linear-gradient(to bottom, #000428, #004e92)",
        purchased: false,
        active: false
    },
    {
        id: 4,
        name: "Рассвет",
        price: 250,
        background: "linear-gradient(to right, #ff7e5f, #feb47b)",
        purchased: false,
        active: false
    },
    // Продолжайте до id:15
];

// Получение элементов DOM
const backButton = document.getElementById('back-button');
const backgroundsContainer = document.getElementById('backgrounds-container');
const currentBalanceElement = document.getElementById('current-balance');

// Инициализация баланса из localStorage или установка по умолчанию
let balance = localStorage.getItem('balance') ? parseInt(localStorage.getItem('balance')) : 500;
currentBalanceElement.textContent = balance;

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
                } else {
                    // Деактивация фона, возвращение к дефолтному
                    bg.active = false;
                    applyBackground('linear-gradient(#222, #222)');
                    localStorage.removeItem('selectedBackgroundId');
                    createBackgroundItems();
                }
            }
        });

        bgItem.appendChild(preview);
        bgItem.appendChild(name);
        bgItem.appendChild(buyBtn);
        backgroundsContainer.appendChild(bgItem);
    });
}

// Функция для деактивации других фонов
function deactivateOthers(activeId) {
    backgrounds.forEach(bg => {
        if (bg.id !== activeId && bg.active) {
            bg.active = false;
        }
    });
}

// Функция для применения фона к игре
function applyBackground(background) {
    // Передаем выбранный фон в игру через localStorage
    localStorage.setItem('selectedBackground', background);
    alert('Фон изменен! Перезагрузите игру для применения.');
}

// Функция для рендеринга магазина
function renderShop() {
    createBackgroundItems();
}

// Обработка нажатия на кнопку "Назад"
backButton.addEventListener('click', () => {
    window.location.href = 'game.html'; // Возврат на игру
});

// Инициализация магазина при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    renderShop();
});
