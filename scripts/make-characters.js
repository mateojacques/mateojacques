// One-off conversion script. NOT part of the build, and Netlify never runs it.
//
// Reads the owner's chosen drawings from scratch/originals/<n>.png and writes
// static/characters/c<index>.png, shrunk to 128px on the long edge with
// transparency kept. The output is committed; the originals live in git history.
//
// Uses Windows PowerShell + System.Drawing so the project gains no image
// dependency. Run once on a Windows machine: node scripts/make-characters.js
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OWNER_NUMBERS = [1, 8, 9, 26, 44, 45, 46, 47, 54, 56, 57, 60, 61, 62, 63];
const LONG_EDGE = 128;

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'scratch', 'originals');
const outDir = path.join(root, 'static', 'characters');
fs.mkdirSync(outDir, { recursive: true });

const resize = (src, dest) => `
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('${src}')
$scale = ${LONG_EDGE} / [Math]::Max($img.Width, $img.Height)
if ($scale -gt 1) { $scale = 1 }
$w = [Math]::Max(1, [int][Math]::Round($img.Width * $scale))
$h = [Math]::Max(1, [int][Math]::Round($img.Height * $scale))
$bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$attrs = New-Object System.Drawing.Imaging.ImageAttributes
$attrs.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
$g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
$bmp.Save('${dest}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
`;

OWNER_NUMBERS.forEach((n, i) => {
  const src = path.join(srcDir, `${n}.png`);
  const dest = path.join(outDir, `c${i + 1}.png`);
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', resize(src, dest)], { stdio: 'inherit' });
  console.log(`${n}.png -> c${i + 1}.png (${fs.statSync(dest).size} bytes)`);
});
