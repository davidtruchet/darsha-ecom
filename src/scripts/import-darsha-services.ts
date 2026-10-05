/** Import the original Servicios page once. Existing editorial content is never overwritten. */
import 'dotenv/config'
import config from '@payload-config'
import { getPayload } from 'payload'
import path from 'node:path'
import services from './data/darsha-services.json'

const payload = await getPayload({ config })
const existing = await payload.find({
  collection: 'pages',
  where: { slug: { equals: 'servicios' } },
  limit: 1,
})
if (existing.docs.length) {
  payload.logger.info('Servicios already exists; import skipped to preserve editorial changes.')
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

const [facialImage, bodyImage] = await Promise.all([
  media('servicos-faciales.jpg', 'Tratamientos faciales'),
  media('service-body.jpg', 'Servicios corporales'),
])
const bookingURL = 'https://wa.me/59892396930'

await payload.create({
  collection: 'pages',
  context: { disableRevalidate: true },
  data: {
    title: 'Servicios',
    slug: 'servicios',
    _status: 'published',
    hero: { type: 'none' },
    layout: [
      {
        blockType: 'darshaServicesIntro',
        heading: 'Nuestros Servicios',
        intro:
          'Descubre nuestra gama completa de tratamientos de belleza y bienestar diseñados para realzar tu belleza natural y rejuvenecer tu cuerpo y mente.',
      },
      {
        blockType: 'darshaTreatments',
        sectionId: 'faciales',
        heading: 'Tratamientos Faciales',
        intro:
          'Tratamientos diseñados para realzar la belleza natural de tu piel con tecnología estética, productos profesionales y atención personalizada. Cada sesión está pensada para brindarte resultados visibles y una experiencia de bienestar.',
        image: facialImage,
        imageSide: 'right',
        background: 'white',
        showPrices: false,
        treatments: services.faciales,
        bookingLabel: 'Reserva tu turno',
        bookingURL,
      },
      {
        blockType: 'darshaTreatments',
        sectionId: 'corporales',
        heading: 'Servicios Corporales',
        intro:
          'Tratamientos corporales personalizados para mejorar firmeza, piel y bienestar, con tecnología estética y cuidado profesional.',
        image: bodyImage,
        imageSide: 'left',
        background: 'warmWhite',
        showPrices: false,
        treatments: services.corporales,
        bookingLabel: 'Reservar Turno',
        bookingURL,
      },
      {
        blockType: 'darshaBookingCTA',
        heading: '¿Listo para experimentar nuestros servicios?',
        bookingLabel: 'Reserva tu turno',
        bookingURL,
      },
    ],
  },
})

payload.logger.info('Darsha Servicios imported.')
process.exit(0)
