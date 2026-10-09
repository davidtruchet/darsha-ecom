import type { Product } from '@/payload-types'
import { RichText } from '@/components/RichText'
import { ChevronDown } from 'lucide-react'

function hasContent(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  if ('text' in node && typeof node.text === 'string' && node.text.trim()) return true
  if ('type' in node && (node.type === 'upload' || node.type === 'block')) return true
  return 'children' in node && Array.isArray(node.children) && node.children.some(hasContent)
}

export function ProductDetails({ product }: { product: Product }) {
  const sections = [
    {
      title: 'Descripción',
      content:
        product.description && hasContent(product.description.root) ? (
          <RichText
            data={product.description}
            enableGutter={false}
            enableProse={false}
            className="leading-relaxed [&_p]:mb-4 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
          />
        ) : null,
    },
    {
      title: 'Beneficios',
      content: product.benefits?.trim() ? (
        <p className="whitespace-pre-line">{product.benefits}</p>
      ) : null,
    },
    {
      title: 'Modo de uso',
      content: product.usageInstructions?.trim() ? (
        <p className="whitespace-pre-line">{product.usageInstructions}</p>
      ) : null,
    },
    {
      title: 'Ingredientes',
      content: product.ingredients?.trim() ? (
        <p className="whitespace-pre-line">{product.ingredients}</p>
      ) : null,
    },
  ].filter((section) => section.content)
  if (!sections.length) return null

  return (
    <section aria-label="Detalles del producto" className="mt-16 border-t border-[#D1C7C0]">
      {sections.map((section, index) => (
        <details key={section.title} open={index === 0} className="group border-b border-[#D1C7C0]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 font-darsha-serif text-2xl [&::-webkit-details-marker]:hidden">
            {section.title}
            <ChevronDown
              aria-hidden
              className="size-5 shrink-0 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="max-w-4xl pb-6 leading-relaxed text-[#4b5563]">{section.content}</div>
        </details>
      ))}
    </section>
  )
}
