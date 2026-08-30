import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

const outputDirectory = resolve('dist');
const basePath = '/laravel-api-boilerplate-website';
const htmlFiles = [];

function collectHtmlFiles(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) {
      collectHtmlFiles(path);
    } else if (extname(path) === '.html') {
      htmlFiles.push(path);
    }
  }
}

function targetExists(pathname) {
  const relativePath = pathname.slice(basePath.length).replace(/^\//, '');
  const directTarget = join(outputDirectory, relativePath);

  return existsSync(directTarget) || existsSync(join(directTarget, 'index.html'));
}

collectHtmlFiles(outputDirectory);

const failures = [];

for (const htmlFile of htmlFiles) {
  const html = readFileSync(htmlFile, 'utf8');
  const links = html.matchAll(/href="([^"]+)"/g);

  for (const [, href] of links) {
    if (!href.startsWith(basePath)) {
      continue;
    }

    const pathname = href.split(/[?#]/, 1)[0];

    if (!targetExists(pathname)) {
      failures.push(`${relative(outputDirectory, htmlFile)} -> ${href}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Broken internal links:\n${failures.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Checked ${htmlFiles.length} HTML files: all internal links resolve.`);
}
