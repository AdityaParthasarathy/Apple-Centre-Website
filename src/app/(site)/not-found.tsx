import type { Metadata } from 'next'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { AnimatedCtaLink } from '@/components/patterns/motion-link'

export const metadata: Metadata = {
  title: 'Page Not Found | Centre for Apple Technologies',
}

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center py-20">
      <Container>
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <Image
            src="/logo-icon.png"
            alt=""
            width={40}
            height={40}
            className="mb-8 rounded-lg opacity-60"
          />
          <p className="mb-2 text-sm font-semibold text-accent">404</p>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Page not found
          </h1>
          <p className="mb-8 text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist, or may have moved. Let&apos;s get
            you back on track.
          </p>
          <AnimatedCtaLink href="/" size="lg">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </AnimatedCtaLink>
        </div>
      </Container>
    </section>
  )
}
