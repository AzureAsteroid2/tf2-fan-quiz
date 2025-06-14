import { useEffect, useRef, useState } from 'react';
import ballImageSource from '/Images/ball.png';
function Pong({ onGameEnd }) {
    const canvasRef = useRef(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const winnerText = useRef("Game Over");

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const win_max = 1;
        const ballImage = new Image();
        ballImage.src = ballImageSource;
        // Game objects
        const ball = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            radius: 20,
            speedX: 10,
            speedY: 7,
            speedIncrement: 1.1,
            width: 40,
            height: 40
        };

        const paddle = {
            width: 10,
            height: 100,
            y: canvas.height / 2 - 50
        };

        const player = {
            x: 10,
            score: 0
        };

        const computer = {
            x: canvas.width - 20,
            y: canvas.height / 2 - 50,
            speed: 4,
            score: 0
        };

        function draw() {
            // Clear canvas
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw ball image instead of circle
            ctx.drawImage(
                ballImage,
                ball.x - ball.width/2,
                ball.y - ball.height/2,
                ball.width,
                ball.height
            );

            // Draw paddles
            ctx.fillStyle = 'white';
            ctx.fillRect(player.x, paddle.y, paddle.width, paddle.height);
            ctx.fillRect(computer.x, computer.y, paddle.width, paddle.height);

            // Draw scores
            ctx.font = '30px Arial';
            ctx.fillText(player.score, canvas.width/4, 50);
            ctx.fillText(computer.score, 3*canvas.width/4, 50);

            // Draw game over text if game is over
            if (isGameOver) {
                ctx.font = '48px Arial';
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.fillText(
                    winnerText.current,
                    canvas.width/2,
                    canvas.height/2
                );
            }
        }

        function update() {
            if (isGameOver) return;

            // Move ball
            ball.x -= ball.speedX;
            ball.y -= ball.speedY;

            // Ball collision with top and bottom
            if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
                ball.speedY = -ball.speedY;
            }

            // Ball collision with paddles
            if(
                (ball.x - ball.radius < player.x + paddle.width &&
                    ball.y > paddle.y && ball.y < paddle.y + paddle.height) ||
            (ball.x + ball.radius > computer.x &&
                ball.y > computer.y && ball.y < computer.y + paddle.height))
             {
                ball.speedX = -(ball.speedX * ball.speedIncrement);
            }

            const computerCenter = computer.y + paddle.height/2;
            const ballCenter = ball.y;
            if (computerCenter < ballCenter - 35) {
                computer.y += computer.speed;
            } else if (computerCenter > ballCenter + 35) {
                computer.y -= computer.speed;
            }

            if (ball.x < 0) {
                computer.score++;
                resetBall();
            } else if (ball.x > canvas.width) {
                player.score++;
                resetBall();
            }

            // Check for game end
            if (player.score >= win_max || computer.score >= win_max) {
                if (player.score > computer.score) {
                    winnerText.current = "You Win!";
                }
                else{
                    winnerText.current = "Game Over!";
                }
                setIsGameOver(true);
                setTimeout(() => {
                    onGameEnd(player.score >= win_max);
                }, 3000);
            }
        }

        function resetBall() {
            ball.x = canvas.width/2;
            ball.y = canvas.height/2;
            ball.speedX = -ball.speedX;
        }

        // Handle mouse movement
        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const newY = e.clientY - rect.top - paddle.height/2;
            // Keep paddle within canvas bounds
            paddle.y = Math.max(0, Math.min(canvas.height - paddle.height, newY));
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        // Game loop
        let animationFrameId;
        function gameLoop() {
            update();
            draw();
            if (!isGameOver) {
                animationFrameId = requestAnimationFrame(gameLoop);
            }
        }

            gameLoop();

        return () => {
            canvas.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [isGameOver, onGameEnd]);

    return (
        <div className="pong-container">
            <canvas
                ref={canvasRef}
                width={800}
                height={400}
                style={{ border: '1px solid white' }}
            />
        </div>
    );
}

export default Pong;