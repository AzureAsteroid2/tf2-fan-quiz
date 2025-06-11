import { useState } from 'react';

function Question({ question, answers, picture, onNextQuestion }) {
    const image_url = "../Images/";
    const defaultImage = "heavy_stare.png";

    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isGambling, setIsGambling] = useState(false);
    const [cycleInterval, setCycleInterval] = useState(null);

    const handleAnswerSelect = (answer) => {
        if (!isGambling) {
            setSelectedAnswer(answer);
        }
    };

    const handleGamble = () => {
        setIsGambling(true);
        let currentIndex = 0;

        const interval = setInterval(() => {
            setSelectedAnswer(answers[currentIndex]);
            currentIndex = (currentIndex + 1) % answers.length;
        }, 100);

        setCycleInterval(interval);

        setTimeout(() => {
            clearInterval(interval);
            const randomIndex = Math.floor(Math.random() * answers.length);
            setSelectedAnswer(answers[randomIndex]);
            setIsGambling(false);
        }, 1000 + Math.random() * 2000);
    };

    const handleNext = () => {
        if (selectedAnswer) {
            onNextQuestion(selectedAnswer.value);
            setSelectedAnswer(null);
            setIsGambling(false);
        }
    };

    return (
        <div className="question-container">
            <h2>{question}</h2>
            <img
                src={image_url + (picture || defaultImage)}
                alt="Question"
                className="question-image"
            />

            <form onSubmit={(e) => e.preventDefault()}>
                <div className="answers-container">
                    {answers.map((answer, index) => (
                        <button
                            key={index}
                            type="button"
                            className={`answer-button ${selectedAnswer === answer ? 'selected' : ''}`}
                            onClick={() => handleAnswerSelect(answer)}
                            disabled={isGambling}
                        >
                            {answer.text}
                        </button>
                    ))}
                </div>

                <div className="button-container">
                    <button
                        type="button"
                        className="gamble-button"
                        onClick={handleGamble}
                        disabled={isGambling}
                    >
                        Gamble!
                    </button>

                    <button
                        type="button"
                        className="next-button"
                        onClick={handleNext}
                        disabled={!selectedAnswer || isGambling}
                    >
                        Next
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Question;