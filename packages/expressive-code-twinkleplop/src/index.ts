import { definePlugin, InlineStyleAnnotation, type ExpressiveCodePlugin } from '@expressive-code/core'

import { UserError, warnUser } from './libs/errors'
import { resolveLanguages, type Language } from './libs/languages'
import { getTokenScope } from './libs/scopes'
import { getTokenStyle } from './libs/styles'

// Languages used for plain text which are never highlighted or reported as unknown.
const plainTextLanguages = new Set(['', 'plain', 'plaintext', 'text', 'txt'])

export function pluginTwinkleplop(options: PluginTwinkleplopOptions): ExpressiveCodePlugin {
  const languages = resolveLanguages(options.languages)
  const reportedUnknownLanguages = new Set<string>()

  return definePlugin({
    name: 'Twinkleplop',
    hooks: {
      performSyntaxAnalysis: ({ codeBlock, config: { logger }, styleVariants }) => {
        const tokenize = languages.get(codeBlock.language)
        if (!tokenize) {
          if (plainTextLanguages.has(codeBlock.language)) return

          const document = codeBlock.parentDocument?.sourceFilePath
          const message = `The language \`${codeBlock.language}\` used in ${document ? `\`${document}\`` : 'a code block'} is not configured.`

          if (options.onUnknownLanguage === 'throw') {
            throw new UserError(
              message,
              "Add it to the `languages` option or set the `onUnknownLanguage` option to `'plain'` to render code in unknown languages without any syntax highlighting.",
            )
          }

          // We only report each unknown language for a specific document once.
          const key = `${codeBlock.language} ${document}`
          if (reportedUnknownLanguages.has(key)) return
          reportedUnknownLanguages.add(key)

          warnUser(
            logger,
            `${message} Code blocks using this language will not be highlighted.`,
            'Add it to the `languages` option to highlight them.',
          )
          return
        }

        // We tokenize the entire code block to handle tokens spanning multiple lines correctly.
        const { tokens, token_types } = tokenize(codeBlock.code)

        // Offset of the current line within the code block.
        let lineStart = 0
        // Index of the first token that might appear on the current line.
        let firstTokenIndex = 0

        for (const line of codeBlock.getLines()) {
          const lineEnd = lineStart + line.text.length

          // A token is 3 consecutive numbers: `[typeIndex, start, end]`.
          for (let index = firstTokenIndex; index < tokens.length; index += 3) {
            const [typeIndex = 0, start = 0, end = 0] = tokens.subarray(index, index + 3)
            // We move to the next line if the token starts after the current line or on its line break.
            if (start >= lineEnd) break
            // If the token ends on the current line, we can continue from the next token on the next line.
            if (end <= lineEnd) firstTokenIndex = index + 3

            // As tokens can span multiple lines, we clamp the token range to the current line.
            const columnStart = Math.max(start, lineStart) - lineStart
            const columnEnd = Math.min(end, lineEnd) - lineStart
            // Skip empty token ranges, e.g. a token ending with a line break or an empty line inside a block comment.
            if (columnEnd <= columnStart) continue

            const type = token_types[typeIndex]
            const scope = type ? getTokenScope(type) : undefined
            if (!scope) continue

            for (const [styleVariantIndex, { theme }] of styleVariants.entries()) {
              const { color, fontStyle } = getTokenStyle(theme, scope)

              line.addAnnotation(
                new InlineStyleAnnotation({
                  bold: fontStyle?.includes('bold'),
                  color: color ?? theme.fg,
                  inlineRange: { columnStart, columnEnd },
                  italic: fontStyle?.includes('italic'),
                  renderPhase: 'earliest',
                  strikethrough: fontStyle?.includes('strikethrough'),
                  styleVariantIndex,
                  underline: fontStyle?.includes('underline'),
                }),
              )
            }
          }

          // Move to the next line after the line break.
          lineStart = lineEnd + 1
        }
      },
    },
  })
}

export interface PluginTwinkleplopOptions {
  // TODO(HiDeoo)
  languages: Record<string, Language>
  // TODO(HiDeoo)
  onUnknownLanguage?: 'plain' | 'throw' | undefined
}
