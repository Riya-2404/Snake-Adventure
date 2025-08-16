class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 600;
        this.canvas.height = 400;
        
        this.gridSize = 20;
        this.snake = [];
        this.food = {};
        this.hurdles = [];
        this.direction = 'right';
        this.score = 0;
        this.level = 1;
        this.gameLoop = null;
        this.isPaused = false;
        
        // Initialize audio
        this.audio = new AudioManager();
        this.isMuted = false;
        
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        // Initialize snake
        this.snake = [
            { x: 3, y: 1 },
            { x: 2, y: 1 },
            { x: 1, y: 1 }
        ];

        this.generateFood();
        this.generateHurdles();
        this.score = 0;
        this.updateScore();
        this.updateLevel();
    }

    generateFood() {
        do {
            this.food = {
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
            };
        } while (this.isCollision(this.food) || this.isHurdleCollision(this.food));
    }

    generateHurdles() {
        this.hurdles = [];
        const hurdleCount = this.level * 3; // Increase hurdles with level

        for (let i = 0; i < hurdleCount; i++) {
            let hurdle;
            do {
                hurdle = {
                    x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                    y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
                };
            } while (
                this.isCollision(hurdle) || 
                this.isHurdleCollision(hurdle) || 
                (hurdle.x === this.food.x && hurdle.y === this.food.y)
            );
            this.hurdles.push(hurdle);
        }
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    if (this.direction !== 'down') this.direction = 'up';
                    break;
                case 'ArrowDown':
                    if (this.direction !== 'up') this.direction = 'down';
                    break;
                case 'ArrowLeft':
                    if (this.direction !== 'right') this.direction = 'left';
                    break;
                case 'ArrowRight':
                    if (this.direction !== 'left') this.direction = 'right';
                    break;
                case ' ':
                    this.togglePause();
                    break;
            }
        });

        // Button event listeners
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());

        // Level selection
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.level = parseInt(e.target.dataset.level);
                document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Add sound control listeners
        document.getElementById('mute-btn').addEventListener('click', () => this.toggleMute());
        document.getElementById('game-mute-btn').addEventListener('click', () => this.toggleMute());
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteBtn = document.getElementById('mute-btn');
        const gameMuteBtn = document.getElementById('game-mute-btn');
        
        if (this.isMuted) {
            muteBtn.textContent = '🔇 Sound Off';
            gameMuteBtn.textContent = '🔇';
            this.audio.stopBackgroundMusic();
        } else {
            muteBtn.textContent = '🔊 Sound On';
            gameMuteBtn.textContent = '🔊';
            if (!this.isPaused && document.getElementById('game-screen').classList.contains('visible')) {
                this.audio.playBackgroundMusic();
            }
        }
    }

    startGame() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('visible');
        this.initializeGame();
        if (!this.isMuted) {
            this.audio.playBackgroundMusic();
        }
        this.gameLoop = setInterval(() => this.update(), 1000 / (5 + this.level * 2));
    }

    togglePause() {
        if (this.isPaused) {
            this.gameLoop = setInterval(() => this.update(), 1000 / (5 + this.level * 2));
            document.getElementById('pause-btn').textContent = 'Pause';
            if (!this.isMuted) {
                this.audio.playBackgroundMusic();
            }
        } else {
            clearInterval(this.gameLoop);
            document.getElementById('pause-btn').textContent = 'Resume';
            this.audio.stopBackgroundMusic();
        }
        this.isPaused = !this.isPaused;
    }

    update() {
        const head = { x: this.snake[0].x, y: this.snake[0].y };

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        if (this.isGameOver(head)) {
            if (!this.isMuted) {
                this.audio.playGameOverSound();
            }
            this.endGame();
            return;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            if (!this.isMuted) {
                this.audio.playEatSound();
            }
            this.score += 10 * this.level;
            this.updateScore();
            this.generateFood();
            
            if (this.score / (10 * this.level) % 5 === 0) {
                this.levelUp();
            }
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    isGameOver(head) {
        // Wall collision
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return true;
        }

        // Self collision
        if (this.isCollision(head)) {
            return true;
        }

        // Hurdle collision
        if (this.isHurdleCollision(head)) {
            return true;
        }

        return false;
    }

    isCollision(position) {
        return this.snake.some(segment => segment.x === position.x && segment.y === position.y);
    }

    isHurdleCollision(position) {
        return this.hurdles.some(hurdle => hurdle.x === position.x && hurdle.y === position.y);
    }

    levelUp() {
        this.level++;
        if (this.level > 3) this.level = 3;
        this.updateLevel();
        this.generateHurdles();
        if (!this.isMuted) {
            this.audio.playLevelUpSound();
        }
        clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), 1000 / (5 + this.level * 2));
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#4a90e2' : '#357abd';
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Draw food
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(
            this.food.x * this.gridSize,
            this.food.y * this.gridSize,
            this.gridSize - 2,
            this.gridSize - 2
        );

        // Draw hurdles
        this.ctx.fillStyle = '#95a5a6';
        this.hurdles.forEach(hurdle => {
            this.ctx.fillRect(
                hurdle.x * this.gridSize,
                hurdle.y * this.gridSize,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });
    }

    endGame() {
        clearInterval(this.gameLoop);
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('visible');
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
    }

    restartGame() {
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('visible');
        document.getElementById('start-screen').classList.remove('hidden');
        this.direction = 'right';
        this.isPaused = false;
        document.getElementById('pause-btn').textContent = 'Pause';
        this.audio.stopBackgroundMusic();
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    updateLevel() {
        document.getElementById('current-level').textContent = this.level;
    }
}

// Initialize game when window loads
window.onload = () => {
    new SnakeGame();
}; 