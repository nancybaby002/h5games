class Card {
    constructor(suit, rank, value) {
        this.suit = suit;
        this.rank = rank;
        this.value = value;
        this.faceUp = false;
        this.element = this.createCardElement();
        this.isDragging = false;
        this.setupDragEvents();
    }

    createCardElement() {
        const card = document.createElement('div');
        card.className = 'card';
        card.draggable = true;
        
        const front = document.createElement('div');
        front.className = 'card-front';
        
        const back = document.createElement('div');
        back.className = 'card-back';

        const isRed = this.suit === '♥' || this.suit === '♦';
        const suitClass = isRed ? 'red' : 'black';
        
        front.innerHTML = `
            <div class="card-corner top-left ${suitClass}">
                <div class="rank">${this.rank}</div>
                <div class="suit">${this.suit}</div>
            </div>
            ${this.createCardPattern()}
            <div class="card-corner bottom-right ${suitClass}">
                <div class="rank">${this.rank}</div>
                <div class="suit">${this.suit}</div>
            </div>
        `;

        card.appendChild(front);
        card.appendChild(back);
        
        return card;
    }

    createCardPattern() {
        const isRed = this.suit === '♥' || this.suit === '♦';
        const suitClass = isRed ? 'red' : 'black';

        if (this.rank === 'A') {
            return `<div class="card-center ${suitClass}">
                <div class="big-suit">${this.suit}</div>
            </div>`;
        } 
        
        if (this.rank === 'K' || this.rank === 'Q' || this.rank === 'J') {
            const faceCard = this.rank === 'K' ? '♔' : this.rank === 'Q' ? '♕' : '♖';
            return `<div class="card-center ${suitClass}">
                <div class="face-card">${faceCard}</div>
                <div class="suit-small">${this.suit}</div>
            </div>`;
        }

        // 数字牌只显示一个大花色
        const count = parseInt(this.rank) || 10;
        return `<div class="card-center ${suitClass}">
            <div class="number-rank">${this.rank}</div>
            <div class="center-suit">${this.suit}</div>
        </div>`;
    }

    setupDragEvents() {
        this.element.addEventListener('dragstart', (e) => {
            this.isDragging = true;
            this.element.classList.add('dragging');
            e.dataTransfer.setData('text/plain', '');
            e.dataTransfer.effectAllowed = 'move';
        });

        this.element.addEventListener('dragend', () => {
            this.isDragging = false;
            this.element.classList.remove('dragging');
        });
    }

    flip() {
        this.faceUp = !this.faceUp;
        if (this.faceUp) {
            this.element.classList.add('flipped');
        } else {
            this.element.classList.remove('flipped');
        }
    }

    show() {
        if (!this.faceUp) {
            this.flip();
        }
    }

    hide() {
        if (this.faceUp) {
            this.flip();
        }
    }
} 