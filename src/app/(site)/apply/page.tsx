import type { Metadata } from 'next'
import { FileText, Search, Users, CheckCircle2 } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { ApplyForm } from '@/components/sections/apply-form'
import { PageHero } from '@/components/patterns/page-hero'

export const metadata: Metadata = {
  title: 'Apply | Centre for Apple Technologies',
  description:
    "Become part of the Centre for Apple Technologies. We're looking for curious, driven students ready to build real things on the Apple ecosystem.",
}

const steps = [
  {
    icon: FileText,
    title: 'Apply',
    description: 'Tell us about yourself and which program interests you.',
  },
  {
    icon: Search,
    title: 'Review',
    description: 'Our team reviews every application within two weeks.',
  },
  {
    icon: Users,
    title: 'Interview',
    description: 'Shortlisted applicants meet with faculty and mentors.',
  },
  {
    icon: CheckCircle2,
    title: 'Welcome',
    description: "Selected members join the Centre's next cohort.",
  },
]

export default function ApplyPage() {
  return (
    <>
      <PageHero
        title="Apply to Join"
        subtitle="Become part of the Centre for Apple Technologies. We're looking for curious, driven students ready to build real things on the Apple ecosystem."
        image="/centre-space/imac-back.jpg"
      />

      <section className="border-b border-border py-16 sm:py-20">
        <Container>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, idx) => (
              <div key={step.title} className="relative">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Step {idx + 1}</p>
                <h2 className="mb-1 font-semibold text-foreground">{step.title}</h2>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container size="md">
          <ApplyForm />
        </Container>
      </section>
    </>
  )
}
