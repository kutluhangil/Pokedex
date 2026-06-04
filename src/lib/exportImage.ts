import { toPng, toJpeg } from 'html-to-image';

export type ExportFormat = 'png' | 'jpg';

/**
 * Convert remote images to data URLs so html-to-image can serialize them
 * without tainting the canvas. PokeAPI sprites/artwork live on github raw
 * which serves permissive CORS headers.
 */
async function inlineImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      if (img.src.startsWith('data:')) return;
      try {
        const res = await fetch(img.src, { mode: 'cors', cache: 'force-cache' });
        const blob = await res.blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.onerror = reject;
          fr.readAsDataURL(blob);
        });
        img.src = dataUrl;
      } catch {
        // ignore — render whatever we can
      }
    })
  );
}

export async function exportNodeAsImage(
  node: HTMLElement,
  filename: string,
  format: ExportFormat = 'png'
) {
  await inlineImages(node);
  // Give the browser a tick to apply the swapped src
  await new Promise((r) => setTimeout(r, 50));

  const opts = {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#0a0a12',
    skipFonts: false,
  };

  const dataUrl =
    format === 'jpg' ? await toJpeg(node, { ...opts, quality: 0.95 }) : await toPng(node, opts);

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
