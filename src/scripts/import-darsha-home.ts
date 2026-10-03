/** Run once per environment with `pnpm import:darsha-home`. Existing home content is never overwritten. */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import path from 'node:path'

const payload = await getPayload({ config })
const existing = await payload.find({
  collection: 'pages',
  where: { slug: { equals: 'home' } },
  limit: 1,
})
if (existing.docs.length) {
  payload.logger.info('Home already exists; import skipped to preserve editorial changes.')
  process.exit(0)
}

async function media(filename: string, alt: string) {
  const found = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
  })
  if (found.docs[0]) return found.docs[0].id
  const created = await payload.create({
    collection: 'media',
    data: { alt },
    filePath: path.resolve(process.cwd(), 'public/darsha', filename),
  })
  return created.id
}

const [hero, body, facial, product, about] = await Promise.all([
  media('women-home.jpg', 'Mujer en un espacio de bienestar'),
  media('body-care.jpg', 'Tratamientos corporales'),
  media('spa-face-mask.jpg', 'Tratamientos faciales'),
  media('vertical-prod.jpg', 'Productos para el cuidado de la piel'),
  media('contact-us.jpg', 'Espacio Darsha'),
])

await payload.create({
  collection: 'pages',
  context: { disableRevalidate: true },
  data: {
    title: 'Inicio',
    slug: 'home',
    _status: 'published',
    hero: { type: 'none' },
    layout: [
      {
        blockType: 'darshaHero',
        heading: 'Espacio Darsha',
        intro: 'Invierte en ti, eres tu proyecto más importante.',
        image: hero,
        label: 'Reserva tu turno',
        url: 'https://wa.me/59892396930',
      },
      {
        blockType: 'darshaCards',
        heading: 'Servicios',
        intro: 'Descubre nuestra gama completa de tratamientos de belleza',
        cards: [
          { title: 'Tratamientos Corporales', image: body, url: '/servicios#corporales' },
          { title: 'Tratamientos Faciales', image: facial, url: '/servicios#faciales' },
          { title: 'Tienda', image: product, url: '/shop', badge: 'Próximamente!' },
        ],
      },
      {
        blockType: 'darshaImageText',
        heading: 'Sobre Nosotros',
        image: about,
        paragraphs: [
          {
            text: 'Espacio Darsha se creó con un propósito claro: ofrecer un lugar de bienestar y relajación donde las personas puedan tomarse un momento para sí mismas. Creemos en la importancia de cuidar cuerpo y mente para alcanzar una armonía integral, y por eso hemos desarrollado un ambiente acogedor y profesional.',
          },
          {
            text: 'En nuestro consultorio, brindamos una variedad de tratamientos de cosmetología y masajes, enfocados en mejorar el bienestar físico y emocional de nuestros clientes. Ya sea para relajarse, revitalizarse o cuidar de su piel, Espacio Darsha es el lugar ideal para encontrar ese equilibrio tan necesario en la vida diaria.',
          },
          {
            text: 'Nos comprometemos a ofrecer una atención personalizada, siempre guiados por valores de profesionalismo, responsabilidad y calidad. Aquí, cada cliente es importante, y trabajamos para que cada experiencia en nuestro espacio sea única y gratificante.',
          },
        ],
      },
      {
        blockType: 'darshaTestimonials',
        heading: 'Reseñas de nuestros clientes',
        reviews: [
          {
            title: 'Excelente lugar!',
            author: 'Maria Laura',
            quote:
              'Es una excelente profesional. Asesoramiento altamente personalizado y con productos magníficos.',
          },
          {
            title: 'Hermoso Espacio',
            author: 'Anahy F.',
            quote: 'Hermoso espacio brindado por Euge, una excelente profesional!',
          },
          {
            title: 'Excelente profesional',
            author: 'Rosimeri B.',
            quote: 'Eugenia una excelente profesional y una persona divina! La recomiendo siempre.',
          },
          {
            title: 'Espacio muy recomendable',
            author: 'Carolina R.',
            quote:
              'Muy recomendable. Excelente profesional Euge y servicios que brinda son maravillosos. Ideal para las que nos gusta darnos un mimo…',
          },
        ],
      },
      {
        blockType: 'darshaContact',
        heading: 'Contacto',
        items: [
          { kind: 'phone', label: '(+598) 92 396 930', url: 'tel:+59892396930' },
          {
            kind: 'location',
            label: 'Torre Barcelona, Punta del Este.',
            url: 'https://maps.app.goo.gl/N6cF1KoATANfZV3f7',
          },
          { kind: 'whatsapp', label: 'Contacto de Whatsapp', url: 'https://wa.me/59892396930' },
        ],
      },
    ],
  },
})

await payload.updateGlobal({
  slug: 'header',
  data: {
    navItems: [
      { link: { type: 'custom', label: 'Servicios', url: '/servicios' } },
      { link: { type: 'custom', label: 'Contacto', url: '/#contact' } },
      { link: { type: 'custom', label: 'Tienda', url: '/shop' } },
    ],
  },
})
await payload.updateGlobal({
  slug: 'footer',
  data: {
    navItems: [
      {
        link: {
          type: 'custom',
          label: 'Instagram',
          url: 'https://www.instagram.com/espaciodarsha/',
        },
      },
    ],
  },
})
payload.logger.info('Darsha home imported.')
process.exit(0)
