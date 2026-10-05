import Link from 'next/link'

export function DarshaBookingCTABlock({
  heading,
  bookingLabel,
  bookingURL,
}: {
  heading: string
  bookingLabel: string
  bookingURL: string
}) {
  return (
    <section id="contact" className="bg-[#CEC3BA] py-16 text-center">
      <div className="darsha-container">
        <h2 className="mb-12 text-xl font-semibold text-[#3D393A]">{heading}</h2>
        <Link
          href={bookingURL}
          target={bookingURL.startsWith('http') ? '_blank' : undefined}
          rel={bookingURL.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="inline-flex w-full justify-center rounded-md bg-[#3D393A] px-6 py-3 text-[#fafaf9] hover:opacity-60 md:w-auto"
        >
          {bookingLabel}
        </Link>
      </div>
    </section>
  )
}
