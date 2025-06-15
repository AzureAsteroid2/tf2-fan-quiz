import './CSS/Ad.css';

function Ad({ image, url, position }) {
    return (
        <div className={`edge-ad edge-ad-${position}`}>
            <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={image} alt={`${position} ad`} />
            </a>
        </div>
    );
}

export default Ad;
