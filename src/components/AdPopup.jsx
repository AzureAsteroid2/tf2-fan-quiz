// import './CSS/AdPopup.css';

function AdPopup({ image, onClose, popupStyle }) {
    return (
        <div className="ad-popup-overlay">
            <div className="ad-popup" style={popupStyle}>
                <button className="ad-close-button" onClick={onClose}>X</button>
                <div className="ad-image" style={{
                    backgroundImage: image ? `url(${image})` : 'none',
                    backgroundColor: image ? 'transparent' : 'white'
                }} />
            </div>
        </div>
    );
}

export default AdPopup;