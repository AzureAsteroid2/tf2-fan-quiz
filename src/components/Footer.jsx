import { useState, useRef, useEffect } from 'react';
import "./CSS/Footer.css";
import github from "../assets/github.svg";

function Footer() {
    const songs = [
        "./Songs/Pub Stompin.mp3",
        "./Songs/Banana No 2.mp3",
        // Add more as needed
    ];

    const [volume, setVolume] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const audioRef = useRef(null);

    const handleVolumeChange = (e) => {
        let newVolume = parseInt(e.target.value);
        newVolume = Math.min(100, Math.max(0, newVolume));
        setVolume(newVolume);

        if (audioRef.current) {
            audioRef.current.volume = newVolume / 100;
        }
    };

    const togglePlay = () => {
        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };

    const playSongAtIndex = (index) => {
        const newIndex = (index + songs.length) % songs.length; // wrap around
        setCurrentSongIndex(newIndex);
    };

    const handleSongEnd = () => {
        playSongAtIndex(currentSongIndex + 1);
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.src = songs[currentSongIndex];
            audioRef.current.volume = volume / 100;
            if (isPlaying) {
                audioRef.current.play();
            }
        }
    }, [currentSongIndex, volume, isPlaying]);

    return (
        <footer className="boring-footer">
            <div className="audio-controls">
                <div className="button-group">
                    <button onClick={togglePlay}>
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button onClick={() => playSongAtIndex(currentSongIndex - 1)}>Previous</button>
                    <button onClick={() => playSongAtIndex(currentSongIndex + 1)}>Next</button>
                </div>

                <audio
                    ref={audioRef}
                    onEnded={handleSongEnd}
                >
                    Your browser hates you and will not let you listen to epic music
                </audio>

                <div className="volume-control">
                    <label htmlFor="volume">Volume:</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="volume-input"
                    />
                    <span className="volume-symbol">%</span>
                </div>
            </div>
            <a href="https://github.com/AzureAsteroid2/tf2-fan-quiz" target="_blank" rel="noopener noreferrer">
                <img alt="github" src={github} className="logo github" />
            </a>
        </footer>
    );
}

export default Footer;
