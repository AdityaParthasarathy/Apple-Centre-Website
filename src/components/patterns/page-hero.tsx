import Image from 'next/image'
import { Container } from '@/components/ui/container'
import { SectionHeading } from '@/components/ui/section-heading'
import { FadeIn } from '@/components/patterns/fade-in'

interface PageHeroProps {
  title: string
  subtitle: string
  image: string
}

// Shared photographic header for secondary pages — same dark-scrim
// language as the homepage hero (real Centre photography, not decoration),
// so Programs/Projects/Events/Gallery/Team each open on an actual place
// instead of the identical plain white banner they used to share.
export function PageHero({ title, subtitle, image }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10">
        <Image src={image} alt="" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,11,15,0.85)_0%,rgba(11,11,15,0.75)_55%,rgba(11,11,15,0.92)_100%)]" />
      </div>
      <Container>
        <div className="max-w-2xl">
          <SectionHeading as="h1" size="xl" className="text-white">
            {title}
          </SectionHeading>
          <FadeIn delay={0.15}>
            <p className="mt-4 text-lg text-white/70">{subtitle}</p>
          </FadeIn>
        </div>
      </Container>
    </section>
  )
}
