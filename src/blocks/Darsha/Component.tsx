import type { Media } from '@/payload-types'
import { ArrowRight, MapPin, MessageCircle, MessageSquareQuote, Phone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type Picture = number | Media | null
const source = (picture: Picture) => (typeof picture === 'object' ? picture?.url : null)
const alt = (picture: Picture) => (typeof picture === 'object' ? picture?.alt || '' : '')

export function DarshaHeroBlock({
  heading,
  intro,
  image,
  label,
  url,
}: {
  heading: string
  intro?: string | null
  image: Picture
  label: string
  url: string
}) {
  return (
    <section className="relative flex min-h-[60vh] items-center md:min-h-[70vh]">
      {source(image) && (
        <Image
          src={source(image)!}
          alt={alt(image)}
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-[center_30%]"
        />
      )}
      <div className="darsha-container relative z-10">
        <div className="mx-auto max-w-lg rounded-lg bg-[#CEC3BA]/80 p-6 md:mx-0 md:p-8">
          <h1 className="font-darsha-serif mb-4 text-4xl text-gray-900 md:text-5xl">{heading}</h1>
          {intro && <p className="mb-6 text-lg text-gray-800 md:text-xl">{intro}</p>}
          <Link
            href={url}
            className="inline-flex w-full justify-center rounded-md bg-[#3D393A] px-6 py-3 text-[#fafaf9] hover:opacity-60 md:w-auto"
          >
            {label}
          </Link>
        </div>
      </div>
    </section>
  )
}

export function DarshaCardsBlock({
  heading,
  intro,
  cards,
}: {
  heading: string
  intro?: string | null
  cards?:
    | { title: string; image: Picture; url: string; badge?: string | null; id?: string | null }[]
    | null
}) {
  return (
    <section id="services" className="bg-[#fafaf9] py-16">
      <div className="darsha-container text-gray-900">
        <h2 className="font-darsha-serif mb-4 text-center text-4xl md:text-5xl">{heading}</h2>
        {intro && <p className="mb-12 text-center text-xl">{intro}</p>}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards?.map((card, i) => (
            <Link href={card.url} key={card.id || i} className="group block text-center">
              <div className="relative mx-auto mb-4 aspect-square w-[260px] sm:w-[280px] xl:w-[360px]">
                <div className="relative size-full overflow-hidden rounded-full border-2 border-transparent group-hover:border-[#E8E3DD]">
                  {source(card.image) && (
                    <Image
                      src={source(card.image)!}
                      alt={alt(card.image)}
                      fill
                      sizes="(max-width: 640px) 300px, (max-width: 1024px) 280px, 360px"
                      className="object-cover"
                    />
                  )}
                </div>
                {card.badge && (
                  <span className="absolute right-[15%] top-[12%] -rotate-12 rounded-full bg-[#3D393A] px-3 py-1 text-xs text-[#fafaf9]">
                    {card.badge}
                  </span>
                )}
              </div>
              <h3 className="mb-2 text-xl font-medium group-hover:text-gray-500">{card.title}</h3>
              <span className="inline-flex items-center text-[#3D393A] group-hover:text-gray-500">
                Más Información <ArrowRight className="ml-1 size-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export function DarshaImageTextBlock({
  heading,
  paragraphs,
  image,
}: {
  heading: string
  paragraphs?: { text: string; id?: string | null }[] | null
  image: Picture
}) {
  return (
    <section id="about" className="bg-[#CEC3BA] py-16">
      <div className="darsha-container flex flex-col items-center md:flex-row">
        <div className="font-darsha-serif mb-8 text-xl text-gray-900 md:mb-0 md:w-1/2 md:pr-10">
          <h2 className="mb-6 text-3xl md:text-5xl">{heading}</h2>
          {paragraphs?.map((p, i) => (
            <p className="mb-6" key={p.id || i}>
              {p.text}
            </p>
          ))}
        </div>
        <div className="relative h-[500px] w-full overflow-hidden rounded-2xl md:w-1/2 md:h-[650px]">
          {source(image) && (
            <Image
              src={source(image)!}
              alt={alt(image)}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
      </div>
    </section>
  )
}

export function DarshaTestimonialsBlock({
  heading,
  reviews,
}: {
  heading: string
  reviews?: { title: string; author: string; quote: string; id?: string | null }[] | null
}) {
  return (
    <section id="reviews" className="bg-[#fafaf9] py-16">
      <div className="darsha-container">
        <h2 className="font-darsha-serif mb-12 text-center text-4xl text-gray-900 md:text-5xl">
          {heading}
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {reviews?.map((r, i) => (
            <div key={r.id || i} className="rounded-lg bg-[#E8E3DD] p-6 text-[#3D393A]">
              <div className="mb-4 flex items-center">
                <MessageSquareQuote />
                <div className="pl-3">
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="text-sm">{r.author}</p>
                </div>
              </div>
              <p>{r.quote}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const icons = { phone: Phone, location: MapPin, whatsapp: MessageCircle }
export function DarshaContactBlock({
  heading,
  items,
}: {
  heading: string
  items?:
    | { kind: 'phone' | 'location' | 'whatsapp'; label: string; url: string; id?: string | null }[]
    | null
}) {
  return (
    <section id="contact" className="bg-[#CEC3BA] py-16">
      <div className="darsha-container">
        <h2 className="mb-12 text-center text-3xl font-semibold text-[#3D393A]">{heading}</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {items?.map((item, i) => {
            const Icon = icons[item.kind]
            return (
              <a
                key={item.id || i}
                href={item.url}
                target={item.url.startsWith('http') ? '_blank' : undefined}
                rel={item.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-center justify-center text-[#3D393A]"
              >
                <Icon className="mr-2" />
                {item.label}
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
