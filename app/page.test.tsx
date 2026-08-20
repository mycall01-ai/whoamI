import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import Home from "@/app/page";
import { loadRestaurants } from "@/lib/restaurants.server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

test("홈 화면은 제목과 지역/음식종류 필터, 실제 데이터 건수를 보여준다", () => {
  render(<Home />);

  const total = loadRestaurants().length;

  expect(
    screen.getByRole("heading", { level: 1, name: "믿고 먹을 수 있는 음식점" })
  ).toBeInTheDocument();
  const regionSelects = screen.getAllByRole("combobox");
  expect(regionSelects).toHaveLength(2);
  expect(regionSelects[0]).toHaveTextContent("전체");
  expect(regionSelects[1]).toHaveTextContent("전체");
  expect(screen.getByText("음식 종류 검색")).toBeInTheDocument();
  expect(screen.getByTestId("result-count")).toHaveTextContent(
    `총 ${total}건`
  );
  expect(
    screen.getByRole("button", { name: /데이터 새로고침/ })
  ).toBeInTheDocument();
  expect(screen.getByText(/최신 데이터 갱신시점:/)).toBeInTheDocument();
});
