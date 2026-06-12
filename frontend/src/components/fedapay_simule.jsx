import { useState } from 'react';
import { AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { confirmPayment } from '../lib/api';

const FedaPaySimule = ({ paymentId, breakdownId, driverToken, amount, payerPhone, paymentMethod, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setError('');
    setIsProcessing(true);
    try {
      await confirmPayment(paymentId, breakdownId, driverToken);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Erreur lors du paiement. Veuillez réessayer.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f4f8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: "'Segoe UI', Arial, sans-serif",
    }}>

      {/* Barre supérieure FedaPay */}
      <div style={{
        width: '100%',
        background: '#1a9c3e',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: '#fff',
            borderRadius: '6px',
            padding: '4px 10px',
            fontWeight: '900',
            fontSize: '16px',
            color: '#1a9c3e',
            letterSpacing: '1px',
          }}>
            Feda<span style={{ color: '#f9a825' }}>Pay</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
            Paiement sécurisé
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
          <Lock size={14} />
          <span>SSL 256-bit</span>
        </div>
      </div>

      {/* Carte principale */}
      <div style={{
        marginTop: '40px',
        width: '100%',
        maxWidth: '440px',
        background: '#fff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        marginInline: '16px',
      }}>

        {/* En-tête montant */}
        <div style={{
          background: 'linear-gradient(135deg, #1a9c3e, #25c75a)',
          padding: '28px 24px',
          textAlign: 'center',
        }}>
          <p style={{
            margin: '0 0 6px',
            color: 'rgba(255,255,255,0.8)',
            fontSize: '13px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
          }}>
            Montant à régler
          </p>
          <p style={{
            margin: 0,
            color: '#fff',
            fontSize: '40px',
            fontWeight: '800',
            letterSpacing: '-1px',
          }}>
            {amount ? amount.toLocaleString('fr-FR') : '—'}
            <span style={{ fontSize: '18px', fontWeight: '600', marginLeft: '6px' }}>XOF</span>
          </p>
          <p style={{
            margin: '8px 0 0',
            color: 'rgba(255,255,255,0.75)',
            fontSize: '12px',
          }}>
            DépannageExpress — Service de dépannage
          </p>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px' }}>

          {/* Moyen de paiement */}
          <div style={{
            background: '#f8fafb',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '16px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Moyen de paiement
            </p>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: '#1a202c' }}>
              {paymentMethod || 'Mobile Money'}
            </p>
          </div>

          {/* Numéro */}
          <div style={{
            background: '#f8fafb',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '24px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Numéro de compte
            </p>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: '#1a202c', letterSpacing: '1px' }}>
              {payerPhone || '—'}
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fff0f0',
              border: '1px solid #ffcdd2',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '16px',
              color: '#c62828',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {/* Bouton Payer */}
          <button
            onClick={handlePay}
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '15px',
              background: isProcessing ? '#a0d4b0' : '#1a9c3e',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background 0.2s',
              letterSpacing: '0.3px',
            }}
          >
            {isProcessing ? (
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
                Traitement en cours…
              </>
            ) : (
              <><ShieldCheck size={18} /> Payer maintenant</>
            )}
          </button>

          {/* Footer sécurité */}
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            color: '#999',
            fontSize: '12px',
            lineHeight: '1.6',
          }}>
            <Lock size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Transaction sécurisée par <strong style={{ color: '#1a9c3e' }}>FedaPay</strong>
            {' '}— Votre numéro de compte ne sera jamais partagé.
          </div>
        </div>
      </div>

      {/* Logos partenaires */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        opacity: 0.5,
      }}>
        {['MTN', 'MOOV', 'CELTIIS'].map(op => (
          <div key={op} style={{
            background: '#fff',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '700',
            color: '#555',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}>
            {op}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default FedaPaySimule;
