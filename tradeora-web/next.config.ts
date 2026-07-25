import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin('./i18n.ts');

import path from 'path';

const nextConfig: NextConfig = {
  serverExternalPackages: ['decimal.js'],
};

export default withNextIntl(nextConfig);
