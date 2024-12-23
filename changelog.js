// Данные для changelog
const changelogData = {
    versions: [
        {
            version: "1.0.4",
            date: "20.12.2024",
            isNew: true,
            changes: [
                "Полностью обновлен дизайн игры",
                "Добавлена нижняя навигация для удобства",
                "Центрирование кнопки клика",
                "Улучшен внешний вид магазина",
                "Добавлена кнопка сброса прогресса в настройках",
                "Оптимизирована производительность",
                "Исправлены баги с сохранением прогресса",
                "Улучшен баланс цен в магазине",
                "Добавлены новые анимации",
                "Реализована система чтоб можно было кликать сразу с 2 пальцев и более",
                "Улучшена система достижений"
            ]
        },
        {
            version: "1.0.3",
            date: "19.12.2024",
            isNew: true ,
            changes: [
"Теперь игра стала еще удобнее и быстрее! 🚀",
"Оптимизирована скорость начисления монет - теперь каждые 5 секунд! 💰",
"Улучшена система сохранения прогресса - ваши достижения в безопасности ✨",
"Добавлены красивые эмодзи во все разделы игры 🎨",
"Исправлено отображение на всех устройствах - играйте с комфортом! 📱",
"Улучшена навигация между разделами - теперь еще удобнее! 🎯",
"Система настроек полностью переработана - больше возможностей! ⚙️",
"Добавлены новые анимации и эффекты для приятной игры ✨",
"Оптимизирована работа автокликера - больше монет! 🖱️",
"Исправлены мелкие баги и улучшена производительность 🛠️",
            ]
        }, 
        {
            version: "1.0.2",
            date: "19.12.2024",
            isNew: true ,
            changes: [
                "Встречайте новую мини-игру CRASH!",
                "Делайте ставки и следите за растущим множителем!",
                "Моментальный вывод средств на ваш баланс",
                "Быстрые ставки одним кликом (10%, 25%, 50%, MAX)",
                "История ваших игр с детальной статистикой",
                "Красивый анимированный график в реальном времени",
                "Защита от случайных ставок во время игры",
                "Компактный и удобный интерфейс для комфортной игры"
            ]
        }, 
        {
            version: "1.0.1",
            date: "19.12.2024",
            isNew: false ,
            changes: [
                "🎮 Обновление игры! 🎮",
                "",
                "✨ Что нового:",
                "1. Добавлена система улучшений предметов!",
                "   - После улучшения появляется красивая иконка",
                "   - Каждое улучшение делает предмет эффективнее",
                "",
                "2. Добавлена система перезарядки улучшений:",
                "   - Первое улучшение: подождите 15 секунд",
                "   - Второе улучшение: подождите 30 секунд",
                "   - Третье улучшение: подождите 1 минуту",
                "   - Четвертое улучшение: подождите 5 минут",
                "   - Пятое улучшение: подождите 10 минут",
                "   - Шестое улучшение: подождите 30 минут",
                "   - Седьмое и следующие: подождите 60 минут",
                "",
                "3. Удобные улучшения:",
                "   - Можно улучшать несколько предметов одновременно",
                "   - Таймер показывает, сколько осталось ждать",
                "   - Прогресс улучшения сохраняется даже после перезагрузки страницы"
            ]
        }, 
        {
            version: "1.0.0",
            date: "19.12.2024",
            isNew: true ,
            changes: [
"Встречайте новую мини-игру CRASH! 🎲",
"Делайте ставки и следите за растущим множителем! 📈",
"Моментальный вывод средств на ваш баланс 💸",
"Быстрые ставки одним кликом (10%, 25%, 50%, MAX) 🎯",
"История ваших игр с детальной статистикой 📊",
"Красивый анимированный график в реальном времени 📱",
"Защита от случайных ставок во время игры 🛡️",
"Компактный и удобный интерфейс для комфортной игры ✨",
"Улучшенная статистика ваших достижений 📈",
"Новые секретные достижения - попробуйте найти все! 🎁",
            ]
        }
    ],
    plannedFeatures: [
        "Новые товары в магазине",
        "Система престижа",
        "Ежедневные задания",
        "Система достижений",
        "Таблица лидеров",
        "Система бонусов"
    ]
};

// Функция для отображения changelog
function showChangelog() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    let content = '<div class="changelog-container">';
    
    // Версии
    changelogData.versions.forEach(version => {
        const isNew = version.isNew;
        content += `
            <div class="changelog-entry ${isNew ? 'new' : 'old'}">
                <div class="changelog-date">
                    Версия ${version.version} (${version.date})
                    ${isNew ? '<span class="new-badge">Новое</span>' : '<span class="old-label">Старое</span>'}
                </div>
                <ul class="changelog-changes">
                    ${version.changes.map(change => `<li>${change}</li>`).join('')}
                </ul>
            </div>
        `;
    });

    // Запланированные функции
    content += `
        <div class="changelog-entry planned">
            <div class="changelog-date">
                <span>ЗАПЛАНИРОВАНО</span>
                <span class="planned-label">Запланировано</span>
            </div>
            <ul class="changelog-changes">
                ${changelogData.plannedFeatures.map((feature, index) => `<li>${index + 1}. ${feature}</li>`).join('')}
            </ul>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #0088ff;">
            Спасибо что играете в нашу игру! ❤️
        </div>
    `;

    content += '</div>';
    modalContent.innerHTML = content;

    // Добавляем кнопку закрытия
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.className = 'close-btn';
    closeButton.onclick = () => {
        modal.style.display = 'none';
        modal.remove(); // Удаляем модальное окно из DOM
    };
    modalContent.insertBefore(closeButton, modalContent.firstChild);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Закрытие по клику вне модального окна
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            modal.remove(); // Удаляем модальное окно из DOM
        }
    };
}

// Добавляем обработчик для кнопки changelog
document.addEventListener('DOMContentLoaded', () => {
    const changelogBtn = document.getElementById('changelogBtn');
    if (changelogBtn) {
        changelogBtn.addEventListener('click', showChangelog);
    }
});
