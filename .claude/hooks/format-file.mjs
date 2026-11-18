// PostToolUse hook: formats the file Claude just edited, so diffs stay Prettier-clean.
// Never fails the tool call — formatting problems are reported, not fatal.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { extname } from 'node:path';

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  try {
    const filePath = JSON.parse(input)?.tool_input?.file_path;
    if (!filePath || !existsSync(filePath)) return;

    const ext = extname(filePath);
    const prettierExts = [
      '.ts',
      '.mts',
      '.js',
      '.mjs',
      '.json',
      '.md',
      '.html',
      '.css',
      '.yml',
      '.yaml',
    ];
    const opts = { stdio: 'ignore', cwd: process.env.CLAUDE_PROJECT_DIR ?? process.cwd() };

    if (ext === '.prisma') {
      execFileSync('npx', ['--no-install', 'prisma', 'format'], opts);
    } else if (prettierExts.includes(ext)) {
      execFileSync(
        'npx',
        ['--no-install', 'prettier', '--write', '--ignore-unknown', filePath],
        opts,
      );
    }
  } catch {
    // Prettier/Prisma not installed yet, or the file has a syntax error: leave it to typecheck.
  }
});
