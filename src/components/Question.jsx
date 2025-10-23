import { useRef, useState } from 'react';

function Question({ question, answers, picture, onNextQuestion }) {
    const image_url = "./Images/";
    const defaultImage = "heavy_stare.png";

    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isGambling, setIsGambling] = useState(false);
    const [cycleInterval, setCycleInterval] = useState(null);
    const gambleAudioStart = useRef(new Audio("./sounds/gamble_start.mp3"));
    const gambleAudioEnd = useRef(new Audio("./sounds/gamble_end.mp3"));
    const successAudio = useRef(new Audio("./sounds/success.mp3"));
    const failAudio = useRef(new Audio("./sounds/fail.mp3"));


    const handleAnswerSelect = (answer) => {
        if (!isGambling) {
            setSelectedAnswer(answer);
        }
    };

    const handleGamble = () => {
        setIsGambling(true);

        // Play start sound
        const audioStart = gambleAudioStart.current;
        audioStart.currentTime = 0;
        audioStart.loop = false;
        audioStart.play().catch((e) => {
            console.log("Start sound play blocked", e);
        });

        let currentIndex = 0;
        const interval = setInterval(() => {
            setSelectedAnswer(answers[currentIndex]);
            currentIndex = (currentIndex + 1) % answers.length;
        }, 100);

        const duration = 1000 + Math.random() * 2000;
        setTimeout(() => {
            clearInterval(interval);
            const randomIndex = Math.floor(Math.random() * answers.length);
            const selected = answers[randomIndex];
            setSelectedAnswer(selected);
            setIsGambling(false);

            // Play end sound fresh
            const endSound = new Audio("./sounds/gamble_end.mp3");
            endSound.currentTime = 0;
            endSound.play().catch((e) => {
                console.log("End sound play blocked", e);
            });

            setTimeout(() => {
                onNextQuestion(selected.value);
                setSelectedAnswer(null);
            }, 500);

        }, duration);
    };



    const handleNext = () => {
        if (selectedAnswer) {
            // Find the highest value answer
            const maxValue = Math.max(...answers.map(a => a.value));
            const isTopAnswer = selectedAnswer.value === maxValue;
            
            // Play appropriate sound
            const audio = isTopAnswer ? successAudio.current : failAudio.current;
            audio.currentTime = 0;
            audio.play().catch((e) => {
                console.log("Sound play blocked", e);
            });
            
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
