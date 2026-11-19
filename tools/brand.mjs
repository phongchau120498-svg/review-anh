import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function brandOf(product, root) {
  const brands = readdirSync(path.join(root, 'docs/brand'), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== 'chung' && product.startsWith(`${entry.name}-`))
    .map(entry => entry.name).sort((a, b) => b.length - a.length);
  return brands[0] ?? 'moaw';
}

export const brandDir = (product, root) => path.join(root, 'docs/brand', brandOf(product, root));

export function brandDocs(product, root) {
  const dir = path.relative(root, brandDir(product, root));
  return ['docs/brand/chung/cach-nghi-content.md', `${dir}/thuong-hieu.md`, `${dir}/giong-van.md`];
}

export function camList(product, root) {
  const dirs = [path.join(root, 'docs/brand/chung'), brandDir(product, root)];
  return [...new Set(dirs.flatMap(dir => {
    try {
      return readFileSync(path.join(dir, 'cam.txt'), 'utf8').split(/\r?\n/)
        .map(line => line.trim()).filter(line => line && !line.startsWith('#'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      return [];
    }
  }))];
}
