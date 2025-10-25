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
    const [isDark, setIsDark] = useState(false);
    const [imageEffects, setImageEffects] = useState({});

    useEffect(() => {
        const checkDarkMode = () => {
            setIsDark(document.body.classList.contains('dark-mode'));
        };
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const shuffled = [...classes].sort(() => Math.random() - 0.5);
        setPool(shuffled);
        const initialAssignments = {};
        classes.forEach(c => initialAssignments[c.name] = null);
        setAssignments(initialAssignments);

        // Define base effect types
        const baseEffects = [
            { name: 'normal', filter: '', transform: '', overflow: 'visible' },
            { name: 'blur', filter: 'blur(6px)', transform: '', overflow: 'visible' },
            { name: 'pixelate', filter: 'contrast(1000%) blur(2px)', transform: '', overflow: 'visible' },
            { name: 'stretch-horizontal', filter: '', transform: 'scaleX(1.5)', overflow: 'hidden' },
            { name: 'stretch-vertical', filter: '', transform: 'scaleY(1.5)', overflow: 'hidden' },
            { name: 'squish-horizontal', filter: '', transform: 'scaleX(0.45)', overflow: 'visible' },
            { name: 'squish-vertical', filter: '', transform: 'scaleY(0.45)', overflow: 'visible' },
            { name: 'rotate', filter: '', transform: '', overflow: 'hidden' }, // rotation will be added
        ];

        // Additional modifiers that can be combined
        const hueRotations = [0, 60, 120, 180, 240, 300]; // Different hue shifts
        const rotations = [45, 90, 135, 180, 225, 270, 315];

        // Generate unique combinations for each class
        const effects = {};
        const usedCombinations = new Set();
        const usedBaseEffects = new Set();
        
        // Shuffle base effects to randomize assignment order
        const shuffledBaseEffects = [...baseEffects].sort(() => Math.random() - 0.5);
        
        classes.forEach((cls, index) => {
            let combination;
            let attempts = 0;
            
            do {
                // Use base effect in order for first 8, then random for the 9th
                const baseEffect = index < baseEffects.length 
                    ? shuffledBaseEffects[index] 
                    : baseEffects[Math.floor(Math.random() * baseEffects.length)];
                
                // Skip if this base effect is already used (prevents double-stacking)
                if (usedBaseEffects.has(baseEffect.name) && attempts < 20) {
                    attempts++;
                    continue;
                }
                
                // Randomly decide if we add hue rotation (50% chance, but not for normal, blur, or pixelate)
                const canAddHue = baseEffect.name !== 'normal' && baseEffect.name !== 'blur' && baseEffect.name !== 'pixelate';
                const addHue = canAddHue && Math.random() > 0.5;
                const hueRotation = addHue ? hueRotations[Math.floor(Math.random() * hueRotations.length)] : 0;
                
                // Build filter string
                let filterParts = [];
                if (baseEffect.filter) filterParts.push(baseEffect.filter);
                if (hueRotation > 0) filterParts.push(`hue-rotate(${hueRotation}deg)`);
                const filter = filterParts.length > 0 ? filterParts.join(' ') : 'none';
                
                // Build transform string
                let transformParts = [];
                if (baseEffect.transform) transformParts.push(baseEffect.transform);
                if (baseEffect.name === 'rotate') {
                    const rotation = rotations[Math.floor(Math.random() * rotations.length)];
                    transformParts.push(`rotate(${rotation}deg)`);
                }
                const transform = transformParts.length > 0 ? transformParts.join(' ') : 'none';
                
                // Create unique key for this combination
                const combinationKey = `${baseEffect.name}-${hueRotation}-${transform}`;
                
                if (!usedCombinations.has(combinationKey) || attempts > 20) {
                    usedCombinations.add(combinationKey);
                    usedBaseEffects.add(baseEffect.name);
                    combination = {
                        type: baseEffect.name,
                        filter,
                        transform,
                        overflow: baseEffect.overflow
                    };
                    break;
                }
                attempts++;
            } while (attempts < 30);
            
            effects[cls.name] = combination;
        });
        
        setImageEffects(effects);
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
        
        // Play drop sound
        const dropSound = new Audio('./sounds/drop.wav');
        dropSound.volume = 0.3;
        dropSound.play().catch(e => console.log('Drop sound play blocked', e));
        
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
                                height: '365px',
                                padding: '10px',
                                alignContent: 'flex-start',
                                boxSizing: 'border-box',
                                overflow: 'auto'
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
                                        background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(76, 29, 149, 0.6))' : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,244,255,0.85))',
                                        border: isDark ? '1px solid rgba(148, 163, 184, 0.25)' : '1px solid rgba(99, 102, 241, 0.15)',
                                        borderRadius: '12px',
                                        boxShadow: isDark ? '0 14px 32px rgba(15, 23, 42, 0.6)' : '0 12px 30px rgba(99, 102, 241, 0.12)',
                                        padding: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                                        overflow: imageEffects[cls.name]?.overflow || 'visible'
                                    }}
                                    draggable
                                    onDragStart={ev => ev.dataTransfer.setData('application/json', JSON.stringify(cls))}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = isDark ? '0 18px 40px rgba(8, 47, 73, 0.6)' : '0 18px 40px rgba(99, 102, 241, 0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = isDark ? '0 14px 32px rgba(15, 23, 42, 0.6)' : '0 12px 30px rgba(99, 102, 241, 0.12)';
                                    }}
                                >
                                    <img
                                        src={cls.image}
                                        alt="Silhouette"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            pointerEvents: 'none',
                                            filter: imageEffects[cls.name]?.filter || 'none',
                                            transform: imageEffects[cls.name]?.transform || 'none',
                                            transition: 'all 0.3s ease'
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
                                            border: isDark ? '2px dashed rgba(148, 163, 184, 0.3)' : '2px dashed rgba(99, 102, 241, 0.3)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(239, 246, 255, 0.3)'
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
                                                    background: isDark ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(76, 29, 149, 0.6))' : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(243,244,255,0.85))',
                                                    borderRadius: '8px',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: imageEffects[assignments[slot.name].name]?.overflow || 'visible'
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
                                                        pointerEvents: 'none',
                                                        filter: imageEffects[assignments[slot.name].name]?.filter || 'none',
                                                        transform: imageEffects[assignments[slot.name].name]?.transform || 'none',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                />
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
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

export default ClassGuess;