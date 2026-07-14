import { useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertTriangle, MapPin, Phone, Wrench, FileText, Search, Lightbulb, Navigation, Loader2 } from 'lucide-react';
import { fetchInterventionForBreakdown } from '../lib/api';
import GeoLabel from './geo_label';
import SafeImage from './SafeImage';

const PAID_STATUSES = ['paid', 'reviewed'];
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 40000;

const BREAKDOWN_LABELS = {
  moteur:     'Panne moteur',
  pneu:       'Crevaison / Pneu',
  electrique: 'Panne électrique',
  carburant:  'Panne de carburant',
  demarrage:  'Problème démarrage',
  general:    'Dépannage général',
};

const ConfirmerPaiement = ({ onabout, breakdownId, driverLat, driverLon }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!breakdownId) return;

    const startedAt = Date.now();

    const poll = () => {
      fetchInterventionForBreakdown(breakdownId)
        .then((intervention) => {
          setError(null);
          setData(intervention);
          if (PAID_STATUSES.includes(intervention.status)) {
            setIsConfirmed(true);
            clearInterval(pollRef.current);
            return;
          }
          if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
            setHasTimedOut(true);
            clearInterval(pollRef.current);
          }
        })
        .catch((err) => setError(err?.message || 'Impossible de vérifier le statut du paiement.'));
    };

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [breakdownId]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Segoe UI', sans-serif",
    }}>

      <div style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>

        {/* CARTE SUCCÈS */}
        <div style={{
          background: '#fff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        }}>

          {/* Header : en attente / succès / délai dépassé */}
          <div style={{
            background: isConfirmed
              ? 'linear-gradient(135deg, #2e7d32, #43a047)'
              : hasTimedOut
                ? 'linear-gradient(135deg, #e65100, #ef6c00)'
                : 'linear-gradient(135deg, #1565c0, #1976d2)',
            padding: '32px 28px',
            textAlign: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              animation: 'popIn 0.5s ease-out',
            }}>
              {isConfirmed ? (
                <CheckCircle size={40} color="#fff" />
              ) : hasTimedOut ? (
                <AlertTriangle size={40} color="#fff" />
              ) : (
                <Loader2 size={40} color="#fff" className="animate-spin" />
              )}
            </div>
            <h1 style={{
              color: '#fff',
              margin: '0 0 8px',
              fontSize: '24px',
              fontWeight: '800',
            }}>
              {isConfirmed
                ? 'Paiement réussi !'
                : hasTimedOut
                  ? 'Confirmation en attente'
                  : 'Confirmation du paiement…'}
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.85)',
              margin: 0,
              fontSize: '15px',
            }}>
              {isConfirmed
                ? 'Votre mécanicien est en route'
                : hasTimedOut
                  ? 'FedaPay met plus de temps que prévu à confirmer. Le suivi se mettra à jour automatiquement.'
                  : 'Nous attendons la confirmation de FedaPay, un instant…'}
            </p>
          </div>

          {/* Corps */}
          <div style={{ padding: '24px' }}>

            {/* Erreur éventuelle */}
            {error && (
              <div style={{
                background: '#fff0f0',
                border: '1px solid #ffcdd2',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#c62828',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            {/* Badge distance estimée */}
            {data?.assignment_distance_km && (
              <div style={{
                background: '#fff8e1',
                border: '1px solid #ffe082',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin size={24} color="#e85d04" />
                  <div>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#888',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Distance estimée
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '20px',
                      fontWeight: '800',
                      color: '#e85d04',
                    }}>
                      {parseFloat(data.assignment_distance_km).toFixed(2)} km
                    </p>
                  </div>
                </div>
                <div style={{
                  background: '#e85d04',
                  color: '#fff',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}>
                  En route
                </div>
              </div>
            )}

            {/* Infos mécanicien */}
            {data && (
              <>
                <p style={{
                  margin: '0 0 12px',
                  fontSize: '12px',
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600',
                }}>
                  Votre mécanicien
                </p>

                <div style={{
                  background: '#f8f9fa',
                  borderRadius: '16px',
                  padding: '16px',
                  marginBottom: '20px',
                }}>

                  {/* Avatar + nom + tel */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    marginBottom: '16px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #eee',
                  }}>
                    <SafeImage
                      src={null}
                      name={data.mechanic_name || '?'}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{
                        margin: '0 0 6px',
                        fontWeight: '700',
                        fontSize: '17px',
                        color: '#1a1a2e',
                      }}>
                        {data.mechanic_name || '—'}
                      </p>
                      {data.mechanic_phone && (
                        <a
                          href={`tel:${data.mechanic_phone}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#e8f5e9',
                            color: '#2e7d32',
                            padding: '5px 12px',
                            borderRadius: '20px',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          <Phone size={14} /> {data.mechanic_phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Détails */}
                  {[
                    {
                      icon: <Wrench size={16} color="#888" />,
                      label: 'Type de panne',
                      value: BREAKDOWN_LABELS[data.breakdown_type] || data.breakdown_type,
                    },
                    data.breakdown_description && {
                      icon: <FileText size={16} color="#888" />,
                      label: 'Description',
                      value: data.breakdown_description,
                    },
                    (data.mechanic_latitude || data.mechanic_longitude || data.mechanic_city) && {
                      icon: <MapPin size={16} color="#888" />,
                      label: 'Position mécanicien',
                      value: <GeoLabel lat={data.mechanic_latitude} lon={data.mechanic_longitude} fallback={data.mechanic_city} />,
                    },
                  ].filter(Boolean).map(item => (
                    <div key={item.label} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0',
                      gap: '12px',
                    }}>
                      <span style={{
                        color: '#888',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.icon} {item.label}
                      </span>
                      <span style={{
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#333',
                        textAlign: 'right',
                      }}>
                        {item.value || '—'}
                      </span>
                    </div>
                  ))}

                </div>
              </>
            )}

            {/* Votre position */}
            {(driverLat || driverLon) && (
              <div style={{
                background: '#e3f2fd',
                border: '1px solid #90caf9',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                <Navigation size={20} color="#1565c0" />
                <div>
                  <p style={{
                    margin: '0 0 4px',
                    fontSize: '11px',
                    color: '#1565c0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: '700',
                  }}>
                    Votre position
                  </p>
                  <span style={{ fontSize: '13px', color: '#1a237e', fontWeight: '500' }}>
                    <GeoLabel lat={driverLat} lon={driverLon} />
                  </span>
                </div>
              </div>
            )}

            {/* Bouton continuer — disponible seulement une fois le paiement réellement confirmé */}
            <button
              disabled={!isConfirmed}
              onClick={() => {
                sessionStorage.removeItem('driver_token');
                sessionStorage.removeItem('breakdown_id');
                onabout();
              }}
              style={{
                width: '100%',
                padding: '16px',
                background: isConfirmed ? 'linear-gradient(135deg, #1a1a2e, #0f3460)' : '#b0b3bd',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: isConfirmed ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: isConfirmed ? '0 6px 20px rgba(15,52,96,0.4)' : 'none',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => {
                if (isConfirmed) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Search size={18} /> {isConfirmed ? 'Continuer le suivi' : 'En attente de confirmation…'}
            </button>

          </div>
        </div>

        {/* Carte conseil */}
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <Lightbulb size={20} color="rgba(255,255,255,0.75)" />
          <p style={{
            margin: 0,
            color: 'rgba(255,255,255,0.75)',
            fontSize: '13px',
            lineHeight: '1.6',
          }}>
            Conservez votre code de confirmation.
            Il vous sera demandé pour valider la fin de l&apos;intervention.
          </p>
        </div>

      </div>

      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>

    </div>
  );
};

export default ConfirmerPaiement;
