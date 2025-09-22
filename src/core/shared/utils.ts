/**
 * Colorea texto para consola usando códigos ANSI.
 * @param text Texto a colorear.
 * @param color Color a aplicar (cyan, magenta, yellow, green, blue, red, reset).
 * @returns Texto coloreado para consola.
 */
export function colorize(text: string, color: string): string {
  const colors: Record<string, string> = {
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
  };
  return `${colors[color] || ''}${String(text)}${colors['reset']}`;
}
