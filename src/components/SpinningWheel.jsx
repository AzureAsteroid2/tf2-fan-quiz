import { useState } from 'react';

function SpinningWheel({ answers, onSelect }) {
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);

    const spinWheel = () => {
        // Random rotation between 2000 and 5000 degrees
        const newRotation = rotation + 2000 + Math.random() * 3000;
        setIsSpinning(true);
        setRotation(newRotation);

        // Calculate final position after spin
        setTimeout(() => {
            setIsSpinning(false);
            const segment = 360 / answers.length;
            const finalRotation = newRotation % 360;
            const selectedIndex = Math.floor((360 - finalRotation) / segment);
            onSelect(answers[selectedIndex]);
        }, 3000); // Match this with CSS animation duration
    };

    return (
        <div className="wheel-container">
            <div
                className={`wheel ${isSpinning ? 'spinning' : ''}`}
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                {answers.map((answer, index) => {
                    const angle = (360 / answers.length) * index;
                    return (
                        <div
                            key={index}
                            className="wheel-segment"
                            style={{
                                transform: `rotate(${angle}deg) translateY(-50%)`,
                            }}
                        >
                            {answer.text}
                        </div>
                    );
                })}
            </div>
            <button
                onClick={spinWheel}
                disabled={isSpinning}
                className="spin-button"
            >
                Spin!
            </button>
        </div>
    );
}

export default SpinningWheel;