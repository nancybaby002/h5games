class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.gridSize = 20;
        this.snake = [];
        this.food = {};
        this.direction = 'right';
        this.score = 0;
        this.gameLoop = null;
        this.gameSpeed = 150;

        this.startButton = document.getElementById('startButton');
        this.scoreElement = document.getElementById('scoreValue');

        this.level = 1;
        this.foodCount = 0;
        this.isPaused = false;
        this.baseSpeed = 150;

        this.levelElement = document.getElementById('levelValue');
        this.speedElement = document.getElementById('speedValue');
        this.pauseButton = document.getElementById('pauseButton');

        this.bindEvents();
    }

    init() {
        this.snake = [
            { x: 6, y: 10 },
            { x: 5, y: 10 },
            { x: 4, y: 10 }
        ];
        this.direction = 'right';
        this.score = 0;
        this.level = 1;
        this.foodCount = 0;
        this.gameSpeed = this.baseSpeed;
        this.isPaused = false;
        
        this.updateUI();
        this.generateFood();
    }

    bindEvents() {
        this.startButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    startGame() {
        this.init();
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        this.startButton.textContent = '重新开始';
    }

    handleKeyPress(e) {
        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };

        const newDirection = keyMap[e.key];
        if (!newDirection) return;

        const opposites = {
            'up': 'down',
            'down': 'up',
            'left': 'right',
            'right': 'left'
        };

        if (opposites[this.direction] !== newDirection) {
            this.direction = newDirection;
        }
    }

    generateFood() {
        this.food = {
            x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
            y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
        };
    }

    togglePause() {
        if (!this.gameLoop) return;
        
        this.isPaused = !this.isPaused;
        this.pauseButton.textContent = this.isPaused ? '继续' : '暂停';
        
        if (this.isPaused) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        } else {
            this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        }
    }

    updateUI() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.speedElement.textContent = this.level;
    }

    levelUp() {
        this.level++;
        this.gameSpeed = Math.max(50, this.baseSpeed - (this.level - 1) * 10);
        clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
        this.updateUI();
    }

    update() {
        const head = { ...this.snake[0] };

        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.foodCount++;
            
            if (this.foodCount >= 10) {
                this.foodCount = 0;
                this.levelUp();
            }
            
            this.updateUI();
            this.generateFood();
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    checkCollision(head) {
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return true;
        }

        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    gameOver() {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
        alert(`游戏结束！\n最终得分：${this.score}\n到达等级：${this.level}`);
        this.startButton.textContent = '开始游戏';
        this.pauseButton.textContent = '暂停';
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();
        
        this.ctx.fillStyle = '#2ecc71';
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                this.ctx.fillStyle = '#27ae60';
            } else {
                this.ctx.fillStyle = '#2ecc71';
            }
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });

        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize/2,
            this.food.y * this.gridSize + this.gridSize/2,
            this.gridSize/2 - 1,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    drawGrid() {
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 0.5;

        for (let i = 0; i <= this.canvas.width; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(i, 0);
            this.ctx.lineTo(i, this.canvas.height);
            this.ctx.stroke();
        }

        for (let i = 0; i <= this.canvas.height; i += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }
    }
}

window.onload = () => {
    new SnakeGame();
}; 