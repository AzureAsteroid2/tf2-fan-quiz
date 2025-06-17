import "../components/CSS/Header.css"
import '../App.css'
import {useEffect, useState} from "react";
import logo from "../assets/logo.svg";
function Header() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        console.log(savedTheme);
        return savedTheme;
        // return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        document.body.className = isDarkMode ? 'dark-mode' : 'light-mode';
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };
    return (
        <header className="sticky-header">
            <div className="header-content">
                <h2>
                    <a href="https://www.priorygroup.com/blog/signs-you-should-see-a-therapist" target="_blank" className="unstyled-link">
                        Buff TF2 Mercs in your area
                    </a>
                </h2>

                <a href="steam://run/440" target="_blank"><img className={"logo"} src={logo} alt="logo"  /></a>
                <button className="theme" onClick={() => toggleTheme()}>
                    The theme is {isDarkMode ? 'dark' : 'light'}
                </button>
            </div>
        </header>
    );
}

export default Header;