const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'docs', 'EduCRM_Instructor_Walkthrough_Guide.md');
const htmlPath = path.join(__dirname, '..', 'docs', 'EduCRM_Instructor_Walkthrough_Guide.html');

let md = fs.readFileSync(mdPath, 'utf8');

// Basic markdown to HTML converter tailored for this guide
function renderMarkdownToHtml(markdown) {
  let lines = markdown.split('\n');
  let html = [];
  let inTable = false;
  let tableHeaders = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Images
    const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      if (inList) { html.push('</ul>'); inList = false; }
      if (inTable) { html.push('</tbody></table></div>'); inTable = false; }
      const alt = imgMatch[1];
      const src = imgMatch[2];
      html.push(`
        <div class="figure-container">
          <img src="${src}" alt="${alt}" class="guide-screenshot" loading="lazy" />
          <div class="figure-caption"><span class="caption-tag">Screen Capture</span> ${alt}</div>
        </div>
      `);
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      if (inTable) { html.push('</tbody></table></div>'); inTable = false; }
      html.push(`<h1 class="guide-h1">${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      if (inTable) { html.push('</tbody></table></div>'); inTable = false; }
      html.push(`<h2 class="guide-h2">${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      if (inTable) { html.push('</tbody></table></div>'); inTable = false; }
      html.push(`<h3 class="guide-h3">${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      if (inList) { html.push('</ul>'); inList = false; }
      if (inTable) { html.push('</tbody></table></div>'); inTable = false; }
      html.push(`<blockquote class="guide-blockquote">${renderInline(line.slice(2))}</blockquote>`);
      continue;
    }

    // Horizontal Rule
    if (line.trim() === '---') {
      if (inList) { html.push('</ul>'); inList = false; }
      if (inTable) { html.push('</tbody></table></div>'); inTable = false; }
      html.push(`<hr class="guide-divider" />`);
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (inList) { html.push('</ul>'); inList = false; }
      let cells = line.split('|').slice(1, -1).map(c => c.trim());
      if (cells.every(c => c.match(/^:?-+:?$/))) {
        // separator row
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
        html.push('<div class="table-wrapper"><table class="guide-table"><thead><tr>');
        cells.forEach(h => html.push(`<th>${renderInline(h)}</th>`));
        html.push('</tr></thead><tbody>');
      } else {
        html.push('<tr>');
        cells.forEach(c => html.push(`<td>${renderInline(c)}</td>`));
        html.push('</tr>');
      }
      continue;
    } else if (inTable) {
      html.push('</tbody></table></div>');
      inTable = false;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) {
        inList = true;
        html.push('<ul class="guide-list">');
      }
      html.push(`<li>${renderInline(line.trim().slice(2))}</li>`);
      continue;
    } else if (inList && !line.trim().startsWith('- ') && !line.trim().startsWith('* ')) {
      html.push('</ul>');
      inList = false;
    }

    // Paragraphs
    if (line.trim().length > 0) {
      html.push(`<p class="guide-p">${renderInline(line)}</p>`);
    }
  }

  if (inList) html.push('</ul>');
  if (inTable) html.push('</tbody></table></div>');

  return html.join('\n');
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(str) {
  // Links
  str = str.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="guide-link">$1</a>');
  // Bold
  str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Inline Code
  str = str.replace(/`(.*?)`/g, '<code class="guide-code">$1</code>');
  // Italic
  str = str.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return str;
}

const bodyHtml = renderMarkdownToHtml(md);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EduCRM — Master Instructor Hands-On Walkthrough & System Evaluation Manual</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(18, 24, 38, 0.85);
      --card-border: rgba(31, 41, 61, 0.9);
      --emerald: #10b981;
      --emerald-glow: rgba(16, 185, 129, 0.2);
      --teal: #14b8a6;
      --cyan: #06b6d4;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --code-bg: #1e293b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.65;
      padding: 2.5rem 1.5rem;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
    }
    .guide-h1 {
      font-size: 2.4rem;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.03em;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #fff 40%, var(--emerald) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .guide-h2 {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--emerald);
      letter-spacing: -0.02em;
      margin-top: 2.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.4rem;
      border-bottom: 1px solid var(--card-border);
    }
    .guide-h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #38bdf8;
      margin-top: 1.8rem;
      margin-bottom: 0.6rem;
    }
    .guide-p {
      color: var(--text-muted);
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    .guide-blockquote {
      background: rgba(16, 185, 129, 0.08);
      border-left: 4px solid var(--emerald);
      padding: 1rem 1.25rem;
      border-radius: 0.5rem;
      color: #e2e8f0;
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }
    .guide-divider {
      border: 0;
      height: 1px;
      background: var(--card-border);
      margin: 2.5rem 0;
    }
    .table-wrapper {
      overflow-x: auto;
      margin: 1.5rem 0;
      border-radius: 0.75rem;
      border: 1px solid var(--card-border);
      background: var(--card-bg);
      backdrop-filter: blur(12px);
    }
    .guide-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.92rem;
      text-align: left;
    }
    .guide-table th {
      background: rgba(15, 23, 42, 0.9);
      color: var(--emerald);
      font-weight: 700;
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--card-border);
      text-transform: uppercase;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
    }
    .guide-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: #e2e8f0;
    }
    .guide-table tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }
    .guide-list {
      margin: 0.8rem 0 1.2rem 1.8rem;
      color: var(--text-muted);
    }
    .guide-list li {
      margin-bottom: 0.4rem;
    }
    .guide-code {
      font-family: 'JetBrains Mono', monospace;
      background: var(--code-bg);
      color: #38bdf8;
      padding: 0.2rem 0.45rem;
      border-radius: 0.35rem;
      font-size: 0.88em;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .guide-link {
      color: var(--emerald);
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
    }
    .guide-link:hover {
      text-decoration: underline;
      color: #34d399;
    }
    .figure-container {
      margin: 1.75rem 0 2.25rem 0;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 0.85rem;
      overflow: hidden;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
    }
    .guide-screenshot {
      width: 100%;
      height: auto;
      display: block;
      border-bottom: 1px solid var(--card-border);
    }
    .figure-caption {
      padding: 0.75rem 1.2rem;
      font-size: 0.88rem;
      color: var(--text-muted);
      background: rgba(10, 15, 26, 0.95);
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .caption-tag {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
      background: var(--emerald-glow);
      color: var(--emerald);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .figure-container { box-shadow: none; border: 1px solid #ccc; page-break-inside: avoid; }
      .guide-h1 { -webkit-text-fill-color: #000; }
      .guide-h2, .guide-h3 { color: #000; }
      .table-wrapper { border: 1px solid #ccc; }
      .guide-table th { background: #eee; color: #000; }
      .guide-table td { color: #000; border-bottom: 1px solid #eee; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${bodyHtml}
  </div>
</body>
</html>`;

fs.writeFileSync(htmlPath, fullHtml, 'utf8');
console.log('Successfully generated HTML guide at:', htmlPath);
