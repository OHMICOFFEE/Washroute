import StaticBookingWizard from '@/components/booking/StaticBookingWizard'

export default function NewBookingPage() {
  return (
    <div className="anim-fadeup">
      <div className="pt-2 mb-6">
        <p className="caption">New Booking</p>
        <h1 className="display mt-0.5">Let's book your wash</h1>
      </div>
      <StaticBookingWizard />
    </div>
  )
}
