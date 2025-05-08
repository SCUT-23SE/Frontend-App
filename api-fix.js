// fix-openapi-gen.js
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { fileURLToPath } from 'url'; // Use import.meta.url for ES Modules

// --- 配置 ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 确认 gen 目录相对于脚本的位置是正确的
const genDir = path.join(__dirname, 'gen');
// -------------

console.log(`Starting OpenAPI TS fixer script...`);
console.log(`Target directory: ${genDir}`);

// Use glob.sync for simpler control flow
try {
  const files = glob.sync(`${genDir}/**/*.ts`, { nodir: true });

  if (files.length === 0) {
    console.log("No .ts files found in the target directory. Exiting.");
    process.exit(0); // Exit normally if no files found
  }

  console.log(`Found ${files.length} .ts files. Processing...`);
  let filesChangedCount = 0;
  let filesWithErrors = 0;

  files.forEach(file => {
    console.log(`\nProcessing ${file}...`);
    try {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      let changedInFile = false;

      // 1. Replace 'url' import with 'native-url'
      const importRegex = /import\s+\*\s+as\s+globalImportUrl\s+from\s+'url';/g;
      const newImport = `import * as globalImportUrl from 'native-url';`;

      if (importRegex.test(content)) {
        content = content.replace(importRegex, newImport);
        if (content !== originalContent) {
          changedInFile = true;
          console.log(`  - Replaced 'url' import with 'native-url'`);
        }
      } else {
        console.log(`  - 'url' import not found or already replaced.`);
      }

      // --- Additional Fixes (Optional but recommended based on previous linter errors) ---

      // Fix: delete localVarUrlObj.search; (The operand of a 'delete' operator must be optional.)
      // This line is often problematic and usually safe to remove as query params are handled separately.
      const deleteSearchRegex = /(\s*\/\/ fix override query string.*?[\r?\n]+)?\s*delete\s+localVarUrlObj\.search;\s*\r?\n?/g;
      if (deleteSearchRegex.test(content)) {
        const initialContent = content;
        content = content.replace(deleteSearchRegex, '');
        if (content !== initialContent) {
          changedInFile = true;
          console.log(`  - Removed 'delete localVarUrlObj.search;'`);
        }
      }

      // Fix: SuccessWithData  -> SuccessWithData & object
      const ampRegex = /import\s+{(.*?)SuccessWithData\s+&amp;\s+object(.*?)}\s+from\s+'..\/models';/g;
      if (ampRegex.test(content)) {
        const initialContent = content;
        content = content.replace(ampRegex, "import {$1 SuccessWithData & object $2} from '../models';");
        if (content !== initialContent) {
          changedInFile = true;
          console.log(`  - Fixed '&amp;' in SuccessWithData import.`);
        }
      }


      // --- Write Changes ---
      if (changedInFile) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`  - Saved changes.`);
        filesChangedCount++;
      } else {
        console.log(`  - No changes needed or applied.`);
      }

    } catch (e) {
      console.error(`  - Error processing file ${file}:`, e);
      filesWithErrors++;
    }
  });

  console.log(`\nScript finished.`);
  console.log(`Total files processed: ${files.length}`);
  console.log(`Total files modified: ${filesChangedCount}`);
  if (filesWithErrors > 0) {
    console.log(`Files with errors: ${filesWithErrors}`);
    process.exit(1); // Exit with error code if any file failed
  }

} catch (err) {
  console.error("Error during script execution:", err);
  process.exit(1);
}