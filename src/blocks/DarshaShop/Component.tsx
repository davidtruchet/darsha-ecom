import Link from 'next/link'

export function DarshaShopIntroBlock({ heading, intro }: { heading: string; intro: string }) {
  return (
    <section
      className="px-4 pb-20 pt-24 text-center"
      style={{ background: 'linear-gradient(to right, #CEC3BA, #E8E3DD, #D1C7C0)' }}
    >
      <div className="mx-auto max-w-4xl font-darsha-serif">
        <h1 className="mb-4 text-4xl text-[#111827] md:text-6xl">{heading}</h1>
        <p className="mx-auto max-w-2xl text-xl text-[#4b5563] md:text-2xl">{intro}</p>
      </div>
    </section>
  )
}

export function DarshaShopPromotionBlock({
  heading,
  description,
  linkLabel,
  linkURL,
}: {
  heading: string
  description?: string | null
  linkLabel?: string | null
  linkURL?: string | null
}) {
  return (
    <section className="bg-[#E8E3DD] py-8 text-[#3D393A]">
      <div className="darsha-container flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-darsha-serif text-2xl">{heading}</h2>
          {description && <p className="mt-2">{description}</p>}
        </div>
        {linkURL && linkLabel && (
          <Link href={linkURL} className="underline underline-offset-4">
            {linkLabel}
          </Link>
        )}
      </div>
    </section>
  )
}
