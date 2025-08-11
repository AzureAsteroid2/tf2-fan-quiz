import { useState, useEffect } from 'react';

const classes = [
    { name: 'Scout', image: './Images/class_silhouettes/scout.png' },
    { name: 'Spy', image: './Images/class_silhouettes/spy.png' },
    { name: 'Soldier', image: './Images/class_silhouettes/soldier.png' },
    { name: 'Pyro', image: './Images/class_silhouettes/pyro.png' },
    { name: 'Demoman', image: './Images/class_silhouettes/demoman.png' },
    { name: 'Heavy', image: './Images/class_silhouettes/heavy.png' },
    { name: 'Engineer', image: './Images/class_silhouettes/engineer.png' },
    { name: 'Medic', image: './Images/class_silhouettes/medic.png' },
    { name: 'Sniper', image: './Images/class_silhouettes/sniper.png' },
    // Add all 9 class_silhouettes
];

function ClassGuess({ setTotalScore, onComplete }) {
    const NUM_ROUNDS = 3;
    const [round, setRound] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [current, setCurrent] = useState(null);
    const [options, setOptions] = useState([]);

    useEffect(() => {
        const shuffled = [...classes].sort(() => Math.random() - 0.5);
        const sel = shuffled.slice(0, NUM_ROUNDS);
        setSelectedClasses(sel);
        setCurrent(sel[0]);
        generateOptions(sel[0]);
    }, []);

    const generateOptions = (curr) => {
        const wrong = [...classes]
            .filter(c => c.name !== curr.name)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        const opts = [...wrong, curr].sort(() => Math.random() - 0.5);
        setOptions(opts);
    };

    const guess = (choice) => {
        if (choice === current.name) {
            setScore(s => s + 1);
            setTotalScore(prev => prev + 4);
        }
        if (round < NUM_ROUNDS - 1) {
            const nextRound = round + 1;
            setRound(nextRound);
            const nextCurr = selectedClasses[nextRound];
            setCurrent(nextCurr);
            generateOptions(nextCurr);
        } else {
            setRound(NUM_ROUNDS);
        }
    };

    return (
        <div className="mini-game">
            <h3>Guess the TF2 Class</h3>
            {round < NUM_ROUNDS ? (
                <>
                    <img src={current?.image} alt="Silhouette" style={{ filter: 'blur(5px)' }} />
                    <div className="answers-container">
                        {options.map((cls) => (
                            <button key={cls.name} className="answer-button" onClick={() => guess(cls.name)}>{cls.name}</button>
                        ))}
                    </div>
                </>
            ) : (
                <div>
                    <p>Game Over! Score: {score}/{NUM_ROUNDS} (+{score * 4} points)</p>
                    <button onClick={onComplete}>Continue</button>
                </div>
            )}
        </div>
    );
}

export default ClassGuess;