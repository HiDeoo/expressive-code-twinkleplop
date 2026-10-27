import rust from './main.rs?raw'
import html from './post.html?raw'
import markdown from './post.md?raw'
import mdx from './post.mdx?raw'
import astro from './Posts.astro?raw'
import css from './posts.css?raw'
import json from './posts.json?raw'
import typescript from './posts.ts?raw'
import yaml from './posts.yml?raw'

export const Snippets: Snippet[] = [
  { code: astro, label: 'Astro', lang: 'astro', title: 'Posts.astro' },
  { code: css, label: 'CSS', lang: 'css', title: 'posts.css' },
  { code: html, label: 'HTML', lang: 'html', title: 'post.html' },
  { code: json, label: 'JSON', lang: 'json', title: 'posts.json' },
  { code: markdown, label: 'Markdown', lang: 'md', title: 'post.md' },
  { code: mdx, label: 'MDX', lang: 'mdx', title: 'post.mdx' },
  { code: rust, label: 'Rust', lang: 'rust', title: 'main.rs' },
  { code: typescript, label: 'TypeScript', lang: 'ts', title: 'posts.ts' },
  { code: yaml, label: 'YAML', lang: 'yaml', title: 'posts.yml' },
]

export interface Snippet {
  code: string
  label: string
  lang: string
  title: string
}
