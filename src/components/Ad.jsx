import 'react';
import './CSS/Ad.css'

function Ad({ image, url }) {
    return (
        <div className="side-ad">
            <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={image} alt="Ad" />
            </a>
        </div>
    );
}

export default Ad;
