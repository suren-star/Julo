import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const HTML_ENTRIES = ['index.html', 'login/index.html'];
const SCAN_ROOTS = [...HTML_ENTRIES, 'src'];
const ALLOWED_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.html']);

const rules = [
  { name: 'OpenAI-style secret', pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: 'GitHub personal access token', pattern: /\bghp_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { name: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Private client secret', pattern: /\bclient_secret\b\s*[:=]/gi },
  { name: 'Dangerous eval()', pattern: /(^|[^\w])eval\s*\(/g },
  { name: 'Dangerous Function constructor', pattern: /new\s+Function\s*\(/g },
  { name: 'Direct innerHTML assignment', pattern: /\.innerHTML\s*=/g },
  { name: 'React dangerouslySetInnerHTML', pattern: /dangerouslySetInnerHTML/g },
];

const files = [];
const seen = new Set();

const collect = (relativePath) => {
  if (seen.has(relativePath)) return;
  const fullPath = path.join(ROOT, relativePath);
  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(fullPath)) collect(path.join(relativePath, entry));
    return;
  }
  if (HTML_ENTRIES.includes(relativePath) || ALLOWED_EXTENSIONS.has(path.extname(relativePath))) {
    seen.add(relativePath);
    files.push(relativePath);
  }
};

for (const target of SCAN_ROOTS) collect(target);

const findings = [];
for (const relativePath of files) {
  const content = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(content)) findings.push(`${relativePath}: ${rule.name}`);
  }
}

for (const entry of HTML_ENTRIES) {
  const html = fs.readFileSync(path.join(ROOT, entry), 'utf8');
  if (!html.includes('Content-Security-Policy')) findings.push(`${entry}: Content Security Policy is missing`);
  if (!html.includes('name="referrer"')) findings.push(`${entry}: Referrer Policy is missing`);
}

if (findings.length) {
  console.error('Security checks failed:');
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log(`Security checks passed for ${files.length} source files and ${HTML_ENTRIES.length} HTML entries.`);
