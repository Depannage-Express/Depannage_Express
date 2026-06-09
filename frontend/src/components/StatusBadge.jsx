import { CheckCircle, Clock, Wrench, Flag, CreditCard, Star, XCircle } from 'lucide-react'

const STATUS_CONFIG = {
  pending_acceptance: {
    icon: Clock,
    label: 'En attente',
    bg: '#fff8e1',
    color: '#e65100',
  },
  accepted: {
    icon: CheckCircle,
    label: 'Acceptée',
    bg: '#e3f2fd',
    color: '#1565c0',
  },
  in_progress: {
    icon: Wrench,
    label: 'En cours',
    bg: '#f3e5f5',
    color: '#6a1b9a',
  },
  completed: {
    icon: Flag,
    label: 'Terminée',
    bg: '#e8f5e9',
    color: '#2e7d32',
  },
  paid: {
    icon: CreditCard,
    label: 'Payée',
    bg: '#e0f2f1',
    color: '#00695c',
  },
  reviewed: {
    icon: Star,
    label: 'Évaluée',
    bg: '#fafafa',
    color: '#37474f',
  },
  refused: {
    icon: XCircle,
    label: 'Refusée',
    bg: '#ffebee',
    color: '#c62828',
  },
}

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    icon: Clock,
    label: status,
    bg: '#f5f5f5',
    color: '#666',
  }
  const Icon = config.icon
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      background: config.bg,
      color: config.color,
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
    }}>
      <Icon size={12} />
      {config.label}
    </span>
  )
}
