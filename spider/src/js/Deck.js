class Deck {
    constructor(difficulty = 'easy') {
        this.cards = [];
        this.difficulty = difficulty;
        this.initDeck();
    }

    initDeck() {
        let suits;
        switch (this.difficulty) {
            case 'easy':
                suits = ['♠']; // 简单模式只用黑桃
                break;
            case 'medium':
                suits = ['♠', '♥']; // 中等模式用黑桃和红心
                break;
            case 'hard':
                suits = ['♠', '♥', '♣', '♦']; // 困难模式用所有花色
                break;
            default:
                suits = ['♠'];
        }

        const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        // 确保总牌数为104张
        const repetitions = Math.floor(104 / (suits.length * 13));
        
        for (let i = 0; i < repetitions; i++) {
            suits.forEach(suit => {
                ranks.forEach((rank, index) => {
                    this.cards.push(new Card(suit, rank, index + 1));
                });
            });
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        return this.cards.pop();
    }
} 