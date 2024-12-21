// 工具函数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function isDescendingSequence(cards) {
    for (let i = 0; i < cards.length - 1; i++) {
        if (cards[i].value !== cards[i + 1].value + 1 || 
            cards[i].suit !== cards[i + 1].suit) {
            return false;
        }
    }
    return true;
} 