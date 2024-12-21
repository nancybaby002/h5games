class BattlefieldBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.explosions = [];
        
        this.setupCanvas();
        this.createInitialParticles();
        this.animate();
    }

    setupCanvas() {
        this.canvas.className = 'battlefield-bg';
        document.body.insertBefore(this.canvas, document.body.firstChild);
        
        // 设置全屏
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createInitialParticles() {
        // 创建烟雾粒子
        for (let i = 0; i < 50; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            life: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.5
        };
    }

    createExplosion(x, y) {
        const particleCount = 20;
        const explosion = {
            x,
            y,
            particles: [],
            time: 0
        };

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 2 + 1;
            explosion.particles.push({
                x: 0,
                y: 0,
                speedX: Math.cos(angle) * speed,
                speedY: Math.sin(angle) * speed,
                size: Math.random() * 2 + 1,
                opacity: 1
            });
        }

        this.explosions.push(explosion);
    }

    update() {
        // 更新烟雾粒子
        this.particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            particle.opacity -= 0.001;

            if (particle.opacity <= 0) {
                particle.opacity = Math.random() * 0.5;
                particle.x = Math.random() * this.canvas.width;
                particle.y = Math.random() * this.canvas.height;
            }
        });

        // 更新爆炸效果
        this.explosions = this.explosions.filter(explosion => {
            explosion.time += 0.016;
            explosion.particles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                particle.opacity -= 0.02;
            });
            return explosion.time < 1;
        });

        // 随机创建新的爆炸
        if (Math.random() < 0.02) {
            this.createExplosion(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height
            );
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制烟雾粒子
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(169, 169, 169, ${particle.opacity})`;
            this.ctx.fill();
        });

        // 绘制爆炸效果
        this.explosions.forEach(explosion => {
            explosion.particles.forEach(particle => {
                this.ctx.beginPath();
                this.ctx.arc(
                    explosion.x + particle.x,
                    explosion.y + particle.y,
                    particle.size,
                    0,
                    Math.PI * 2
                );
                this.ctx.fillStyle = `rgba(255, 100, 0, ${particle.opacity})`;
                this.ctx.fill();
            });
        });
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// 初始化背景
window.addEventListener('load', () => {
    new BattlefieldBackground();
}); 