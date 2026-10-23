import type { ExpressiveCodeTheme } from '@expressive-code/core'

const tokenStyleCache = new WeakMap<ExpressiveCodeTheme, Map<string, TokenStyle>>()

/**
 * A simplified version of Visual Studio Code `ThemeTrieElement.match()` that resolves the color and font style a theme
 * assigns to a TextMate scope.
 *
 * A TextMate scope matches if it equals the requested scope or is a prefix of it followed by a dot. The most specific
 * match wins.
 *
 * @see https://github.com/microsoft/vscode-textmate/blob/392b23a4a5ecda7fe4f481d721f113695b14159b/src/theme.ts#L665-L686
 */
export function getTokenStyle(theme: ExpressiveCodeTheme, scope: string) {
  let themeCache = tokenStyleCache.get(theme)
  if (!themeCache) {
    themeCache = new Map()
    tokenStyleCache.set(theme, themeCache)
  }

  const cachedStyle = themeCache.get(scope)
  if (cachedStyle) return cachedStyle

  let color: string | undefined
  let colorSpecificity = 0
  let fontStyle: string | undefined
  let fontStyleSpecificity = 0

  for (const { scope: themeScopes = [], settings } of theme.settings) {
    for (const themeScope of themeScopes) {
      if (scope !== themeScope && !scope.startsWith(`${themeScope}.`)) continue

      const specificity = themeScope.split('.').length

      if (settings.foreground && specificity >= colorSpecificity) {
        color = settings.foreground
        colorSpecificity = specificity
      }

      if (settings.fontStyle !== undefined && specificity >= fontStyleSpecificity) {
        fontStyle = settings.fontStyle
        fontStyleSpecificity = specificity
      }
    }
  }

  const style: TokenStyle = { color, fontStyle }

  themeCache.set(scope, style)

  return style
}

interface TokenStyle {
  color: string | undefined
  fontStyle: string | undefined
}
