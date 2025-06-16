import { useState, useRef } from 'react';
import "./CSS/Footer.css"
import github from "../assets/github.svg";

function Footer() {
    const [volume, setVolume] = useState(100); // Start at 100%
    const [isPlaying, setIsPlaying] = useState(false);
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

    return (
        <footer className="boring-footer">
            <div className="audio-controls">
                <button
                    onClick={togglePlay}
                    className="play-pause-button"
                >
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <audio
                    ref={audioRef}
                    loop
                    autoPlay
                    src="./Songs/Pub Stompin.mp3"
                    volume={volume / 100}
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
            <a href="https://github.com/AzureAsteroid2/tf2-fan-quiz" target="_blank">
                <img alt="github" src={github} className={"logo github"} />
            </a>
        </footer>
    );
}

export default Footer;