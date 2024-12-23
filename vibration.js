// Проверяем поддержку вибрации на устройстве
function checkVibrationSupport() {
    return 'vibrate' in navigator;
}

// Функция для вибрации
function vibrate(duration = 50) {
    // Получаем состояние вибрации из localStorage
    const vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false';
    
    if (checkVibrationSupport() && vibrationEnabled) {
        navigator.vibrate(duration);
    }
}

// Добавляем обработчики для кнопок меню
document.addEventListener('DOMContentLoaded', () => {
    // Находим все кнопки навигации
    const navButtons = document.querySelectorAll('.nav-btn');
    
    // Добавляем обработчик для каждой кнопки
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            vibrate();
        });
    });

    // Обработчик для кнопки changelog
    const changelogBtn = document.getElementById('changelogBtn');
    if (changelogBtn) {
        changelogBtn.addEventListener('click', () => {
            vibrate();
        });
    }

    // Инициализация переключателя вибрации
    const vibrationToggle = document.getElementById('vibrationToggle');
    if (vibrationToggle) {
        // Устанавливаем начальное состояние переключателя
        vibrationToggle.checked = localStorage.getItem('vibrationEnabled') !== 'false';
        
        // Добавляем обработчик изменения состояния
        vibrationToggle.addEventListener('change', (e) => {
            localStorage.setItem('vibrationEnabled', e.target.checked);
            // Тестовая вибрация при включении
            if (e.target.checked) {
                vibrate();
            }
        });
    }
});
