// Структура данных для changelog
const changelogData = {
    versions: [
        {
            version: "1.0.0",
            date: "2024-12-23",
            isNew: true,
            changes: [
                "Добавлена игра Crash",
                "Автоматический запуск каждые 10 секунд",
                "График с отображением коэффициента",
                "Система ставок с быстрыми ставками",
                "История игр с отображением результатов",
                "Анимированный график с изменением цвета",
                "Система вывода средств"
            ]
        },
        {
            version: "1.2.2",
            date: "2024-12-22",
            isNew: false,
            changes: [
                "Добавлена система улучшений",
                "Добавлено 5 видов улучшений",
                "Добавлена анимация прогресса",
                "Исправлены баги с отображением"
            ]
        },
        {
            version: "1.2.1",
            date: "2024-12-21",
            isNew: false,
            changes: [
                "Добавлена система достижений",
                "Добавлено 10 достижений",
                "Исправлены баги"
            ]
        },
        {
            version: "1.2.0",
            date: "2024-12-20",
            isNew: false,
            changes: [
                "Система магазина",
                "Система достижений"
            ]
        }
    ]
};

// Функция для рендеринга changelog
function renderChangelog() {
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent) return;

    let changelogHTML = '<div class="modal-header"><h2>ПОСЛЕДНИЕ ОБНОВЛЕНИЯ</h2><button class="close-btn">&times;</button></div>';
    changelogHTML += '<div class="changelog-container">';

    changelogData.versions.forEach(version => {
        const versionClass = version.isNew ? 'changelog-version new' : 'changelog-version';
        changelogHTML += `
            <div class="${versionClass}">
                <div class="version-header">
                    <h3>Версия ${version.version}</h3>
                    <span class="version-date">${version.date}</span>
                    ${version.isNew ? '<span class="new-badge">New</span>' : ''}
                </div>
                <ul class="changes-list">
                    ${version.changes.map(change => `<li>${change}</li>`).join('')}
                </ul>
            </div>
        `;
    });

    changelogHTML += '</div>';
    modalContent.innerHTML = changelogHTML;
}

// Экспортируем функцию для использования в основном скрипте
window.renderChangelog = renderChangelog;
