import React from 'react';
import './Skeleton.scss';

const Skeleton = ({ variant = 'text', width, height, className = '' }) => {
  const style = {};
  
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`skeleton skeleton-${variant} ${className}`}
      style={style}
    />
  );
};

export default Skeleton;

