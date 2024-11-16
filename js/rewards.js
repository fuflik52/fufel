// js/rewards.js

function updateTaskProgress(type, amount) {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let tasksUpdated = false;

    savedTasks.forEach(task => {
        if (task.type === type && !task.completed) {
            task.progress += amount;
            if (task.progress >= task.target) {
                task.progress = task.target;
                task.completed = true;
                awardReward(task);
                showNotification(`Задание "${task.title}" выполнено! Вы получили ${task.reward} монет.`, 'success');
            }
            tasksUpdated = true;
        }
    });

    if (tasksUpdated) {
        localStorage.setItem('tasks', JSON.stringify(savedTasks));
        renderTasks(); // Функция для обновления UI заданий
    }
}

function awardReward(task) {
    if (typeof updateBalance === 'function') {
        updateBalance(gameState.balance + task.reward);
    } else {
        console.warn('Функция updateBalance не определена.');
    }
}

// Функция для рендеринга заданий в UI
function renderTasks() {
    const tasksContainer = document.querySelector('#tasks .stats-container');
    if (!tasksContainer) {
        console.error('Не удалось найти контейнер для заданий.');
        return;
    }

    tasksContainer.innerHTML = '';

    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];

    savedTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.classList.add('reward-item');
        if (task.completed) {
            taskItem.classList.add('completed');
        }

        taskItem.innerHTML = `
            <div>
                <span class="reward-title">${task.title}</span>
                <div class="reward-progress">
                    <div class="reward-progress-bar" style="width: ${Math.min((task.progress / task.target) * 100, 100)}%"></div>
                </div>
                <div class="progress-text">${Math.min(Math.floor((task.progress / task.target) * 100), 100)}%</div>
            </div>
            <span class="reward-value">+${task.reward} ${task.completed ? '🎉' : ''}</span>
        `;

        tasksContainer.appendChild(taskItem);
    });
}

// Инициализация заданий при загрузке страницы
function initializeTasks() {
    if (!localStorage.getItem('tasks')) {
        const initialTasks = [
            {
                id: 'open-6-balls',
                title: 'Открыть 6 шаров',
                type: 'ballsOpened',
                target: 6,
                reward: 100,
                progress: 0,
                completed: false
            },
            {
                id: 'score-1500',
                title: 'Набрать 1500 очков',
                type: 'score',
                target: 1500,
                reward: 200,
                progress: 0,
                completed: false
            },
            // Добавьте дополнительные задания здесь
        ];
        localStorage.setItem('tasks', JSON.stringify(initialTasks));
    }
    renderTasks();
}

initializeTasks();
