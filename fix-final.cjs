const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => 
  f.startsWith('app.') && f.endsWith('.tsx') && !f.includes('__root') && f !== 'app.tsx'
);

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Add AppShell import if missing
  if (!content.includes('import { AppShell } from "@/components/AppShell"')) {
    const firstImportIdx = content.indexOf('import ');
    if (firstImportIdx !== -1) {
      content = content.slice(0, firstImportIdx) + 
        'import { AppShell } from "@/components/AppShell";\n' +
        content.slice(firstImportIdx);
      changed = true;
    }
  }

  // 2. Find the main component function's return statement
  // Look for function XxxPage/Component() { ... return (
  // Then find the matching closing ) and wrap content in <>
  
  // Strategy: find "return (\n" and add <> after it, then find ");" before function end and add </> before it
  // But we need to find the RIGHT return - the one that renders JSX
  
  // Let's find the component function name from the Route definition
  const routeMatch = content.match(/component:\s*(\w+)/);
  if (!routeMatch) continue;
  const componentName = routeMatch[1];
  
  // Find the function definition
  const funcRegex = new RegExp(`function\\s+${componentName}\\s*\\(`);
  const funcMatch = content.match(funcRegex);
  if (!funcMatch) continue;
  
  const funcStartIdx = content.indexOf(funcMatch[0]);
  const funcBody = content.slice(funcStartIdx);
  
  // Find "return (" in the function body
  const returnMatch = funcBody.match(/\n\s*return\s*\(\s*\n/);
  if (!returnMatch) continue;
  
  const returnIdx = funcStartIdx + funcBody.indexOf(returnMatch[0]);
  const afterReturn = returnIdx + returnMatch[0].length;
  
  // Check if it already has <> 
  const nextChars = content.slice(afterReturn, afterReturn + 10).trim();
  if (nextChars.startsWith('<>')) continue; // Already wrapped
  
  // Check if it starts with <AppShell
  if (nextChars.startsWith('<AppShell')) continue; // Already has AppShell
  
  // 3. Determine AppShell props for this file
  // We'll use a simple approach: find the original props from context
  // For now, just wrap in <> and note which files need AppShell
  
  // Actually, we need to re-add AppShell. Let's find the original props.
  // Since we can't know the exact original props, we'll use generic ones
  // based on the file name
  
  console.log(`⚠️  ${file} needs manual AppShell wrapper`);
}

console.log('\nDone analyzing. Files need manual fix.');
