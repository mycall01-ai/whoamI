import { describe, expect, it } from "vitest";

import {
  ALL_SIDO,
  deriveRegion,
  filterRestaurants,
  getFoodTypes,
  getSidoList,
  splitFoodTypes,
  toBaseAddress,
  type Restaurant,
} from "@/lib/restaurants";

const fixture: Restaurant[] = [
  {
    id: "1",
    sido: "서울특별시",
    sigungu: "종로구",
    name: "명동칼국수",
    roadAddress: "서울특별시 종로구 종로1길 57",
    lotAddress: "",
    phone: "027232780",
    cuisineCategory: "한식",
    foodType: "칼국수",
    designatedDate: "2010-11-22",
  },
  {
    id: "2",
    sido: "제주특별자치도",
    sigungu: "제주시",
    name: "제주감자탕본점직영점",
    roadAddress: "제주특별자치도 제주시 연동7길 26",
    lotAddress: "",
    phone: "",
    cuisineCategory: "",
    foodType: "전복죽,해물뚝배기",
    designatedDate: "2002-03-26",
  },
];

describe("deriveRegion", () => {
  it("도로명주소 앞 두 토큰을 시도/시군구로 뽑아낸다", () => {
    expect(deriveRegion("서울특별시 종로구 종로1길 57")).toEqual({
      sido: "서울특별시",
      sigungu: "종로구",
    });
  });

  it("세종특별자치시는 시군구 단위가 없어 빈 문자열로 둔다", () => {
    expect(deriveRegion("세종특별자치시 장군면 장기로 854-24")).toEqual({
      sido: "세종특별자치시",
      sigungu: "",
    });
  });
});

describe("splitFoodTypes", () => {
  it("콤마로 여러 값이 들어간 필드를 개별 항목으로 나눈다", () => {
    expect(splitFoodTypes("전복죽,해물뚝배기")).toEqual(["전복죽", "해물뚝배기"]);
  });

  it("괄호 안 콤마는 가격 표기라 값 구분자로 보지 않는다", () => {
    expect(splitFoodTypes("낙지볶음(4,500원)")).toEqual(["낙지볶음(4,500원)"]);
  });

  it("점/숫자/가격 조각처럼 음식 종류가 아닌 값은 걸러낸다", () => {
    expect(splitFoodTypes("냉면,..,11,5000원)")).toEqual(["냉면"]);
  });
});

describe("filterRestaurants", () => {
  it("음식 종류가 여러 개인 항목도 그 중 하나만 골라도 매칭된다", () => {
    const result = filterRestaurants(fixture, {
      sido: ALL_SIDO,
      foodType: "해물뚝배기",
    });

    expect(result).toEqual([fixture[1]]);
  });

  it("지역과 음식 종류를 동시에 만족하는 항목만 남긴다", () => {
    const result = filterRestaurants(fixture, {
      sido: "서울특별시",
      foodType: "칼국수",
    });

    expect(result).toEqual([fixture[0]]);
  });

  it("조건에 맞는 데이터가 없으면 빈 배열을 반환한다", () => {
    const result = filterRestaurants(fixture, {
      sido: "서울특별시",
      foodType: "해물뚝배기",
    });

    expect(result).toEqual([]);
  });
});

describe("getFoodTypes", () => {
  it("콤마로 묶인 값도 풀어서 중복 없이 가나다순으로 만든다", () => {
    expect(getFoodTypes(fixture)).toEqual(["전복죽", "칼국수", "해물뚝배기"]);
  });
});

describe("toBaseAddress", () => {
  it("콤마 뒤 상세정보를 떼고 번지수까지만 남긴다", () => {
    expect(toBaseAddress("서울특별시 종로구 종로1길 57, 2층 (중학동)")).toBe(
      "서울특별시 종로구 종로1길 57"
    );
  });

  it("콤마 없이 동 이름만 괄호로 붙은 경우도 떼어낸다", () => {
    expect(toBaseAddress("서울특별시 종로구 대학로 53 (연건동)")).toBe(
      "서울특별시 종로구 대학로 53"
    );
  });

  it("상세정보가 없으면 그대로 둔다", () => {
    expect(toBaseAddress("서울특별시 종로구 대학로 53")).toBe(
      "서울특별시 종로구 대학로 53"
    );
  });
});

describe("getSidoList", () => {
  it("중복 없이 가나다순으로 정렬된 시도 목록을 만든다", () => {
    expect(getSidoList(fixture)).toEqual(["서울특별시", "제주특별자치도"]);
  });
});
