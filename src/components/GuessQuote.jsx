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
    const audioCtxRef = useRef(null);
    const sourceRef = useRef(null);

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
        filter.frequency.value = 300;
        filter.gain.value = 20; // Boost bass

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

    return (
        <div className="mini-game">
            <h3>Guess the TF2 Quote Speaker</h3>
            {!isGameOver ? (
                <>
                    <div style={{display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start'}}>
                        <div
                            className="pool"
                            style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                width: '40%',
                                border: '1px dashed gray',
                                minHeight: '300px',
                                padding: '10px',
                                alignContent: 'flex-start',
                                boxSizing: 'border-box'
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
                                        background: '#f9f9f9',
                                        border: '1px solid gray',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'grab'
                                    }}
                                    draggable
                                    onDragStart={ev => ev.dataTransfer.setData('application/json', JSON.stringify(quote))}
                                >
                                    <button
                                        onClick={() => playDisguised(quote)}
                                        onMouseDown={e => e.stopPropagation()}
                                        style={{ pointerEvents: 'auto' }}
                                    >
                                        Play
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
                                    <span style={{marginBottom: '5px'}}>{slot}</span>
                                    <div
                                        className="drop-square"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            border: '1px solid black',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#f9f9f9'
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
                                                    cursor: 'grab'
                                                }}
                                                draggable
                                                onDragStart={ev => ev.dataTransfer.setData('application/json', JSON.stringify(assignments[slot]))}
                                            >
                                                <button
                                                    onClick={() => playDisguised(assignments[slot])}
                                                    onMouseDown={e => e.stopPropagation()}
                                                    style={{ pointerEvents: 'auto' }}
                                                >
                                                    Play
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleFinish} style={{marginTop: '20px'}}>Finish</button>
                </>
            ) : (
                <div>
                    <p>Game Over! Score: {score}/9 (+{score * 4} points)</p>
                    <button onClick={onComplete}>Continue</button>
                </div>
            )}
        </div>
    );
}

export default GuessQuote;