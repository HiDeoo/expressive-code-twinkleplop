import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

const site =
  (process.env['CONTEXT'] === 'production' ? process.env['URL'] : process.env['DEPLOY_PRIME_URL']) ??
  'https://expressive-code-twinkleplop.netlify.app/'

// TODO(HiDeoo) favicon

export default defineConfig({
  integrations: [
    starlight({
      description: '// TODO(HiDeoo) desc',
      editLink: {
        baseUrl: 'https://github.com/HiDeoo/expressive-code-twinkleplop/edit/main/docs/',
      },
      head: [
        {
          tag: 'meta',
          attrs: {
            property: 'og:image',
            content: new URL('og.jpg', site).href,
          },
        },
        {
          tag: 'meta',
          attrs: {
            property: 'og:image:alt',
            content: '// TODO(HiDeoo) desc',
          },
        },
      ],
      // sidebar: [
      //   {
      //     label: "Start Here",
      //     items: [
      //       { label: "Getting Started", link: "/getting-started/" },
      //       { label: "Usage", link: "/usage/" },
      //     ],
      //   },
      //   {
      //     label: "Resources",
      //     items: [{ label: "Plugins and Tools", slug: "resources/starlight" }],
      //   },
      // ],
      social: [
        {
          href: 'https://bsky.app/profile/hideoo.dev',
          icon: 'blueSky',
          label: 'Bluesky',
        },
        {
          href: 'https://github.com/HiDeoo/expressive-code-twinkleplop',
          icon: 'github',
          label: 'GitHub',
        },
      ],
      title: '// TODO(HiDeoo) ',
    }),
  ],
  site,
  trailingSlash: 'always',
})
