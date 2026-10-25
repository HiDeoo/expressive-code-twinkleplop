import {
  always,
  create_language,
  embed_grammars,
  type LanguageFn,
  type LanguageOptions,
  type LanguagePipeline,
} from '@twinkleplop/core'
import { compile } from '@twinkleplop/core/compile'
import { tokenize as css } from '@twinkleplop/css'
import { tokenize as tsx } from '@twinkleplop/tsx'

import { promoteComponentTagNames } from '../../libs/reclassifiers'

import { astroRawGrammar, AstroTokenTypes } from './grammar'

const grammar = compile(astroRawGrammar)

export function tokenize(options?: LanguageOptions): LanguageFn {
  // Astro frontmatter, expressions, and scripts are tokenized by the TSX tokenizer.
  const script = tsx()

  const pipeline: LanguagePipeline = [
    ...promoteComponentTagNames(AstroTokenTypes.component),
    always(
      embed_grammars({
        [AstroTokenTypes.rawExpression]: script,
        [AstroTokenTypes.rawFrontmatter]: script,
        raw_script: script,
        raw_style: css(),
      }),
      'embed',
    ),
  ]

  return create_language(grammar, pipeline)(options)
}
