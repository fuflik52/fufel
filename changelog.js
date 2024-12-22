// Структура данных для changelog
const changelogData = {
    versions: [
        {
            version: "1.2.324234",
            date: "2024-12-22",
            isNew: true,
            changes: [
                "Добавлена система changelog",
                "Улучшен интерфейс магазина",
                "Исправлены мелкие ошибки"
            ]
        },
        {
            version: "1.1.0",
            date: "2024-12-15",
            isNew: false,
            changes: [
                "Добавлены новые предметы в магазин",
                "Улучшена система достижений",
                "Оптимизирована производительность"
            ]
        },
        {
            version: "1.0.0",
            date: "2024-12-01",
            isNew: false,
            changes: [
                "Первый релиз игры",
                "Базовая механика кликера",
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
