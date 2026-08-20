// 행정안전부 전국모범음식점표준데이터 CSV 실제 헤더 기준.
// 시도/시군구는 원본에 컬럼이 없어 도로명주소(없으면 소재지주소) 앞부분으로 추정한다.
export type Restaurant = {
  id: string;
  sido: string;
  sigungu: string;
  name: string;
  roadAddress: string;
  lotAddress: string;
  phone: string;
  cuisineCategory: string;
  foodType: string;
  designatedDate: string;
};

export const ALL_SIDO = "전체";
export const ALL_SIGUNGU = "전체";

export function deriveRegion(address: string): { sido: string; sigungu: string } {
  const parts = address.trim().split(/\s+/).filter(Boolean);
  const sido = parts[0] ?? "";
  // 세종특별자치시는 시군구 단위가 없어 두 번째 토큰이 읍/면/동이다.
  const sigungu = sido.startsWith("세종") ? "" : parts[1] ?? "";
  return { sido, sigungu };
}

// 도로명주소에서 층/동 같은 상세정보를 떼고 번지수까지만 남긴다.
// "서울특별시 종로구 종로1길 57, 2층 (중학동)" -> "서울특별시 종로구 종로1길 57"
export function toBaseAddress(address: string): string {
  const beforeDetail = address.split(",")[0];
  return beforeDetail.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

// "." / 숫자만 / "5000원)"처럼 파싱 후에도 남는 가격·기호 조각은 음식 종류가 아니다.
function isValidFoodType(type: string): boolean {
  if (!type) return false;
  if (/^[.\-\s]+$/.test(type)) return false;
  if (/^\d+$/.test(type)) return false;
  if (/^\(?[\d,]+\s*원\)?$/.test(type)) return false;
  if (type.length <= 2 && !/[가-힣]/.test(type)) return false;
  return true;
}

// 주된음식종류 필드는 "전복죽,해물뚝배기"처럼 콤마로 여러 값을 담는 행이 있다.
// 단, "낙지볶음(4,500원)"처럼 괄호 안 콤마는 가격 표기라 값 구분자가 아니므로 괄호 밖 콤마만 나눈다.
export function splitFoodTypes(foodType: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let current = "";

  for (const ch of foodType) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);

    if (ch === "," && depth === 0) {
      tokens.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  tokens.push(current);

  return tokens.map((s) => s.trim()).filter(isValidFoodType);
}

export function getSidoList(restaurants: Restaurant[]): string[] {
  return Array.from(new Set(restaurants.map((r) => r.sido).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, "ko")
  );
}

// 시도를 먼저 고르지 않으면(전체) 시군구는 의미가 없으므로 빈 목록을 준다.
export function getSigunguList(restaurants: Restaurant[], sido: string): string[] {
  if (!sido || sido === ALL_SIDO) return [];
  const inSido = restaurants.filter((r) => r.sido === sido);
  return Array.from(new Set(inSido.map((r) => r.sigungu).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, "ko")
  );
}

export function getFoodTypes(restaurants: Restaurant[]): string[] {
  const types = restaurants.flatMap((r) => splitFoodTypes(r.foodType));
  return Array.from(new Set(types)).sort((a, b) => a.localeCompare(b, "ko"));
}

export function filterRestaurants(
  restaurants: Restaurant[],
  filters: { sido?: string; sigungu?: string; foodType?: string | null }
): Restaurant[] {
  return restaurants.filter((r) => {
    const sidoMatch =
      !filters.sido || filters.sido === ALL_SIDO || r.sido === filters.sido;
    const sigunguMatch =
      !filters.sigungu ||
      filters.sigungu === ALL_SIGUNGU ||
      r.sigungu === filters.sigungu;
    const foodTypeMatch =
      !filters.foodType || splitFoodTypes(r.foodType).includes(filters.foodType);
    return sidoMatch && sigunguMatch && foodTypeMatch;
  });
}
