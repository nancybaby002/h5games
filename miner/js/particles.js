class ExplosionEffect {
    constructor() {
        this.container = document.getElementById('particles-container');
    }

    createParticle(x, y) {
        const particle = document.createElement('div');
        particle.className = 'particle ' + this.getRandomColor();
        
        // 随机大小 (3-8px)
        const size = Math.random() * 5 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // 设置初始位置
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        
        // 随机运动方向和距离
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 100 + 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        particle.style.transform = `translate(${vx}px, ${vy}px)`;
        
        this.container.appendChild(particle);
        
        // 动画结束后移除粒子
        setTimeout(() => {
            particle.remove();
        }, 1000);
    }

    getRandomColor() {
        const colors = ['red', 'orange', 'yellow'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createExplosion(x, y) {
        // 创建多个粒子
        for (let i = 0; i < 30; i++) {
            this.createParticle(x, y);
        }
    }
}

// 导出供其他模块使用
window.ExplosionEffect = ExplosionEffect; 