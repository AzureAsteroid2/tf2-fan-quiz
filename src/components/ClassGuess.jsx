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
];

function ClassGuess({ setTotalScore, onComplete }) {
    const [pool, setPool] = useState([]);
    const [assignments, setAssignments] = useState({});
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const shuffled = [...classes].sort(() => Math.random() - 0.5);
        setPool(shuffled);
        const initialAssignments = {};
        classes.forEach(c => initialAssignments[c.name] = null);
        setAssignments(initialAssignments);
    }, []);

    const handleDrop = (ev, targetSlot) => {
        ev.preventDefault();
        const data = ev.dataTransfer.getData('application/json');
        if (!data) return;
        const dragged = JSON.parse(data);
        const isFromPool = pool.some(c => c.name === dragged.name);
        let fromSlot = null;
        if (!isFromPool) {
            fromSlot = Object.keys(assignments).find(s => assignments[s]?.name === dragged.name);
        }
        const currentInTarget = assignments[targetSlot];
        setAssignments(prev => ({...prev, [targetSlot]: dragged}));
        if (isFromPool) {
            let newPool = pool.filter(c => c.name !== dragged.name);
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
        const fromSlot = Object.keys(assignments).find(s => assignments[s]?.name === dragged.name);
        if (fromSlot) {
            setAssignments(prev => ({...prev, [fromSlot]: null}));
            setPool(prev => [...prev, dragged]);
        }
    };

    const handleFinish = () => {
        let correct = 0;
        for (let slot of classes) {
            const assigned = assignments[slot.name];
            if (assigned && assigned.name === slot.name) {
                correct++;
            }
        }
        setScore(correct);
        setTotalScore(prev => prev + correct * 4);
        setIsGameOver(true);
    };

    return (
        <div className="mini-game">
            <h3>Guess the TF2 Class</h3>
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
                            {pool.map(cls => (
                                <div
                                    key={cls.name}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        margin: '5px',
                                        cursor: 'grab',
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,244,255,0.85))',
                                        border: '1px solid rgba(99, 102, 241, 0.15)',
                                        borderRadius: '12px',
                                        boxShadow: '0 12px 30px rgba(99, 102, 241, 0.12)',
                                        padding: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'transform 0.25s ease, box-shadow 0.25s ease'
                                    }}
                                    draggable
                                    onDragStart={ev => ev.dataTransfer.setData('application/json', JSON.stringify(cls))}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 18px 40px rgba(99, 102, 241, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.12)';
                                    }}
                                >
                                    <img
                                        src={cls.image}
                                        alt="Silhouette"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            pointerEvents: 'none'
                                        }}
                                    />
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
                            {classes.map(slot => (
                                <div key={slot.name} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                                    <span style={{marginBottom: '5px'}}>{slot.name}</span>
                                    <div
                                        className="drop-square"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            border: '2px dashed rgba(99, 102, 241, 0.3)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: 'rgba(239, 246, 255, 0.3)'
                                        }}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => handleDrop(e, slot.name)}
                                    >
                                        {assignments[slot.name] && (
                                            <div
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    cursor: 'grab',
                                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,244,255,0.85))',
                                                    borderRadius: '8px',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                draggable
                                                onDragStart={ev => ev.dataTransfer.setData('application/json', JSON.stringify(assignments[slot.name]))}
                                            >
                                                <img
                                                    src={assignments[slot.name].image}
                                                    alt="Silhouette"
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'contain',
                                                        pointerEvents: 'none'
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={handleFinish} 
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            borderRadius: '999px',
                            fontSize: '1.05rem',
                            fontWeight: '600',
                            border: '1px solid transparent',
                            cursor: 'pointer',
                            transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,244,255,0.85))',
                            color: '#213547',
                            borderColor: 'rgba(99, 102, 241, 0.15)',
                            boxShadow: '0 12px 30px rgba(99, 102, 241, 0.12)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 18px 40px rgba(99, 102, 241, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.12)';
                        }}
                    >
                        Finish
                    </button>
                </>
            ) : (
                <div>
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
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,244,255,0.85))',
                            color: '#213547',
                            borderColor: 'rgba(99, 102, 241, 0.15)',
                            boxShadow: '0 12px 30px rgba(99, 102, 241, 0.12)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 18px 40px rgba(99, 102, 241, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 12px 30px rgba(99, 102, 241, 0.12)';
                        }}
                    >
                        Continue
                    </button>
                </div>
            )}
        </div>
    );
}

export default ClassGuess;