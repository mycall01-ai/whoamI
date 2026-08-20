import fs from "node:fs";
import path from "node:path";

import { downloadSourceCsv } from "../lib/download-source-csv.server";

const OUT_PATH = path.join(process.cwd(), "data", "모범음식점정보.csv");

async function main() {
  const buffer = await downloadSourceCsv();
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, buffer);
  console.log(`${OUT_PATH} 업데이트 완료 (${buffer.length.toLocaleString()} bytes)`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
