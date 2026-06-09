const SafeImage = ({ src, alt = '', name = '?', style = {}, className = '' }) => {
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e85d04&color=fff&size=200`;

  return (
    <img
      src={src || fallback}
      alt={alt}
      style={{ objectFit: 'cover', ...style }}
      className={className}
      onError={(e) => {
        e.currentTarget.src = fallback;
        e.currentTarget.onerror = null;
      }}
    />
  );
};

export default SafeImage;
