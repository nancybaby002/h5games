class Gomoku {
    constructor() {
        this.canvas = document.getElementById('board');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15; // 15x15的棋盘
        this.cellSize = this.canvas.width / this.boardSize;
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.isAIMode = false; // 添加AI模式标志

        this.drawBoard();
        this.addEventListeners();
    }

    drawBoard() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制棋盘背景
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 添加木纹效果
        const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, 'rgba(139, 69, 19, 0.1)');
        gradient.addColorStop(0.5, 'rgba(222, 184, 135, 0.2)');
        gradient.addColorStop(1, 'rgba(139, 69, 19, 0.1)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格线
        this.ctx.strokeStyle = 'rgba(139, 69, 19, 0.8)';
        this.ctx.lineWidth = 1;

        // 绘制外边框
        this.ctx.beginPath();
        this.ctx.rect(
            this.cellSize / 2, 
            this.cellSize / 2, 
            this.canvas.width - this.cellSize, 
            this.canvas.height - this.cellSize
        );
        this.ctx.stroke();

        // 绘制内部网格线
        for (let i = 1; i < this.boardSize; i++) {
            // 横线
            this.ctx.beginPath();
            this.ctx.moveTo(this.cellSize / 2, i * this.cellSize + this.cellSize / 2);
            this.ctx.lineTo(this.canvas.width - this.cellSize / 2, i * this.cellSize + this.cellSize / 2);
            this.ctx.stroke();

            // 竖线
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize + this.cellSize / 2, this.cellSize / 2);
            this.ctx.lineTo(i * this.cellSize + this.cellSize / 2, this.canvas.height - this.cellSize / 2);
            this.ctx.stroke();
        }

        // 绘制天元和星位
        const starPoints = [
            {x: 3, y: 3}, {x: 11, y: 3},
            {x: 7, y: 7},
            {x: 3, y: 11}, {x: 11, y: 11}
        ];

        starPoints.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(
                point.x * this.cellSize + this.cellSize / 2,
                point.y * this.cellSize + this.cellSize / 2,
                4, 0, Math.PI * 2
            );
            this.ctx.fillStyle = '#8B4513';
            this.ctx.fill();
        });

        // 重绘所有已有的棋子
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j]) {
                    this.drawPiece(i, j, this.board[i][j]);
                }
            }
        }
    }

    drawPiece(row, col, color = null) {
        const x = col * this.cellSize + this.cellSize / 2;
        const y = row * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize * 0.4;
        
        // 使用传入的color或当前玩家的颜色
        const pieceColor = color || this.currentPlayer;

        // 绘制阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        // 绘制棋子
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = pieceColor;  // 使用确定的颜色
        this.ctx.fill();

        // 清除阴影效果
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // 绘制棋子边框
        this.ctx.strokeStyle = pieceColor === 'black' ? '#333' : '#ccc';
        this.ctx.stroke();

        // 添加高光效果
        const gradient = this.ctx.createRadialGradient(
            x - radius/3, y - radius/3, radius/10,
            x, y, radius
        );
        gradient.addColorStop(0, pieceColor === 'black' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
    }

    addEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver) return;
            if (this.isAIMode && this.currentPlayer === 'white') return; // AI思考时玩家不能下棋

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const col = Math.floor(x / this.cellSize);
            const row = Math.floor(y / this.cellSize);

            if (this.isValidMove(row, col)) {
                this.makeMove(row, col);
                
                // 在AI模式下，玩家下完后轮到AI下棋
                if (this.isAIMode && !this.gameOver && this.currentPlayer === 'white') {
                    setTimeout(() => this.makeAIMove(), 500);
                }
            }
        });

        document.getElementById('restart').addEventListener('click', () => {
            this.restart();
        });

        // 添加模式切换按钮的事件监听
        document.getElementById('toggleAI').addEventListener('click', () => {
            this.isAIMode = !this.isAIMode;
            this.restart();
            document.getElementById('toggleAI').textContent = 
                this.isAIMode ? '切换为双人模式' : '切换为人机模式';
            document.getElementById('mode-status').textContent = 
                this.isAIMode ? '当前模式：人机对战' : '当前模式：双人对战';
        });
    }

    isValidMove(row, col) {
        return row >= 0 && row < this.boardSize && 
               col >= 0 && col < this.boardSize && 
               this.board[row][col] === null;
    }

    makeAIMove() {
        const move = this.findBestMove();
        if (move) {
            this.makeMove(move.row, move.col);
        }
    }

    findBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        const moves = this.getPrioritizedMoves();

        // 遍历所有可能的位置
        for (const move of moves) {
            const { row, col } = move;
            // 模拟落子
            this.board[row][col] = 'white';
            // 评估这步棋的分数
            const score = this.evaluatePosition(row, col);
            // 撤销落子
            this.board[row][col] = null;

            if (score > bestScore) {
                bestScore = score;
                bestMove = { row, col };
            }
        }

        return bestMove;
    }

    evaluatePosition(row, col) {
        let score = 0;
        const directions = [
            [[0, 1], [0, -1]],  // 水平
            [[1, 0], [-1, 0]],  // 垂直
            [[1, 1], [-1, -1]], // 对角线
            [[1, -1], [-1, 1]]  // 反对角线
        ];

        // 检查是否是棋盘中心位置，中心位置有加分
        const centerBonus = Math.abs(row - 7) + Math.abs(col - 7);
        score -= centerBonus * 10;

        directions.forEach(dir => {
            // 计算AI方向的连子数和两端是否被封堵
            this.board[row][col] = 'white';
            const aiAnalysis = this.analyzeDirection(row, col, dir);
            
            // 计算玩家方向的连子数和两端是否被封堵
            this.board[row][col] = 'black';
            const playerAnalysis = this.analyzeDirection(row, col, dir);
            
            this.board[row][col] = null;

            // AI进攻评分
            score += this.getPositionScore(aiAnalysis.count, aiAnalysis.openEnds, true);
            // 防守评分（基于玩家可能的走法）
            score += this.getPositionScore(playerAnalysis.count, playerAnalysis.openEnds, false);
        });

        return score;
    }

    analyzeDirection(row, col, dir) {
        let count = 1;
        let openEnds = 0;
        const color = this.board[row][col];

        // 检查两个方向
        for (const [deltaRow, deltaCol] of dir) {
            let currentRow = row + deltaRow;
            let currentCol = col + deltaCol;
            let consecutive = 0;

            // 计算连续棋子数
            while (
                currentRow >= 0 && currentRow < this.boardSize &&
                currentCol >= 0 && currentCol < this.boardSize &&
                this.board[currentRow][currentCol] === color
            ) {
                consecutive++;
                currentRow += deltaRow;
                currentCol += deltaCol;
            }

            // 检查这个方向是否是开放的（没有被对手的棋子封堵）
            if (
                currentRow >= 0 && currentRow < this.boardSize &&
                currentCol >= 0 && currentCol < this.boardSize &&
                this.board[currentRow][currentCol] === null
            ) {
                openEnds++;
            }

            count += consecutive;
        }

        return { count, openEnds };
    }

    getPositionScore(count, openEnds, isAI) {
        const baseScore = isAI ? 1 : 0.9; // AI进攻比防守略重要
        
        // 必胜情况
        if (count >= 5) return 1000000;

        // 基于连子数和开放端数的评分
        switch (count) {
            case 4:
                // 活四或双冲四
                if (openEnds === 2) return 50000 * baseScore;
                // 冲四
                if (openEnds === 1) return 10000 * baseScore;
                return 5000 * baseScore;
            
            case 3:
                // 活三
                if (openEnds === 2) return 5000 * baseScore;
                // 眠三
                if (openEnds === 1) return 1000 * baseScore;
                return 500 * baseScore;
            
            case 2:
                // 活二
                if (openEnds === 2) return 500 * baseScore;
                // 眠二
                if (openEnds === 1) return 100 * baseScore;
                return 50 * baseScore;
            
            case 1:
                // 根据开放端数给予少量分数
                return 10 * openEnds * baseScore;
            
            default:
                return 0;
        }
    }

    showWinAnimation() {
        const status = document.getElementById('status');
        status.classList.add('winner-status');
        
        const winner = this.currentPlayer === 'black' ? '黑子' : '白子';
        const messages = [
            `🎉 精彩！${winner}大获全胜！🎉`,
            `🏆 恭喜！${winner}技压群雄！🏆`,
            `✨ 太厉害了！${winner}完美取胜！✨`,
            `🌟 精彩对决！${winner}最终胜出！🌟`
        ];
        
        status.textContent = messages[Math.floor(Math.random() * messages.length)];
        
        // 绘制获胜棋子的特效
        this.drawWinningEffect();
    }

    drawWinningEffect() {
        const winningPieces = this.getWinningPieces();
        let scale = 1;
        let increasing = true;
        
        const animate = () => {
            if (!this.gameOver) return;
            
            // 重绘棋盘
            this.drawBoard();
            
            // 重绘所有棋子
            for (let i = 0; i < this.boardSize; i++) {
                for (let j = 0; j < this.boardSize; j++) {
                    if (this.board[i][j]) {
                        const isWinningPiece = winningPieces.some(
                            piece => piece.row === i && piece.col === j
                        );
                        
                        if (isWinningPiece) {
                            // 获胜棋子带特效
                            this.drawPieceWithEffect(i, j, this.board[i][j], scale);
                        }
                    }
                }
            }
            
            // 更新缩放值
            if (increasing) {
                scale += 0.01;
                if (scale >= 1.2) increasing = false;
            } else {
                scale -= 0.01;
                if (scale <= 1) increasing = true;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    drawPieceWithEffect(row, col, color, scale) {
        const x = col * this.cellSize + this.cellSize / 2;
        const y = row * this.cellSize + this.cellSize / 2;
        const radius = this.cellSize * 0.4;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-x, -y);

        // 绘制光晕效果
        const gradient = this.ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 1.5);
        gradient.addColorStop(0, color === 'black' ? 'rgba(50, 50, 50, 0.3)' : 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        this.ctx.fill();

        // 绘制棋子，使用原本的颜色
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;  // 使用传入的原始颜色
        this.ctx.fill();
        this.ctx.strokeStyle = color === 'black' ? '#333' : '#ccc';
        this.ctx.stroke();

        this.ctx.restore();
    }

    getWinningPieces() {
        const winningPieces = [];
        const directions = [
            [[0, 1], [0, -1]],  // 水平
            [[1, 0], [-1, 0]],  // 垂直
            [[1, 1], [-1, -1]], // 对角线
            [[1, -1], [-1, 1]]  // 反对角线
        ];

        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (!this.board[row][col]) continue;

                directions.forEach(dir => {
                    const pieces = [{row, col}];
                    let count = 1;

                    // 检查两个方向
                    for (const [deltaRow, deltaCol] of dir) {
                        let currentRow = row + deltaRow;
                        let currentCol = col + deltaCol;

                        while (
                            currentRow >= 0 && currentRow < this.boardSize &&
                            currentCol >= 0 && currentCol < this.boardSize &&
                            this.board[currentRow][currentCol] === this.board[row][col]
                        ) {
                            pieces.push({row: currentRow, col: currentCol});
                            count++;
                            currentRow += deltaRow;
                            currentCol += deltaCol;
                        }
                    }

                    if (count >= 5) {
                        winningPieces.push(...pieces);
                    }
                });
            }
        }

        return [...new Set(winningPieces.map(p => JSON.stringify(p)))].map(p => JSON.parse(p));
    }

    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        this.drawPiece(row, col);

        if (this.checkWin(row, col)) {
            this.gameOver = true;
            this.showWinAnimation();
            return;
        }

        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        document.getElementById('status').textContent = 
            `当前玩家: ${this.currentPlayer === 'black' ? '黑子' : '白子'}`;
    }

    checkWin(row, col) {
        const directions = [
            [[0, 1], [0, -1]],  // 水平
            [[1, 0], [-1, 0]],  // 垂直
            [[1, 1], [-1, -1]], // 对角线
            [[1, -1], [-1, 1]]  // 反对角线
        ];

        return directions.some(dir => {
            const count = 1 + 
                this.countDirection(row, col, dir[0][0], dir[0][1]) +
                this.countDirection(row, col, dir[1][0], dir[1][1]);
            return count >= 5;
        });
    }

    countDirection(row, col, deltaRow, deltaCol) {
        let count = 0;
        let currentRow = row + deltaRow;
        let currentCol = col + deltaCol;

        while (
            currentRow >= 0 && currentRow < this.boardSize &&
            currentCol >= 0 && currentCol < this.boardSize &&
            this.board[currentRow][currentCol] === this.currentPlayer
        ) {
            count++;
            currentRow += deltaRow;
            currentCol += deltaCol;
        }

        return count;
    }

    restart() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.drawBoard();
        
        const status = document.getElementById('status');
        status.classList.remove('winner-status');
        status.textContent = '当前玩家: 黑子';
    }

    getPrioritizedMoves() {
        const moves = [];
        
        // 收集所有可能的走法
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === null) {
                    // 计算到最近棋子的距离
                    const distance = this.getMinDistanceToStone(i, j);
                    if (distance <= 2) { // 只考虑距离已有棋子较近的位置
                        moves.push({
                            row: i,
                            col: j,
                            distance: distance
                        });
                    }
                }
            }
        }

        // 按照距离排序，优先考虑距离已有棋子近的位置
        return moves.sort((a, b) => a.distance - b.distance);
    }

    getMinDistanceToStone(row, col) {
        let minDistance = this.boardSize * 2;
        
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] !== null) {
                    const distance = Math.max(Math.abs(row - i), Math.abs(col - j));
                    minDistance = Math.min(minDistance, distance);
                }
            }
        }
        
        return minDistance;
    }
}

// 初始化游戏
window.onload = () => {
    new Gomoku();
}; 