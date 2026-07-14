import { useState } from 'react';
import { Wrench, AlertTriangle, CreditCard, Lock, Smartphone } from 'lucide-react';
import { createPayment } from '../lib/api';

const OPERATORS = [
  { value: '', label: 'Choisir un opérateur' },
  { value: 'MTN Mobile Money', label: 'MTN Mobile Money' },
  { value: 'Moov Money', label: 'Moov Money' },
  { value: 'Celtiis Cash', label: 'Celtiis Cash' },
  { value: 'Carte Bancaire', label: 'Carte Bancaire' },
];

const Paiement = ({ payerName, amount, breakdownId, driverToken }) => {
  const [operator, setOperator] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('64000001');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePayer = async () => {
    setError('');

    if (!operator) {
      setError('Veuillez sélectionner un moyen de paiement.');
      return;
    }
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 8) {
      setError('Veuillez entrer un numéro de téléphone valide (8 chiffres minimum).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payment = await createPayment({
        payer_name: payerName || 'Conducteur',
        payer_phone: `+229${phoneNumber.replace(/\D/g, '')}`,
        amount: amount || 15000,
        payment_method: operator,
        payment_for: 'intervention',
        breakdown_request: breakdownId || null,
        driver_token: driverToken || null,
      });

      if (!payment.payment_url) {
        throw new Error("FedaPay n'a pas renvoyé de lien de paiement. Réessayez.");
      }

      sessionStorage.setItem('fedapay_return', JSON.stringify({
        payment_id: payment.payment_id,
        breakdown_id: breakdownId,
        driver_token: driverToken,
      }));
      sessionStorage.setItem('driver_token', driverToken || '');
      sessionStorage.setItem('breakdown_id', breakdownId || '');
      window.location.href = payment.payment_url;
    } catch (err) {
      setError(err.message || 'Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        background: '#fff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '480px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      }}>

        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #e85d04, #f48c06)',
          padding: '32px 28px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Wrench size={32} color="#fff" />
          </div>
          <h1 style={{
            color: '#fff',
            margin: 0,
            fontSize: '22px',
            fontWeight: '700',
            letterSpacing: '0.5px',
          }}>
            Paiement de l'intervention
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.85)',
            margin: '8px 0 0',
            fontSize: '14px',
          }}>
            DépannageExpress — Paiement sécurisé
          </p>
        </div>

        {/* CORPS */}
        <div style={{ padding: '28px' }}>

          {/* Montant */}
          {amount && (
            <div style={{
              background: '#fff8f0',
              border: '2px solid #f48c06',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
              marginBottom: '24px',
            }}>
              <p style={{
                margin: '0 0 6px',
                color: '#888',
                fontSize: '13px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Montant à payer
              </p>
              <p style={{
                margin: 0,
                fontSize: '42px',
                fontWeight: '800',
                color: '#e85d04',
                letterSpacing: '-1px',
              }}>
                {amount.toLocaleString('fr-FR')}
                <span style={{ fontSize: '18px' }}> FCFA</span>
              </p>
            </div>
          )}

          {/* Opérateur */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: '#555',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}>
              Moyen de paiement
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                style={{
                  width: '100%',
                  background: '#f8f9fa',
                  border: '2px solid #e9ecef',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: operator ? '#333' : '#999',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#f48c06'}
                onBlur={e => e.target.style.borderColor = '#e9ecef'}
              >
                {OPERATORS.map((op) => (
                  <option key={op.value} value={op.value} disabled={op.value === ''}>
                    {op.label}
                  </option>
                ))}
              </select>
              <span style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#999',
                fontSize: '12px',
              }}>▼</span>
            </div>
          </div>

          {/* Numéro */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#555',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}>
              Votre numéro
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8f9fa',
              border: '2px solid #e9ecef',
              borderRadius: '12px',
              padding: '12px 16px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRight: '1px solid #ddd',
                paddingRight: '12px',
                marginRight: '12px',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '20px' }}>🇧🇯</span>
                <span style={{ fontWeight: '700', color: '#555', fontSize: '14px' }}>+229</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={10}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#333',
                }}
                placeholder="0197654321"
              />
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{
              background: '#fff0f0',
              border: '1px solid #ffcdd2',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              color: '#c62828',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {/* Bouton principal */}
          <button
            onClick={handlePayer}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '16px',
              background: isSubmitting
                ? '#ccc'
                : 'linear-gradient(135deg, #e85d04, #f48c06)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              fontSize: '17px',
              fontWeight: '700',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'transform 0.1s, box-shadow 0.1s',
              boxShadow: isSubmitting ? 'none' : '0 6px 20px rgba(232,93,4,0.4)',
              letterSpacing: '0.3px',
            }}
            onMouseEnter={e => {
              if (!isSubmitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(232,93,4,0.5)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isSubmitting ? 'none' : '0 6px 20px rgba(232,93,4,0.4)';
            }}
          >
            {isSubmitting ? (
              <>
                <span style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  display: 'inline-block',
                  flexShrink: 0,
                }} />
                Initialisation...
              </>
            ) : (
              <><CreditCard size={18} /> Confirmer le paiement</>
            )}
          </button>

          {/* Badges sécurité */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '20px',
            flexWrap: 'wrap',
          }}>
            {[
              { icon: <Lock size={14} />, label: 'SSL sécurisé' },
              { icon: <Smartphone size={14} />, label: 'Mobile Money' },
              { icon: <CreditCard size={14} />, label: 'Carte bancaire' },
            ].map(badge => (
              <div key={badge.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                color: '#888',
                fontSize: '12px',
              }}>
                {badge.icon}
                <span>{badge.label}</span>
              </div>
            ))}
          </div>

          {/* FedaPay mention */}
          <div style={{
            textAlign: 'center',
            marginTop: '16px',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '10px',
          }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
              Paiement traité par{' '}
              <strong style={{ color: '#555' }}>FedaPay</strong>
              {' '}— Plateforme de paiement sécurisée en Afrique
            </p>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default Paiement;
