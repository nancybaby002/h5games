class ToastManager {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // 添加图标
        const icon = type === 'success' ? '🎖️' : '💥';
        toast.innerHTML = `${icon} ${message}`;
        
        this.container.appendChild(toast);

        // 添加入场动画
        requestAnimationFrame(() => {
            toast.style.animation = 'toastIn 0.5s ease, flicker 0.15s infinite';
        });

        // 设置退场动画和移除
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.5s ease, flicker 0.15s infinite';
            toast.addEventListener('animationend', (e) => {
                if (e.animationName === 'toastOut') {
                    toast.remove();
                }
            });
        }, duration);
    }
}

window.toastManager = new ToastManager(); 