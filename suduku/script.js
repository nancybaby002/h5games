class Sudoku {
    constructor() {
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        this.cellsToRemove = 40; // 默认难度
    }

    // 生成新游戏
    generate() {
        // 清空棋盘
        this.board = Array(9).fill().map(() => Array(9).fill(0));
        this.solution = Array(9).fill().map(() => Array(9).fill(0));
        
        // 先填充第一行
        const firstRow = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        this.solution[0] = firstRow;
        
        // 使用回溯法填充剩余的格子
        if (this.generateSolution(1, 0)) {
            // 复制解决方案到当前板
            this.board = this.solution.map(row => [...row]);
            // 移除一些数字来创建谜题
            this.removeNumbers();
        } else {
            // 如果生成失败，重试
            this.generate();
        }
    }

    // 使用回溯法生成解决方案
    generateSolution(row, col) {
        if (row >= 9) {
            return true; // 已经填完所有行
        }
        
        if (col >= 9) {
            return this.generateSolution(row + 1, 0); // 进入下一行
        }

        // 尝试1-9的随机排列
        const numbers = this.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        
        for (let num of numbers) {
            // 检查当前位置放置这个数字是否有效
            if (this.isValidPlacement(row, col, num)) {
                this.solution[row][col] = num;
                
                // 继续填充下一个位置
                if (this.generateSolution(row, col + 1)) {
                    return true;
                }
                
                // 如果后续填充失败，回溯
                this.solution[row][col] = 0;
            }
        }
        
        return false; // 当前位置无法找到有效数字
    }

    // 检查在指定位置放置数字是否有效
    isValidPlacement(row, col, num) {
        // 检查行
        for (let x = 0; x < 9; x++) {
            if (x !== col && this.solution[row][x] === num) {
                return false;
            }
        }

        // 检查列
        for (let x = 0; x < 9; x++) {
            if (x !== row && this.solution[x][col] === num) {
                return false;
            }
        }

        // 检查3x3方块
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const currentRow = boxRow + i;
                const currentCol = boxCol + j;
                if ((currentRow !== row || currentCol !== col) && 
                    this.solution[currentRow][currentCol] === num) {
                    return false;
                }
            }
        }

        return true;
    }

    // Fisher-Yates 洗牌算法
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // 移除数字来创建谜题
    removeNumbers() {
        const positions = [];
        // 创建所有位置的数组
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                positions.push([i, j]);
            }
        }
        
        // 随机打乱位置数组
        this.shuffle(positions);
        
        // 移除指定数量的数字
        for (let i = 0; i < this.cellsToRemove; i++) {
            const [row, col] = positions[i];
            this.board[row][col] = 0;
        }
    }
}

// 游戏管理类
class Game {
    constructor() {
        this.sudoku = new Sudoku();
        this.initialBoard = null;
        this.selectedCell = null;
        this.timer = null;
        this.seconds = 0;
        this.isPaused = false;
        this.bestTimes = this.loadBestTimes();
        this.currentDifficulty = 'medium';
        this.setupBoard();
        this.setupEventListeners();
        this.updateBestTimeDisplay();
    }

    // 加载最佳时间记录
    loadBestTimes() {
        const saved = localStorage.getItem('sudokuBestTimes');
        return saved ? JSON.parse(saved) : {
            easy: Infinity,
            medium: Infinity,
            hard: Infinity
        };
    }

    // 保存最佳时间记录
    saveBestTime() {
        if (this.seconds < (this.bestTimes[this.currentDifficulty] || Infinity)) {
            this.bestTimes[this.currentDifficulty] = this.seconds;
            localStorage.setItem('sudokuBestTimes', JSON.stringify(this.bestTimes));
            this.updateBestTimeDisplay();
        }
    }

    // 更新最佳时间显示
    updateBestTimeDisplay() {
        const bestTime = this.bestTimes[this.currentDifficulty];
        const bestTimeElement = document.getElementById('bestTime');
        if (bestTime === Infinity) {
            bestTimeElement.textContent = '--:--';
        } else {
            const minutes = Math.floor(bestTime / 60);
            const seconds = bestTime % 60;
            bestTimeElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    // 修改计时器相关方法
    startTimer() {
        this.stopTimer();
        this.seconds = 0;
        this.isPaused = false;
        this.updateTimerDisplay();
        document.querySelector('.timer').classList.remove('paused');
        this.timer = setInterval(() => {
            if (!this.isPaused) {
                this.seconds++;
                this.updateTimerDisplay();
            }
        }, 1000);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        const timerElement = document.querySelector('.timer');
        const pauseIcon = document.querySelector('.pause-icon');
        
        if (this.isPaused) {
            timerElement.classList.add('paused');
            pauseIcon.textContent = '▶';
        } else {
            timerElement.classList.remove('paused');
            pauseIcon.textContent = '⏸';
        }
    }

    setupBoard() {
        const board = document.getElementById('board');
        board.innerHTML = '';
        this.sudoku.generate();
        this.initialBoard = this.sudoku.board.map(row => [...row]);

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const cell = document.createElement('input');
                cell.type = 'number';
                cell.className = 'cell';
                cell.min = 1;
                cell.max = 9;
                
                if (this.sudoku.board[i][j] !== 0) {
                    cell.value = this.sudoku.board[i][j];
                    cell.readOnly = true;
                    cell.classList.add('initial');
                }

                cell.dataset.row = i;
                cell.dataset.col = j;
                board.appendChild(cell);
            }
        }
    }

    setupEventListeners() {
        document.getElementById('newGame').addEventListener('click', () => {
            this.setupBoard();
        });

        document.getElementById('check').addEventListener('click', () => {
            this.checkSolution();
        });

        document.getElementById('board').addEventListener('input', (e) => {
            if (e.target.classList.contains('cell')) {
                const value = e.target.value;
                if (value && (value < 1 || value > 9)) {
                    e.target.value = '';
                }
            }
        });

        // 添加数字键盘事件
        document.getElementById('numpad').addEventListener('click', (e) => {
            if (e.target.classList.contains('num-btn') && this.selectedCell) {
                const num = e.target.dataset.num;
                if (num === '0') {
                    this.selectedCell.value = '';
                } else {
                    this.selectedCell.value = num;
                }
                this.selectedCell.classList.remove('error');
            }
        });

        // 修改单元格选择事件
        document.getElementById('board').addEventListener('click', (e) => {
            if (e.target.classList.contains('cell')) {
                // 移除所有高亮
                this.clearHighlights();
                
                // 只允许选择非初始数字的格子
                if (!e.target.readOnly) {
                    if (this.selectedCell) {
                        this.selectedCell.classList.remove('selected');
                    }
                    
                    this.selectedCell = e.target;
                    this.selectedCell.classList.add('selected');
                }
                
                // 高亮相同数字（无论是否是初始数字）
                const value = e.target.value;
                if (value) {
                    this.highlightSameNumbers(value);
                }
            }
        });

        // 修改数字键盘事件
        document.getElementById('numpad').addEventListener('click', (e) => {
            // 只有选中了非初始数字的格子才能输入
            if (e.target.classList.contains('num-btn') && 
                this.selectedCell && 
                !this.selectedCell.readOnly) {
                const num = e.target.dataset.num;
                this.clearHighlights();
                if (num === '0') {
                    this.selectedCell.value = '';
                } else {
                    this.selectedCell.value = num;
                    this.highlightSameNumbers(num);
                }
                this.selectedCell.classList.remove('error');
            }
        });

        // 修改输入事件监听器
        document.getElementById('board').addEventListener('input', (e) => {
            if (e.target.classList.contains('cell')) {
                // 如果是初始数字，阻止输入
                if (e.target.readOnly) {
                    e.target.value = e.target.defaultValue;
                    return;
                }

                const value = e.target.value;
                this.clearHighlights();
                if (value && !isNaN(value)) {
                    this.highlightSameNumbers(value);
                }
            }
        });

        // 添加难度选择事件
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.currentDifficulty = e.target.value;
            this.setDifficulty(this.currentDifficulty);
            this.updateBestTimeDisplay();
            this.setupBoard();
        });

        // 添加暂停按钮事件
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });
    }

    setDifficulty(difficulty) {
        switch(difficulty) {
            case 'easy':
                this.sudoku.cellsToRemove = 30;
                break;
            case 'medium':
                this.sudoku.cellsToRemove = 40;
                break;
            case 'hard':
                this.sudoku.cellsToRemove = 50;
                break;
        }
    }

    checkSolution() {
        const cells = document.querySelectorAll('.cell');
        let isCorrect = true;

        cells.forEach(cell => {
            cell.classList.remove('error');
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            const value = parseInt(cell.value) || 0;

            if (value !== this.sudoku.solution[row][col]) {
                cell.classList.add('error');
                isCorrect = false;
            }
        });

        if (isCorrect) {
            this.stopTimer();
            this.saveBestTime();
            const timeStr = document.getElementById('timer').textContent;
            const isBestTime = this.seconds === this.bestTimes[this.currentDifficulty];
            alert(
                `恭喜你！完成数独！\n` +
                `用时：${timeStr}\n` +
                (isBestTime ? '新纪录！' : '')
            );
        }
    }

    // 添加高亮相同数字的方法
    highlightSameNumbers(number) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            if (cell.value === number) {
                cell.classList.add('same-number');
            }
        });
    }

    // 添加清除高亮的方法
    clearHighlights() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('same-number');
        });
    }
}

// 启动游戏
new Game(); 