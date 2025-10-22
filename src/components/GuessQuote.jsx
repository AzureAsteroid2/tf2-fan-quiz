import { useState, useEffect, useRef } from 'react';

const speakers = ['Scout', 'Soldier', 'Pyro', 'Demoman', 'Heavy', 'Engineer', 'Medic', 'Sniper', 'Spy'];

const audioModules = import.meta.glob('../../public/quotes/**/*.wav', { eager: true, query: '?url', import: 'default' });

const speakerAudios = {};

for (const path in audioModules) {
    const match = path.match(/.*\/quotes\/([^/]+)\/[^/]+\.wav$/);
    if (match) {
        const folder = match[1];
        const speaker = folder.charAt(0).toUpperCase() + folder.slice(1);
        const url = audioModules[path];
        if (!speakerAudios[speaker]) speakerAudios[speaker] = [];
        speakerAudios[speaker].push(url);
    }
}

function GuessQuote({ setTotalScore, onComplete }) {
    const [pool, setPool] = useState([]);
    const [assignments, setAssignments] = useState({});
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [buffers, setBuffers] = useState({});
    const [isDark, setIsDark] = useState(false);
    const audioCtxRef = useRef(null);
    const sourceRef = useRef(null);

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDark(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();

        const init = async () => {
            const selectedQuotes = speakers.map(s => {
                const audios = speakerAudios[s] || [];
                if (audios.length === 0) return null;
                const randomAudio = audios[Math.floor(Math.random() * audios.length)];
                return { speaker: s, audio: randomAudio };
            }).filter(Boolean);

            const shuffled = [...selectedQuotes].sort(() => Math.random() - 0.5);
            setPool(shuffled);

            const initialAssignments = {};
            speakers.forEach(s => initialAssignments[s] = null);
            setAssignments(initialAssignments);

            const map = {};
            for (let q of shuffled) {
                const response = await fetch(q.audio);
                const arrayBuffer = await response.arrayBuffer();
                map[q.audio] = await audioCtxRef.current.decodeAudioData(arrayBuffer);
            }
            setBuffers(map);
        };
        init();

        return () => {
            if (audioCtxRef.current) audioCtxRef.current.close();
        };
    }, []);

    const playDisguised = (quote) => {
        if (!quote || !buffers[quote.audio] || !audioCtxRef.current) return;

        if (sourceRef.current) {
            sourceRef.current.stop();
            sourceRef.current = null;
        }

        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffers[quote.audio];
        source.playbackRate.value = 0.8; // Down-pitch

        const filter = audioCtxRef.current.createBiquadFilter();
        filter.type = 'lowshelf';
        filter.frequency.value = 1000;
        filter.gain.value = 5; // Boost bass

        source.connect(filter);
        filter.connect(audioCtxRef.current.destination);
        source.start(0);

        sourceRef.current = source;
    };

    const handleDrop = (ev, targetSlot) => {
        ev.preventDefault();
        const data = ev.dataTransfer.getData('application/json');
        if (!data) return;
        const dragged = JSON.parse(data);
        const isFromPool = pool.some(q => q.audio === dragged.audio);
        let fromSlot = null;
        if (!isFromPool) {
            fromSlot = Object.keys(assignments).find(s => assignments[s]?.audio === dragged.audio);
        }
        const currentInTarget = assignments[targetSlot];
        setAssignments(prev => ({...prev, [targetSlot]: dragged}));
        if (isFromPool) {
            let newPool = pool.filter(q => q.audio !== dragged.audio);
            if (currentInTarget) {
                newPool = [...newPool, currentInTarget];
            }
            setPool(newPool);
        } else if (fromSlot && fromSlot !== targetSlot) {
            if (currentInTarget) {
                setAssignments(prev => ({...prev, [fromSlot]: currentInTarget}));
            } else {
                setAssignments(prev => ({...prev, [fromSlot]: null}));
            }
        }
    };

    const handleDropToPool = (ev) => {
        ev.preventDefault();
        const data = ev.dataTransfer.getData('application/json');
        if (!data) return;
        const dragged = JSON.parse(data);
        const fromSlot = Object.keys(assignments).find(s => assignments[s]?.audio === dragged.audio);
        if (fromSlot) {
            setAssignments(prev => ({...prev, [fromSlot]: null}));
            setPool(prev => [...prev, dragged]);
        }
    };

    const handleFinish = () => {
        let correct = 0;
        for (let slot of speakers) {
            const assigned = assignments[slot];
            if (assigned && assigned.speaker === slot) {
                correct++;
            }
        }
        setScore(correct);
        setTotalScore(prev => prev + correct * 4);
        setIsGameOver(true);
    };

    const SpeakerIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
    );

    const theme = {
        light: {
            text: '#213547',
            background: '#ffffff',
            buttonBg: '#efefef',
            buttonBorder: '#d1d1d1',
            border: '#000',
            dashedBorder: 'gray',
        },
        dark: {
            text: 'rgba(255, 255, 255, 0.87)',
            background: '#242424',
            buttonBg: '#474747',
            buttonBorder: 'rgb(105 105 105 / 87%)',
            border: '#ccc',
            dashedBorder: '#ccc',
        }
    };

    const colors = isDark ? theme.dark : theme.light;

    return (
        <div className="mini-game" style={{ color: colors.text }}>
            <h3>Guess the TF2 Class That Said This!</h3>
            {!isGameOver ? (
                <>
                    <div style={{display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start'}}>
                        <div
                            className="pool"
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                width: '40%',
                                border: `1px dashed ${colors.dashedBorder}`,
                                height: '365px',
                                padding: '10px',
                                alignContent: 'flex-start',
                                boxSizing: 'border-box',
                                backgroundColor: colors.background,
                                overflow: 'auto'
                            }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={handleDropToPool}
                        >
                            {pool.map(quote => (
                                <div
                                    key={quote.audio}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        margin: '5px',
                                        background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(76, 29, 149, 0.6))' : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,244,255,0.85))',
                                        border: isDark ? '1px solid rgba(148, 163, 184, 0.25)' : '1px solid rgba(99, 102, 241, 0.15)',
                                        borderRadius: '12px',
                                        boxShadow: isDark ? '0 14px 32px rgba(15, 23, 42, 0.6)' : '0 12px 30px rgba(99, 102, 241, 0.12)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'grab',
                                        transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                                    }}
                                    draggable
                                    onDragStart={ev => ev.dataTransfer.setData('application/json', JSON.stringify(quote))}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = isDark ? '0 18px 40px rgba(8, 47, 73, 0.6)' : '0 18px 40px rgba(99, 102, 241, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = isDark ? '0 14px 32px rgba(15, 23, 42, 0.6)' : '0 12px 30px rgba(99, 102, 241, 0.12)';
                                    }}
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            playDisguised(quote);
                                        }}
                                        onMouseDown={e => e.stopPropagation()}
                                        style={{ 
                                            pointerEvents: 'auto', 
                                            border: 'none', 
                                            background: 'transparent', 
                                            cursor: 'pointer', 
                                            color: isDark ? '#22d3ee' : '#6366f1',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        aria-label="Play audio"
                                    >
                                        <SpeakerIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div
                            className="slots"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '10px',
                                width: '50%'
                            }}
                        >
                            {speakers.map(slot => (
                                <div key={slot} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                    <span style={{marginBottom: '5px', color: colors.text}}>{slot}</span>
                                    <div
                                        className="drop-square"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            border: `1px solid ${colors.border}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: colors.background
                                        }}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => handleDrop(e, slot)}
                                    >
                                        {assignments[slot] && (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'grab',
                                                    background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(76, 29, 149, 0.6))' : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,244,255,0.85))',
                                                    borderRadius: '8px'
                                                }}
                                                draggable
                                                onDragStart={ev => ev.dataTransfer.setData('application/json', JSON.stringify(assignments[slot]))}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        playDisguised(assignments[slot]);
                                                    }}
                                                    onMouseDown={e => e.stopPropagation()}
                                                    style={{ 
                                                        pointerEvents: 'auto', 
                                                        border: 'none', 
                                                        background: 'transparent', 
                                                        cursor: 'pointer', 
                                                        color: isDark ? '#22d3ee' : '#6366f1',
                                                        padding: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    aria-label="Play audio"
                                                >
                                                    <SpeakerIcon />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                        <button 
                            onClick={handleFinish} 
                            style={{
                                padding: '10px 20px',
                                borderRadius: '999px',
                                fontSize: '1.05rem',
                                fontWeight: '600',
                                border: '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                                background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(76, 29, 149, 0.6))' : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,244,255,0.85))',
                                color: isDark ? 'rgba(255, 255, 255, 0.87)' : '#213547',
                                borderColor: isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                                boxShadow: isDark ? '0 14px 32px rgba(15, 23, 42, 0.6)' : '0 12px 30px rgba(99, 102, 241, 0.12)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = isDark ? '0 18px 40px rgba(8, 47, 73, 0.6)' : '0 18px 40px rgba(99, 102, 241, 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = isDark ? '0 14px 32px rgba(15, 23, 42, 0.6)' : '0 12px 30px rgba(99, 102, 241, 0.12)';
                            }}
                        >
                            Finish
                        </button>
                    </div>
                </>
            ) : (
                <div style={{ color: colors.text, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <p>Game Over! Score: {score}/9 (+{score * 4} points)</p>
                    <button 
                        onClick={onComplete} 
                        style={{
                            padding: '10px 20px',
                            borderRadius: '999px',
                            fontSize: '1.05rem',
                            fontWeight: '600',
                            border: '1px solid transparent',
                            cursor: 'pointer',
                            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                            background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(76, 29, 149, 0.6))' : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,244,255,0.85))',
                            color: isDark ? 'rgba(255, 255, 255, 0.87)' : '#213547',
                            borderColor: isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                            boxShadow: isDark ? '0 14px 32px rgba(15, 23, 42, 0.6)' : '0 12px 30px rgba(99, 102, 241, 0.12)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = isDark ? '0 18px 40px rgba(8, 47, 73, 0.6)' : '0 18px 40px rgba(99, 102, 241, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = isDark ? '0 14px 32px rgba(15, 23, 42, 0.6)' : '0 12px 30px rgba(99, 102, 241, 0.12)';
                        }}
                    >
                        Continue
                    </button>
                </div>
            )}
        </div>
    );
}

export default GuessQuote;