// Web equivalent of Expo's native glyph-to-image helper for the real tab icons.
export async function renderToImageAsync(glyphs: string, options: {size?: number; fontFamily?: string; color?: string} = {}) {
 const size = options.size || 24, scale = 2;
 await document.fonts.load(`${size}px "${options.fontFamily}"`);
 const canvas = document.createElement('canvas');
 canvas.width = canvas.height = size * scale;
 const ctx = canvas.getContext('2d');
 if (!ctx) throw new Error('Canvas unavailable for tab icons');
 ctx.scale(scale, scale);
 ctx.font = `${size}px "${options.fontFamily}"`;
 ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
 ctx.fillStyle = options.color || 'black';
 ctx.fillText(glyphs, size / 2, size / 2);
 return {uri:canvas.toDataURL(), width:size, height:size, scale};
}
