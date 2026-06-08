import { cn } from '@/lib/utils'
import { Check, Circle } from 'lucide-react'
import type { BookingStatus, BookingStatusEvent } from '@/types'
import { STATUS_LABELS } from '@/lib/utils/pricing'
import { formatDateTime } from '@/lib/utils'

const TIMELINE_STEPS: BookingStatus[] = [
  'pending_payment',
  'confirmed',
  'driver_assigned',
  'driver_en_route',
  'pickup_arrived',
  'pickup_verified',
  'vehicle_collected',
  'wash_in_progress',
  'returning_vehicle',
  'delivery_arrived',
  'delivery_verified',
  'completed',
]

interface BookingTimelineProps {
  currentStatus: BookingStatus
  events?: BookingStatusEvent[]
  compact?: boolean
}

export default function BookingTimeline({ currentStatus, events, compact }: BookingTimelineProps) {
  const currentIdx = TIMELINE_STEPS.indexOf(currentStatus)
  const isCancelled = currentStatus === 'cancelled'

  if (isCancelled) {
    return (
      <div className="glass rounded-xl p-4 text-center text-red-400 text-sm">
        This booking has been cancelled.
      </div>
    )
  }

  return (
    <div className={cn('space-y-0', compact && 'text-xs')}>
      {TIMELINE_STEPS.map((step, idx) => {
        const done    = idx < currentIdx
        const active  = idx === currentIdx
        const pending = idx > currentIdx
        const event   = events?.find(e => e.status === step)

        return (
          <div key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'timeline-dot border-2 flex-shrink-0 flex items-center justify-center',
                  done   && 'bg-indigo-500 border-indigo-500',
                  active && 'bg-white border-white shadow-glow',
                  pending && 'bg-transparent border-white/20',
                )}
              >
                {done && <Check className="w-2 h-2 text-white" />}
                {active && <Circle className="w-2 h-2 text-surface-900 fill-current" />}
              </div>
              {idx < TIMELINE_STEPS.length - 1 && (
                <div
                  className={cn(
                    'timeline-line',
                    done   && 'bg-indigo-500',
                    active  && 'bg-gradient-to-b from-white/60 to-white/10',
                    pending && 'bg-white/10',
                  )}
                />
              )}
            </div>
            <div className={cn('pb-4 min-w-0 flex-1', idx === TIMELINE_STEPS.length - 1 && 'pb-0')}>
              <p className={cn(
                'font-medium leading-tight',
                done   && 'text-white/50',
                active && 'text-white',
                pending && 'text-white/25',
              )}>
                {STATUS_LABELS[step] ?? step}
              </p>
              {event && (
                <p className="text-white/30 text-xs mt-0.5">{formatDateTime(event.created_at)}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
