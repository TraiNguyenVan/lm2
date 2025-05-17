class TaiXiuGame {
    constructor() {
        this.balance = 1000;
        this.betAmount = 0;
        this.playerBet = ''; // 'tai' or 'xiu'
        this.gamePhase = 'waiting'; // waiting, betting, revealing
        this.gameTimer = 0;
        this.diceValues = [1, 1, 1];
        this.soundPlayed = false;
        this.seed = 0; // For consistent random numbers
        this.currentLang = 'en'; // Default language
        this.revealed = false; // Add revealed flag
        
        // Game statistics
        this.gameHistory = [];
        this.winStreak = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 1000;
        this.taiCount = 0;
        this.totalGames = 0;

        // Translations
        this.translations = {
            en: {
                nextRound: "Next round in %s",
                bettingTime: "Betting time: %s",
                revealing: "Revealing in %s",
                youWon: "You won! (%s)",
                youLost: "You lost! (%s)",
                noBet: "No bet placed (%s)",
                insufficientBalance: "Insufficient balance!",
                cannotBet: "Cannot bet at this time"
            },
            vi: {
                nextRound: "Ván mới sau %s giây",
                bettingTime: "Thời gian đặt cược: %s giây",
                revealing: "Kết quả sau %s giây",
                youWon: "Bạn thắng! (%s)",
                youLost: "Bạn thua! (%s)",
                noBet: "Không đặt cược (%s)",
                insufficientBalance: "Số dư không đủ!",
                cannotBet: "Không thể đặt cược lúc này"
            }
        };

        // DOM Elements
        this.balanceElement = document.getElementById('balance');
        this.timerElement = document.getElementById('timer');
        this.betAmountInput = document.getElementById('betAmount');
        this.betTaiButton = document.getElementById('betTai');
        this.betXiuButton = document.getElementById('betXiu');
        this.resultElement = document.getElementById('result');
        this.diceElements = [
            document.getElementById('dice1'),
            document.getElementById('dice2'),
            document.getElementById('dice3')
        ];
        this.rollSound = document.getElementById('rollSound');        // Load additional sounds
        this.winSound = document.getElementById('winSound');
        this.loseSound = document.getElementById('loseSound');
        
        // Initialize
        this.init();
    }    init() {
        this.updateBalance();
        this.setupEventListeners();
        this.startGameLoop();
        this.setupLanguageSwitch();
    }

    setupEventListeners() {
        this.betTaiButton.addEventListener('click', () => this.placeBet('tai'));
        this.betXiuButton.addEventListener('click', () => this.placeBet('xiu'));
    }

    setupLanguageSwitch() {
        const langEn = document.getElementById('langEn');
        const langVi = document.getElementById('langVi');

        langEn.addEventListener('click', () => this.switchLanguage('en'));
        langVi.addEventListener('click', () => this.switchLanguage('vi'));
    }

    switchLanguage(lang) {
        this.currentLang = lang;
        document.getElementById('langEn').classList.toggle('active', lang === 'en');
        document.getElementById('langVi').classList.toggle('active', lang === 'vi');

        // Update all translatable elements
        document.querySelectorAll('[data-lang-en]').forEach(element => {
            element.textContent = element.getAttribute(`data-lang-${lang}`);
        });

        // Update current display
        this.updateDisplay();
    }

    updateBalance() {
        this.balanceElement.textContent = this.balance;
    }    placeBet(type) {
        if (this.gamePhase !== 'betting') {
            console.log(this.translations[this.currentLang].cannotBet);
            return;
        }

        const amount = parseInt(this.betAmountInput.value);
        if (amount > this.balance) {
            alert(this.translations[this.currentLang].insufficientBalance);
            return;
        }

        this.betAmount = amount;
        this.playerBet = type;
        this.balance -= amount;
        this.updateBalance();
        
        this.betTaiButton.disabled = true;
        this.betXiuButton.disabled = true;
        
        console.log(`Bet placed: ${type.toUpperCase()} for $${amount}`);
    }    startGameLoop() {
        this.gameLoop = setInterval(() => {
            const now = new Date();
            const seconds = now.getSeconds();
            
            if (seconds < 15) {
                if (this.gamePhase !== 'waiting') {
                    this.gamePhase = 'waiting';
                    this.showDicesForWaiting();
                }
                this.gameTimer = 15 - seconds;
            } else if (seconds < 45) {
                if (this.gamePhase !== 'betting') {
                    this.gamePhase = 'betting';
                    this.hideDicesForBetting();
                }
                this.gameTimer = 45 - seconds;
            } else {
                if (this.gamePhase !== 'revealing') {
                    this.gamePhase = 'revealing';
                    this.generateResult();
                }
                this.gameTimer = 60 - seconds;
                if (this.gameTimer <= 5 && !this.revealed) {
                    this.revealResult();
                }
            }
            
            this.updateDisplay();
        }, 1000);
    }    showDicesForWaiting() {
        this.diceElements.forEach(dice => dice.classList.add('visible'));
        const mainCover = document.querySelector('.main-cover');
        mainCover.classList.add('revealed');
    }

    hideDicesForBetting() {
        this.diceElements.forEach(dice => dice.classList.remove('visible'));
        const mainCover = document.querySelector('.main-cover');
        mainCover.classList.remove('revealed');
    }    resetForBetting() {
        this.betAmount = 0;
        this.playerBet = '';
        this.betTaiButton.disabled = false;
        this.betXiuButton.disabled = false;
        this.resultElement.textContent = '';
        this.soundPlayed = false;
    }    resetGame() {
        this.betAmount = 0;
        this.playerBet = '';
        this.betTaiButton.disabled = false;
        this.betXiuButton.disabled = false;
        this.resultElement.textContent = '';
        this.soundPlayed = false;
        this.revealed = false;
    }    generateResult() {
        // Generate a seed based on the current minute
        const now = new Date();
        const newSeed = now.getMinutes();
        
        // Only generate new results if we're in a new minute
        if (newSeed !== this.seed) {
            this.seed = newSeed;
            // Use the seed to generate consistent results across all clients
            const seededRandom = () => {
                let x = Math.sin(this.seed++) * 10000;
                return Math.floor((x - Math.floor(x)) * 6) + 1;
            };
            
            this.diceValues = Array(3).fill(0).map(() => seededRandom());
        }
        
        // Update dice images but keep them covered
        this.diceElements.forEach((dice, index) => {
            const img = dice.querySelector('.dice-image');
            img.src = `images/dice${this.diceValues[index]}.png`;
        });
    }    revealResult() {
        if (this.revealed) return; // Prevent multiple reveals
        this.revealed = true;

        if (!this.soundPlayed) {
            this.rollSound.play();
            this.soundPlayed = true;
        }

        // Make dice visible first
        this.diceElements.forEach(dice => {
            dice.classList.add('visible');
        });
        
        // Remove the cover with animation
        const mainCover = document.querySelector('.main-cover');
        mainCover.classList.add('revealed');

        const sum = this.diceValues.reduce((a, b) => a + b, 0);
        const result = sum > 10 ? 'tai' : 'xiu';
        
        console.log(`Game Result: ${result.toUpperCase()} (Sum: ${sum})`);
        
        // Update game history and stats first
        this.updateGameHistory(result, sum);
        this.updateGameStats(result);
        
        // Calculate winnings and show result
        if (this.playerBet === result) {
            this.balance += this.betAmount * 2;
            this.resultElement.textContent = this.translations[this.currentLang].youWon.replace('%s', sum);
            this.resultElement.style.color = '#4CAF50';
            setTimeout(() => this.winSound.play(), 500); // Play win sound after reveal animation
        } else if (this.playerBet) {
            this.resultElement.textContent = this.translations[this.currentLang].youLost.replace('%s', sum);
            this.resultElement.style.color = '#f44336';
            setTimeout(() => this.loseSound.play(), 500); // Play lose sound after reveal animation
        } else {
            this.resultElement.textContent = this.translations[this.currentLang].noBet.replace('%s', sum);
            this.resultElement.style.color = '#FFC107';
        }
        
        this.updateBalance();
    }    updateDisplay() {
        let messageKey = '';
        switch (this.gamePhase) {
            case 'waiting':
                messageKey = 'nextRound';
                this.timerElement.parentElement.style.borderColor = '#FFC107';
                break;
            case 'betting':
                messageKey = 'bettingTime';
                this.timerElement.parentElement.style.borderColor = '#2196F3';
                break;
            case 'revealing':
                messageKey = 'revealing';
                this.timerElement.parentElement.style.borderColor = '#4CAF50';
                break;
        }
        
        const message = this.translations[this.currentLang][messageKey].replace('%s', this.gameTimer);
        this.timerElement.textContent = message;
    }

    updateGameHistory(result, sum) {
        // Add new result to history
        this.gameHistory.unshift({ result, sum });
        if (this.gameHistory.length > 10) {
            this.gameHistory.pop();
        }

        // Update history display
        const historyGrid = document.getElementById('historyGrid');
        historyGrid.innerHTML = '';
        this.gameHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item history-${item.result}`;
            historyItem.textContent = item.sum;
            historyGrid.appendChild(historyItem);
        });
    }    updateGameStats(result) {
        this.totalGames++;
        if (result === 'tai') {
            this.taiCount++;
        }

        // Update win streak
        if (this.playerBet === result) {
            this.winStreak++;
            document.getElementById('winStreak').textContent = this.winStreak;
            document.getElementById('winStreak').classList.add('winning-streak');
        } else if (this.playerBet) {
            this.winStreak = 0;
            document.getElementById('winStreak').textContent = '0';
            document.getElementById('winStreak').classList.remove('winning-streak');
        }

        // Update high score
        if (this.balance > this.highScore) {
            this.highScore = this.balance;
            localStorage.setItem('highScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
        }

        // Update Tài trend
        const taiPercentage = (this.taiCount / this.totalGames) * 100;
        document.getElementById('taiTrend').style.width = `${taiPercentage}%`;
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new TaiXiuGame();
});
