const fs = require('fs');
const path = require('path');
const routesDir = path.join(__dirname, 'src', 'routes');

const brokenFiles = [
  'app.ai-coach.tsx',
  'app.billing.tsx', 
  'app.calendar.tsx',
  'app.dashboard.tsx',
  'app.goals.tsx',
  'app.journal.tsx',
  'app.portfolios.tsx',
  'app.support.tsx',
  'app.trades.index.tsx',
];

for (const file of brokenFiles) {
  const fp = path.join(routesDir, file);
  let c = fs.readFileSync(fp, 'utf8');

  // 1. Remove useSetTitle import if present
  c = c.replace(/import \{ useSetTitle \} from ["']@\/lib\/page-context["'];\n/g, '');

  // 2. Remove all useSetTitle(...) calls - various patterns
  c = c.replace(/\n\s*useSetTitle\("[^"]*",\s*"[^"]*"\);/g, '');
  c = c.replace(/\n\s*useSetTitle\("[^"]*",\s*"[^"]*",\s*\([^)]*\)\);/g, '');

  // 3. Remove any leftover "import { useSetTitle" fragments
  c = c.replace(/import \{ useSetTitle[^}]*\}[^;]*;\n?/g, '');

  // 4. Fix the broken ai-coach useSetTitle with embedded JSX
  // Pattern: useSetTitle("...", "...", (<Button...broken...>))
  c = c.replace(/\s*useSetTitle\("مربی هوشمند AI"[^)]*\);/g, '');

  // 5. Add AppShell import if missing
  if (!c.includes('import { AppShell } from "@/components/AppShell"')) {
    c = c.replace(
      /(import \{[^}]+\} from ["']@tanstack\/react-router["'];)/,
      'import { AppShell } from "@/components/AppShell";\n$1'
    );
  }

  // 6. Find the component function and wrap return in <>
  // Get component name from Route definition
  const routeCompMatch = c.match(/component:\s*(\w+)/);
  if (!routeCompMatch) { console.log(`⚠️  ${file}: no component found`); continue; }
  const compName = routeCompMatch[1];

  // Find the function
  const funcRegex = new RegExp(`function\\s+${compName}\\s*\\(`);
  const funcMatch = c.match(funcRegex);
  if (!funcMatch) { console.log(`⚠️  ${file}: function ${compName} not found`); continue; }

  // Find "return (" after function start
  const funcIdx = c.indexOf(funcMatch[0]);
  const restFromFunc = c.slice(funcIdx);
  const returnMatch = restFromFunc.match(/\n(\s*)return\s*\(\s*\n/);
  if (!returnMatch) { console.log(`⚠️  ${file}: return not found`); continue; }

  const returnIdx = funcIdx + restFromFunc.indexOf(returnMatch[0]);
  const returnLineEnd = returnIdx + returnMatch[0].length;
  
  // Check if already wrapped
  const afterReturn = c.slice(returnLineEnd, returnLineEnd + 20).trim();
  if (afterReturn.startsWith('<AppShell') || afterReturn.startsWith('<>')) {
    console.log(`⏭️  ${file}: already has wrapper`);
    continue;
  }

  // Add <> after return (
  c = c.slice(0, returnLineEnd) + '<>\n' + c.slice(returnLineEnd);

  // Find the matching ); for this return - look for ); followed by } (function end)
  // Simple heuristic: find the last ); before the next function or end of file
  // Look for ");\n}\n" pattern near the end
  const lastReturn = c.lastIndexOf('\n);');
  if (lastReturn !== -1) {
    c = c.slice(0, lastReturn) + '\n</>\n);' + c.slice(lastReturn + 3);
  }

  fs.writeFileSync(fp, c, 'utf8');
  console.log(`✅ ${file}`);
}

console.log('\nDone! Run tsc to verify.');
