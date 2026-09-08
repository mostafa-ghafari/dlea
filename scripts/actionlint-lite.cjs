#!/usr/bin/env node
/**
 * actionlint-lite — lightweight GitHub Actions workflow validator
 *
 * Validates all .github/workflows/*.yml files for:
 *   1. YAML syntax (tabs, trailing whitespace)
 *   2. Required top-level keys (name, on, jobs)
 *   3. on: trigger structure (valid event names)
 *   4. Every job has runs-on and steps (or uses)
 *   5. needs[] references resolve to existing jobs
 *   6. Template-expression balance ${{ ... }}
 *   7. actions/* version pins (warn on @main/@master)
 *   8. runs-on values are valid runner labels
 *   9. Every step has either run: or uses:
 *  10. No duplicate job names
 *
 * Usage:  node scripts/actionlint-lite.mjs
 *         npm run lint:workflows  (add to package.json)
 */
const fs = require("node:fs");
const path = require("node:path");

const VALID_RUNNERS = new Set([
  "ubuntu-latest", "ubuntu-22.04", "ubuntu-20.04",
  "windows-latest", "windows-2022", "windows-2019",
  "macos-latest", "macos-14", "macos-13",
  "self-hosted",
]);

const VALID_EVENTS = new Set([
  "push", "pull_request", "pull_request_target", "workflow_dispatch",
  "workflow_run", "schedule", "release", "issues", "issue_comment",
  "repository_dispatch", "workflow_call", "merge_group", "pull_request_review",
]);

// Discover workflow files
const wfDir = path.join(process.cwd(), ".github", "workflows");
let files;
try {
  files = fs.readdirSync(wfDir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => path.join(".github", "workflows", f));
} catch {
  console.log("No .github/workflows/ directory found — nothing to validate.");
  process.exit(0);
}

if (files.length === 0) {
  console.log("No workflow files found.");
  process.exit(0);
}

let allPassed = true;
let totalErrors = 0;

for (const file of files) {
  const errors = [];
  let content;

  try {
    content = fs.readFileSync(file, "utf8");
  } catch {
    errors.push("File not found");
    allPassed = false;
    totalErrors++;
    console.log(`\n❌ ${file}:\n  - File not found`);
    continue;
  }

  const lines = content.split("\n");

  // 1. Tabs
  lines.forEach((line, i) => {
    if (line.includes("\t")) {
      errors.push(`Line ${i + 1}: tab character (YAML requires spaces)`);
    }
  });

  // 2. Trailing whitespace
  lines.forEach((line, i) => {
    if (line.length > 0 && line !== line.trimEnd()) {
      errors.push(`Line ${i + 1}: trailing whitespace`);
    }
  });

  // 3. Required top-level keys
  for (const key of ["name", "on", "jobs"]) {
    if (!new RegExp(`^${key}:`, "m").test(content)) {
      errors.push(`Missing required top-level key: "${key}"`);
    }
  }

  // 4. Balanced template expressions
  const openCount = (content.match(/\$\{\{/g) || []).length;
  const closeCount = (content.match(/\}\}/g) || []).length;
  if (openCount !== closeCount) {
    errors.push(`Unbalanced ${{ }}: ${openCount} opens vs ${closeCount} closes`);
  }

  // 5. Validate on: triggers
  const onBlockMatch = content.match(/^on:\s*\n((?:  \w.*\n)*)/m);
  if (onBlockMatch) {
    for (const tl of onBlockMatch[1].split("\n").filter(Boolean)) {
      const eventMatch = tl.match(/^ {2}(\w[\w-]*):/);
      if (eventMatch && !VALID_EVENTS.has(eventMatch[1])) {
        errors.push(`on: unknown event "${eventMatch[1]}"`);
      }
    }
  }

  // 6. Parse jobs
  const jobsLineIdx = lines.findIndex((l) => /^jobs:\s*$/.test(l));
  if (jobsLineIdx === -1) {
    errors.push('Could not find "jobs:" top-level key');
  } else {
    let jobsEndIdx = lines.length;
    for (let i = jobsLineIdx + 1; i < lines.length; i++) {
      if (/^\S/.test(lines[i]) && lines[i].trim().length > 0) {
        jobsEndIdx = i;
        break;
      }
    }

    const jobStarts = [];
    for (let i = jobsLineIdx + 1; i < jobsEndIdx; i++) {
      const m = lines[i].match(/^ {2}(\w[\w-]*):\s*$/);
      if (m) jobStarts.push({ name: m[1], line: i });
    }

    // Duplicate job names
    const nameCount = {};
    jobStarts.forEach((j) => { nameCount[j.name] = (nameCount[j.name] || 0) + 1; });
    for (const [name, count] of Object.entries(nameCount)) {
      if (count > 1) errors.push(`Duplicate job name: "${name}" (${count} times)`);
    }

    const jobNames = jobStarts.map((j) => j.name);

    for (let ji = 0; ji < jobStarts.length; ji++) {
      const { name: jobName, line: startIdx } = jobStarts[ji];
      const endIdx = ji + 1 < jobStarts.length ? jobStarts[ji + 1].line : jobsEndIdx;
      const jobBlock = lines.slice(startIdx, endIdx).join("\n");

      // runs-on
      const runsOnMatch = jobBlock.match(/ {4}runs-on:\s*(.+)/);
      if (!runsOnMatch) {
        errors.push(`Job "${jobName}": missing "runs-on"`);
      } else {
        const val = runsOnMatch[1].trim();
        if (!val.startsWith("${{") && !val.startsWith("[") && !VALID_RUNNERS.has(val)) {
          errors.push(`Job "${jobName}": unusual runs-on "${val}"`);
        }
      }

      // steps or uses
      const hasSteps = / {4}steps:\s*$/.test(jobBlock);
      const hasUses = / {4}uses:\s*/.test(jobBlock);
      if (!hasSteps && !hasUses) {
        errors.push(`Job "${jobName}": no "steps" or "uses" found`);
      }

      // steps validation
      if (hasSteps) {
        const stepBlock = jobBlock.slice(jobBlock.indexOf("steps:"));
        const stepLines = stepBlock.split("\n");
        let inStep = false, stepHasRun = false, stepHasUses = false, stepCount = 0;
        for (const sl of stepLines) {
          if (/ {6}- /.test(sl)) {
            if (inStep && !stepHasRun && !stepHasUses) {
              errors.push(`Job "${jobName}": step ${stepCount} missing "run:" or "uses:"`);
            }
            inStep = true; stepHasRun = false; stepHasUses = false; stepCount++;
          }
          if (/ {8}run:\s*/.test(sl)) stepHasRun = true;
          if (/ {8}uses:\s*/.test(sl)) stepHasUses = true;
        }
        if (inStep && !stepHasRun && !stepHasUses) {
          errors.push(`Job "${jobName}": step ${stepCount} missing "run:" or "uses:"`);
        }

        // action version pinning
        for (const um of stepBlock.matchAll(/uses:\s*([\w-]+\/[\w-]+)@([\w.\-]+)/g)) {
          const [, action, version] = um;
          if (["main", "master"].includes(version)) {
            errors.push(`Job "${jobName}": ${action}@${version} is unpinned — pin to a release tag`);
          }
        }
      }

      // needs
      const needsMatch = jobBlock.match(/ {4}needs:\s*(.+)/);
      if (needsMatch) {
        const needsVal = needsMatch[1].trim();
        const deps = needsVal.startsWith("[")
          ? needsVal.slice(1, -1).split(",").map((s) => s.trim().replace(/['"]/g, ""))
          : [needsVal.replace(/['"]/g, "")];
        for (const dep of deps) {
          if (dep && !jobNames.includes(dep)) {
            errors.push(`Job "${jobName}": needs "${dep}" — job not found`);
          }
        }
      }
    }

    console.log(`  ${file}: ${jobNames.length} job(s) — ${jobNames.join(", ")}`);
  }

  if (errors.length > 0) {
    allPassed = false;
    totalErrors += errors.length;
    console.log(`\n❌ ${file}: ${errors.length} issue(s)`);
    errors.forEach((e) => console.log(`  - ${e}`));
  } else {
    console.log(`  ✅ PASS`);
  }
}

console.log(
  allPassed
    ? `\n✅ All ${files.length} workflow(s) pass validation`
    : `\n❌ ${totalErrors} issue(s) across ${files.length} file(s)`
);
process.exit(allPassed ? 0 : 1);
