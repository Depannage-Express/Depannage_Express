import { useEffect, useState } from 'react';
import { confirmPayment, fetchInterventionForBreakdown } from '../lib/api';
import GeoLabel from './geo_label';
import SafeImage from './SafeImage';

const BREAKDOWN_LABELS = {
  moteur:     '🔩 Panne moteur',
  pneu:       '🛞 Crevaison / Pneu',
  electrique: '⚡ Panne électrique',
  carburant:  '⛽ Panne de carburant',
  demarrage:  '🔑 Problème démarrage',
  general:    '🔧 Dépannage général',
};

const ConfirmerPaiement = ({ onabout, paymentId, breakdownId, driverLat, driverLon, driverToken }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [effectiveToken] = useState(
    () => driverToken || sessionStorage.getItem('driver_token') || null
  );

  useEffect(() => {
    if (!paymentId || !breakdownId) return;
    confirmPayment(paymentId, breakdownId, effectiveToken)
      .catch((err) => setError(err?.message || 'Erreur lors de la confirmation du paiement.'))
      .finally(() => {
        fetchInterventionForBreakdown(breakdownId).then(setData).catch(() => {});
      });
  }, [paymentId, breakdownId, effectiveToken]);

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

          {/* Header vert succès */}
          <div style={{
            background: 'linear-gradient(135deg, #2e7d32, #43a047)',
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
              fontSize: '40px',
              animation: 'popIn 0.5s ease-out',
            }}>
              ✅
            </div>
            <h1 style={{
              color: '#fff',
              margin: '0 0 8px',
              fontSize: '24px',
              fontWeight: '800',
            }}>
              Paiement réussi !
            </h1>
            <p style={{
              color: 'rgba(255,255,255,0.85)',
              margin: 0,
              fontSize: '15px',
            }}>
              Votre mécanicien est en route 🚗
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
                ⚠️ {error}
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
                  <span style={{ fontSize: '24px' }}>📍</span>
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
                          📞 {data.mechanic_phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Détails */}
                  {[
                    {
                      icon: '🔩',
                      label: 'Type de panne',
                      value: BREAKDOWN_LABELS[data.breakdown_type] || data.breakdown_type,
                    },
                    data.breakdown_description && {
                      icon: '📝',
                      label: 'Description',
                      value: data.breakdown_description,
                    },
                    (data.mechanic_latitude || data.mechanic_longitude || data.mechanic_city) && {
                      icon: '📍',
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
                <span style={{ fontSize: '20px' }}>🧭</span>
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

            {/* Bouton continuer */}
            <button
              onClick={() => {
                sessionStorage.removeItem('driver_token');
                sessionStorage.removeItem('breakdown_id');
                onabout();
              }}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(15,52,96,0.4)',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Continuer le suivi 🔍
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
          <span style={{ fontSize: '20px' }}>💡</span>
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
