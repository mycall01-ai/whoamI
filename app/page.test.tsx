import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";
import { loadRestaurants } from "@/lib/restaurants.server";

test("홈 화면은 제목과 지역/음식종류 필터, 실제 데이터 건수를 보여준다", () => {
  render(<Home />);

  const total = loadRestaurants().length;

  expect(
    screen.getByRole("heading", { level: 1, name: "모범음식점 탐색" })
  ).toBeInTheDocument();
  expect(screen.getByRole("combobox")).toHaveTextContent("전체");
  expect(screen.getByText("음식 종류 검색")).toBeInTheDocument();
  expect(screen.getByTestId("result-count")).toHaveTextContent(
    `총 ${total}건`
  );
});
