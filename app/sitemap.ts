import { MetadataRoute } from 'next';

const baseUrl = process.env.APP_URL
  ? `https://${process.env.APP_URL}`
  : 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes = [
    '',
    '/profile',
    '/client/find',
    '/craftsman/find',
    '/client/auth/login',
    '/client/auth/sign-up',
    '/craftsman/auth/login',
    '/craftsman/auth/sign-up',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic routes — e.g. job listings from /jobs/[id]
  // Replace this with a real DB/API call
  const jobs = await getJobs(); // your fetch logic here
  const jobRoutes = jobs.map((job: { id: string; updatedAt: string }) => ({
    url: `${baseUrl}/jobs/${job.id}`,
    lastModified: job.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...jobRoutes];
}

// placeholder — swap with your actual data fetching (Supabase, etc.)
async function getJobs() {
  return [];
}