#!/usr/bin/env node
/**
 * Sync Google Drive folder tree → src/content/articles/*.md
 *
 * Folder convention:
 *   <ROOT>/<category>/<sub-category>/<doc>     → src/content/articles/<category>/<sub-category>/<slug>.md
 *
 * Skipped:
 *   - Any folder or file whose name starts with `_`  (e.g. `_drafts/`)
 *   - Docs whose description YAML contains `draft: true`
 *   - Docs whose description YAML contains `status: draft`
 *
 * Auth:
 *   GOOGLE_SERVICE_ACCOUNT_JSON   raw JSON of a service account key
 *   ROOT_FOLDER_ID                Drive ID of the root folder shared with the SA
 *
 * Flags:
 *   --dry-run     don't write files, just print what would happen
 *   --include-review   include `status: review` docs (default: only published)
 */

import { google } from 'googleapis';
import yaml from 'js-yaml';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(REPO_ROOT, 'src/content/articles');
const IMAGES_DIR = path.join(REPO_ROOT, 'public/images/articles');

const DRY = process.argv.includes('--dry-run');
const INCLUDE_REVIEW = process.argv.includes('--include-review');

const ROOT_FOLDER_ID = process.env.ROOT_FOLDER_ID;
if (!ROOT_FOLDER_ID) {
  console.error('Missing ROOT_FOLDER_ID env var.');
  process.exit(1);
}

const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!saJson) {
  console.error('Missing GOOGLE_SERVICE_ACCOUNT_JSON env var.');
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(saJson),
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/documents.readonly',
  ],
});
const drive = google.drive({ version: 'v3', auth });
const docs = google.docs({ version: 'v1', auth });

const MIME_FOLDER = 'application/vnd.google-apps.folder';
const MIME_DOC = 'application/vnd.google-apps.document';

// ----- Drive walk -----------------------------------------------------------

async function listChildren(folderId) {
  const out = [];
  let pageToken;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        'nextPageToken, files(id, name, mimeType, description, createdTime, modifiedTime, lastModifyingUser(emailAddress, displayName))',
      pageSize: 200,
      pageToken,
    });
    out.push(...(res.data.files ?? []));
    pageToken = res.data.nextPageToken;
  } while (pageToken);
  return out;
}

async function walk(folderId, categoryParts = []) {
  const items = [];
  for (const f of await listChildren(folderId)) {
    if (f.name.startsWith('_')) continue;
    if (f.mimeType === MIME_FOLDER) {
      items.push(...(await walk(f.id, [...categoryParts, slugify(f.name)])));
    } else if (f.mimeType === MIME_DOC) {
      items.push({ file: f, categoryParts });
    }
  }
  return items;
}

// ----- Description (frontmatter override) parsing --------------------------

function parseDescription(desc) {
  if (!desc) return {};
  const trimmed = desc.trim();
  if (!trimmed) return {};
  try {
    const parsed = yaml.load(trimmed);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    console.warn('  (description is not valid YAML, ignoring)');
    return {};
  }
}

// ----- Doc → Markdown conversion -------------------------------------------

async function convertDoc(file, categoryParts) {
  const { data: doc } = await docs.documents.get({ documentId: file.id });
  const inlineObjects = doc.inlineObjects ?? {};
  const lists = doc.lists ?? {};

  const overrides = parseDescription(file.description);
  const slug = overrides.slug ?? slugify(file.name);

  const status = overrides.status ?? (overrides.draft ? 'draft' : 'published');
  if (status === 'draft') return null;
  if (status === 'review' && !INCLUDE_REVIEW) return null;
  if (!['review', 'published'].includes(status)) {
    console.warn(`  unknown status "${status}", treating as published`);
  }

  const ctx = {
    slug,
    images: [], // {id, url, alt}
    md: [],
    listStack: [], // {listId, level}
  };

  for (const el of doc.body?.content ?? []) {
    if (el.paragraph) renderParagraph(el.paragraph, inlineObjects, lists, ctx);
    else if (el.table) renderTable(el.table, ctx);
  }
  flushList(ctx);

  // Resolve images: download contentUri to disk
  const downloadedCovers = [];
  for (const img of ctx.images) {
    const localPath = await downloadImage(img, slug);
    if (localPath) {
      // Replace placeholder in markdown
      ctx.md = ctx.md.map((line) => line.replaceAll(`{{IMG:${img.id}}}`, localPath));
      downloadedCovers.push(localPath);
    }
  }

  const body = ctx.md.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const summary = overrides.summary ?? extractSummary(body);

  const frontmatter = {
    title: overrides.title ?? file.name,
    category: overrides.category ?? (categoryParts.join('/') || 'uncategorized'),
    tags: overrides.tags ?? [],
    status: status === 'review' ? 'review' : 'published',
    publishedAt: overrides.publishedAt ?? overrides.date ?? file.createdTime,
    updatedAt: file.modifiedTime,
    author: overrides.author ?? file.lastModifyingUser?.emailAddress,
    summary,
    cover: overrides.cover ?? downloadedCovers[0],
    location: overrides.location,
    eventDate: overrides.eventDate,
    docId: file.id,
    docUrl: `https://docs.google.com/document/d/${file.id}/edit`,
  };

  // strip undefined / empty
  for (const k of Object.keys(frontmatter)) {
    const v = frontmatter[k];
    if (v === undefined || v === null || (Array.isArray(v) && v.length === 0)) {
      delete frontmatter[k];
    }
  }

  const fm = yaml.dump(frontmatter, { lineWidth: 120, noRefs: true });
  return {
    slug,
    categoryParts,
    content: `---\n${fm}---\n\n${body}\n`,
  };
}

function renderParagraph(p, inlineObjects, lists, ctx) {
  const style = p.paragraphStyle?.namedStyleType ?? 'NORMAL_TEXT';
  const isList = !!p.bullet;

  const text = (p.elements ?? [])
    .map((el) => renderElement(el, inlineObjects, ctx))
    .join('')
    .replace(/\s+$/, '');

  if (!isList) flushList(ctx);

  if (style.startsWith('HEADING_')) {
    const level = Math.min(parseInt(style.slice('HEADING_'.length), 10) + 1, 6);
    ctx.md.push(`${'#'.repeat(level)} ${text}`, '');
    return;
  }

  if (isList) {
    const listId = p.bullet.listId;
    const level = p.bullet.nestingLevel ?? 0;
    const ordered = isOrderedList(lists[listId], level);
    const marker = ordered ? '1.' : '-';
    ctx.md.push(`${'  '.repeat(level)}${marker} ${text}`);
    ctx.listStack.push({ listId, level });
    return;
  }

  if (!text) {
    ctx.md.push('');
    return;
  }

  // Block quote: a paragraph styled with indent often signals quote in Docs.
  // We only mark explicit "BLOCK_QUOTE" if author uses it.
  if (style === 'TITLE' || style === 'SUBTITLE') {
    // Skip: title is taken from doc filename.
    return;
  }

  ctx.md.push(text, '');
}

function flushList(ctx) {
  if (ctx.listStack.length) {
    ctx.md.push('');
    ctx.listStack = [];
  }
}

function isOrderedList(listDef, level) {
  if (!listDef) return false;
  const glyph = listDef.listProperties?.nestingLevels?.[level]?.glyphType;
  return !!glyph && glyph !== 'GLYPH_TYPE_UNSPECIFIED' && glyph !== 'NONE';
}

function renderElement(el, inlineObjects, ctx) {
  if (el.textRun) return renderTextRun(el.textRun);
  if (el.inlineObjectElement) {
    const id = el.inlineObjectElement.inlineObjectId;
    const obj = inlineObjects[id];
    const props = obj?.inlineObjectProperties?.embeddedObject;
    const url = props?.imageProperties?.contentUri;
    const alt = props?.title ?? props?.description ?? '';
    if (url) {
      ctx.images.push({ id, url, alt });
      // Use placeholder; replaced post-download with local path.
      return `\n\n![${alt}]({{IMG:${id}}})\n\n`;
    }
    return '';
  }
  if (el.horizontalRule) return '\n\n---\n\n';
  if (el.pageBreak) return '\n\n';
  return '';
}

function renderTextRun(tr) {
  let txt = tr.content ?? '';
  if (!txt || txt === '\n') return txt;
  const trailingNewline = txt.endsWith('\n');
  txt = txt.replace(/\n$/, '');
  const s = tr.textStyle ?? {};
  if (s.link?.url) txt = `[${txt}](${s.link.url})`;
  if (s.bold) txt = `**${txt}**`;
  if (s.italic) txt = `*${txt}*`;
  if (s.strikethrough) txt = `~~${txt}~~`;
  if (s.fontFamily?.fontFamily?.toLowerCase().includes('mono')) {
    txt = `\`${txt}\``;
  }
  return txt + (trailingNewline ? '\n' : '');
}

function renderTable(table, ctx) {
  flushList(ctx);
  const rows = table.tableRows ?? [];
  if (rows.length === 0) return;
  const cells = rows.map((r) =>
    (r.tableCells ?? []).map((c) =>
      (c.content ?? [])
        .flatMap((b) => (b.paragraph?.elements ?? []).map((e) => e.textRun?.content ?? ''))
        .join('')
        .replace(/\n/g, ' ')
        .trim(),
    ),
  );
  const cols = Math.max(...cells.map((r) => r.length));
  const header = cells[0] ?? [];
  ctx.md.push(`| ${header.concat(Array(cols - header.length).fill('')).join(' | ')} |`);
  ctx.md.push(`| ${Array(cols).fill('---').join(' | ')} |`);
  for (const r of cells.slice(1)) {
    ctx.md.push(`| ${r.concat(Array(cols - r.length).fill('')).join(' | ')} |`);
  }
  ctx.md.push('');
}

// ----- Image download -------------------------------------------------------

async function downloadImage({ id, url }, slug) {
  const dir = path.join(IMAGES_DIR, slug);
  const filename = `${id}.bin`;
  const dest = path.join(dir, filename);
  const publicPath = `/images/articles/${slug}/${filename}`;

  if (DRY) return publicPath;

  await fs.mkdir(dir, { recursive: true });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.warn(`  failed to download image ${id}: ${res.status}`);
    return null;
  }
  const ct = res.headers.get('content-type') ?? '';
  const ext = ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('gif') ? 'gif' : 'jpg';
  const finalName = `${id}.${ext}`;
  const finalDest = path.join(dir, finalName);
  const finalPublic = `/images/articles/${slug}/${finalName}`;
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(finalDest, buf);
  return finalPublic;
}

// ----- Helpers --------------------------------------------------------------

function slugify(s) {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function extractSummary(body) {
  const firstPara = body.split(/\n{2,}/).find((p) => p.trim() && !p.startsWith('#') && !p.startsWith('!'));
  if (!firstPara) return undefined;
  const stripped = firstPara.replace(/[*_`]/g, '').replace(/\[(.+?)\]\(.+?\)/g, '$1');
  return stripped.length > 240 ? stripped.slice(0, 237) + '…' : stripped;
}

async function clearManagedDirs() {
  if (DRY) return;
  for (const d of [ARTICLES_DIR, IMAGES_DIR]) {
    if (existsSync(d)) await fs.rm(d, { recursive: true, force: true });
    await fs.mkdir(d, { recursive: true });
  }
}

async function writeArticle({ slug, categoryParts, content }) {
  const dir = path.join(ARTICLES_DIR, ...categoryParts);
  const file = path.join(dir, `${slug}.md`);
  if (DRY) {
    console.log(`  would write ${path.relative(REPO_ROOT, file)} (${content.length} bytes)`);
    return;
  }
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file, content);
}

// ----- Main -----------------------------------------------------------------

async function main() {
  console.log(`Sync starting (root=${ROOT_FOLDER_ID}${DRY ? ', dry-run' : ''})`);
  const items = await walk(ROOT_FOLDER_ID);
  console.log(`Found ${items.length} doc(s)`);

  if (!DRY) await clearManagedDirs();

  let written = 0;
  let skipped = 0;
  for (const { file, categoryParts } of items) {
    console.log(`• ${categoryParts.join('/') || '(root)'} / ${file.name}`);
    try {
      const result = await convertDoc(file, categoryParts);
      if (!result) {
        console.log('  skipped (draft/review)');
        skipped++;
        continue;
      }
      await writeArticle(result);
      written++;
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      throw err;
    }
  }

  console.log(`Done. Wrote ${written}, skipped ${skipped}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
