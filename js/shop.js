// Получение текущего баланса из localStorage или установка по умолчанию
let balance = parseInt(localStorage.getItem('balance')) || 500;
document.getElementById('balance').textContent = balance;

const defaultBackground = "#1a1a2e";
const disableButton = document.getElementById("disable-background");

// Обработчик кнопки отключения фона
disableButton.addEventListener('click', () => {
    localStorage.removeItem('selectedBackground');
    document.body.style.background = defaultBackground;
});

// Обработка кнопок покупки и применения фона
document.querySelectorAll('.shop-item').forEach(item => {
    const buyButton = item.querySelector('.buy-button');
    const applyButton = item.querySelector('.apply-button');
    const price = parseInt(item.dataset.price);
    const background = item.dataset.background;
    const itemName = item.querySelector('.item-name').textContent;

    // Проверка, куплен ли фон
    const purchasedBackgrounds = JSON.parse(localStorage.getItem('purchasedBackgrounds')) || [];
    if (purchasedBackgrounds.includes(itemName)) {
        buyButton.style.display = 'none';
        applyButton.style.display = 'block';
    }

    buyButton.addEventListener('click', () => {
        if (balance >= price) {
            balance -= price;
            localStorage.setItem('balance', balance);
            document.getElementById('balance').textContent = balance;
            buyButton.style.display = 'none';
            applyButton.style.display = 'block';

            // Сохранение купленного фона
            purchasedBackgrounds.push(itemName);
            localStorage.setItem('purchasedBackgrounds', JSON.stringify(purchasedBackgrounds));
        } else {
            buyButton.textContent = 'НЕДОСТАТОЧНО МОНЕТ';
            setTimeout(() => {
                buyButton.textContent = 'КУПИТЬ';
            }, 1000);
        }
    });

    applyButton.addEventListener('click', () => {
        localStorage.setItem('selectedBackground', background);
        document.body.style.background = background;
    });
});

// Обработчик кнопки закрытия магазина
const closeShopBtn = document.getElementById('close-shop-btn');
closeShopBtn.addEventListener('click', () => {
    // Перенаправление на основную страницу игры
    window.location.href = 'index.html';
});

// Установка сохранённого фона при загрузке магазина
const savedBackground = localStorage.getItem('selectedBackground');
if (savedBackground) {
    document.body.style.background = savedBackground;
}
