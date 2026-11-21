import { mkdtempSync, mkdirSync, linkSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';

// Skip duplicated end frames at the two turns of the loop.
const sequence = mkdtempSync(join(tmpdir(), 'limitless-flight-'));
try {
  for (let i = 0; i < 798; i++) {
    const frame = i < 400 ? i + 1 : 799 - i;
    const name = n => String(n).padStart(4, '0') + '.webp';
    const src = resolve('public/frames/desktop', name(frame));
    const dest = join(sequence, name(i + 1));
    try { linkSync(src, dest); } catch { copyFileSync(src, dest); }
  }
  mkdirSync('public/js', { recursive: true });
  for (const [device, width] of [['mobile', 960], ['desktop', 1920]]) {
    execFileSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '24',
      '-i', join(sequence, '%04d.webp'), '-vf', 'scale=' + width + ':-2',
      '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
      '-threads', '3', '-g', '48', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      'public/js/flight-' + device + '-v1.mp4',
    ], { stdio: 'inherit' });
  }
} finally {
  rmSync(sequence, { recursive: true, force: true });
}
