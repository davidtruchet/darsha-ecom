'use client'

import type { Media } from '@/payload-types'
import { ChevronRight, Clock, DollarSign, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

type Treatment = {
  title: string
  description: string
  duration: string
  frequency?: string | null
  price?: string | null
  id?: string | null
}

type Props = {
  sectionId: 'faciales' | 'corporales'
  heading: string
  intro: string
  image: number | Media | null
  imageSide: 'left' | 'right'
  background: 'white' | 'beige' | 'warmWhite'
  showPrices?: boolean | null
  treatments?: Treatment[] | null
  bookingLabel: string
  bookingURL: string
}

export function DarshaTreatmentsBlock({
  sectionId,
  heading,
  intro,
  image,
  imageSide,
  background,
  showPrices,
  treatments,
  bookingLabel,
  bookingURL,
}: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const imageURL = typeof image === 'object' ? image?.url : null
  const imageAlt = typeof image === 'object' ? image?.alt || heading : heading

  return (
    <section
      id={sectionId}
      className={`w-full py-16 text-[#0a0a0a] ${background === 'warmWhite' ? 'bg-[#f8f5f2]' : background === 'beige' ? 'bg-[#CEC3BA]' : 'bg-white'}`}
    >
      <div className="darsha-container">
        <div className="flex flex-col gap-8 pb-8 md:flex-row">
          <div className="md:w-1/2">
            <h2 className="font-darsha-serif mb-8 text-4xl md:text-5xl">{heading}</h2>
          </div>
          <div className="md:w-1/2">
            <p className="text-xl text-[#4b5563]">{intro}</p>
          </div>
        </div>
        <div className="flex flex-col gap-8 md:flex-row">
          <div className={`md:w-1/2 ${imageSide === 'left' ? 'md:order-2' : ''}`}>
            <div className="space-y-2">
              {treatments?.map((treatment, index) => {
                const isOpen = activeIndex === index
                const panelId = `${sectionId}-treatment-${index}`
                return (
                  <div
                    key={treatment.id || index}
                    className="overflow-hidden rounded-lg border border-[#e5e7eb]"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setActiveIndex(isOpen ? null : index)}
                      className={`flex w-full cursor-pointer items-center justify-between p-4 text-left transition-colors ${
                        isOpen ? 'bg-[#3D393A] text-white' : 'hover:bg-[#f3f4f6]'
                      }`}
                    >
                      <span className="flex items-center">
                        <span className="mr-3 text-xs opacity-60">
                          {String(index + 1).padStart(2, '0')}.
                        </span>
                        <span className="font-medium">{treatment.title}</span>
                      </span>
                      <ChevronRight
                        className={`ml-2 size-4 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                      />
                    </button>
                    <div
                      id={panelId}
                      aria-hidden={!isOpen}
                      inert={!isOpen}
                      className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ${
                        isOpen
                          ? 'grid-rows-[1fr] border-t border-[#e5e7eb] opacity-100'
                          : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="bg-white p-6">
                          <p className="mb-6 text-[#4b5563]">{treatment.description}</p>
                          <div className="mb-8 space-y-3">
                            <div className="flex items-center gap-2">
                              <Clock className="size-5 text-[#9ca3af]" />
                              <span className="text-sm">{treatment.duration}</span>
                            </div>
                            {showPrices && treatment.price && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="size-5 text-[#9ca3af]" />
                                <span className="text-sm">{treatment.price}</span>
                              </div>
                            )}
                            {treatment.frequency && (
                              <div className="flex items-center gap-2">
                                <RefreshCw className="size-5 text-[#9ca3af]" />
                                <span className="text-sm">{treatment.frequency}</span>
                              </div>
                            )}
                          </div>
                          <Link
                            href={bookingURL}
                            target={bookingURL.startsWith('http') ? '_blank' : undefined}
                            rel={bookingURL.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className="block w-full rounded-md bg-[#3D393A] px-6 py-3 text-center text-white hover:bg-[#1f2937]"
                          >
                            {bookingLabel}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className={`mt-8 md:mt-0 md:w-1/2 ${imageSide === 'left' ? 'md:order-1' : ''}`}>
            <div className="relative mx-auto my-12 w-full max-w-md">
              <div className="absolute -top-10 right-0 flex w-full justify-end">
                <Image
                  src="/darsha/ellipse-2.png"
                  alt=""
                  width={300}
                  height={30}
                  className="object-contain"
                />
              </div>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-full">
                {imageURL && (
                  <Image
                    src={imageURL}
                    alt={imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 448px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="absolute -bottom-10 left-0 w-full">
                <Image
                  src="/darsha/ellipse-1.png"
                  alt=""
                  width={300}
                  height={30}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
