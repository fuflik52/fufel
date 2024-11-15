// js/index.js

// Функция для создания шариков (balloon)
function createBalloon() {
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    balloon.style.left = Math.random() * window.innerWidth + 'px';
    balloon.style.backgroundColor = `hsl(${Math.random() * 360}, 70%, 50%)`;
    document.body.appendChild(balloon);

    balloon.addEventListener('animationend', () => {
        balloon.remove();
    });
}

// Создание шариков периодически
setInterval(createBalloon, 1000);

// Инициальные шарики
for(let i = 0; i < 10; i++) {
    setTimeout(createBalloon, i * 300);
}

// Обработка нажатий на кнопки
document.getElementById('play-button').addEventListener('click', () => {
    window.location.href = 'game.html';
});

document.getElementById('settings-button').addEventListener('click', () => {
    window.location.href = 'settings.html';
});

document.getElementById('shop-button').addEventListener('click', () => {
    window.location.href = 'shop.html';
});