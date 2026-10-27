import { UserError } from './errors'

// https://github.com/pngwn/twinkleplop/blob/eaebac048c2f7a83081746857589269150c409a6/lib/markdown-core/src/registry.ts
export function resolveLanguages(languages: Record<string, Language>): Map<string, TwinkleplopTokenizer> {
  const resolved = new Map<string, TwinkleplopTokenizer>()
  const tokenizers = new Map<string, TwinkleplopTokenizer>()

  const embeddedLanguages: Record<string, TwinkleplopTokenizer> = {}
  for (const name of Object.keys(languages)) {
    // Embedded languages look up their tokenizer when tokenizing code as it may not exist yet when they are embedded,
    // e.g. for a language embedding itself or a language configured after it.
    embeddedLanguages[name] = (code) => {
      const tokenizer = resolved.get(name)
      if (!tokenizer) throw new Error(`The embedded language \`${name}\` is used before all languages are configured.`)
      return tokenizer(code)
    }
  }

  for (const name of Object.keys(languages)) {
    const target = resolveAlias(languages, name)

    let tokenizer = tokenizers.get(target)
    if (!tokenizer) {
      tokenizer = makeTokenizer(target, languages[target], embeddedLanguages)
      tokenizers.set(target, tokenizer)
    }

    resolved.set(name, tokenizer)
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

export function resolveDefaultLanguage(languages: Map<string, TwinkleplopTokenizer>, name: string | undefined) {
  if (!name) return

  const tokenizer = languages.get(name)

  if (!tokenizer) {
    throw new UserError(
      `The default language \`${name}\` is not configured.`,
      'Add it to the `languages` option or set the `defaultLanguage` option to a configured language.',
    )
  }

  return tokenizer
}

function resolveAlias(languages: Record<string, Language>, name: string): string {
  const aliases = [name]
  let target = name
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
    target = language
    language = languages[language]
  }

  return target
}

function makeTokenizer(
  name: string,
  language: Language | undefined,
  embeddedLanguages: Record<string, TwinkleplopTokenizer>,
): TwinkleplopTokenizer {
  if (typeof language === 'function') return language

  if (isEmbeddingLanguage(language)) {
    const tokenizer: unknown = language.embed(embeddedLanguages)
    if (isTokenizer(tokenizer)) return tokenizer
  }

  throw new UserError(
    `The language \`${name}\` is not configured correctly.`,
    'Set it to the result of calling the `tokenize` export from a Twinkleplop language package or to the name of another language in the `languages` option. A language embedding other languages can also be set to an object with an `embed` function returning the result of calling a `tokenize` export.',
  )
}

function isEmbeddingLanguage(value: unknown): value is EmbeddingLanguage {
  return typeof value === 'object' && value !== null && 'embed' in value && typeof value.embed === 'function'
}

function isTokenizer(value: unknown): value is TwinkleplopTokenizer {
  return typeof value === 'function'
}

export type Language = TwinkleplopTokenizer | EmbeddingLanguage | string

type TwinkleplopTokenizer = (code: string) => TwinkleplopTokenizeResult

interface TwinkleplopTokenizeResult {
  tokens: Uint32Array // [typeIndex, start, end]
  token_types: string[]
}

interface EmbeddingLanguage {
  /**
   * A function receiving all languages configured in the `languages` option, including aliases, and returning the
   * result of calling the `tokenize` export of a Twinkleplop language package with them.
   *
   * @see https://expressive-code-twinkleplop.netlify.app/guides/languages/#embedding-languages
   */
  embed: (languages: Record<string, TwinkleplopTokenizer>) => TwinkleplopTokenizer
}
