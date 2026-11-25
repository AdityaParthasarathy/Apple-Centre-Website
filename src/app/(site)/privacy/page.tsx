import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { PageHero } from '@/components/patterns/page-hero'

export const metadata: Metadata = {
  title: 'Privacy Policy | Centre for Apple Technologies',
  description: 'What the Apple Centre at RIT Chennai collects through this website and the Members Portal, why, and the choices you have.',
}

const UPDATED = '25 November 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        title="Privacy Policy"
        subtitle="What the Apple Centre collects through this website and the Members Portal, why, and the choices you have."
        image="/centre-space/lab-angle-1.jpg"
      />

      <article className="py-16 sm:py-20">
        <Container size="lg">
          <div className="space-y-10">
            <p className="text-sm text-muted-foreground">Last updated: {UPDATED}</p>

            <Section title="Who we are">
              <p>
                This website is run by the Centre for Apple Technologies (the &ldquo;Apple Centre&rdquo;) at Rajalakshmi
                Institute of Technology (RIT), Chennai. This policy covers this website, its Members Portal and Faculty
                Portal, and the Apple Centre desktop app, which simply shows this same website in its own window.
              </p>
            </Section>

            <Section title="Just visiting">
              <p>
                You can read the whole public site without an account. We do not use advertising, analytics or tracking
                tools, and we do not set tracking cookies. Our hosting provider (Vercel) automatically handles ordinary
                technical information, such as your IP address and the pages requested, to deliver the site and keep it
                secure.
              </p>
            </Section>

            <Section title="Applying and registering">
              <p>When you apply to join the Centre, or register for an event or a program, we ask for:</p>
              <List
                items={[
                  'your name, email address and phone number,',
                  'your year of study and, for events, your college,',
                  'for applications: your skills, how comfortable you are with technology, a résumé, and descriptions, links and screenshots of projects you choose to share.',
                ]}
              />
              <p>
                We use this to review applications, run events and programs, contact you, and email you confirmations
                and decisions. It is seen by the Centre&apos;s staff, and a notification of each application is emailed to
                the Centre team.
              </p>
            </Section>

            <Section title="The Members Portal">
              <p>To create an account we ask for your name, a username, your enrollment number, your department, and a password.</p>
              <List
                items={[
                  <>
                    <strong className="font-medium text-foreground">Your password</strong> is stored only in scrambled
                    form. Nobody at the Centre can read it.
                  </>,
                  <>
                    <strong className="font-medium text-foreground">Continue with Google:</strong> Google tells us your
                    name and verified email address, and nothing else. We cannot see your Google password, email,
                    files or contacts. You can remove the connection at any time in your Google account settings.
                  </>,
                  <>
                    <strong className="font-medium text-foreground">What you add</strong> (photos, projects and
                    achievements) is published on the public website. For a project this includes its title,
                    description, image, links, GitHub repository link, technologies and any names you type into the
                    team field.
                  </>,
                  <>
                    <strong className="font-medium text-foreground">Kept private, for Centre staff only:</strong> your
                    account details, enrollment number, department, year of study, and the mentor details you give with
                    a project (name, department, position, email and phone number). These are never shown on the public
                    site. Please only give a mentor&apos;s details if they are happy for the Centre to hold them.
                  </>,
                ]}
              />
              <p>
                Other members cannot see your account or the items you add in the Members Portal; each member sees only
                their own.
              </p>
            </Section>

            <Section title="Faculty Portal">
              <p>
                Centre staff sign in with their email address and password, or with Google. We keep their name and
                email so they can manage the site&apos;s content.
              </p>
            </Section>

            <Section title="Cookies and your browser">
              <p>We use only the cookies the site needs to work:</p>
              <List
                items={[
                  'a sign-in cookie that keeps you signed in to the Members or Faculty Portal for up to 7 days (until you log out), and',
                  'a short-lived cookie that lasts a few minutes while you sign in with Google.',
                ]}
              />
              <p>
                While you fill in a portal form, your browser may keep an unfinished draft for that tab so you don&apos;t
                lose your work. It stays on your device and is cleared when you close the tab.
              </p>
            </Section>

            <Section title="Who handles your information">
              <p>We don&apos;t sell your information or use it for advertising. To run the site we rely on a few services:</p>
              <List
                items={[
                  'Google (Sheets and Drive, where records and uploaded files are kept, and Google sign-in),',
                  'Vercel (hosting, and storage for some uploaded photos),',
                  'an email service, used to send the messages described above.',
                ]}
              />
              <p>
                Access is limited to the Centre&apos;s staff. We use secure (HTTPS) connections, but no online system is
                perfectly secure.
              </p>
            </Section>

            <Section title="How long we keep it">
              <p>
                We keep your information for as long as it is needed for the Centre&apos;s programs and records, or until you
                ask us to delete it. You can delete any photo, project or achievement you added yourself, at any time,
                from the Members Portal.
              </p>
            </Section>

            <Section title="Your choices">
              <p>
                You can ask to see what we hold about you, to correct it, or to have it deleted, including your Members
                Portal account. If you forget your password, a member of staff can reset it for you.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                If we change how we handle your information, we will update this page and the date at the top.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                For any question about your information, contact the Centre&apos;s coordinators listed on the{' '}
                <Link href="/faculty" className="font-medium text-accent hover:underline">
                  Meet the Team
                </Link>{' '}
                page, or visit the Centre at the RIT Chennai campus.
              </p>
            </Section>
          </div>
        </Container>
      </article>
    </>
  )
}
