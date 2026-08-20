import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import Home from "@/app/page";
import { loadRestaurants } from "@/lib/restaurants.server";
import { filterRestaurants, getFoodTypes } from "@/lib/restaurants";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

test("홈 화면은 제목과 지역/음식종류 필터, 실제 데이터 건수를 보여준다", () => {
  render(<Home />);

  const total = loadRestaurants().length;

  expect(
    screen.getByRole("heading", { level: 1, name: /믿고 먹을 수 있는 음식점/ })
  ).toBeInTheDocument();
  const regionSelects = screen.getAllByRole("combobox");
  expect(regionSelects).toHaveLength(2);
  expect(regionSelects[0]).toHaveTextContent("전체");
  expect(regionSelects[1]).toHaveTextContent("전체");
  expect(screen.getByPlaceholderText(/음식 종류 검색/)).toBeInTheDocument();
  expect(screen.getByTestId("result-count")).toHaveTextContent(
    `총 ${total}건`
  );
  expect(
    screen.getByRole("button", { name: /데이터 새로고침/ })
  ).toBeInTheDocument();
  expect(screen.getByText(/최신 데이터 갱신시점:/)).toBeInTheDocument();
});

test("음식종류를 입력하고 엔터를 치면 포함하는 음식점만 걸러진다", () => {
  render(<Home />);

  const total = loadRestaurants().length;
  const input = screen.getByPlaceholderText(/음식 종류 검색/);

  fireEvent.change(input, { target: { value: "만두" } });
  expect(screen.getByTestId("result-count")).toHaveTextContent(`총 ${total}건`);

  fireEvent.keyDown(input, { key: "Enter" });

  const filteredText = screen.getByTestId("result-count").textContent ?? "";
  const filteredCount = Number(filteredText.match(/\d+/)?.[0]);
  expect(filteredCount).toBeGreaterThan(0);
  expect(filteredCount).toBeLessThan(total);
  expect(
    screen.getByRole("button", { name: "음식종류 필터 초기화" })
  ).toBeInTheDocument();
});

test("자동완성 목록에서 클릭하면 그 음식종류만 정확히 필터링된다", () => {
  render(<Home />);

  const input = screen.getByPlaceholderText(/음식 종류 검색/);
  fireEvent.change(input, { target: { value: "만두" } });

  const restaurants = loadRestaurants();
  const compoundType = getFoodTypes(restaurants).find(
    (t) => t.includes("만두") && t !== "만두"
  );
  expect(compoundType).toBeDefined();

  fireEvent.click(screen.getByRole("button", { name: compoundType! }));

  expect(input).toHaveValue(compoundType);
  const expectedCount = filterRestaurants(restaurants, {
    foodType: compoundType,
  }).length;
  expect(screen.getByTestId("result-count")).toHaveTextContent(
    `총 ${expectedCount}건`
  );
});
