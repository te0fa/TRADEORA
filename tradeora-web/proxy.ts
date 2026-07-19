import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Configure Upstash Redis client
let redis: Redis | null = null;
let ratelimitHeavy: Ratelimit | null = null;
let ratelimitStandard: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimitHeavy = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit/heavy',
  });

  ratelimitStandard = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit/standard',
  });
}

const intlMiddleware = createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always'
});

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // 1. Apply Upstash Rate Limiting to API endpoints
  if (path.startsWith('/api/') && redis) {
    // Exclude payment webhooks to prevent callback failure
    if (!path.includes('/api/stripe/webhook')) {
      const ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
      let isAllowed = true;
      let limit = 10;
      let remaining = 9;
      let reset = Date.now() + 60000;

      try {
        if (path.includes('/api/ml-predict') || path.includes('/api/screener')) {
          if (ratelimitHeavy) {
            const result = await ratelimitHeavy.limit(ip);
            isAllowed = result.success;
            limit = result.limit;
            remaining = result.remaining;
            reset = result.reset;
          }
        } else {
          if (ratelimitStandard) {
            const result = await ratelimitStandard.limit(ip);
            isAllowed = result.success;
            limit = result.limit;
            remaining = result.remaining;
            reset = result.reset;
          }
        }
      } catch (err) {
        console.error('Rate limiting Redis error:', err);
      }

      if (!isAllowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة مرة أخرى لاحقاً.',
            message: 'Too many requests. Please try again later.'
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': String(reset),
            },
          }
        );
      }
    }
  }

  // 2. Define bypass paths to skip next-intl and auth for API and static files
  const isBypass = path.includes('/_next') || 
                   path.startsWith('/api') || 
                   path.includes('/favicon.ico') || 
                   path.includes('.') ||
                   path.includes('/public/');

  if (isBypass) {
    return NextResponse.next();
  }

  // 3. Run next-intl middleware first to get the response with correct locale/headers
  let res = intlMiddleware(req);

  // 4. Initialize Supabase Client using standard Server Side Client pattern
  const supabaseClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = intlMiddleware(req);
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 5. Refresh session if expired
  const { data: { session } } = await supabaseClient.auth.getSession();

  // 6. Define bypass paths for UI routing validation
  const isAuthPage = path.includes('/auth');

  // 6. Authentication Routing Logic
  if (!session && !isAuthPage) {
    const localeMatch = path.match(/^\/(ar|en)/);
    const locale = localeMatch ? localeMatch[1] : 'ar';
    url.pathname = `/${locale}/auth`;
    return NextResponse.redirect(url);
  }

  if (session && isAuthPage) {
    const localeMatch = path.match(/^\/(ar|en)/);
    const locale = localeMatch ? localeMatch[1] : 'ar';
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  // 7. Protect /admin routes from non-admins
  if (session && path.includes('/admin')) {
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      const localeMatch = path.match(/^\/(ar|en)/);
      const locale = localeMatch ? localeMatch[1] : 'ar';
      url.pathname = `/${locale}`;
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export default proxy;


export const config = {
  matcher: [
    '/', 
    '/(ar|en)/:path*', 
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)' // Match everything including api
  ]
};
