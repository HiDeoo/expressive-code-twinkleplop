// https://github.com/pngwn/twinkleplop/blob/eaebac048c2f7a83081746857589269150c409a6/lib/markdown-core/src/registry.ts
export function resolveLanguages(languages: Record<string, Language>): Map<string, TwinkleplopTokenizer> {
  const resolved = new Map<string, TwinkleplopTokenizer>()

  for (const name of Object.keys(languages)) {
    resolved.set(name, resolveLanguage(languages, name))
  }

  return resolved
}

function resolveLanguage(languages: Record<string, Language>, name: string): TwinkleplopTokenizer {
  const aliases = [name]
  let language = languages[name]

  while (typeof language === 'string') {
    if (aliases.includes(language)) {
      throw new Error('// TODO(HiDeoo) cycle')
    }

    if (!Object.hasOwn(languages, language)) {
      throw new Error('// TODO(HiDeoo) unknown')
    }

    aliases.push(language)
    language = languages[language]
  }

  if (typeof language !== 'function') {
    throw new TypeError('// TODO(HiDeoo) not a function')
  }

  return language
}

export type Language = TwinkleplopTokenizer | string

type TwinkleplopTokenizer = (code: string) => TwinkleplopTokenizeResult

interface TwinkleplopTokenizeResult {
  tokens: Uint32Array // [typeIndex, start, end]
  token_types: string[]
}
