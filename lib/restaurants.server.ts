import fs from "node:fs";
import path from "node:path";
import iconv from "iconv-lite";
import { parse } from "csv-parse/sync";

import { deriveRegion, type Restaurant } from "@/lib/restaurants";

const CSV_PATH = path.join(process.cwd(), "data", "모범음식점정보.csv");

let cache: Restaurant[] | null = null;
let cachedMtimeMs: number | null = null;

export function loadRestaurants(): Restaurant[] {
  // 2일마다 갱신되는 파일이라 mtime이 바뀌면 dev 서버 재시작 없이도 다시 읽는다.
  const mtimeMs = fs.statSync(CSV_PATH).mtimeMs;
  if (cache && cachedMtimeMs === mtimeMs) return cache;
  cachedMtimeMs = mtimeMs;

  const buffer = fs.readFileSync(CSV_PATH);
  const text = iconv.decode(buffer, "cp949");
  const rows: Record<string, string>[] = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  cache = rows
    .filter((row) => row["영업상태명"] === "영업")
    .map((row, index) => {
      const address = row["도로명주소"] || row["소재지주소"] || "";
      const { sido, sigungu } = deriveRegion(address);
      return {
        id: `${row["관리번호"] || row["인허가번호"] || "row"}-${index}`,
        sido,
        sigungu,
        name: row["업소명"] ?? "",
        roadAddress: row["도로명주소"] ?? "",
        lotAddress: row["소재지주소"] ?? "",
        phone: row["전화번호"] ?? "",
        cuisineCategory: row["음식의유형"] ?? "",
        foodType: row["주된음식종류"] ?? "",
        designatedDate: row["지정일자"] ?? "",
      };
    });

  return cache;
}
