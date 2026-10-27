import { tokenize as bash } from '@twinkleplop/bash'
import { tokenize as css } from '@twinkleplop/css'
import { tokenize as html } from '@twinkleplop/html'
import { tokenize as javascript } from '@twinkleplop/javascript'
import { tokenize as json } from '@twinkleplop/json'
import { tokenize as markdown } from '@twinkleplop/markdown'
import { tokenize as rust } from '@twinkleplop/rust'
import { tokenize as typescript } from '@twinkleplop/typescript'
import { tokenize as yamlTokenizer } from '@twinkleplop/yaml'
import { pluginTwinkleplop } from 'expressive-code-twinkleplop'
import { tokenize as astro } from 'expressive-code-twinkleplop/languages/astro'
import { tokenize as mdx } from 'expressive-code-twinkleplop/languages/mdx'

const yaml = yamlTokenizer()

/** @type {import('@astrojs/starlight/expressive-code').StarlightExpressiveCodeOptions} */
const expressiveCodeConfig = {
  shiki: false,
  plugins: [
    pluginTwinkleplop({
      languages: {
        astro: astro(),
        css: css(),
        html: html(),
        js: javascript(),
        json: json(),
        md: { embed: (languages) => markdown({ languages, front_matter: yaml }) },
        mdx: { embed: (languages) => mdx({ languages }) },
        rust: rust(),
        sh: bash(),
        ts: typescript(),
        yaml,
      },
      onUnknownLanguage: 'throw',
    }),
  ],
}

export default expressiveCodeConfig
