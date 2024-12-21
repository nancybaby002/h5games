import React from 'react';

const Card = ({ value, suit, isVisible, isDragging }) => {
  const cardStyle = {
    width: '80px',
    height: '120px',
    border: '1px solid #000',
    borderRadius: '5px',
    backgroundColor: isVisible ? '#fff' : '#2c5380',
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  };

  if (!isVisible) {
    return <div style={cardStyle} />;
  }

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: '24px' }}>
        {value}
        <span style={{ color: suit === '♥' || suit === '♦' ? 'red' : 'black' }}>
          {suit}
        </span>
      </div>
    </div>
  );
};

export default Card; 