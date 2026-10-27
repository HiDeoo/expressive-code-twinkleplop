import {
  always,
  create_language,
  embed_grammars,
  embed_labelled,
  type LanguageFn,
  type LanguageOptions,
  type LanguagePipeline,
} from '@twinkleplop/core'
import { compile } from '@twinkleplop/core/compile'
import { reclassifiers as markdownReclassifiers } from '@twinkleplop/markdown'
import { tokenize as tsx } from '@twinkleplop/tsx'
import { tokenize as yaml } from '@twinkleplop/yaml'

import { promoteComponentTagNames } from '../../libs/reclassifiers'

import { mdxRawGrammar, MdxTokenTypes } from './grammar'

const grammar = compile(mdxRawGrammar)

export function tokenize(options?: MdxLanguageOptions): LanguageFn {
  // MDX ESM and expressions are tokenized by the TSX tokenizer.
  const script = tsx()

  const pipeline: LanguagePipeline = [
    // We embed with TSX before Markdown reclassifiers to prevent raw MDX tokens from being reclassified, e.g. a raw
    // MDX expression inside bold text which would no longer be embedded properly.
    always(
      embed_grammars({
        [MdxTokenTypes.rawEsm]: script,
        [MdxTokenTypes.rawExpression]: script,
      }),
      'embed',
    ),
    ...promoteComponentTagNames(MdxTokenTypes.component),
    ...markdownReclassifiers,
    // The Markdown grammar only supports YAML frontmatter so we can always embed it.
    always(embed_grammars({ raw_front_matter: yaml() }), 'embed'),
  ]

  if (options?.languages) {
    pipeline.push(
      always(embed_labelled({ label: 'code_language', body: 'raw_code_block', languages: options.languages }), 'embed'),
    )
  }

  return create_language(grammar, pipeline)(options)
}

export interface MdxLanguageOptions extends LanguageOptions {
  /**
   * The languages used to highlight code blocks nested in MDX documents, where each key is a language identifier and
   * each value is the result of calling the `tokenize` export of a Twinkleplop language package.
   *
   * To use all languages configured in the Twinkleplop plugin, configure the MDX language as an embedding language,
   * e.g. `mdx: { embed: (languages) => mdx({ languages }) }`.
   *
   * @see https://expressive-code-twinkleplop.netlify.app/guides/languages/#embedding-languages
   */
  languages?: Record<string, LanguageFn> | undefined
}
