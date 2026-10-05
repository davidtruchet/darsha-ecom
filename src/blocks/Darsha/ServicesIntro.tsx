export function DarshaServicesIntroBlock({ heading, intro }: { heading: string; intro: string }) {
  return (
    <div className="bg-white pb-16">
      <section
        className="w-full px-4 pb-20 pt-24 text-center"
        style={{ background: 'linear-gradient(to right, #CEC3BA, #E8E3DD, #D1C7C0)' }}
      >
        <div className="mx-auto max-w-4xl font-darsha-serif">
          <h1 className="mb-4 text-4xl text-[#111827] md:text-6xl">{heading}</h1>
          <p className="mx-auto max-w-2xl text-xl text-[#4b5563] md:text-2xl">{intro}</p>
        </div>
      </section>
    </div>
  )
}
