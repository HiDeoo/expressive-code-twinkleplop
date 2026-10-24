import { UserError } from './errors'

// https://github.com/pngwn/twinkleplop/blob/eaebac048c2f7a83081746857589269150c409a6/lib/markdown-core/src/registry.ts
export function resolveLanguages(languages: Record<string, Language>): Map<string, TwinkleplopTokenizer> {
  const resolved = new Map<string, TwinkleplopTokenizer>()

  for (const name of Object.keys(languages)) {
    resolved.set(name, resolveLanguage(languages, name))
  }

  return resolved
}

export function isTokenizeResult(value: unknown): value is TwinkleplopTokenizeResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'tokens' in value &&
    value.tokens instanceof Uint32Array &&
    'token_types' in value &&
    Array.isArray(value.token_types)
  )
}

function resolveLanguage(languages: Record<string, Language>, name: string): TwinkleplopTokenizer {
  const aliases = [name]
  let language = languages[name]

  while (typeof language === 'string') {
    if (aliases.includes(language)) {
      throw new UserError(
        `The language \`${language}\` is an alias that refers back to itself: ${[...aliases.slice(aliases.indexOf(language)), language].map((alias) => `\`${alias}\``).join(' → ')}.`,
        'Make sure each alias in the `languages` option eventually refers to a language that is not an alias.',
      )
    }

    if (!Object.hasOwn(languages, language)) {
      throw new UserError(
        `The language \`${aliases.at(-1)}\` is an alias of \`${language}\`, which is not configured.`,
        `Add \`${language}\` to the \`languages\` option or change the alias to refer to a configured language.`,
      )
    }

    aliases.push(language)
    language = languages[language]
  }

  if (typeof language !== 'function') {
    throw new UserError(
      `The language \`${name}\` is not configured correctly.`,
      'Set it to the result of calling the `tokenize` export from a Twinkleplop language package or to the name of another language in the `languages` option.',
    )
  }

  return language
}

export type Language = TwinkleplopTokenizer | string

type TwinkleplopTokenizer = (code: string) => TwinkleplopTokenizeResult

interface TwinkleplopTokenizeResult {
  tokens: Uint32Array // [typeIndex, start, end]
  token_types: string[]
}
