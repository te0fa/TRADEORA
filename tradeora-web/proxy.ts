import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // A list of all locales that are supported
  locales: ['ar', 'en'],
 
  // Used when no locale matches
  defaultLocale: 'ar',
  
  // Set default direction prefix behavior
  localePrefix: 'always'
});
 
export const config = {
  // Match only internationalized pathnames.
  // Match "/", "/ar", "/en", and any path under them except static files/api.
  matcher: [
    // Match root and locale paths
    '/',
    '/(ar|en)/:path*',
    // Match other pages without locale prefix (next-intl redirects them as-needed)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'
  ]
};
