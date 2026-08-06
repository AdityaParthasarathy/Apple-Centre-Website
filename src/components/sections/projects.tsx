import { getAllProjects } from '@/lib/merge-projects'
import { ProjectsSectionClient } from '@/components/sections/projects-client'

// Server Component so the Apps Script call (server-only secret) stays off
// the client — merges the static seed projects with anything faculty have
// added, featured ones first, then hands the result to the client component
// for the motion bits.
export async function ProjectsSection() {
  const projects = await getAllProjects()
  return <ProjectsSectionClient projects={projects} />
}
