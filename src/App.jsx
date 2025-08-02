import "./components/Header.jsx"
import './App.css'
import questions from "./Questions/under_18.jsx";
import questions_two from "./Questions/under_18_two.jsx"
import Question from "./components/Question.jsx";
import Header from "./components/Header.jsx";
import adPairs from "./Ads/ad_pairs.jsx";
import popupAds from "./Ads/popup_ads.jsx";
import Ad from "./components/Ad.jsx";
import Footer from "./components/Footer.jsx";
import Pong from "./components/Pong.jsx";
import AdPopup from "./components/AdPopup.jsx";
import {useCallback, useEffect, useRef, useState} from "react";

function App() {
    const [phase, setPhase] = useState("first"); // "first", "pong", "second", "done"
    const timerTime = 5;
    const [timer, setTimer] = useState(timerTime);
    const timerIdRef = useRef(null);
    const [adPair] = useState(() => {
        const randomIndex = Math.floor(Math.random() * adPairs.length);
        return adPairs[randomIndex];
    });
    const [showAdPopup, setShowAdPopup] = useState(false);
    const [popupAd, setPopupAd] = useState(null);
    const [popupStyle, setPopupStyle] = useState({});
    const adPopupTimerRef = useRef(null);
    const questionsAnsweredRef = useRef(0);

    const [totalScore, setTotalScore] = useState(0);
    const [totalPossibleScore, setTotalPossibleScore] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isStarted, setIsStarted] = useState(false);
    const PONG_BONUS = 10;

    // Calculate total possible score when component mounts
    useEffect(() => {
        const max1 = questions.reduce(
            (sum, q) => sum + Math.max(...q.answers.map(a => a.value)),
            0
        );
        const max2 = questions_two.reduce(
            (sum, q) => sum + Math.max(...q.answers.map(a => a.value)),
            0
        );
        setTotalPossibleScore(max1 + max2);
    }, []);


    useEffect(() => {
        if (phase !== "first" && phase !== "second") return;

        const showRandomAd = () => {
            const prob = Math.min(0.2 + 0.05 * questionsAnsweredRef.current, 1.0);
            if (Math.random() < prob) {
                const randomIndex = Math.floor(Math.random() * popupAds.length);
                setPopupAd(popupAds[randomIndex]);
                const randomTop = Math.floor(Math.random() * 61) + 25;
                const randomLeft = Math.floor(Math.random() * 61) + 10;
                setPopupStyle({
                    top: `${randomTop}%`,
                    left: `${randomLeft}%`,
                    transform: 'translate(-50%, -50%)'
                });
                setShowAdPopup(true);
            }
        };

        adPopupTimerRef.current = setInterval(() => {
            showRandomAd();
        }, Math.floor(Math.random() * 9000) + 1000);

        return () => {
            if (adPopupTimerRef.current) clearInterval(adPopupTimerRef.current);
        };
    }, [phase, adPair]);

    useEffect(() => {
        if (phase !== "second") return;

        if (timerIdRef.current) clearInterval(timerIdRef.current);

        timerIdRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerIdRef.current);
                    setPhase("done");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerIdRef.current) clearInterval(timerIdRef.current);
        };
    }, [phase, currentQuestionIndex]);

    const handleNextQuestion = useCallback((answerValue) => {
        if (timerIdRef.current) {
            clearInterval(timerIdRef.current);
            timerIdRef.current = null;
        }

        setTotalScore(prev => prev + answerValue);
        questionsAnsweredRef.current += 1;

        if (phase === "first") {
            if (currentQuestionIndex + 1 < questions.length) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setPhase("pong");
                setCurrentQuestionIndex(0); // prepare for next phase
            }
        } else if (phase === "second") {
            if (currentQuestionIndex + 1 < questions_two.length) {
                setCurrentQuestionIndex(prev => prev + 1);
                setTimer(timerTime);
            } else {
                setPhase("done");
            }
        }
    }, [phase, currentQuestionIndex, questions.length, questions_two.length]);


    const handlePongComplete = (won) => {
        if (won) {
            setTotalScore(prev => prev + PONG_BONUS);
        }
        setPhase("second");
        setTimer(timerTime);
        setCurrentQuestionIndex(0);
    };

    const getGrade = () => {
        const percentage = Math.round((totalScore / (totalPossibleScore + PONG_BONUS)) * 100);
        let grade = "";

        if (percentage < 0) {
            grade = "F";
        } else if (percentage <= 69) {
            grade = "D";
        } else if (percentage <= 79) {
            grade = "C";
        } else if (percentage <= 89) {
            grade = "B";
        } else if (percentage <= 98) {
            grade = "A";
        } else {
            grade = "S";
        }

        const isPerfect = percentage === 100;

        return { percentage, grade, isPerfect };
    };


    const handleStart = () => {
        setIsStarted(true);
    };

    const handleAdClose = () => {
        setShowAdPopup(false);
        setPopupAd(null);
    };

    return (
        <>
            <Header />

            <Ad image={adPair.left.image} url={adPair.left.url} position="left" />
            <Ad image={adPair.right.image} url={adPair.right.url} position="right" />

            <div className="site-content">
                <div className="card">
                    {!isStarted && (
                        <>
                            <h1>Are you a Team Fortress 2 Fan?</h1>
                            <button className="start-button" onClick={handleStart}>Start Quiz</button>
                        </>
                    )}

                    {isStarted && (
                        <>
                            {phase === "first" && (
                                <Question
                                    {...questions[currentQuestionIndex]}
                                    onNextQuestion={handleNextQuestion}
                                />
                            )}

                            {phase === "pong" && (
                                <Pong onGameEnd={handlePongComplete} />
                            )}

                            {phase === "second" && (
                                <div>
                                    <div className="timer">Time left: {timer}</div>
                                    <Question
                                        {...questions_two[currentQuestionIndex]}
                                        onNextQuestion={handleNextQuestion}
                                    />
                                </div>
                            )}

                            {phase === "done" && (
                                <div className="Score">
                                    <h2>You have completed the quiz!!!</h2>
                                    <button onClick={() => setPhase("grade")}>See Grade</button>
                                </div>
                            )}

                            {phase === "grade" && (() => {
                                const { percentage, grade, isPerfect } = getGrade();
                                return (
                                    <div className="grade-container">
                                        <h2>Your Grade: {grade}</h2>
                                        <p>Quiz Score: {totalScore} / {totalPossibleScore + PONG_BONUS}</p>
                                        <p>Score: {percentage}%</p>
                                        {isPerfect && <p>Remember this for a book: 10202017</p>}
                                        {percentage < 0 && (
                                            <div className="negative-overlay">
                                                <p>You should fill one of these out</p>
                                                <img src="" alt="Negative Score" className="scary" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>
            </div>

            {showAdPopup && popupAd && (
                <AdPopup
                    image={popupAd.image}
                    onClose={handleAdClose}
                    popupStyle={popupStyle}
                />
            )}

            <Footer />
        </>

    );
}

export default App;