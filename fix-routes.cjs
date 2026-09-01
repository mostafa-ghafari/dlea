const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => 
  f.startsWith('app.') && f.endsWith('.tsx') && !f.includes('__root') && !f.includes('app.tsx')
);

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Remove AppShell import
  if (content.includes('import { AppShell } from "@/components/AppShell"')) {
    content = content.replace(/import \{ AppShell \} from ["']@\/components\/AppShell["'];\n/, '');
    changed = true;
  }

  // 2. Add useSetTitle import (after first import line)
  if (!content.includes('useSetTitle') && content.includes('createFileRoute')) {
    content = content.replace(
      /(import \{ createFileRoute)/,
      'import { useSetTitle } from "@/lib/page-context";\n$1'
    );
    changed = true;
  }

  // 3. Extract AppShell opening tag props and remove it
  // Pattern: <AppShell title="..." subtitle="..." actions={...}>
  const shellRegex = /<AppShell\s+title="([^"]*)"\s+subtitle="([^"]*)"(?:\s+actions=\{([\s\S]*?)\})?\s*>\s*\n?/;
  const shellMatch = content.match(shellRegex);

  if (shellMatch) {
    const [, title, subtitle, actionsRaw] = shellMatch;
    
    // Remove the opening AppShell tag
    content = content.replace(shellRegex, '');
    changed = true;

    // Remove closing </AppShell>
    content = content.replace(/\s*<\/AppShell>\s*\n?/, '\n');
    changed = true;

    // Find the function name and add useSetTitle as first statement
    // Look for the component function that contains the JSX
    const funcRegex = /(function\s+\w+\s*\([^)]*\)\s*\{)/;
    const funcMatch = content.match(funcRegex);
    
    if (funcMatch) {
      let call;
      if (actionsRaw && actionsRaw.trim()) {
        call = `  useSetTitle("${title}", "${subtitle}", (${actionsRaw.trim()}));`;
      } else {
        call = `  useSetTitle("${title}", "${subtitle}");`;
      }
      
      content = content.replace(funcMatch[1], funcMatch[1] + '\n' + call);
      changed = true;
    }
  } else {
    // Try simpler pattern without actions
    const simpleRegex = /<AppShell\s+title="([^"]*)"\s+subtitle="([^"]*)"\s*>\s*\n?/;
    const simpleMatch = content.match(simpleRegex);
    
    if (simpleMatch) {
      const [, title, subtitle] = simpleMatch;
      content = content.replace(simpleRegex, '');
      content = content.replace(/\s*<\/AppShell>\s*\n?/, '\n');
      
      const funcRegex = /(function\s+\w+\s*\([^)]*\)\s*\{)/;
      const funcMatch = content.match(funcRegex);
      if (funcMatch) {
        content = content.replace(funcMatch[1], funcMatch[1] + `\n  useSetTitle("${title}", "${subtitle}");`);
      }
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file}`);
  } else {
    console.log(`⏭️  ${file} (skipped - no AppShell found)`);
  }
}

console.log('\nDone!');
