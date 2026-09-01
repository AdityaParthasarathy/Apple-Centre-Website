import type { Metadata } from 'next'
import { Container } from '@/components/ui/container'
import { PageHero } from '@/components/patterns/page-hero'
import { ProgramsGrid } from '@/components/sections/programs-grid'
import { SectionHeading } from '@/components/ui/section-heading'
import { Accordion, type AccordionItem } from '@/components/ui/accordion'
import { getAllPrograms } from '@/lib/merge-programs'

const PROGRAM_FAQS: AccordionItem[] = [
  {
    question: 'Do I need prior coding experience to apply?',
    answer:
      "No. The Apply form asks how comfortable you are with your stack, and \"new to this, excited to learn\" is a completely normal answer — the programs are built to take you from fundamentals to shipping real apps, not to filter for people who already can.",
  },
  {
    question: 'What hardware and software will I have access to?',
    answer:
      'The Labs give you Apple iMac workstations with Xcode, Swift Playgrounds, and the latest SwiftUI tooling — you don\'t need your own Mac to take part.',
  },
  {
    question: "Can I apply if I'm not a Computer Science major?",
    answer:
      'Yes. The application covers every year of study plus Faculty/Staff and Other — the Centre is open across departments, not limited to one major.',
  },
  {
    question: 'Do I need to submit a project to apply?',
    answer:
      "No — projects on the application are optional (up to three). If you have something to show, great; if not, that's not a reason to hold off applying.",
  },
  {
    question: 'How long does the application process take?',
    answer:
      "Applications move through Pending, then Reviewed, before a final Accepted or Rejected decision. There's no fixed turnaround — the coordination team reviews them as they come in.",
  },
  {
    question: 'Is a resume required?',
    answer: "No, it's optional on the application — attach one if you have it, but it won't hold up your application either way.",
  },
]

export const metadata: Metadata = {
  title: 'Programs | Centre for Apple Technologies',
  description:
    'Comprehensive, hands-on programs designed to take you from fundamentals to shipping real apps on the Apple ecosystem.',
}

// Faculty-added programs live in the sheet, not build-time content, so this
// route needs to periodically re-check for new ones.
export const revalidate = 60

export default async function ProgramsPage() {
  const programs = await getAllPrograms()
  return (
    <>
      <PageHero
        title="Programs"
        subtitle="Comprehensive, hands-on programs designed to take you from fundamentals to shipping real apps on the Apple ecosystem."
        image="/centre-space/magic-keyboard.jpg"
      />

      <section className="py-16 sm:py-24">
        <Container>
          <ProgramsGrid programs={programs} />
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container size="lg">
          <div className="mb-10 max-w-2xl">
            <SectionHeading size="xl">Frequently asked questions</SectionHeading>
          </div>
          <Accordion items={PROGRAM_FAQS} />
        </Container>
      </section>
    </>
  )
}
