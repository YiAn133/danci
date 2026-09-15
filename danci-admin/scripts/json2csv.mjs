#!/usr/bin/env node
/**
 * json2csv.mjs —— 把词典导出的 JSON 转成 CSV。
 *
 * 输入文件整体并不是一份合法 JSON：它是若干「已经格式化好的 JSON 对象」首尾直接
 * 拼接而成（形如 `}` 紧跟 `{`，中间既没有逗号，也没有外层数组），所以对整份文件
 * 直接 JSON.parse 会失败。
 *
 * 这里用逐字符扫描 + 括号配对来切分记录，不依赖缩进或换行，因此同样兼容：
 *   - 标准 JSON 数组：[{...}, {...}]
 *   - JSONL / NDJSON：一行一个对象
 *   - 本文件的拼接格式：{...}{...}
 *
 * 输出 4 列：wordRank, headWord, content, bookId
 * content 会压缩成单行 JSON 字符串放进单元格，内部的引号按 CSV 规则转义。
 *
 * 用法：
 *   node scripts/json2csv.mjs                        # 默认处理 temp/PEPXiaoXue3_1.json
 *   node scripts/json2csv.mjs <输入.json> [输出.csv]   # 指定文件，输出默认与输入同目录
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const COLUMNS = ["wordRank", "headWord", "content", "bookId"];

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const defaultInput = resolve(scriptDir, "..", "temp", "PEPXiaoXue6_1.json");

const inputPath = resolve(process.argv[2] ?? defaultInput);
const outputPath = resolve(
  process.argv[3] ?? inputPath.replace(/\.json$/i, ".csv"),
);

/**
 * 扫描文本，切出所有顶层 JSON 值。
 * 用括号计数 + 字符串状态机，避免值里的花括号或逗号干扰切分。
 */
function extractTopLevelValues(text) {
  const values = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === "}" || char === "]") {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        values.push(text.slice(start, index + 1));
        start = -1;
      }
    }
  }

  return values;
}

function parseChunk(chunk, index) {
  try {
    return JSON.parse(chunk);
  } catch (error) {
    throw new Error(`第 ${index + 1} 段无法解析为 JSON：${error.message}`);
  }
}

/** 按 RFC 4180 转义单个字段：含逗号 / 引号 / 换行时用双引号包裹。 */
function toCsvField(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const raw = readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");

const records = extractTopLevelValues(raw)
  .map(parseChunk)
  .flatMap((value) => (Array.isArray(value) ? value : [value]))
  .filter((record) => record !== null && typeof record === "object");

if (records.length === 0) {
  console.error(`未能从 ${inputPath} 解析出任何记录，请检查文件内容。`);
  process.exit(1);
}

const rows = [COLUMNS.join(",")];

for (const record of records) {
  rows.push(
    [
      record.wordRank,
      record.headWord,
      // content 压缩成单行 JSON，否则字段内的缩进换行会破坏 CSV 的行结构。
      record.content === undefined ? "" : JSON.stringify(record.content),
      record.bookId,
    ]
      .map(toCsvField)
      .join(","),
  );
}

// 带 UTF-8 BOM，Excel / WPS 打开中文才不乱码；下游不需要 BOM 时去掉 \uFEFF 即可。
const csv = `\uFEFF${rows.join("\r\n")}\r\n`;
writeFileSync(outputPath, csv, "utf8");

console.log(`输入：  ${inputPath}`);
console.log(`输出：  ${outputPath}`);
console.log(`列：    ${COLUMNS.join(", ")}`);
console.log(`记录数：${records.length}`);
console.log(
  `词表：  ${records
    .slice(0, 6)
    .map((record) => record.headWord)
    .join(", ")} …`,
);
console.log(`大小：  ${(Buffer.byteLength(csv) / 1024).toFixed(1)} KB`);
