import { useEffect, useState } from 'react';
import { reverseGeocode } from '../lib/api';

const GeoLabel = ({ lat, lon, fallback }) => {
  const [geo, setGeo] = useState(null);

  useEffect(() => {
    if (!lat || !lon) return;
    reverseGeocode(lat, lon).then(setGeo);
  }, [lat, lon]);

  if (!lat || !lon) return <span>{fallback || '—'}</span>;
  if (!geo) return <span>{fallback || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`}</span>;

  const parts = [geo.neighbourhood, geo.city].filter(Boolean);
  return (
    <span>
      {parts.length > 0 ? parts.join(', ') : fallback || `${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`}
    </span>
  );
};

export default GeoLabel;
