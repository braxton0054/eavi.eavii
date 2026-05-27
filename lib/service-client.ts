import { createServerClient } from '@supabase/ssr'

/**
 * Creates a Supabase client with the service role key.
 * This bypasses RLS and should ONLY be used in trusted server-side contexts:
 * - API routes (especially webhooks/callbacks)
 * - Server actions
 * - Background jobs
 *
 * NEVER expose this client to the browser.
 */
export async function createServiceClient() {
  // Dynamic import to avoid pulling server-only code into client bundles
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore — server components can't set cookies
          }
        },
      },
    }
  )
}
