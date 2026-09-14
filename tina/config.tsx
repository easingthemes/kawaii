import { defineConfig } from 'tinacms';
import nextConfig from '../next.config';

import Page from './collection/page';

const config = defineConfig({
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID!,
  branch:
    process.env.NEXT_PUBLIC_TINA_BRANCH! || // explicit override
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF! || // Vercel
    process.env.HEAD!, // Netlify
  token: process.env.TINA_TOKEN!,
  media: {
    tina: {
      publicFolder: 'public',
      mediaRoot: 'uploads',
    },
  },
  build: {
    publicFolder: 'public',
    outputFolder: 'admin',
    basePath: nextConfig.basePath?.replace(/^\//, '') || '',
  },
  schema: {
    collections: [Page],
  },
});

export default config;
