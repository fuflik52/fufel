let balance = parseInt(localStorage.getItem('balance')) || 500;
document.getElementById('balance').textContent = balance;

const defaultBackground = "#1a1a2e";
const disableButton = document.getElementById("disable-background");

document.querySelectorAll('.shop-item').forEach(item => {
    const buyButton = item.querySelector('.buy-button');
    const applyButton = item.querySelector('.apply-button');
    const price = parseInt(item.dataset.price);
    const background = item.dataset.background;
    
    buyButton.addEventListener('click', () => {
        if (balance >= price) {
            balance -= price;
            localStorage.setItem('balance', balance);
            document.getElementById('balance').textContent = balance;
            buyButton.style.display = 'none';
            applyButton.style.display = 'block';
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

disableButton.addEventListener('click', () => {
    localStorage.removeItem('selectedBackground');
    document.body.style.background = defaultBackground;
});

// Установка сохраненного фона
const savedBackground = localStorage.getItem('selectedBackground');
if (savedBackground) {
    document.body.style.background = savedBackground;
}
