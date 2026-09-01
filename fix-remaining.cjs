const fs = require('fs');
const path = require('path');

// Files that need <> ... </> wrapper around return content
const needsWrapper = [
  'app.billing.tsx', 'app.calendar.tsx', 'app.dashboard.tsx',
  'app.goals.tsx', 'app.journal.tsx', 'app.portfolios.tsx',
  'app.support.tsx', 'app.trades.index.tsx'
];

const routesDir = path.join(__dirname, 'src', 'routes');

for (const file of needsWrapper) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix: wrap return content in <>
  // Find "return (\n" followed by content that has multiple root elements
  // Replace "return (\n" with "return (\n    <>\n"  
  // Replace ");" at end of component with "    </>\n);"
  
  // Find the main component's return statement
  // Look for pattern: return (\n    <something that's not <>
  content = content.replace(
    /(\breturn\s*\(\s*\n)(    <)(?![\/])/,
    '$1    <>\n$2'
  );
  
  // Find the closing of the return before }) or function end
  // Replace the last ");" before function end with "    </>\n);"
  // This is the return statement's closing
  const lastReturnIdx = content.lastIndexOf('\n);');
  if (lastReturnIdx !== -1) {
    content = content.slice(0, lastReturnIdx) + '\n    </>\n);' + content.slice(lastReturnIdx + 3);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed wrapper: ${file}`);
}

// Fix ai-coach separately - it has a broken useSetTitle with actions embedded
const aiCoachPath = path.join(routesDir, 'app.ai-coach.tsx');
let aiContent = fs.readFileSync(aiCoachPath, 'utf8');

// Fix the broken useSetTitle call
aiContent = aiContent.replace(
  /useSetTitle\("مربی هوشمند AI", "تحلیل عملکرد در هر بازه زمانی؛ با تمرکز روی ضعف‌ها و راهکار رفع آن‌ها", \(\n\s*<Button[\s\S]*?runNewAnalysis\)\);/,
  'useSetTitle("مربی هوشمند AI", "تحلیل عملکرد در هر بازه زمانی؛ با تمرکز روی ضعف‌ها و راهکار رفع آن‌ها");'
);

// Fix the return statement - find where content starts after the broken useSetTitle
// The return should have <> wrapper
aiContent = aiContent.replace(
  /return \(\n\s*<RefreshCw/,
  'return (\n    <>\n    <RefreshCw'
);

// Add </> before the final );
const aiLastReturn = aiContent.lastIndexOf('\n);');
if (aiLastReturn !== -1) {
  aiContent = aiContent.slice(0, aiLastReturn) + '\n    </>\n);' + aiContent.slice(aiLastReturn + 3);
}

fs.writeFileSync(aiCoachPath, aiContent, 'utf8');
console.log('✅ Fixed ai-coach.tsx');

console.log('\nDone! Run npx tsc --noEmit to check.');
