// js/settings.js

// Получение элементов DOM
const backButton = document.getElementById('back-button');
const bgmToggle = document.getElementById('bgm-toggle');
const sfxToggle = document.getElementById('sfx-toggle');

// Обработка нажатия на кнопку "Назад"
backButton.addEventListener('click', () => {
    window.location.href = 'game.html'; // Возврат на игру
});

// Загрузка настроек из localStorage или установка по умолчанию
document.addEventListener('DOMContentLoaded', () => {
    const bgmEnabled = localStorage.getItem('bgmEnabled') === 'false' ? false : true;
    const sfxEnabled = localStorage.getItem('sfxEnabled') === 'false' ? false : true;

    bgmToggle.checked = bgmEnabled;
    sfxToggle.checked = sfxEnabled;

    // Отправка событий для обновления настроек в игре
    window.parent.postMessage({ type: 'bgmToggle', value: bgmEnabled }, '*');
    window.parent.postMessage({ type: 'sfxToggle', value: sfxEnabled }, '*');
});

// Обработка изменения переключателей
bgmToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    localStorage.setItem('bgmEnabled', isChecked);
    window.parent.postMessage({ type: 'bgmToggle', value: isChecked }, '*');
});

sfxToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    localStorage.setItem('sfxEnabled', isChecked);
    window.parent.postMessage({ type: 'sfxToggle', value: isChecked }, '*');
});
