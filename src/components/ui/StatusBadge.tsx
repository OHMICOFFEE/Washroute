import { cn } from '@/lib/utils'
import { STATUS_LABELS } from '@/lib/utils/pricing'
import type { BookingStatus } from '@/types'

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  pending_payment:      { bg: 'rgba(255,149,0,0.12)',  color: '#ff9500' },
  confirmed:            { bg: 'rgba(0,122,255,0.1)',   color: '#007aff' },
  driver_assigned:      { bg: 'rgba(0,122,255,0.1)',   color: '#007aff' },
  driver_en_route:      { bg: 'rgba(90,200,250,0.12)', color: '#0a84ff' },
  pickup_arrived:       { bg: 'rgba(90,200,250,0.12)', color: '#0a84ff' },
  pickup_verified:      { bg: 'rgba(175,82,222,0.1)',  color: '#af52de' },
  vehicle_collected:    { bg: 'rgba(175,82,222,0.1)',  color: '#af52de' },
  at_wash_facility:     { bg: 'rgba(90,200,250,0.1)',  color: '#32ade6' },
  wash_in_progress:     { bg: 'rgba(90,200,250,0.1)',  color: '#32ade6' },
  concierge_in_progress:{ bg: 'rgba(90,200,250,0.1)',  color: '#32ade6' },
  returning_vehicle:    { bg: 'rgba(52,199,89,0.1)',   color: '#34c759' },
  delivery_arrived:     { bg: 'rgba(52,199,89,0.12)',  color: '#34c759' },
  delivery_pin_released:{ bg: 'rgba(52,199,89,0.12)',  color: '#34c759' },
  delivery_verified:    { bg: 'rgba(52,199,89,0.12)',  color: '#34c759' },
  completed:            { bg: 'rgba(52,199,89,0.12)',  color: '#30d158' },
  cancelled:            { bg: 'rgba(255,59,48,0.1)',   color: '#ff3b30' },
}

export default function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  const style = BADGE_STYLES[status] ?? { bg: 'rgba(0,0,0,0.06)', color: '#6e6e73' }
  return (
    <span className={cn('pill', className)}
      style={{ background: style.bg, color: style.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.color }} />
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
