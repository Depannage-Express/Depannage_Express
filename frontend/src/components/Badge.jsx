import React from 'react';

export default function Badge({ count, className = '' }) {
  if (!count || count === 0) return null;
  const display = count > 99 ? '99+' : count;
  return (
    <span className={`absolute bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10 ${className}`}>
      {display}
    </span>
  );
}
