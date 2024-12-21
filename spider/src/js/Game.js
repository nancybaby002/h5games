class Game {
    constructor() {
        this.difficulty = 'easy';
        this.deck = new Deck(this.difficulty);
        this.piles = Array(10).fill().map(() => []);
        this.score = 0;
        this.moves = 0;
        this.remainingCards = [];
        
        this.gameBoardElement = document.getElementById('gameBoard');
        this.deckContainerElement = document.getElementById('deckContainer');
        this.scoreElement = document.getElementById('score');
        this.movesElement = document.getElementById('moves');
        this.completedContainer = document.getElementById('completedPiles');
        
        this.selectedCards = [];
        this.draggedCards = null;
        this.completedPiles = 0;

        this.timerElement = document.getElementById('timer');
        this.startTime = null;
        this.timerInterval = null;

        this.renderRequestId = null;
        this.isRendering = false;
        this.pendingUpdates = new Set();

        this.initGame();
        this.setupEventListeners();
        this.setupDragEvents();
        this.setupSettingsModal();
        this.setupDebugButtons();
        this.startTimer();
        this.setupHintButton();
    }

    initGame() {
        this.deck.shuffle();
        
        // 初始发牌：前4列各6张牌，后6列各5张牌
        for (let i = 0; i < 10; i++) {
            const cardsToAdd = i < 4 ? 6 : 5;
            for (let j = 0; j < cardsToAdd; j++) {
                const card = this.deck.deal();
                // 只翻开每列最后一张牌
                if (j === cardsToAdd - 1) {
                    card.show();
                }
                this.piles[i].push(card);
            }
        }

        // 剩余的牌放入发牌堆
        this.remainingCards = this.deck.cards;
        
        this.renderBoard();
        this.renderDeck();
    }

    setupEventListeners() {
        document.getElementById('newGame').addEventListener('click', () => {
            this.resetGame();
        });

        this.gameBoardElement.addEventListener('click', (e) => {
            const cardElement = e.target.closest('.card');
            if (cardElement) {
                const pileIndex = this.findPileIndex(cardElement);
                const cardIndex = this.findCardIndex(cardElement, pileIndex);
                this.handleCardClick(pileIndex, cardIndex);
            }
        });
    }

    setupDragEvents() {
        this.gameBoardElement.addEventListener('dragstart', (e) => {
            const cardElement = e.target.closest('.card');
            if (!cardElement || !cardElement.classList.contains('flipped')) return;

            const pileIndex = this.findPileIndex(cardElement);
            const cardIndex = this.findCardIndex(cardElement, pileIndex);
            const pile = this.piles[pileIndex];
            
            if (this.isValidStartCard(pile[cardIndex], cardIndex, pile)) {
                this.draggedCards = {
                    pileIndex,
                    cardIndex,
                    cards: pile.slice(cardIndex)
                };
                
                // 创建拖拽时的视觉反馈
                const dragImage = cardElement.cloneNode(true);
                dragImage.style.opacity = '0.8';
                document.body.appendChild(dragImage);
                e.dataTransfer.setDragImage(dragImage, 45, 65);
                
                // 延迟删除克隆的元素
                setTimeout(() => document.body.removeChild(dragImage), 0);
                
                cardElement.classList.add('dragging');
                this.highlightValidDropTargets();
            } else {
                e.preventDefault();
            }
        });

        this.gameBoardElement.addEventListener('dragend', (e) => {
            const cardElement = e.target.closest('.card');
            if (cardElement) {
                cardElement.classList.remove('dragging');
                this.removeDropTargetHighlights();
            }
            this.draggedCards = null;
        });

        this.gameBoardElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            const pileElement = e.target.closest('.pile');
            if (pileElement && this.draggedCards) {
                const toPileIndex = Array.from(this.gameBoardElement.children).indexOf(pileElement);
                if (this.isValidMove(this.draggedCards.pileIndex, toPileIndex)) {
                    e.dataTransfer.dropEffect = 'move';
                    pileElement.classList.add('valid-drop-target');
                } else {
                    e.dataTransfer.dropEffect = 'none';
                    pileElement.classList.add('invalid-drop-target');
                }
            }
        });

        this.gameBoardElement.addEventListener('dragleave', (e) => {
            const pileElement = e.target.closest('.pile');
            if (pileElement) {
                pileElement.classList.remove('valid-drop-target', 'invalid-drop-target');
            }
        });

        this.gameBoardElement.addEventListener('drop', (e) => {
            e.preventDefault();
            const pileElement = e.target.closest('.pile');
            if (pileElement && this.draggedCards) {
                const toPileIndex = Array.from(this.gameBoardElement.children).indexOf(pileElement);
                if (this.isValidMove(this.draggedCards.pileIndex, toPileIndex)) {
                    this.moveCards(this.draggedCards.pileIndex, toPileIndex);
                    this.moves++;
                    this.movesElement.textContent = this.moves;
                    this.checkForCompletion(toPileIndex);
                }
            }
            this.removeDropTargetHighlights();
            this.draggedCards = null;
            this.renderBoard();
        });
    }

    highlightValidDropTargets() {
        this.piles.forEach((pile, index) => {
            if (this.draggedCards && this.isValidMove(this.draggedCards.pileIndex, index)) {
                const pileElement = this.gameBoardElement.children[index];
                pileElement.classList.add('potential-drop-target');
            }
        });
    }

    removeDropTargetHighlights() {
        const pileElements = this.gameBoardElement.getElementsByClassName('pile');
        Array.from(pileElements).forEach(pile => {
            pile.classList.remove('valid-drop-target', 'invalid-drop-target', 'potential-drop-target');
        });
    }

    handleCardClick(pileIndex, cardIndex) {
        if (pileIndex < 0 || cardIndex < 0) return;
        
        const pile = this.piles[pileIndex];
        if (!pile) return;
        
        const card = pile[cardIndex];
        if (!card) return;

        if (!card.faceUp) return;

        // 如果没有选中的牌，选中当前牌
        if (this.selectedCards.length === 0) {
            if (this.isValidStartCard(card, cardIndex, pile)) {
                this.selectCard(card, pileIndex, cardIndex);
            }
        } else {
            // 如果已经有选中的牌，尝试移动
            const fromPileIndex = this.selectedCards[0].pileIndex;
            if (this.isValidMove(fromPileIndex, pileIndex)) {
                this.moveCards(fromPileIndex, pileIndex);
                this.moves++;
                this.movesElement.textContent = this.moves;
                this.checkForCompletion(pileIndex);
            }
            this.clearSelection();
        }
        
        this.renderBoard();
    }

    isValidStartCard(card, cardIndex, pile) {
        // 检查是否是最上面的牌或者下面的牌是按顺序排列的
        for (let i = cardIndex; i < pile.length - 1; i++) {
            if (pile[i].value !== pile[i + 1].value + 1 || 
                pile[i].suit !== pile[i + 1].suit) {
                return false;
            }
        }
        return true;
    }

    isValidMove(fromPileIndex, toPileIndex) {
        const fromPile = this.piles[fromPileIndex];
        const toPile = this.piles[toPileIndex];
        
        // 如果是同一列，不允许移动
        if (fromPileIndex === toPileIndex) {
            return false;
        }
        
        // 如果是拖拽模式
        if (this.draggedCards) {
            const movingCard = fromPile[this.draggedCards.cardIndex];
            if (!movingCard) return false;
            if (toPile.length === 0) return true; // 空列可以放置任何牌
            const topCard = toPile[toPile.length - 1];
            return topCard.value === movingCard.value + 1;
        }
        
        // 如果是点击模式
        if (!this.selectedCards || this.selectedCards.length === 0) {
            return false;
        }
        const movingCard = fromPile[this.selectedCards[0].cardIndex];
        if (!movingCard) return false;
        if (toPile.length === 0) return true; // 空列可以放置任何牌
        const topCard = toPile[toPile.length - 1];
        return topCard.value === movingCard.value + 1;
    }

    moveCards(fromPileIndex, toPileIndex) {
        const fromPile = this.piles[fromPileIndex];
        let startIndex;

        if (this.draggedCards) {
            startIndex = this.draggedCards.cardIndex;
        } else if (this.selectedCards && this.selectedCards.length > 0) {
            startIndex = this.selectedCards[0].cardIndex;
        } else {
            console.error('No cards selected for moving');
            return;
        }

        const cardsToMove = fromPile.splice(startIndex);
        this.piles[toPileIndex].push(...cardsToMove);

        // 翻开移动后露出的牌
        if (fromPile.length > 0 && !fromPile[fromPile.length - 1].faceUp) {
            fromPile[fromPile.length - 1].show();
        }
    }

    checkForCompletion(pileIndex) {
        const pile = this.piles[pileIndex];
        let sequenceStart = pile.length - 13;
        
        if (sequenceStart < 0) return;

        let isComplete = true;
        const suit = pile[sequenceStart].suit;
        
        for (let i = 0; i < 13; i++) {
            if (!pile[sequenceStart + i] || 
                pile[sequenceStart + i].suit !== suit || 
                pile[sequenceStart + i].value !== 13 - i) {
                isComplete = false;
                break;
            }
        }

        if (isComplete) {
            // 移除完成的序列
            const completedCards = pile.splice(sequenceStart, 13);
            this.completedPiles++;
            
            // 创建完成的牌组显示
            const completedPile = document.createElement('div');
            completedPile.className = 'completed-pile';
            const topCard = completedCards[0];
            completedPile.innerHTML = `
                <div class="completed-card">
                    <div class="suit ${topCard.suit === '♥' || topCard.suit === '♦' ? 'red' : ''}">${topCard.suit}</div>
                </div>
            `;
            this.completedContainer.appendChild(completedPile);

            // 计算分数
            const difficultyScores = {
                'easy': 100,
                'medium': 200,
                'hard': 300
            };
            this.score += difficultyScores[this.difficulty];
            this.scoreElement.textContent = this.score;
            
            // 自动翻开新露出的牌
            if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
                pile[pile.length - 1].show();
            }

            // 重新渲染整个游戏板以更新事件监听器
            this.renderBoard();
            
            // 检查胜利条件
            this.checkForWin();
        }
    }

    checkForWin() {
        const totalCards = this.piles.reduce((sum, pile) => sum + pile.length, 0);
        if (totalCards === 0 || this.testingWin) {
            this.stopTimer();
            
            // 先创建撒花效果
            this.createConfetti();
            
            // 延迟显示胜利消息
            setTimeout(() => {
                const victoryMessage = document.createElement('div');
                victoryMessage.className = 'victory-message';
                victoryMessage.innerHTML = `
                    <h1>恭喜你赢了！</h1>
                    <p>最终得分：${this.score}</p>
                    <p>移动次数：${this.moves}</p>
                    <p>用时：${this.timerElement.textContent}</p>
                `;
                document.body.appendChild(victoryMessage);
                
                // 5秒后移除胜利消息
                setTimeout(() => {
                    victoryMessage.remove();
                }, 5000);
            }, 500); // 等待0.5秒后显示胜利消息
        }
    }

    dealNewCards() {
        if (this.remainingCards.length >= 10) {
            // 禁用交互
            this.gameBoardElement.classList.add('dealing');
            
            // 准备要发的牌
            const cardsToAdd = [];
            for (let i = 0; i < 10; i++) {
                const card = this.remainingCards.pop();
                card.show();
                cardsToAdd.push({ card, pileIndex: i });
            }

            // 按顺序发牌
            let delay = 0;
            cardsToAdd.forEach(({ card, pileIndex }, index) => {
                setTimeout(() => {
                    // 直接添加到对应的牌堆
                    this.piles[pileIndex].push(card);
                    
                    // 只渲染当前更新的牌堆
                    this.renderPile(pileIndex);
                    
                    // 最后一张牌发完后的处理
                    if (index === 9) {
                        this.gameBoardElement.classList.remove('dealing');
                        this.renderDeck();
                        // 完成后重新渲染整个棋盘以确保所有事件监听器正确绑定
                        setTimeout(() => {
                            this.renderBoard();
                        }, 100);
                    }
                }, delay);
                delay += 50; // 每张牌之间的延迟时间
            });
        }
    }

    // 新增方法：只渲染单个牌堆
    renderPile(pileIndex) {
        const pile = this.piles[pileIndex];
        const pileElement = this.gameBoardElement.children[pileIndex];
        
        // 清空当前牌堆的内容
        pileElement.innerHTML = '';
        
        // 如果牌堆为空，显示占位符
        if (pile.length === 0) {
            const placeholder = document.createElement('div');
            placeholder.className = 'card-placeholder';
            pileElement.appendChild(placeholder);
            return;
        }

        // 更新牌堆内容
        pile.forEach((card, cardIndex) => {
            const cardElement = card.element.cloneNode(true);
            cardElement.style.top = `${cardIndex * 30}px`;
            cardElement.classList.add('dealing-animation');
            
            // 确保卡片的可拖拽属性和翻转状态正确
            cardElement.draggable = true;
            if (card.faceUp) {
                cardElement.classList.add('flipped');
            }
            
            pileElement.appendChild(cardElement);
        });
    }

    getDeckPosition() {
        const deckElement = document.querySelector('.deck-button');
        const rect = deckElement.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top
        };
    }

    getPilePositions() {
        const piles = document.querySelectorAll('.pile');
        return Array.from(piles).map(pile => {
            const rect = pile.getBoundingClientRect();
            const cards = pile.querySelectorAll('.card');
            const y = cards.length > 0 ? 
                cards[cards.length - 1].getBoundingClientRect().top + 30 : // 如果有卡片，放在最后一张上面
                rect.top; // 如果是空列，放在底部
            return {
                x: rect.left,
                y: y
            };
        });
    }

    renderBoard() {
        if (this.renderRequestId) {
            cancelAnimationFrame(this.renderRequestId);
        }

        this.renderRequestId = requestAnimationFrame(() => {
            if (this.isRendering) return;
            this.isRendering = true;

            this.clearHints();
            this.removeEventListeners();
            
            while (this.gameBoardElement.firstChild) {
                this.gameBoardElement.firstChild.remove();
            }

            this.piles.forEach((pile, pileIndex) => {
                const pileElement = document.createElement('div');
                pileElement.className = 'pile';
                
                if (pile.length === 0) {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'card-placeholder';
                    pileElement.appendChild(placeholder);
                } else {
                    const fragment = document.createDocumentFragment();
                    pile.forEach((card, cardIndex) => {
                        const cardElement = card.element.cloneNode(true);
                        cardElement.style.top = `${cardIndex * 30}px`;
                        
                        if (card.faceUp) {
                            cardElement.classList.add('flipped');
                            cardElement.draggable = true;
                        }
                        
                        fragment.appendChild(cardElement);
                    });
                    pileElement.appendChild(fragment);
                }

                this.gameBoardElement.appendChild(pileElement);
            });

            this.setupDragEvents();
            
            this.isRendering = false;
            this.renderRequestId = null;
        });
    }

    renderDeck() {
        this.deckContainerElement.innerHTML = '';
        if (this.remainingCards.length > 0) {
            // 创建牌堆容器
            const deckStack = document.createElement('div');
            deckStack.className = 'deck-stack';
            
            // 创建多层卡片背面效果
            for (let i = 0; i < Math.min(3, Math.ceil(this.remainingCards.length / 10)); i++) {
                const cardBack = document.createElement('div');
                cardBack.className = 'card deck-card';
                cardBack.style.transform = `translateY(${i * 2}px)`;
                
                const backFace = document.createElement('div');
                backFace.className = 'card-back';
                cardBack.appendChild(backFace);
                
                deckStack.appendChild(cardBack);
            }
            
            // 添加点击事件
            deckStack.addEventListener('click', () => this.dealNewCards());
            
            // 添加剩余牌数显示
            const cardCount = document.createElement('div');
            cardCount.className = 'deck-count';
            cardCount.textContent = `剩余: ${this.remainingCards.length}`;
            
            const deckWrapper = document.createElement('div');
            deckWrapper.className = 'deck-wrapper';
            deckWrapper.appendChild(deckStack);
            deckWrapper.appendChild(cardCount);
            
            this.deckContainerElement.appendChild(deckWrapper);
        }
    }

    resetGame() {
        this.deck = new Deck(this.difficulty);
        this.piles = Array(10).fill().map(() => []);
        this.score = 0;
        this.moves = 0;
        this.remainingCards = [];
        this.selectedCards = [];
        this.scoreElement.textContent = '0';
        this.movesElement.textContent = '0';
        this.resetTimer();
        this.initGame();
    }

    findPileIndex(cardElement) {
        if (!cardElement) return -1;
        const pile = cardElement.closest('.pile');
        if (!pile) return -1;
        return Array.from(pile.parentNode.children).indexOf(pile);
    }

    findCardIndex(cardElement, pileIndex) {
        if (!cardElement || pileIndex < 0) return -1;
        const pile = cardElement.closest('.pile');
        if (!pile) return -1;
        return Array.from(pile.children).indexOf(cardElement);
    }

    selectCard(card, pileIndex, cardIndex) {
        this.selectedCards = [{card, pileIndex, cardIndex}];
        card.element.classList.add('selected');
    }

    clearSelection() {
        this.selectedCards.forEach(({card}) => {
            card.element.classList.remove('selected');
        });
        this.selectedCards = [];
    }

    setupSettingsModal() {
        const modal = document.getElementById('settingsModal');
        const settingsBtn = document.getElementById('settingsBtn');
        const closeBtn = modal.querySelector('.close-btn');

        // 打开设置
        settingsBtn.addEventListener('click', () => {
            modal.classList.add('show');
        });

        // 关闭设置
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('show');
        });

        // 点击模态框外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });

        // 设置难度按钮事件
        const difficultyButtons = modal.querySelectorAll('.difficulty-btn');
        difficultyButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 移除所有按钮的active类
                difficultyButtons.forEach(btn => btn.classList.remove('active'));
                // 添加当前按钮的active类
                button.classList.add('active');
                
                // 设置难度
                if (button.id === 'easyMode') this.difficulty = 'easy';
                if (button.id === 'mediumMode') this.difficulty = 'medium';
                if (button.id === 'hardMode') this.difficulty = 'hard';
                
                // 重新开始游戏
                this.resetGame();
                // 关闭设置窗口
                modal.classList.remove('show');
            });
        });
    }

    setupDebugButtons() {
        document.getElementById('testComplete').addEventListener('click', () => {
            this.testCompletePile();
        });
        
        document.getElementById('testWin').addEventListener('click', () => {
            this.testGameWin();
        });
        
        document.getElementById('autoPlay').addEventListener('click', () => {
            this.autoPlayOneMove();
        });
    }

    testCompletePile() {
        // 在第一列创建一个完整的同花顺
        const pile = this.piles[0];
        pile.length = 0; // 清空第一列

        const suit = '♠';
        const ranks = ['K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A'];
        
        ranks.forEach((rank, index) => {
            const card = new Card(suit, rank, 13 - index);
            card.show();
            pile.push(card);
        });

        this.renderBoard();
        this.checkForCompletion(0);
    }

    testGameWin() {
        this.testingWin = true;  // 添加测试标志
        // 清空所有列
        this.piles.forEach(pile => pile.length = 0);
        this.remainingCards = [];
        this.renderBoard();
        this.renderDeck();
        this.checkForWin();
        this.testingWin = false;  // 重置测试标志
    }

    createConfetti() {
        const colors = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
        const shapes = ['square', 'circle', 'triangle'];
        
        const existingContainer = document.querySelector('.confetti-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        confettiContainer.style.position = 'fixed';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '9999';
        document.body.appendChild(confettiContainer);
        
        for (let i = 0; i < 300; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                const color = colors[Math.floor(Math.random() * colors.length)];
                const shape = shapes[Math.floor(Math.random() * shapes.length)];
                
                confetti.className = `confetti ${color} ${shape}`;
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.animationDuration = (Math.random() * 4 + 2) + 's'; // 2-6秒
                confetti.style.opacity = Math.random() * 0.7 + 0.3; // 0.3-1.0
                confetti.style.transform = `scale(${Math.random() * 1.2 + 0.8})`; // 0.8-2.0
                
                confetti.style.animationDelay = Math.random() * 2 + 's';
                confetti.style.transform += ` rotate(${Math.random() * 360}deg)`;
                
                confettiContainer.appendChild(confetti);
                
                confetti.addEventListener('animationend', () => {
                    confetti.remove();
                    if (confettiContainer.children.length === 0) {
                        confettiContainer.remove();
                    }
                });
            }, i * 10); // 每10ms创建一个，产生连续效果
        }
    }

    startTimer() {
        this.startTime = new Date();
        this.updateTimer();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    resetTimer() {
        this.stopTimer();
        this.timerElement.textContent = '00:00';
        this.startTimer();
    }

    updateTimer() {
        if (!this.startTime) return;
        
        const currentTime = new Date();
        const elapsedTime = Math.floor((currentTime - this.startTime) / 1000);
        
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        
        this.timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    setupHintButton() {
        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
        });
    }

    showHint() {
        // 移除之前的提示高亮
        this.clearHints();

        // 查找可能的移动
        const hint = this.findPossibleMove();
        if (hint) {
            // 高亮源牌和目标位置
            this.highlightMove(hint);
        }
    }

    findPossibleMove() {
        // 遍历所有牌堆
        for (let fromPile = 0; fromPile < this.piles.length; fromPile++) {
            const pile = this.piles[fromPile];
            
            // 从上到下检查每张牌
            for (let cardIndex = pile.length - 1; cardIndex >= 0; cardIndex--) {
                const card = pile[cardIndex];
                if (!card.faceUp) continue;

                // 检查是否是有效的起始牌
                if (this.isValidStartCard(card, cardIndex, pile)) {
                    // 查找可能的目标位置
                    for (let toPile = 0; toPile < this.piles.length; toPile++) {
                        if (fromPile === toPile) continue;

                        const targetPile = this.piles[toPile];
                        if (targetPile.length === 0) {
                            // 空列是有效的移动目标
                            return {
                                fromPile,
                                cardIndex,
                                toPile,
                                cards: pile.slice(cardIndex)
                            };
                        }

                        const topCard = targetPile[targetPile.length - 1];
                        if (topCard.value === card.value + 1) {
                            return {
                                fromPile,
                                cardIndex,
                                toPile,
                                cards: pile.slice(cardIndex)
                            };
                        }
                    }
                }
            }
        }
        return null;
    }

    highlightMove(hint) {
        // 高亮源牌
        const sourcePile = this.gameBoardElement.children[hint.fromPile];
        const sourceCards = sourcePile.children;
        for (let i = hint.cardIndex; i < sourceCards.length; i++) {
            sourceCards[i].classList.add('hint-source');
        }

        // 高亮目标位置
        const targetPile = this.gameBoardElement.children[hint.toPile];
        targetPile.classList.add('hint-target');

        // 3秒后自动清除提示
        setTimeout(() => this.clearHints(), 3000);
    }

    clearHints() {
        // 清除所有提示高亮
        const hintSources = document.querySelectorAll('.hint-source');
        const hintTargets = document.querySelectorAll('.hint-target');
        
        hintSources.forEach(element => {
            element.classList.remove('hint-source');
        });
        
        hintTargets.forEach(element => {
            element.classList.remove('hint-target');
        });
    }

    autoPlayOneMove() {
        // 查找可能的移动
        const move = this.findBestMove();
        if (move) {
            // 执行移动
            this.executeAutoMove(move);
        } else {
            // 如果没有可移动的牌，但还有牌堆，则发牌
            if (this.remainingCards.length >= 10) {
                this.dealNewCards();
            } else {
                alert('没有可以移动的牌了！');
            }
        }
    }

    findBestMove() {
        // 首先查找可以形成完整牌组的移动
        const completeMove = this.findCompletingMove();
        if (completeMove) return completeMove;

        // 然后查找可以合并同花色的移动
        const suitMove = this.findSuitMove();
        if (suitMove) return suitMove;

        // 最后查找任何可能的移动
        return this.findPossibleMove();
    }

    findCompletingMove() {
        // 遍历所有牌堆
        for (let fromPile = 0; fromPile < this.piles.length; fromPile++) {
            const pile = this.piles[fromPile];
            
            // 从底部开始检查
            for (let cardIndex = 0; cardIndex < pile.length; cardIndex++) {
                const card = pile[cardIndex];
                if (!card.faceUp) continue;

                // 检查是否可能形成完整的同花顺
                if (this.isValidStartCard(card, cardIndex, pile)) {
                    const sequence = pile.slice(cardIndex);
                    if (sequence.length === 13 && 
                        sequence[0].value === 13 && 
                        sequence[sequence.length - 1].value === 1) {
                        return {
                            fromPile,
                            cardIndex,
                            toPile: fromPile,
                            isComplete: true
                        };
                    }
                }
            }
        }
        return null;
    }

    findSuitMove() {
        // 遍历所有牌堆
        for (let fromPile = 0; fromPile < this.piles.length; fromPile++) {
            const pile = this.piles[fromPile];
            
            // 从上到下检查每张牌
            for (let cardIndex = pile.length - 1; cardIndex >= 0; cardIndex--) {
                const card = pile[cardIndex];
                if (!card.faceUp) continue;

                if (this.isValidStartCard(card, cardIndex, pile)) {
                    // 查找可以放置同花色的目标位置
                    for (let toPile = 0; toPile < this.piles.length; toPile++) {
                        if (fromPile === toPile) continue;

                        const targetPile = this.piles[toPile];
                        if (targetPile.length === 0) continue;

                        const topCard = targetPile[targetPile.length - 1];
                        if (topCard.value === card.value + 1 && topCard.suit === card.suit) {
                            return {
                                fromPile,
                                cardIndex,
                                toPile
                            };
                        }
                    }
                }
            }
        }
        return null;
    }

    executeAutoMove(move) {
        // 清理之前的状态
        this.clearSelection();
        this.removeDropTargetHighlights();

        // 设置临时的 draggedCards 用于移动
        this.draggedCards = {
            pileIndex: move.fromPile,
            cardIndex: move.cardIndex,
            cards: this.piles[move.fromPile].slice(move.cardIndex)
        };

        // 执行移动
        this.moveCards(move.fromPile, move.toPile);
        this.moves++;
        this.movesElement.textContent = this.moves;
        
        // 检查是否完成一组牌
        this.checkForCompletion(move.toPile);
        
        // 清理临时数据和状态
        this.draggedCards = null;
        this.selectedCards = [];
        
        // 移除所有可能的高亮和选中状态
        const allCards = document.querySelectorAll('.card');
        allCards.forEach(card => {
            card.classList.remove('selected', 'dragging', 'hint-source');
        });
        
        // 更新界面
        this.renderBoard();
        
        // 确保所有事件监听器正确绑定
        this.setupDragEvents();
    }

    removeEventListeners() {
        const oldPiles = this.gameBoardElement.querySelectorAll('.pile');
        oldPiles.forEach(pile => {
            const cards = pile.querySelectorAll('.card');
            cards.forEach(card => {
                card.removeEventListener('dragstart', this.handleDragStart);
                card.removeEventListener('dragend', this.handleDragEnd);
            });
        });
    }

    cleanup() {
        this.stopTimer();
        
        if (this.renderRequestId) {
            cancelAnimationFrame(this.renderRequestId);
            this.renderRequestId = null;
        }
        
        this.removeEventListeners();
        
        const confettiContainer = document.querySelector('.confetti-container');
        if (confettiContainer) {
            confettiContainer.remove();
        }
        
        this.clearHints();
        
        this.draggedCards = null;
        this.selectedCards = [];
        
        this.pendingUpdates.clear();
    }

    destroy() {
        this.cleanup();
    }
}

window.addEventListener('unload', () => {
    if (window.game) {
        window.game.destroy();
    }
});

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 