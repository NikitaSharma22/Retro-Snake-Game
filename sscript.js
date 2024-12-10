const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('start-button');
const endButton = document.getElementById('end-button');
const modal = document.getElementById('game-over-modal');
const finalScore = document.getElementById('final-score');
const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const chompSound = document.getElementById('chomp-sound');
const powerupSound = document.getElementById('powerup-sound');

const gridSize = 20;
const canvasSize = 400;
let snake = [{x: 9 * gridSize, y: 9 * gridSize}];
let food = {};
let direction = 'RIGHT';
let score = 0;
let gameInterval;
let goldenApple = null;
let slowDownPowerUp = null;
let goldenAppleTimeout = null;
let slowDownTimeout = null;
let isSlowActive = false;
let gameStartTime = Date.now(); // Track when the game started
let lastPowerUpTime = Date.now(); // Track the last power-up appearance
let powerUpInterval = 15000; // 15 seconds between power-ups
let isPowerUpAvailable = false; // Flag to control when power-ups can appear
let snakeSpeed = 250;
let initialSpeed = 500; // Default speed
let speedIncrement = 0; // Adjust this value for how much you want to speed up


canvas.width = canvasSize;
canvas.height = canvasSize;

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
    if (event.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
    if (event.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
    if (event.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
});

function startGame(difficulty) {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';

    // Set speed and increment based on difficulty
    if (difficulty === 'easy') {
        initialSpeed = 500;
        speedIncrement = 0;
    } else if (difficulty === 'medium') {
        initialSpeed = 300;
        speedIncrement = 5;
    } else if (difficulty === 'hard') {
        initialSpeed = 150;
        speedIncrement = 10;
    }

    snakeSpeed = initialSpeed; // Set the game speed
    score = 0;
    scoreElement.textContent = score;
    snake = [{x: 9 * gridSize, y: 9 * gridSize}];
    direction = 'RIGHT';
    generateFood();
    gameInterval = setInterval(gameLoop, snakeSpeed);
}


function gameLoop() {
    const head = { ...snake[0] };

    if (direction === 'UP') head.y -= gridSize;
    if (direction === 'DOWN') head.y += gridSize;
    if (direction === 'LEFT') head.x -= gridSize;
    if (direction === 'RIGHT') head.x += gridSize;

    // Collision with walls or self
    if (head.x < 0 || head.x >= canvasSize || head.y < 0 || head.y >= canvasSize || snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame();
        return;
    }

    snake.unshift(head);

    // Check for food collision
    if (head.x === food.x && head.y === food.y) {
        chompSound.play();
        score += 10;
        scoreElement.textContent = score;
        generateFood();
        increaseSpeed();
    } else if (goldenApple && head.x === goldenApple.x && head.y === goldenApple.y) {
        powerupSound.play();
        score += 30;
        scoreElement.textContent = score;
        goldenApple = null;
        clearTimeout(goldenAppleTimeout);
        isPowerUpAvailable = false; // Allow new power-up
    } else if (slowDownPowerUp && head.x === slowDownPowerUp.x && head.y === slowDownPowerUp.y) {
        if (!isSlowActive) {
            isSlowActive = true;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, snakeSpeed + 200); // Slower speed
            setTimeout(() => {
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, snakeSpeed);
                isSlowActive = false;
            }, 7000); // 7 seconds
        }
        slowDownPowerUp = null;
        clearTimeout(slowDownTimeout);
        isPowerUpAvailable = false; // Allow new power-up
    } else {
        snake.pop();
    }
     
    drawGame();
    drawPowerUps();
    generatePowerUps(); // Check if a new power-up should appear
    onFoodEaten();
    onPowerUpAppear();

}

function drawPowerUps() {
    if (goldenApple) {
        ctx.fillStyle = goldenAppleVisible ? "green" : "transparent"; // Blinking effect
        ctx.fillRect(goldenApple.x, goldenApple.y, gridSize, gridSize);
        goldenAppleVisible = !goldenAppleVisible; // Toggle visibility
    }

    if (slowDownPowerUp) {
        context.fillStyle = "blue";
        context.beginPath();
        context.arc(
            slowDownPowerUp.x + gridSize / 2,
            slowDownPowerUp.y + gridSize / 2,
            gridSize / 2,
            0,
            2 * Math.PI
        );
        context.fill();
    }
}


function increaseSpeed() {
    if (speedIncrement > 0) {
        clearInterval(gameInterval);
        snakeSpeed = Math.max(100, snakeSpeed - speedIncrement); // Prevent speed from going too fast
        gameInterval = setInterval(gameLoop, snakeSpeed);
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Snake
    snake.forEach(segment => {
        ctx.fillStyle = '#ffff66';
        ctx.fillRect(segment.x, segment.y, gridSize, gridSize);
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 2;
        ctx.strokeRect(segment.x, segment.y, gridSize, gridSize);
    });

    // Draw Regular Food
    ctx.fillStyle = '#ff5722';
    ctx.beginPath();
    ctx.arc(food.x + gridSize / 2, food.y + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw Golden Apple
    if (goldenApple) {
        const blink = Math.floor(Date.now() / 200) % 2; // Fast blinking
        ctx.fillStyle = blink ? '#00ff00' : '#1a1a1a';
        ctx.beginPath();
        ctx.arc(goldenApple.x + gridSize / 2, goldenApple.y + gridSize / 2, gridSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Slow-Down Power-Up
    if (slowDownPowerUp) {
        ctx.fillStyle = '#79f6fc';
        ctx.beginPath();
        ctx.arc(slowDownPowerUp.x + gridSize / 2, slowDownPowerUp.y + gridSize / 2, gridSize / 1.5, 0, Math.PI * 2); // Slightly bigger
        ctx.fill();
    }
}

function generateFood() {
    const x = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;
    const y = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;
    food = { x, y };
}

function saveScore() {
    const scores = JSON.parse(localStorage.getItem('snakeScores')) || [];
    scores.push(score);

    // Sort scores in descending order and keep only the top 3
    scores.sort((a, b) => b - a);
    const topScores = scores.slice(0, 3);

    // Save updated scores back to localStorage
    localStorage.setItem('snakeScores', JSON.stringify(topScores));

    return topScores;
}

function displayTopScores(currentScore, topScores) {
    const modalContent = document.querySelector('.modal-content');
    const topScoresHtml = topScores.map((s, index) => {
        const isCurrentScore = s === currentScore;
        return `
            <div style="margin: 10px; padding: 10px; border: 2px solid ${isCurrentScore ? '#ff5722' : '#fff'}; background: ${isCurrentScore ? '#e64a19' : '#1a1a1a'}">
                <strong>Rank ${index + 1}: ${s}</strong>
            </div>
        `;
    }).join('');

    modalContent.innerHTML = `
        <h2>Game Over!</h2>
        <p>Total Score: <span id="final-score">${currentScore}</span></p>
        <div class="top-scores">
            <h3>Top Scores:</h3>
            ${topScoresHtml}
        </div>
        <div class="modal-buttons">
            <button id="retry-button" onclick="restartGame()">Retry</button>
            <button id="end-game-button" onclick="endGameFromPopup()">End Game</button>
        </div>
    `;
}

function endGame() {
    clearInterval(gameInterval);

    // Save current score and get updated top scores
    const topScores = saveScore();

    // Display Game Over modal with top scores
    displayTopScores(score, topScores);

    modal.style.display = 'flex';
}

function restartGame() {
    modal.style.display = 'none';
    startGame();
}

function endGameFromPopup() {
    modal.style.display = 'none';
    startScreen.style.display = 'flex';
    gameContainer.style.display = 'none';
}

function generateGoldenApple() {
    const x = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;
    const y = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;
    goldenApple = { x, y };

    // Remove Golden Apple after 5 seconds
    goldenAppleTimeout = setTimeout(() => {
        goldenApple = null;
        isPowerUpAvailable = false;
    }, 5000);
}

function generateSlowDownPowerUp() {
    const x = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;
    const y = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;
    slowDownPowerUp = { x, y };

    // Remove after some time if needed
    slowDownTimeout = setTimeout(() => {
        slowDownPowerUp = null;
        isPowerUpAvailable = false;
    }, 10000); // Optional
}

function generatePowerUps() {
    const currentTime = Date.now();

    console.log("Game Time:", (currentTime - gameStartTime) / 1000, "seconds");

    if (currentTime - gameStartTime >= 30000) { // After 30s of gameplay
        console.log("Power-ups eligible to spawn.");

        if (currentTime - lastPowerUpTime >= powerUpInterval && !isPowerUpAvailable) {
            console.log("Generating a new power-up...");

            // Power-up spawn logic
            const powerUpType = Math.random() < 0.5 ? "goldenApple" : "slowDown"; // 50/50 chance
            const x = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;
            const y = Math.floor(Math.random() * (canvasSize / gridSize)) * gridSize;

            if (powerUpType === "goldenApple") {
                generateGoldenApple();
                goldenApple = { x, y };
                onPowerUpAppear();
                goldenAppleTimeout = setTimeout(() => {
                    goldenApple = null;
                    isPowerUpAvailable = false;
                }, 5000); // 5 seconds before it vanishes
            } else {
                generateSlowDownPowerUp();
                slowDownPowerUp = { x, y };
                onPowerUpAppear();
                slowDownTimeout = setTimeout(() => {
                    slowDownPowerUp = null;
                    isPowerUpAvailable = false; // Reset for new power-up
                }, 5000); // 5 seconds visibility
            }

            isPowerUpAvailable = true;
            lastPowerUpTime = currentTime;
        } else {
            console.log("Power-up interval not yet met or one is already active.");
        }
    } else {
        console.log("Power-ups not eligible yet.");
    }
}

document.getElementById('start-game-btn').addEventListener('click', () => {
    chompSound.play().catch(() => {});
    powerupSound.play().catch(() => {});
    // Other game start logic
});
startButton.addEventListener('click', () => {
    chompSound.play().catch(() => {}); // Silent failure if not allowed yet
    powerupSound.play().catch(() => {});
    startGame('medium'); // Default difficulty
});
chompSound.addEventListener('error', (e) => {
    console.error("Chomp sound error:", e);
});
powerupSound.addEventListener('error', (e) => {
    console.error("Powerup sound error:", e);
});
function onPowerUpAppear() {
    // Play power-up appearance sound
    if (powerupSound) {
        powerupSound.currentTime = 0; // Reset sound to start
        powerupSound.play().catch((err) => {
            console.warn("Power-up appearance sound issue:", err);
        });
    }
}

