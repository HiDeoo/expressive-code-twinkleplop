import { definePlugin, InlineStyleAnnotation, type ExpressiveCodePlugin } from '@expressive-code/core'

export function pluginTwinkleplop(options: PluginTwinkleplopOptions): ExpressiveCodePlugin {
  return definePlugin({
    name: 'Twinkleplop',
    hooks: {
      performSyntaxAnalysis: ({ codeBlock }) => {
        const tokenize = options.languages[codeBlock.language]
        if (!tokenize) return

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
            const color = type ? options.colors[type] : undefined
            if (!color) continue

            line.addAnnotation(
              new InlineStyleAnnotation({ color, inlineRange: { columnStart, columnEnd }, renderPhase: 'earliest' }),
            )
          }

          // Move to the next line after the line break.
          lineStart = lineEnd + 1
        }
      },
    },
  })
}

type TwinkleplopTokenizer = (code: string) => TwinkleplopTokenizeResult

interface TwinkleplopTokenizeResult {
  tokens: Uint32Array // [typeIndex, start, end]
  token_types: string[]
}

export interface PluginTwinkleplopOptions {
  // TODO(HiDeoo)
  colors: Record<string, string>
  // TODO(HiDeoo)
  languages: Record<string, TwinkleplopTokenizer>
}
