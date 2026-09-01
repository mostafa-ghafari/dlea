const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'routes');

// Fix journal - same pattern as goals: Dialog got sucked into actions
let j = fs.readFileSync(path.join(dir, 'app.journal.tsx'), 'utf8');
// Replace the broken return
j = j.replace(
  /return \(\n<>\n    <DialogTrigger asChild>\n(\s*)<Button[^>]*variant="outline">\n(\s*)<FolderPlus[^/]*\/>\n(\s*)گروه‌ها\n(\s*)<\/Button>\n(\s*)<\/DialogTrigger>/,
  (m, ...args) => {
    return `return (\n    <AppShell title="ژورنال معاملاتی" subtitle="یادداشت و تحلیل معاملات" actions={\n      <Button variant="outline" onClick={() => setGroupDialog(true)}>\n        <FolderPlus className="ml-1 h-4 w-4" />\n        گروه‌ها\n      </Button>\n    }>\n      <Dialog open={groupDialog} onOpenChange={setGroupDialog}>`;
  }
);
// Fix closing: replace last </>\n);\n} with </AppShell>\n);\n}
j = j.replace(/\n<\/>\n\);\n\}\n$/, '\n    </AppShell>\n);\n}\n');
// Also need to remove the leftover }> that was part of the old actions prop
j = j.replace(/\n\s*\}\>\s*\n\s*<div/g, '\n      <div');
fs.writeFileSync(path.join(dir, 'app.journal.tsx'), j);
console.log('✅ app.journal.tsx');

// Fix portfolios
let p = fs.readFileSync(path.join(dir, 'app.portfolios.tsx'), 'utf8');
// Find the broken return pattern
const pReturnMatch = p.match(/return \(\n<>\n([\s\S]*?)<\/>\n\);\n\}\n?$/);
if (pReturnMatch) {
  // Need to add AppShell with proper structure
  p = p.replace(/return \(\n<>/, `return (\n    <AppShell title="پرتفولیوها" subtitle="مدیریت حساب‌های معاملاتی" actions={\n      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setOpen(true)}>\n        <Plus className="ml-1 h-4 w-4" />پرتفولیو جدید\n      </Button>\n    }>`);
  p = p.replace(/\n<\/>\n\);\n}\n?$/, '\n    </AppShell>\n);\n}\n');
  // Fix leftover }> 
  p = p.replace(/\n\s*\}\>\s*\n/g, '\n');
}
fs.writeFileSync(path.join(dir, 'app.portfolios.tsx'), p);
console.log('✅ app.portfolios.tsx');

// Fix support
let s = fs.readFileSync(path.join(dir, 'app.support.tsx'), 'utf8');
s = s.replace(/return \(\n<>/, `return (\n    <AppShell title="پشتیبانی" subtitle="ارسال تیکت و پیگیری درخواست‌ها" actions={\n      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setOpen(true)}>\n        <Plus className="ml-1 h-4 w-4" />تیکت جدید\n      </Button>\n    }>`);
s = s.replace(/\n<\/>\n\);\n}\n?$/, '\n    </AppShell>\n);\n}\n');
s = s.replace(/\n\s*\}\>\s*\n/g, '\n');
fs.writeFileSync(path.join(dir, 'app.support.tsx'), s);
console.log('✅ app.support.tsx');

// Fix trades.index
let t = fs.readFileSync(path.join(dir, 'app.trades.index.tsx'), 'utf8');
t = t.replace(/return \(\n<>/, `return (\n    <AppShell title="معاملات" subtitle="لیست تمام معاملات ثبت‌شده" actions={\n      <Link to="/app/trades/new">\n        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">\n          <Plus className="ml-1 h-4 w-4" />معامله جدید\n        </Button>\n      </Link>\n    }>`);
t = t.replace(/\n<\/>\n\);\n}\n?$/, '\n    </AppShell>\n);\n}\n');
t = t.replace(/\n\s*\}\>\s*\n/g, '\n');
fs.writeFileSync(path.join(dir, 'app.trades.index.tsx'), t);
console.log('✅ app.trades.index.tsx');

// Fix ai-coach - most complex
let a = fs.readFileSync(path.join(dir, 'app.ai-coach.tsx'), 'utf8');
// Remove the broken return and reconstruct
// Find the component function
const aFuncMatch = a.match(/function AiCoach\(\)[\s\S]*?return \(\n<>\n([\s\S]*?)<\/>\n\);\n\}/);
if (aFuncMatch) {
  const innerContent = aFuncMatch[1];
  a = a.replace(
    /return \(\n<>\n[\s\S]*?<\/>\n\);\n\}/,
    `return (\n    <AppShell title="مربی هوشمند AI" subtitle="تحلیل عملکرد در هر بازه زمانی؛ با تمرکز روی ضعف‌ها و راهکار رفع آن‌ها" actions={\n      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={generating} onClick={runNewAnalysis}>\n        <RefreshCw className={\`ml-1 h-4 w-4 \${generating ? "animate-spin" : ""}\`} />\n        {generating ? "در حال تحلیل با Gemini..." : "تحلیل جدید"}\n      </Button>\n    }>\n${innerContent.replace(/<RefreshCw[\s\S]*?تحلیل جدید"}\n\s*<\/Button>\s*\}\s*\>\s*/g, '')}\n    </AppShell>\n);`
  );
}
// Fix any leftover broken fragments
a = a.replace(/\n\s*\}\>\s*\n/g, '\n');
fs.writeFileSync(path.join(dir, 'app.ai-coach.tsx'), a);
console.log('✅ app.ai-coach.tsx');

console.log('\nDone! Run tsc to check.');
