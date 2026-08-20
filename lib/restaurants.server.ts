import fs from "node:fs";
import path from "node:path";
import iconv from "iconv-lite";
import { parse } from "csv-parse/sync";

import { deriveRegion, type Restaurant } from "@/lib/restaurants";

const CSV_PATH = path.join(process.cwd(), "data", "모범음식점정보.csv");

type LoadedData = { restaurants: Restaurant[]; updatedAt: string };

let cache: LoadedData | null = null;
let cachedMtimeMs: number | null = null;

function load(): LoadedData {
  const buffer = fs.readFileSync(CSV_PATH);
  const text = iconv.decode(buffer, "cp949");
  const rows: Record<string, string>[] = parse(text, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });

  // 데이터갱신시점은 행별로 다르다(지자체마다 반영 시점이 다름) - 그중 가장 최근 값을
  // "이 파일의 데이터 갱신시점"으로 보여준다. "YYYY-MM-DD HH:mm:ss" 형식이라 문자열
  // 비교로도 최신값을 구할 수 있다.
  const updatedAt = rows.reduce((latest, row) => {
    const value = row["데이터갱신시점"] ?? "";
    return value > latest ? value : latest;
  }, "");

  const restaurants = rows
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

  return { restaurants, updatedAt };
}

// 2일마다 갱신되는 파일이라 mtime이 바뀌면 dev 서버 재시작 없이도 다시 읽는다.
function ensureLoaded(): LoadedData {
  const mtimeMs = fs.statSync(CSV_PATH).mtimeMs;
  if (!cache || cachedMtimeMs !== mtimeMs) {
    cachedMtimeMs = mtimeMs;
    cache = load();
  }
  return cache;
}

export function loadRestaurants(): Restaurant[] {
  return ensureLoaded().restaurants;
}

export function loadDataUpdatedAt(): string {
  return ensureLoaded().updatedAt;
}
