'use client'

import type { Media, Product } from '@/payload-types'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export function Gallery({
  gallery,
  title,
}: {
  gallery: NonNullable<Product['gallery']>
  title: string
}) {
  const params = useSearchParams()
  const [selected, setSelected] = useState<{ index: number; options: string } | null>(null)
  const images = gallery.filter(
    (item): item is typeof item & { image: Media } =>
      !!item.image && typeof item.image === 'object' && !!item.image.url,
  )
  const optionParams = new URLSearchParams(params.toString())
  optionParams.delete('variant')
  optionParams.delete('image')
  const options = optionParams.toString()
  const optionIDs = Array.from(optionParams.values())
  const variantImage = images.findIndex(
    (item) =>
      item.variantOption &&
      optionIDs.includes(
        String(typeof item.variantOption === 'object' ? item.variantOption.id : item.variantOption),
      ),
  )
  const index =
    selected?.options === options
      ? Math.min(selected.index, images.length - 1)
      : Math.max(0, variantImage)
  const active = images[index]?.image

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
        {active?.url ? (
          <Image
            src={active.url}
            alt={active.alt || title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-6 md:p-10"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[#4b5563]">
            Imagen próximamente
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3" aria-label="Imágenes del producto">
          {images.map((item, i) => (
            <button
              key={`${item.image.id}-${i}`}
              type="button"
              aria-label={`Ver imagen ${i + 1} de ${title}`}
              aria-pressed={index === i}
              onClick={() => setSelected({ index: i, options })}
              className={`relative size-20 overflow-hidden rounded border-2 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3D393A] ${index === i ? 'border-[#3D393A]' : 'border-[#E8E3DD]'}`}
            >
              <Image
                src={item.image.url!}
                alt=""
                fill
                sizes="80px"
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
