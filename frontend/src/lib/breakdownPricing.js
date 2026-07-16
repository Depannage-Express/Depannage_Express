// Tarif par panne — clés = libellés exacts de components/demande_depannage.jsx (BREAKDOWN_TYPES).
// Une demande peut cumuler plusieurs pannes : la plus chère est facturée plein tarif,
// chacune des suivantes bénéficie d'une réduction de 20%.
// Estimation affichage uniquement — le montant réel est calculé et validé côté serveur
// (backend/apps/breakdowns/pricing.py, doit rester en cohérence avec cette table).

const FALLBACK_LABEL = 'Autre panne';
const REPEAT_BREAKDOWN_DISCOUNT_RATE = 0.20;

export const BREAKDOWN_PRICING = {
  'Panne moteur':                18000,
  'Surchauffe moteur':           18000,
  'Moteur fumant':               20000,
  'Boîte de vitesses':           22000,
  'Embrayage':                   20000,
  'Accident / Collision':        25000,
  'Suspension / Amortisseurs':   18000,
  'Frein défaillant':            16000,
  'Batterie déchargée':          12000,
  'Alternateur':                 15000,
  'Panne électrique':            15000,
  'Courroie cassée':             15000,
  'Fuite de liquide':            12000,
  'Radiateur':                   12000,
  'Climatisation':               12000,
  'Problème de démarrage':       10000,
  'Tableau de bord':             10000,
  'Panne de carburant':           8000,
  'Pneu crevé':                   8000,
  'Éclairage en panne':           8000,
  'Vitre / Serrure':              8000,
  'Autre panne':                 15000,
};

export function computeBreakdownAmount(breakdownType) {
  const labels = (breakdownType || '')
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean);

  if (labels.length === 0) labels.push(FALLBACK_LABEL);

  const prices = labels
    .map((label) => BREAKDOWN_PRICING[label] ?? BREAKDOWN_PRICING[FALLBACK_LABEL])
    .sort((a, b) => b - a);

  return prices.reduce((total, price, index) => {
    if (index === 0) return total + price;
    return total + Math.floor(price * (1 - REPEAT_BREAKDOWN_DISCOUNT_RATE));
  }, 0);
}
