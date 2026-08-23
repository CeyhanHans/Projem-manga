export function buildFontProfile(text, options = {}) {
  const characters = [...String(text ?? '')].filter(character => /\p{L}/u.test(character));
  const uppercase = characters.filter(character => character === character.toLocaleUpperCase('tr-TR')).length;
  const uppercaseRatio = characters.length ? uppercase / characters.length : 0;
  const emphatic = uppercaseRatio > 0.78 || /[!?]{2,}/.test(text);
  const darkBackground = (options.backgroundLuminance ?? 1) < 0.48;
  return {
    family: options.family ?? '"Arial Narrow", "Roboto Condensed", Arial, sans-serif',
    weight: emphatic ? 700 : 600,
    style: options.italic ? 'italic' : 'normal',
    color: darkBackground ? '#ffffff' : '#111111',
    strokeColor: darkBackground ? '#111111' : '#ffffff',
    strokeWidth: options.strokeWidth ?? (emphatic ? 1.2 : 0.8),
    uppercaseRatio: Math.round(uppercaseRatio * 100) / 100,
    emphatic,
  };
}

