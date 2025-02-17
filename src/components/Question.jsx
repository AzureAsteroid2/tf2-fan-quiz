
import { useState } from 'react';

function Question({ question, answers, picture, onNextQuestion }) {
    const image_url = "../../public/Images/";
    const defaultImage = "heavy_stare.png";

    const [selectedAnswer, setSelectedAnswer] = useState(null);

    const handleAnswerSelect = (answer) => {
        setSelectedAnswer(answer);
    };

    const handleNext = () => {
        if (selectedAnswer) {
            onNextQuestion(selectedAnswer.value);
            setSelectedAnswer(null);
        }
    };

    return (
        <>
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
                            >
                                {answer.text}
                            </button>
                        ))}
                    </div>
                    <div>
                        <button
                            className="next-button"
                            onClick={handleNext}
                            disabled={!selectedAnswer}
                        >
                            Next
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

export default Question;