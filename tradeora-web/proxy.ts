import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'always'
});

export default async function proxy(req: NextRequest) {
  // 1. Run next-intl middleware first to get the response with correct locale/headers
  let res = intlMiddleware(req);

  // 2. Initialize Supabase Client using standard Server Side Client pattern
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

  // 3. Refresh session if expired
  const { data: { session } } = await supabaseClient.auth.getSession();

  const url = req.nextUrl.clone();
  const path = url.pathname;

  // 4. Define bypass paths
  const isAuthPage = path.includes('/auth');
  
  const isBypass = path.includes('/_next') || 
                   path.startsWith('/api') || 
                   path.includes('/favicon.ico') || 
                   path.includes('.') ||
                   path.includes('/public/');

  if (isBypass) {
    return res;
  }

  // 5. Authentication Routing Logic
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

  // 6. Protect /admin routes from non-admins
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

export const config = {
  matcher: [
    '/', 
    '/(ar|en)/:path*', 
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/).*)'
  ]
};
