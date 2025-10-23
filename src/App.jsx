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
import GuessQuote from "./components/GuessQuote.jsx";
import {useCallback, useEffect, useRef, useState} from "react";
import ClassGuess from "./components/ClassGuess.jsx";
import confetti from 'canvas-confetti';

// Debug mode - set to false to hide all debug buttons
const DEBUG_MODE = true;

function MobileWarning({ onDismiss }) {
    return (
        <div className="mobile-warning-overlay">
            <div className="mobile-warning">
                <h2>⚠️ Mobile Warning</h2>
                <p>This quiz is optimized for desktop browsers. Some features may not work properly on mobile devices.</p>
                <p>For the best experience, please use a desktop or laptop computer.</p>
                <button onClick={onDismiss} className="gamble-button">Continue Anyway</button>
            </div>
        </div>
    );
}

function App() {
    const [phase, setPhase] = useState("first"); // "first", "pong", "second", "silhouette", "quote", "done"
    const timerTime = 10;
    const [timer, setTimer] = useState(timerTime);
    const timerIdRef = useRef(null);
    const [adPair, setAdPair] = useState(() => {
        const randomIndex = Math.floor(Math.random() * adPairs.length);
        return adPairs[randomIndex];
    });
    const adRotationTimerRef = useRef(null);
    const [showAdPopup, setShowAdPopup] = useState(false);
    const [popupAd, setPopupAd] = useState(null);
    const [popupStyle, setPopupStyle] = useState({});
    const adPopupTimerRef = useRef(null);
    const questionsAnsweredRef = useRef(0);

    const [totalScore, setTotalScore] = useState(0);
    const [totalPossibleScore, setTotalPossibleScore] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isStarted, setIsStarted] = useState(false);
    const [showMobileWarning, setShowMobileWarning] = useState(false);
    const PONG_BONUS = 10;
    const CLASS_GUESS_BONUS = 36;
    const QUOTE_BONUS = 36;

    // Check if mobile on mount
    useEffect(() => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        if (isMobile) {
            setShowMobileWarning(true);
        }
    }, []);

    // Rotate side ads every minute
    useEffect(() => {
        adRotationTimerRef.current = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * adPairs.length);
            setAdPair(adPairs[randomIndex]);
        }, 90000); // 90 seconds

        return () => {
            if (adRotationTimerRef.current) clearInterval(adRotationTimerRef.current);
        };
    }, []);

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
        // Only show popup ads during question phases, not during drag-and-drop games
        if (phase !== "first" && phase !== "second") return;

        const showRandomAd = () => {
            const prob = Math.min(0.05 + 0.03 * questionsAnsweredRef.current, 0.7);
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
        }, Math.floor(Math.random() * 12000) + 3000);

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
                setPhase("silhouette");
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

    const handleSilhouetteComplete = () => {
        setPhase("quote");
    };

    const handleQuoteComplete = () => {
        setPhase("done");
    };

    const [showJobJumpscare, setShowJobJumpscare] = useState(false);

    // Play grade sound when grade phase is shown
    useEffect(() => {
        if (phase === "grade") {
            const { grade } = getGrade();
            const gradeAudio = new Audio(`./sounds/${grade}.mp3`);
            gradeAudio.play().catch((e) => {
                console.log("Grade sound play blocked", e);
            });

            // Trigger confetti for S rank
            if (grade === "S") {
                const duration = 3000; // 3 seconds
                const end = Date.now() + duration;

                const frame = () => {
                    confetti({
                        particleCount: 3,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: ['#6366f1', '#8b5cf6', '#22c55e', '#eab308']
                    });
                    confetti({
                        particleCount: 3,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: ['#6366f1', '#8b5cf6', '#22c55e', '#eab308']
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                };
                frame();
            }

            // Trigger failure effect for F rank
            if (grade === "F") {
                const duration = 5000; // 5 seconds
                const end = Date.now() + duration;

                const frame = () => {
                    confetti({
                        particleCount: 2,
                        angle: 90,
                        spread: 180,
                        origin: { y: 0 },
                        colors: ['#1f2937', '#374151', '#4b5563', '#6b7280'],
                        gravity: 1.5,
                        scalar: 0.8
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                };
                frame();

                // Show job jumpscare after a few seconds
                setTimeout(() => {
                    setShowJobJumpscare(true);
                }, 3000);
            } else {
                setShowJobJumpscare(false);
            }
        }
    }, [phase]);

    const getGrade = () => {
        const percentage = Math.round((totalScore / (totalPossibleScore + PONG_BONUS + CLASS_GUESS_BONUS + QUOTE_BONUS)) * 100);
        let grade = "";

        if (percentage < 0) {
            grade = "F";
        } else if (percentage < 60) {
            grade = "F";
        } else if (percentage < 70) {
            grade = "D";
        } else if (percentage < 80) {
            grade = "C";
        } else if (percentage < 90) {
            grade = "B";
        } else if (percentage < 100) {
            grade = "A";
        } else {
            grade = "S"; // Perfect score
        }

        const isPerfect = percentage === 100;

        return { percentage, grade, isPerfect };
    };


    const handleStart = () => {
        setIsStarted(true);
    };

    const testGrade = (targetPercentage) => {
        const maxScore = totalPossibleScore + PONG_BONUS + CLASS_GUESS_BONUS + QUOTE_BONUS;
        const testScore = Math.round((targetPercentage / 100) * maxScore);
        setTotalScore(testScore);
        setPhase("grade");
        setIsStarted(true);
    };

    const jumpToPhase = (phaseName) => {
        setIsStarted(true);
        setPhase(phaseName);
    };

    const handleAdClose = () => {
        setShowAdPopup(false);
        setPopupAd(null);
    };

    return (
        <>
            {showMobileWarning && <MobileWarning onDismiss={() => setShowMobileWarning(false)} />}
            <Header />

            <Ad image={adPair.left.image} url={adPair.left.url} position="left" />
            <Ad image={adPair.right.image} url={adPair.right.url} position="right" />

            <div className="site-content">
                <div className="card">
                    {!isStarted && (
                        <>
                            <h1>Are you a Team Fortress 2 Fan?</h1>
                            <button className="start-button" onClick={handleStart}>Start Quiz</button>
                            
                            {DEBUG_MODE && (
                                <>
                                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Test Grades:</p>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            <button className="gamble-button" onClick={() => testGrade(100)}>S (100%)</button>
                                            <button className="gamble-button" onClick={() => testGrade(95)}>A (95%)</button>
                                            <button className="gamble-button" onClick={() => testGrade(85)}>B (85%)</button>
                                            <button className="gamble-button" onClick={() => testGrade(75)}>C (75%)</button>
                                            <button className="gamble-button" onClick={() => testGrade(65)}>D (65%)</button>
                                            <button className="gamble-button" onClick={() => testGrade(50)}>F (50%)</button>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Jump to Phase:</p>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                            <button className="gamble-button" onClick={() => jumpToPhase('first')}>Questions 1</button>
                                            <button className="gamble-button" onClick={() => jumpToPhase('pong')}>Pong</button>
                                            <button className="gamble-button" onClick={() => jumpToPhase('second')}>Questions 2</button>
                                            <button className="gamble-button" onClick={() => jumpToPhase('silhouette')}>Silhouette</button>
                                            <button className="gamble-button" onClick={() => jumpToPhase('quote')}>Guess Quote</button>
                                            <button className="gamble-button" onClick={() => jumpToPhase('done')}>Done</button>
                                        </div>
                                    </div>
                                </>
                            )}
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
                                    <div className={`timer ${timer >= 6 ? 'timer-green' : timer >= 3 ? 'timer-yellow' : 'timer-red'}`}>
                                        Time left: {timer}
                                    </div>
                                    <Question
                                        {...questions_two[currentQuestionIndex]}
                                        onNextQuestion={handleNextQuestion}
                                    />
                                </div>
                            )}

                                {phase === "silhouette" && (
                                    <div>
                                        <ClassGuess setTotalScore={setTotalScore} onComplete={handleSilhouetteComplete}></ClassGuess>
                                    </div>
                                )}

                                {phase === "quote" && (
                                    <div>
                                        <GuessQuote setTotalScore={setTotalScore} onComplete={handleQuoteComplete}></GuessQuote>
                                    </div>
                                )}

                                {phase === "done" && (
                                    <div className="Score">
                                        <h2>You have completed the quiz!!!</h2>
                                        <button className="gamble-button" onClick={() => setPhase("grade")}>See Grade</button>
                                    </div>
                                )}

                                {phase === "grade" && (() => {
                                    const { percentage, grade, isPerfect } = getGrade();
                                    
                                    return (
                                        <div className="grade-container">
                                            <div className={`grade-letter grade-${grade.toLowerCase()}`}>{grade}</div>
                                            <p className="grade-percentage">{percentage}%</p>
                                            <p>Quiz Score: {totalScore} / {totalPossibleScore + PONG_BONUS + CLASS_GUESS_BONUS + QUOTE_BONUS}</p>
                                            {isPerfect && <p className="perfect-message">Remember this for a book: 10202017</p>}
                                            {percentage < 0 && (
                                                <div className="negative-overlay">
                                                    <p>You should fill one of these out</p>
                                                    <img src="../public/Images/job_application.png" alt="Negative Score" className="scary" />
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

            {showJobJumpscare && (
                <div className="job-jumpscare">
                    <h2 className="job-jumpscare-text">You should fill one of these out</h2>
                    <img src="./Images/job_application.png" alt="Job Application" className="job-jumpscare-image" />
                </div>
            )}

            <Footer />
        </>

    );
}

export default App;