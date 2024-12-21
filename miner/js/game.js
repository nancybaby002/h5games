class Minesweeper {
    // 定义难度配置
    static DIFFICULTY_SETTINGS = {
        beginner: {
            rows: 9,
            cols: 9,
            mines: 10
        },
        intermediate: {
            rows: 16,
            cols: 16,
            mines: 40
        },
        expert: {
            rows: 16,
            cols: 30,
            mines: 99
        }
    };

    constructor(difficulty = 'beginner') {
        this.setDifficulty(difficulty);
        this.init();
        this.setupEventListeners();
        this.explosionEffect = new ExplosionEffect();
        this.startTime = null;  // 添加开始时间属性
        this.timerAnimationFrame = null;  // 添加动画帧ID属性
    }

    setDifficulty(difficulty) {
        const settings = Minesweeper.DIFFICULTY_SETTINGS[difficulty];
        this.rows = settings.rows;
        this.cols = settings.cols;
        this.mines = settings.mines;
        this.minesLeft = settings.mines;
        this.difficulty = difficulty;
        this.board = [];
        this.gameOver = false;
        this.timer = 0;
        this.timerInterval = null;
        this.isLeftButtonDown = false;
        this.isRightButtonDown = false;
    }

    init() {
        // 初始化空板
        this.board = Array(this.rows).fill().map(() => 
            Array(this.cols).fill().map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            }))
        );
        
        // 随机放置地雷
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            if (!this.board[row][col].isMine) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
        
        // 计算每个格子周围的地雷数
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].neighborMines = this.countNeighborMines(row, col);
                }
            }
        }

        this.renderBoard();
        this.updateMineCount();
        this.startTimer();

        // 更新游戏板的布局类
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.className = `game-board ${this.difficulty}`;
    }

    countNeighborMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols &&
                    this.board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    renderBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (this.board[row][col].isRevealed) {
                    cell.classList.add('revealed');
                    if (this.board[row][col].isMine) {
                        cell.textContent = '💣';
                        cell.classList.add('mine');
                    } else {
                        const count = this.board[row][col].neighborMines;
                        if (count > 0) {
                            cell.textContent = count;
                            cell.dataset.number = count;
                        }
                    }
                } else if (this.board[row][col].isFlagged) {
                    cell.textContent = '🚩';
                }
                
                gameBoard.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        const gameBoard = document.getElementById('gameBoard');
        
        // 修改现有的点击事件
        gameBoard.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        gameBoard.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        gameBoard.addEventListener('mouseleave', () => this.resetMouseButtons());
        gameBoard.addEventListener('contextmenu', (e) => e.preventDefault());
        
        document.getElementById('newGame').addEventListener('click', () => {
            this.resetGame();
        });

        // 添加难度选择的事件监听
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.setDifficulty(e.target.value);
            this.resetGame();
        });

        // 添加帮助按钮事件监听
        const modal = document.getElementById('helpModal');
        const helpBtn = document.getElementById('helpBtn');
        const closeBtn = document.querySelector('.close');

        helpBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    handleMouseDown(e) {
        if (this.gameOver) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        switch (e.button) {
            case 0: // 左键
                this.isLeftButtonDown = true;
                if (this.board[row][col].isRevealed && this.board[row][col].neighborMines > 0) {
                    this.highlightNeighbors(row, col);
                }
                break;
            case 2: // 右键
                this.isRightButtonDown = true;
                if (this.board[row][col].isRevealed && this.board[row][col].neighborMines > 0) {
                    this.highlightNeighbors(row, col);
                }
                e.preventDefault();
                break;
        }

        // 检查是否同时按下左右键
        if (this.isLeftButtonDown && this.isRightButtonDown) {
            this.quickReveal(row, col);
        }
    }

    handleMouseUp(e) {
        if (this.gameOver) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        // 移除所有高亮效果
        document.querySelectorAll('.cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });

        switch (e.button) {
            case 0: // 左键
                this.isLeftButtonDown = false;
                if (!this.isRightButtonDown) {
                    this.handleClick(e);
                }
                break;
            case 2: // 右键
                this.isRightButtonDown = false;
                if (!this.isLeftButtonDown) {
                    this.handleRightClick(e);
                }
                break;
        }
    }

    resetMouseButtons() {
        this.isLeftButtonDown = false;
        this.isRightButtonDown = false;
        // 移除所有高亮效果
        document.querySelectorAll('.cell.highlight').forEach(cell => {
            cell.classList.remove('highlight');
        });
    }

    quickReveal(row, col) {
        if (!this.board[row][col].isRevealed) return;
        
        // 获取中心格子的DOM元素
        const centerCell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        // 计算周围的旗子数量
        let flagCount = 0;
        const neighbors = this.getNeighbors(row, col);
        
        // 添加检查动画效果
        centerCell.classList.add('checking');
        
        // 获取所有相邻格子的DOM元素并添加动画
        const neighborElements = neighbors.map(([r, c]) => ({
            element: document.querySelector(`[data-row="${r}"][data-col="${c}"]`),
            row: r,
            col: c
        }));
        
        neighborElements.forEach(({element}) => {
            if (element && !element.classList.contains('revealed')) {
                element.classList.add('checking');
            }
        });

        // 计算旗子数量
        for (const [r, c] of neighbors) {
            if (this.board[r][c].isFlagged) {
                flagCount++;
            }
        }

        // 延迟执行揭示操作，等待动画完成
        setTimeout(() => {
            // 移除检查动画
            centerCell.classList.remove('checking');
            neighborElements.forEach(({element}) => {
                if (element) {
                    element.classList.remove('checking');
                }
            });

            // 如果旗子数量等于数字，则揭示所有未标记的相邻格子
            if (flagCount === this.board[row][col].neighborMines) {
                let revealedCells = [];
                
                for (const {row: r, col: c, element} of neighborElements) {
                    if (!this.board[r][c].isFlagged && !this.board[r][c].isRevealed) {
                        this.revealCell(r, c);
                        if (this.board[r][c].isMine) {
                            this.endGame(false);
                            return;
                        }
                        if (element) {
                            element.classList.add('quick-reveal');
                            revealedCells.push(element);
                        }
                    }
                }
                
                this.renderBoard();
                
                // 移除动画类
                setTimeout(() => {
                    revealedCells.forEach(element => {
                        element.classList.remove('quick-reveal');
                    });
                }, 300);

                if (this.checkWin()) {
                    this.endGame(true);
                }
            }
        }, 300);
    }

    getNeighbors(row, col) {
        const neighbors = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols) {
                    neighbors.push([newRow, newCol]);
                }
            }
        }
        return neighbors;
    }

    handleClick(e) {
        if (this.gameOver) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (this.board[row][col].isFlagged) return;
        
        this.revealCell(row, col);
        this.renderBoard();
        
        if (this.board[row][col].isMine) {
            this.handleMineClick(row, col);
        } else if (this.checkWin()) {
            this.endGame(true);
        }
    }

    handleRightClick(e) {
        e.preventDefault();
        if (this.gameOver) return;
        
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (!this.board[row][col].isRevealed) {
            this.board[row][col].isFlagged = !this.board[row][col].isFlagged;
            this.minesLeft += this.board[row][col].isFlagged ? -1 : 1;
            this.updateMineCount();
            this.renderBoard();
        }
    }

    revealCell(row, col) {
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols ||
            this.board[row][col].isRevealed || this.board[row][col].isFlagged) {
            return;
        }

        this.board[row][col].isRevealed = true;

        if (this.board[row][col].neighborMines === 0 && !this.board[row][col].isMine) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    this.revealCell(row + i, col + j);
                }
            }
        }
    }

    checkWin() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col].isMine && !this.board[row][col].isRevealed) {
                    return false;
                }
            }
        }
        return true;
    }

    endGame(won) {
        this.gameOver = true;
        // 停止计时器
        if (this.timerAnimationFrame) {
            cancelAnimationFrame(this.timerAnimationFrame);
            this.timerAnimationFrame = null;
        }
        
        // 显示所有地雷
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col].isMine) {
                    this.board[row][col].isRevealed = true;
                }
            }
        }
        
        this.renderBoard();

        // 显示对应的提示信息
        if (won) {
            window.toastManager.show('恭喜你赢了！', 'success', 5000);
        } else {
            window.toastManager.show('游戏结束！', 'error', 5000);
        }
    }

    startTimer() {
        if (this.timerAnimationFrame) {
            cancelAnimationFrame(this.timerAnimationFrame);
        }
        this.timer = 0;
        this.startTime = Date.now();
        document.getElementById('timer').textContent = '0';
        this.updateTimer();
    }

    updateTimer() {
        if (this.gameOver) return;
        
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - this.startTime) / 1000);
        
        if (elapsedSeconds !== this.timer) {
            this.timer = elapsedSeconds;
            document.getElementById('timer').textContent = this.timer;
        }
        
        this.timerAnimationFrame = requestAnimationFrame(() => this.updateTimer());
    }

    updateMineCount() {
        document.getElementById('mineCount').textContent = this.minesLeft;
    }

    resetGame() {
        // 停止计时器
        if (this.timerAnimationFrame) {
            cancelAnimationFrame(this.timerAnimationFrame);
            this.timerAnimationFrame = null;
        }
        this.gameOver = false;
        this.minesLeft = this.mines;
        this.init();
    }

    handleMineClick(row, col) {
        this.gameOver = true;
        this.revealAllMines();
        
        // 获取被点击的格子的位置
        const clickedCell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const rect = clickedCell.getBoundingClientRect();
        
        // 添加震动效果
        const gameContainer = document.querySelector('.game-container');
        gameContainer.classList.add('shake');
        
        // 在点击位置创建爆炸效果
        this.explosionEffect.createExplosion(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
        );
        
        // 延迟显示游戏结束提示
        setTimeout(() => {
            gameContainer.classList.remove('shake');
            this.endGame(false);  // 调用 endGame 方法，传入 false 表示失败
        }, 1000);
    }

    highlightNeighbors(row, col) {
        const neighbors = this.getNeighbors(row, col);
        neighbors.forEach(([r, c]) => {
            const neighborCell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (neighborCell && !this.board[r][c].isRevealed && !this.board[r][c].isFlagged) {
                neighborCell.classList.add('highlight');
                // 移除之前的动画（如果有）
                neighborCell.addEventListener('animationend', () => {
                    neighborCell.classList.remove('highlight');
                }, { once: true });
            }
        });
    }
}

// 游戏启动时，根据选择的难度初始化
window.addEventListener('load', () => {
    const difficulty = document.getElementById('difficulty').value;
    new Minesweeper(difficulty);
}); 