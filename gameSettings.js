// Настройки игры
const gameSettings = {
    autoIncomeInterval: 5, // интервал автодохода в секундах
    clickPower: 1, // базовая сила клика
    autoClickMultiplier: 1, // множитель автоклика
    saveInterval: 5, // интервал сохранения в секундах
};

// Функция для изменения настроек игры
function updateGameSettings(settings) {
    Object.assign(gameSettings, settings);
    // Сохраняем настройки в localStorage
    localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
    
    // Перезапускаем интервалы если они существуют
    if (typeof window.startGameInterval === 'function') {
        window.startGameInterval();
    }
}

// Загружаем сохраненные настройки
function loadGameSettings() {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
        Object.assign(gameSettings, JSON.parse(savedSettings));
    }
}

// Функция для сброса настроек к значениям по умолчанию
function resetGameSettings() {
    const defaultSettings = {
        autoIncomeInterval: 1,
        clickPower: 1,
        autoClickMultiplier: 1,
        saveInterval: 1
    };
    updateGameSettings(defaultSettings);
}

// Примеры использования:
/*
// Изменить интервал автодохода на 5 секунд
updateGameSettings({ autoIncomeInterval: 5 });

// Изменить силу клика на 2
updateGameSettings({ clickPower: 2 });

// Увеличить множитель автоклика в 1.5 раза
updateGameSettings({ autoClickMultiplier: 1.5 });

// Сбросить все настройки к значениям по умолчанию
resetGameSettings();
*/

// Экспортируем функции и объект настроек для использования в других файлах
window.gameSettings = gameSettings;
window.updateGameSettings = updateGameSettings;
window.loadGameSettings = loadGameSettings;
window.resetGameSettings = resetGameSettings;
