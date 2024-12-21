// 定义卡牌花色和数字
const SUITS = ['♠', '♥', '♣', '♦'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const COLORS = {
    '♠': 'black',
    '♥': 'red',
    '♣': 'black',
    '♦': 'red'
};

class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.faceUp = false;
        this.element = this.createCardElement();
        this.setupDoubleClick();
    }

    createCardElement() {
        const card = document.createElement('div');
        card.className = 'card';
        if (!this.faceUp) {
            card.classList.add('face-down');
        }
        card.dataset.suit = this.suit;
        card.dataset.value = this.value;
        
        const content = document.createElement('div');
        content.className = 'card-content';
        content.innerHTML = `
            <div class="card-top">
                <span class="card-value">${this.value}</span>
                <span class="card-suit">${this.suit}</span>
            </div>
            <div class="card-center">${this.suit}</div>
            <div class="card-bottom">
                <span class="card-value">${this.value}</span>
                <span class="card-suit">${this.suit}</span>
            </div>
        `;
        
        card.appendChild(content);
        return card;
    }

    flip() {
        this.faceUp = !this.faceUp;
        this.element.classList.toggle('face-down');
    }

    getValue() {
        const valueMap = {
            'A': 1,
            'J': 11,
            'Q': 12,
            'K': 13
        };
        return valueMap[this.value] || parseInt(this.value);
    }

    setupDoubleClick() {
        this.element.addEventListener('dblclick', () => {
            if (window.solitaireGame) {
                window.solitaireGame.handleDoubleClick(this);
            }
        });
    }
}

class Solitaire {
    constructor() {
        this.deck = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.score = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.moveHistory = [];
        this.autoCompleteMode = false;
        this.drawCount = 1;
        this.visibleWaste = [];
        
        this.hints = [];
        this.showingHint = false;
        
        this.initializeGame();
        this.setupEventListeners();
        window.solitaireGame = this;
        this.setupGameModeSelect();
    }

    initializeGame() {
        // 创建并洗牌
        this.createDeck();
        this.shuffleDeck();
        this.dealCards();
        this.startTimer();
        this.updateScore(0);
    }

    createDeck() {
        this.deck = [];
        for (const suit of SUITS) {
            for (const value of VALUES) {
                const card = new Card(suit, value);
                this.deck.push(card);
            }
        }
        console.log('Created deck:', this.deck.length); // 调试用
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    dealCards() {
        // 发牌到tableau
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = this.deck.pop();
                if (i === j) {
                    card.flip(); // 翻开最后一张牌
                }
                this.tableau[j].push(card);
                this.updateCardPosition(card, 'tableau', j);
            }
        }
        
        // 确保剩余的牌都在deck中并且是背面朝上
        this.deck.forEach(card => {
            if (card.faceUp) {
                card.flip();
            }
            this.updateCardPosition(card, 'deck', 0);
        });

        console.log('Remaining deck:', this.deck.length); // 调试用
        this.updateDisplay();
    }

    updateCardPosition(card, pile, index) {
        const pileId = index === undefined ? `${pile}-0` : `${pile}-${index}`;
        const container = document.getElementById(pileId);
        if (!container) {
            console.error('Container not found:', pileId);
            return;
        }
        
        // 确保卡片被添加到正确的容器中
        if (card.element.parentElement !== container) {
            container.appendChild(card.element);
        }
        
        // 设置卡片位置
        if (pile === 'deck') {
            // 牌堆最多显示3张牌的堆叠效果
            const deckIndex = this.deck.indexOf(card);
            const offset = Math.min(deckIndex, 2);
            card.element.style.top = `-${offset}px`;
            card.element.style.left = `-${offset}px`;
            if (!card.faceUp) {
                card.element.classList.add('face-down');
            }
        } else if (pile === 'tableau') {
            // tableau中的牌堆叠间距根据牌的数量动态调整
            const pileCards = this.tableau[index];
            const cardIndex = pileCards.indexOf(card);
            const totalCards = pileCards.length;
            
            // 计算最大间距和最小间距
            const maxSpacing = 30;
            const minSpacing = 15;
            const availableHeight = 400; // tableau-pile的高度
            
            // 根据牌的数量动态计算间距
            let spacing = maxSpacing;
            if (totalCards > 1) {
                // 计算需要的总高度
                const neededHeight = (totalCards - 1) * maxSpacing;
                if (neededHeight > availableHeight - 180) { // 180是卡片高度
                    spacing = Math.max(minSpacing, 
                        (availableHeight - 180) / (totalCards - 1));
                }
            }
            
            card.element.style.top = `${cardIndex * spacing}px`;
            card.element.style.left = '0';
        } else if (pile === 'foundation') {
            // foundation中的牌完全重叠
            card.element.style.top = '0';
            card.element.style.left = '0';
        } else if (pile === 'waste') {
            // waste pile中最多显示3张牌
            const visibleIndex = this.waste.slice(-3).indexOf(card);
            if (visibleIndex !== -1) {
                card.element.style.display = 'block';
                card.element.style.left = `${visibleIndex * 20}px`;
                card.element.style.top = '0';
            } else {
                card.element.style.display = 'none';
            }
        }

        // 设置z-index确保正确的堆叠顺序
        if (pile === 'foundation') {
            const foundationPile = this.foundations[index];
            card.element.style.zIndex = foundationPile.indexOf(card);
        } else {
            // 其他位置的z-index处理
            let zIndex;
            if (pile === 'deck') {
                zIndex = this.deck.indexOf(card);
            } else if (pile === 'waste') {
                zIndex = this.waste.indexOf(card);
            } else if (pile === 'tableau') {
                zIndex = this.tableau[index].indexOf(card);
            }
            card.element.style.zIndex = zIndex;
        }
    }

    setupEventListeners() {
        // 设置新游戏按钮
        document.getElementById('new-game').addEventListener('click', () => {
            this.resetGame();
        });

        // 设置牌堆点击事件
        document.getElementById('deck-0').addEventListener('click', () => {
            this.drawCard();
        });

        // 设置拖拽事件
        this.setupDragAndDrop();

        // 添加撤销快捷键
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                this.undoMove();
            }
        });

        // 添加预览按钮点击事件
        const previewButton = document.getElementById('preview-win');
        if (previewButton) {
            previewButton.addEventListener('click', () => {
                this.previewWinState();
            });
        }

        // 添加提示按钮
        const hintButton = document.getElementById('hint-button');
        if (hintButton) {
            hintButton.addEventListener('click', () => {
                this.findPossibleMoves();
            });
        }
    }

    setupDragAndDrop() {
        const setupCardDrag = (card) => {
            const element = card.element;
            element.setAttribute('draggable', true);
            
            element.addEventListener('dragstart', (e) => {
                if (!card.faceUp) {
                    e.preventDefault();
                    return;
                }
                
                const cards = this.getStackFromCard(element);
                if (!cards) {
                    e.preventDefault();
                    return;
                }

                try {
                    const dragData = {
                        cards: cards.map(c => ({
                            suit: c.suit,
                            value: c.value
                        })),
                        sourceId: this.findPileId(cards[0])
                    };
                    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
                    cards.forEach(c => c.element.classList.add('dragging'));
                } catch (err) {
                    console.error('Drag start error:', err);
                    e.preventDefault();
                }
            });

            element.addEventListener('dragend', () => {
                document.querySelectorAll('.card.dragging')
                    .forEach(el => el.classList.remove('dragging'));
            });
        };

        // 为所有现有卡片设置拖拽
        this.deck.forEach(setupCardDrag);
        this.waste.forEach(setupCardDrag);
        this.tableau.flat().forEach(setupCardDrag);

        // 设置放置区域
        document.querySelectorAll('.card-pile').forEach(pile => {
            pile.addEventListener('dragover', (e) => {
                e.preventDefault();
                pile.classList.add('drag-over');
            });

            pile.addEventListener('dragleave', () => {
                pile.classList.remove('drag-over');
            });

            pile.addEventListener('drop', (e) => {
                e.preventDefault();
                pile.classList.remove('drag-over');
                
                try {
                    const jsonData = e.dataTransfer.getData('application/json');
                    if (!jsonData) {
                        console.warn('No valid drag data found');
                        return;
                    }
                    
                    const data = JSON.parse(jsonData);
                    if (!data || !data.cards || !data.sourceId) {
                        console.warn('Invalid drag data format');
                        return;
                    }

                    this.handleCardDrop(data, pile.id);
                } catch (err) {
                    console.error('Drop error:', err);
                }
            });
        });
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            const minutes = Math.floor(this.timer / 60);
            const seconds = this.timer % 60;
            document.getElementById('timer').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score').textContent = this.score;
    }

    resetGame() {
        // 清除时器
        clearInterval(this.timerInterval);
        this.timer = 0;
        this.score = 0;
        
        // 清除所有牌堆
        this.deck = [];
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.moveHistory = [];
        
        // 清除DOM
        document.querySelectorAll('.card').forEach(card => card.remove());
        
        // 重新初始化游戏
        this.initializeGame();
        this.setupDragAndDrop(); // 确保拖拽功能正常
    }

    drawCard() {
        if (this.deck.length === 0) {
            if (this.waste.length === 0) return;
            
            // 将废牌堆牌全部翻转并放回牌堆
            this.deck = [...this.waste].reverse();
            this.waste = [];
            this.visibleWaste = [];
            
            this.deck.forEach(card => {
                if (card.faceUp) {
                    card.flip();
                }
                card.element.classList.add('face-down');
                this.updateCardPosition(card, 'deck', 0);
            });
        } else {
            // 根据模式翻对应数量的牌
            const cardsToMove = Math.min(this.drawCount, this.deck.length);
            for (let i = 0; i < cardsToMove; i++) {
                const card = this.deck.pop();
                if (!card.faceUp) {
                    card.flip();
                }
                this.waste.push(card);
            }
            
            this.updateVisibleWaste();
        }
        
        this.updateDisplay();
        this.setupDragAndDrop(); // 确保拖拽功能正常
    }

    updateVisibleWaste() {
        // 在简单模式下只显示最后一张牌，标准模式显示最后三张
        const visibleCount = this.drawCount === 1 ? 1 : 3;
        this.visibleWaste = this.waste.slice(-visibleCount);
        
        this.waste.forEach((card, index) => {
            const isVisible = index >= this.waste.length - visibleCount;
            if (isVisible) {
                card.element.style.display = 'block';
                const offset = (index - (this.waste.length - visibleCount)) * 20;
                card.element.style.left = `${offset}px`;
                if (!card.faceUp) {
                    card.flip();
                }
            } else {
                card.element.style.display = 'none';
            }
        });
    }

    handleCardDrop(data, targetPileId) {
        const { cards, sourceId } = data;
        if (!cards || !sourceId) return;

        if (!this.isValidStackMove(cards, targetPileId)) {
            return;
        }

        // 记录移动
        this.recordMove({
            cards,
            sourceId,
            targetId: targetPileId
        });

        // 使用动画移动卡片
        this.moveCardsWithAnimation(
            cards.map(cardData => this.findCard(cardData)),
            sourceId,
            targetPileId
        );

        this.checkAutoComplete();
        this.checkWinCondition();
    }

    isValidStackMove(cards, targetPileId) {
        // 获取实际的Card对象
        const cardObjects = cards.map(cardData => this.findCard(cardData));
        if (!cardObjects.every(card => card)) return false;

        // 单张卡片的移动
        if (cardObjects.length === 1) {
            return this.isValidMove(cards[0], targetPileId);
        }

        // 多张卡片只能移动到tableau
        const [pileType, pileIndex] = targetPileId.split('-');
        if (pileType !== 'tableau') return false;

        // 验证卡片序列是否合法
        for (let i = 1; i < cardObjects.length; i++) {
            const curr = cardObjects[i];
            const prev = cardObjects[i - 1];
            if (COLORS[curr.suit] === COLORS[prev.suit] || 
                curr.getValue() !== prev.getValue() - 1) {
                return false;
            }
        }

        // 验证目标位置是否合法
        const tableau = this.tableau[pileIndex];
        if (tableau.length === 0) {
            return cardObjects[0].getValue() === 13;
        }

        const topCard = tableau[tableau.length - 1];
        return COLORS[cardObjects[0].suit] !== COLORS[topCard.suit] && 
               cardObjects[0].getValue() === topCard.getValue() - 1;
    }

    moveCards(cards, sourceId, targetId) {
        const [sourcePileType, sourcePileIndex] = sourceId.split('-');
        const [targetPileType, targetPileIndex] = targetId.split('-');

        // 获取源位置和目位置的牌堆
        let sourcePile = this.getPileByTypeAndIndex(sourcePileType, sourcePileIndex);
        let targetPile = this.getPileByTypeAndIndex(targetPileType, targetPileIndex);

        if (!sourcePile || !targetPile) {
            console.error('Invalid pile:', { sourcePile, targetPile, sourceId, targetId });
            return;
        }

        // 从源位置移除卡片
        const cardIndex = sourcePile.findIndex(c => 
            c.suit === cards[0].suit && c.value === cards[0].value
        );
        
        if (cardIndex === -1) {
            console.error('Card not found in source pile');
            return;
        }

        const movedCards = sourcePile.splice(cardIndex, cards.length);

        // 添加到目标位置
        targetPile.push(...movedCards);

        // 更新显示
        this.updateDisplay();
        
        // 如果源pile还有卡片且最后一张是背面，则翻转
        if (sourcePile.length > 0 && !sourcePile[sourcePile.length - 1].faceUp) {
            sourcePile[sourcePile.length - 1].flip();
            this.updateScore(5); // 翻牌得分
        }

        // 移动到foundation得分
        if (targetPileType === 'foundation') {
            this.updateScore(10);
        }
    }

    getPileByTypeAndIndex(pileType, pileIndex) {
        switch (pileType) {
            case 'tableau':
                return this.tableau[pileIndex];
            case 'foundation':
                return this.foundations[pileIndex];
            case 'waste':
                return this.waste;
            case 'deck':
                return this.deck;
            default:
                return null;
        }
    }

    isValidMove(cardData, targetPileId) {
        const sourceCard = this.findCard(cardData);
        if (!sourceCard || !sourceCard.faceUp) return false;

        const [pileType, pileIndex] = targetPileId.split('-');
        
        // 移动到基础牌堆（foundation）的规则
        if (pileType === 'foundation') {
            const foundation = this.foundations[pileIndex];
            
            // 如果是空的foundation，只能放A
            if (foundation.length === 0) {
                return sourceCard.getValue() === 1;
            }
            
            const topCard = foundation[foundation.length - 1];
            // 必须是同花色，且数值递增
            return sourceCard.suit === topCard.suit && 
                   sourceCard.getValue() === topCard.getValue() + 1;
        }
        
        // 移动到tableau的规则
        if (pileType === 'tableau') {
            const tableau = this.tableau[pileIndex];
            
            // 如果是空的tableau只能放K
            if (tableau.length === 0) {
                return sourceCard.getValue() === 13;
            }
            
            const topCard = tableau[tableau.length - 1];
            // 必须是不同颜色，且数值递减
            return COLORS[sourceCard.suit] !== COLORS[topCard.suit] && 
                   sourceCard.getValue() === topCard.getValue() - 1;
        }

        return false;
    }

    findCard(cardData) {
        // 在所有位置查找卡牌
        const allPiles = [
            ...this.tableau,
            ...this.foundations,
            this.waste,
            this.deck
        ];

        for (const pile of allPiles) {
            const card = pile.find(c => 
                c.suit === cardData.suit && c.value === cardData.value
            );
            if (card) return card;
        }
        return null;
    }

    findPileId(card) {
        // 在tableau中查找
        for (let i = 0; i < this.tableau.length; i++) {
            if (this.tableau[i].includes(card)) {
                return `tableau-${i}`;
            }
        }

        // 在foundation中查找
        for (let i = 0; i < this.foundations.length; i++) {
            if (this.foundations[i].includes(card)) {
                return `foundation-${i}`;
            }
        }

        // 在waste中查找
        if (this.waste.includes(card)) {
            return 'waste-0';
        }

        // 在deck中查找
        if (this.deck.includes(card)) {
            return 'deck-0';
        }

        return null;
    }

    getStackFromCard(cardElement) {
        if (!cardElement || !cardElement.dataset) {
            return null;
        }

        const card = this.findCard({
            suit: cardElement.dataset.suit,
            value: cardElement.dataset.value
        });

        if (!card || !card.faceUp) {
            return null;
        }

        // 找到卡片所在的pile
        const pileId = this.findPileId(card);
        if (!pileId) {
            return null;
        }

        const [pileType, pileIndex] = pileId.split('-');
        if (pileType !== 'tableau') {
            return [card];
        }

        const pile = this.tableau[pileIndex];
        const cardIndex = pile.indexOf(card);
        if (cardIndex === -1) {
            return null;
        }

        return pile.slice(cardIndex);
    }

    checkWinCondition() {
        const isWin = this.foundations.every(foundation => 
            foundation.length === 13
        );

        if (isWin) {
            clearInterval(this.timerInterval);
            
            // 触发胜利动画
            this.foundations.forEach(foundation => {
                foundation.forEach(card => {
                    card.element.classList.add('victory');
                });
            });

            // 添加胜利效果
            document.querySelector('.game-container').classList.add('victory');
            this.createFireworks();
            this.showVictoryMessage();
        }
    }

    // 自动完成功能
    checkAutoComplete() {
        if (this.autoCompleteMode) return;
        
        // 放宽自动完成的条件
        const canAutoComplete = this.tableau.every(pile => {
            if (pile.length === 0) return true;
            return pile.every(card => card.faceUp);
        }) && this.deck.length === 0;

        if (canAutoComplete) {
            this.autoCompleteMode = true;
            this.performAutoComplete();
        }
    }

    isAutoCompleteSafe(pile) {
        // 检查一列牌是否可以按顺序移动到foundation
        return pile.every((card, index) => {
            if (index === 0) return true;
            const prevCard = pile[index - 1];
            return card.suit === prevCard.suit && 
                   card.getValue() === prevCard.getValue() - 1;
        });
    }

    canMoveToFoundation(card) {
        // 检查单张牌是可以移动到foundation
        const foundation = this.foundations.find(f => 
            f.length === 0 || (
                f[f.length - 1].suit === card.suit && 
                f[f.length - 1].getValue() === card.getValue() - 1
            )
        );
        return foundation !== undefined;
    }

    async performAutoComplete() {
        while (this.autoCompleteMode) {
            let moved = false;
            
            // 先移动waste中的牌
            for (const card of this.waste) {
                if (this.canMoveToFoundation(card)) {
                    await this.autoMoveToFoundation(card);
                    moved = true;
                    break;
                }
            }

            // 再移动tableau中的牌
            if (!moved) {
                for (const pile of this.tableau) {
                    if (pile.length > 0) {
                        const topCard = pile[pile.length - 1];
                        if (this.canMoveToFoundation(topCard)) {
                            await this.autoMoveToFoundation(topCard);
                            moved = true;
                            break;
                        }
                    }
                }
            }

            if (!moved) {
                this.autoCompleteMode = false;
                this.checkWinCondition();
            }

            // 添加延迟使动画更流畅
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    async autoMoveToFoundation(card) {
        const foundationIndex = this.foundations.findIndex(f => 
            f.length === 0 || (
                f[f.length - 1].suit === card.suit && 
                f[f.length - 1].getValue() === card.getValue() - 1
            )
        );

        if (foundationIndex !== -1) {
            const sourceId = this.findPileId(card);
            const targetId = `foundation-${foundationIndex}`;
            
            // 记录移动
            this.recordMove({
                cards: [card],
                sourceId,
                targetId
            });

            // 执行移动
            await this.moveCardsWithAnimation([card], sourceId, targetId);
            this.updateScore(10);
        }
    }

    // 撤销功能
    recordMove(move) {
        this.moveHistory.push({
            cards: move.cards.map(card => ({
                suit: card.suit,
                value: card.value
            })),
            sourceId: move.sourceId,
            targetId: move.targetId,
            wasFlipped: move.wasFlipped
        });
    }

    undoMove() {
        if (this.moveHistory.length === 0) return;

        const lastMove = this.moveHistory.pop();
        if (!lastMove) return;

        const cards = lastMove.cards.map(cardData => 
            this.findCard(cardData)
        ).filter(card => card !== null);

        if (cards.length === 0) {
            console.error('No cards found for undo operation');
            return;
        }

        try {
            // 反向执行移动
            this.moveCards(cards, lastMove.targetId, lastMove.sourceId);

            // 如果有翻牌操作，需要撤销
            if (lastMove.wasFlipped) {
                const [pileType, pileIndex] = lastMove.sourceId.split('-');
                const pile = this.getPileByTypeAndIndex(pileType, pileIndex);
                if (pile && pile.length > 0) {
                    pile[pile.length - 1].flip();
                }
            }

            // 撤销得分
            if (lastMove.targetId.startsWith('foundation')) {
                this.updateScore(-10);
            }
            if (lastMove.wasFlipped) {
                this.updateScore(-5);
            }
        } catch (error) {
            console.error('Error during undo operation:', error);
            this.moveHistory.push(lastMove); // 恢复移动历史
        }
    }

    // 增强的移动动画
    async moveCardsWithAnimation(cards, sourceId, targetId) {
        const [targetType, targetIndex] = targetId.split('-');
        const targetElement = document.getElementById(targetId);
        const targetRect = targetElement.getBoundingClientRect();

        // 为每张牌添动画
        const animations = cards.map((card, index) => {
            const cardElement = card.element;
            const startRect = cardElement.getBoundingClientRect();
            
            // 计算移动距离
            const deltaX = targetRect.left - startRect.left;
            const deltaY = targetRect.top - startRect.top + (index * 30);

            // 添加动画类
            cardElement.style.transition = 'transform 0.3s ease-out';
            cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

            // 添加移动时的缩放效果
            cardElement.style.transform += ' scale(1.05)';
            setTimeout(() => {
                cardElement.style.transform = cardElement.style.transform.replace(' scale(1.05)', '');
            }, 150);

            return new Promise(resolve => {
                cardElement.addEventListener('transitionend', () => {
                    cardElement.style.transition = '';
                    cardElement.style.transform = '';
                    resolve();
                }, { once: true });
            });
        });

        // 等待所有动画完成
        await Promise.all(animations);
        
        // 实际移动卡片
        this.moveCards(cards, sourceId, targetId);
    }

    // 添加 updateDisplay 方法
    updateDisplay() {
        // 首先更新deck显示
        this.deck.forEach((card, i) => {
            this.updateCardPosition(card, 'deck', 0);
            card.element.style.zIndex = i;
            // 添加堆叠效果
            if (i > 0) {
                card.element.style.top = `-${Math.min(i, 3)}px`;
                card.element.style.left = `-${Math.min(i, 3)}px`;
            }
        });

        // 更新waste显示
        this.updateVisibleWaste();
        this.waste.forEach((card, i) => {
            this.updateCardPosition(card, 'waste', 0);
            card.element.style.zIndex = i;
        });

        // 更新tableau显示
        this.tableau.forEach((pile, i) => {
            pile.forEach((card, j) => {
                this.updateCardPosition(card, 'tableau', i);
                card.element.style.zIndex = j;
            });
        });

        // 更新foundation显示
        this.foundations.forEach((pile, i) => {
            pile.forEach((card, j) => {
                this.updateCardPosition(card, 'foundation', i);
                card.element.style.zIndex = j;
            });
        });
    }

    handleDoubleClick(card) {
        if (!card.faceUp) return; // 如果是背面朝上的牌，不处理

        // 找到卡片当前所在的位置
        const sourceId = this.findPileId(card);
        if (!sourceId) return;

        // 检查是否可以移动到foundation
        const foundationIndex = this.findAvailableFoundation(card);
        if (foundationIndex === -1) return;

        const targetId = `foundation-${foundationIndex}`;
        
        // 记录移动
        this.recordMove({
            cards: [{suit: card.suit, value: card.value}],
            sourceId,
            targetId
        });

        // 执行移动
        this.moveCardsWithAnimation([card], sourceId, targetId);
        
        // 更新分数
        this.updateScore(10);
        
        // 检查是否可以自动完成
        this.checkAutoComplete();
        this.checkWinCondition();
    }

    findAvailableFoundation(card) {
        // 检查每个foundation堆
        for (let i = 0; i < this.foundations.length; i++) {
            const foundation = this.foundations[i];
            
            // 如果foundation是空的，只接受A
            if (foundation.length === 0) {
                if (card.getValue() === 1) {
                    return i;
                }
                continue;
            }
            
            // 检查是否可以放在当前foundation堆上
            const topCard = foundation[foundation.length - 1];
            if (card.suit === topCard.suit && 
                card.getValue() === topCard.getValue() + 1) {
                return i;
            }
        }
        
        return -1; // 没有找到合适的foundation
    }

    setupGameModeSelect() {
        const modeSelect = document.getElementById('game-mode');
        if (modeSelect) {
            // 设置初始值
            modeSelect.value = this.drawCount.toString();
            
            // 添加切换事件
            modeSelect.addEventListener('change', (e) => {
                this.drawCount = parseInt(e.target.value);
                this.resetGame(); // 重置游戏
            });
        }
    }

    // 修改 previewWinState 方法
    previewWinState() {
        // 清空现有的牌堆
        this.deck = [];
        this.waste = [];
        this.tableau = [[], [], [], [], [], [], []];
        
        // 清除DOM中的卡片
        document.querySelectorAll('.card').forEach(card => card.remove());

        // 为每个花色创建完整的序列（A到K）
        const orderedValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const suits = ['♠', '♥', '♣', '♦'];

        suits.forEach((suit, index) => {
            const foundation = this.foundations[index] = [];
            orderedValues.forEach(value => {
                const card = new Card(suit, value);
                card.flip(); // 确保卡片正面朝上
                foundation.push(card);
                this.updateCardPosition(card, 'foundation', index);
            });
        });

        // 更新显示
        this.updateDisplay();

        // 触发胜利动画
        setTimeout(() => {
            // 添加胜利效果到游戏容器
            document.querySelector('.game-container').classList.add('victory');

            // 为每张卡片添加胜利动画
            this.foundations.forEach(foundation => {
                foundation.forEach(card => {
                    card.element.classList.add('victory');
                });
            });

            // 创建礼花效果
            this.createFireworks();

            // 显示胜利消息
            this.showVictoryMessage();

            // 停止计时器
            clearInterval(this.timerInterval);
        }, 100);

        console.log('Victory state previewed');
    }

    // 修改 createFireworks 方法，增加更多礼花效果
    createFireworks() {
        const container = document.querySelector('.fireworks-container');
        const colors = ['#ff0', '#f0f', '#0ff', '#ff4444', '#44ff44', '#4444ff', '#ffaa00', '#ff00aa'];
        
        const createFirework = () => {
            for (let i = 0; i < 40; i++) {
                const particle = document.createElement('div');
                particle.className = 'firework-particle';
                
                // 随机起始位置
                const startX = Math.random() * window.innerWidth;
                const startY = window.innerHeight;
                
                particle.style.left = `${startX}px`;
                particle.style.top = `${startY}px`;
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                particle.style.boxShadow = `0 0 6px ${particle.style.backgroundColor}`;
                
                container.appendChild(particle);
                
                // 创建更自然的爆炸动画
                const angle = (Math.random() * Math.PI * 2);
                const velocity = 8 + Math.random() * 8;
                const moveX = Math.cos(angle) * velocity;
                const moveY = Math.sin(angle) * velocity;
                
                particle.animate([
                    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                    { transform: `translate(${moveX * 50}px, ${-moveY * 50}px) scale(0)`, opacity: 0 }
                ], {
                    duration: 1500 + Math.random() * 1000,
                    easing: 'cubic-bezier(0,0,0.2,1)',
                    fill: 'forwards'
                }).onfinish = () => particle.remove();
            }
        };

        // 创建��组礼花，持续时间更长
        for (let i = 0; i < 8; i++) {
            setTimeout(createFirework, i * 300);
        }

        // 持续创建礼花效果
        const interval = setInterval(createFirework, 800);
        setTimeout(() => clearInterval(interval), 8000);
    }

    // 添加胜利消息显示方法
    showVictoryMessage() {
        const message = document.querySelector('.victory-message');
        const scoreSpan = message.querySelector('.victory-score');
        const timeSpan = message.querySelector('.victory-time');
        
        scoreSpan.textContent = this.score;
        timeSpan.textContent = `${Math.floor(this.timer / 60)}分${this.timer % 60}秒`;
        
        message.classList.add('show');
        
        // 3秒后隐藏消息
        setTimeout(() => {
            message.classList.remove('show');
        }, 3000);
    }

    /**
     * 添加提示系统 - 查找可能的移动
     */
    findPossibleMoves() {
        this.hints = [];
        
        // 检查waste堆顶牌的可能移动
        if (this.waste.length > 0) {
            const wasteCard = this.waste[this.waste.length - 1];
            this.checkCardMoves(wasteCard, 'waste-0');
        }

        // 检查tableau中每列顶牌的可能移动
        this.tableau.forEach((pile, index) => {
            if (pile.length > 0) {
                const topCard = pile[pile.length - 1];
                this.checkCardMoves(topCard, `tableau-${index}`);
            }
        });

        // 如果找到提示，高亮显示
        if (this.hints.length > 0 && !this.showingHint) {
            this.showNextHint();
        }
    }

    /**
     * 检查单张卡片的可能移动
     */
    checkCardMoves(card, sourceId) {
        // 检查是否可以移动到foundation
        this.foundations.forEach((foundation, index) => {
            if (this.canMoveToFoundation(card)) {
                this.hints.push({
                    card: card,
                    sourceId: sourceId,
                    targetId: `foundation-${index}`,
                    type: 'foundation'
                });
            }
        });

        // 检查是否可以移动到tableau
        this.tableau.forEach((pile, index) => {
            if (this.isValidMove(card, `tableau-${index}`)) {
                this.hints.push({
                    card: card,
                    sourceId: sourceId,
                    targetId: `tableau-${index}`,
                    type: 'tableau'
                });
            }
        });
    }

    /**
     * 显示下一个提示
     */
    showNextHint() {
        if (this.hints.length === 0) return;
        
        this.showingHint = true;
        const hint = this.hints[0];
        
        // 高亮显示源卡片和目标位置
        hint.card.element.classList.add('hint-source');
        document.getElementById(hint.targetId).classList.add('hint-target');
        
        // 3秒后移除高亮
        setTimeout(() => {
            hint.card.element.classList.remove('hint-source');
            document.getElementById(hint.targetId).classList.remove('hint-target');
            this.showingHint = false;
        }, 3000);
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new Solitaire();
    console.log('Game initialized'); // 调试用
}); 