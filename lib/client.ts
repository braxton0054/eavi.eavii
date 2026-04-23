import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (typeof window === 'undefined') {
    throw new Error('createClient should only be called in browser environment')
  }

  if (client) {
    return client
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name) {
          return document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name, value, options) {
          let cookie = `${name}=${value}`
          if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`
          if (options?.path) cookie += `; Path=${options.path}`
          if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`
          if (options?.secure) cookie += `; Secure`
          document.cookie = cookie
        },
        remove(name, options) {
          document.cookie = `${name}=; Max-Age=0; Path=${options?.path || '/'}`
        }
      }
    }
  )

  return client
}
