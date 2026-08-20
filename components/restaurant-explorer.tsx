"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, MapPin, Phone, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ALL_SIDO,
  ALL_SIGUNGU,
  filterRestaurants,
  getFoodTypes,
  getSidoList,
  getSigunguList,
  toBaseAddress,
  type Restaurant,
} from "@/lib/restaurants";
import { refreshRestaurantData } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const DISPLAY_LIMIT = 200;

function naverMapSearchUrl(query: string) {
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

export function RestaurantExplorer({
  restaurants,
  updatedAt,
}: {
  restaurants: Restaurant[];
  updatedAt: string;
}) {
  const router = useRouter();
  const [sido, setSido] = React.useState<string>(ALL_SIDO);
  const [sigungu, setSigungu] = React.useState<string>(ALL_SIGUNGU);
  const [foodType, setFoodType] = React.useState<string | null>(null);
  const [foodTypeOpen, setFoodTypeOpen] = React.useState(false);
  const [isRefreshing, startRefresh] = React.useTransition();
  const [refreshError, setRefreshError] = React.useState<string | null>(null);

  function handleRefresh() {
    setRefreshError(null);
    startRefresh(async () => {
      const result = await refreshRestaurantData();
      if (!result.ok) {
        setRefreshError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const sidoList = React.useMemo(() => getSidoList(restaurants), [restaurants]);
  const sigunguList = React.useMemo(
    () => getSigunguList(restaurants, sido),
    [restaurants, sido]
  );
  const foodTypes = React.useMemo(() => getFoodTypes(restaurants), [restaurants]);

  const results = React.useMemo(
    () => filterRestaurants(restaurants, { sido, sigungu, foodType }),
    [restaurants, sido, sigungu, foodType]
  );
  const visibleResults = results.slice(0, DISPLAY_LIMIT);

  const hasActiveFilter =
    sido !== ALL_SIDO || sigungu !== ALL_SIGUNGU || foodType !== null;

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          믿고 먹을 수 있는 음식점
        </h1>
        <p className="text-sm text-muted-foreground">
          행정안전부 전국모범음식점표준데이터 기준. 폐업한 곳은 제외하고 영업 중인
          곳만 보여줍니다.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            데이터 새로고침
          </Button>
          <span className="text-xs text-muted-foreground">
            {updatedAt ? `최신 데이터 갱신시점: ${updatedAt}` : "데이터 갱신시점 정보 없음"}
          </span>
        </div>
        {refreshError && (
          <p className="text-xs text-destructive">새로고침 실패: {refreshError}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={sido}
          onValueChange={(value) => {
            setSido(value ?? ALL_SIDO);
            setSigungu(ALL_SIGUNGU);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="지역 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SIDO}>{ALL_SIDO}</SelectItem>
            {sidoList.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sigungu}
          onValueChange={(value) => setSigungu(value ?? ALL_SIGUNGU)}
          disabled={sigunguList.length === 0}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="시/군/구" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SIGUNGU}>{ALL_SIGUNGU}</SelectItem>
            {sigunguList.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={foodTypeOpen} onOpenChange={setFoodTypeOpen}>
          <PopoverTrigger
            render={
              <Button variant="outline" className="w-56 justify-between font-normal">
                <span className={cn(!foodType && "text-muted-foreground")}>
                  {foodType ?? "음식 종류 검색"}
                </span>
                <ChevronsUpDown className="size-4 opacity-50" />
              </Button>
            }
          />
          <PopoverContent className="w-56 p-0">
            <Command>
              <CommandInput placeholder="음식 종류 검색..." />
              <CommandList>
                <CommandEmpty>일치하는 음식 종류가 없어요.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setFoodType(null);
                      setFoodTypeOpen(false);
                    }}
                  >
                    <Check className={cn(foodType ? "opacity-0" : "opacity-100")} />
                    전체
                  </CommandItem>
                  {foodTypes.map((type) => (
                    <CommandItem
                      key={type}
                      onSelect={() => {
                        setFoodType(type);
                        setFoodTypeOpen(false);
                      }}
                    >
                      <Check
                        className={cn(foodType === type ? "opacity-100" : "opacity-0")}
                      />
                      {type}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {hasActiveFilter && (
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => {
              setSido(ALL_SIDO);
              setSigungu(ALL_SIGUNGU);
              setFoodType(null);
            }}
          >
            필터 초기화
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground" data-testid="result-count">
        총 {results.length}건
        {results.length > DISPLAY_LIMIT &&
          ` 중 ${DISPLAY_LIMIT}건 표시 — 필터로 좁혀보세요`}
      </p>

      <ul className="flex flex-col gap-3">
        {visibleResults.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-1 rounded-lg border border-border p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{r.name}</span>
              {r.cuisineCategory && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                  {r.cuisineCategory}
                </span>
              )}
            </div>
            {r.foodType && (
              <span className="text-sm text-muted-foreground">{r.foodType}</span>
            )}
            <a
              href={naverMapSearchUrl(
                `${r.name}, ${toBaseAddress(r.roadAddress || r.lotAddress)}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              <MapPin className="size-3.5" />
              {r.roadAddress || r.lotAddress}
            </a>
            {r.phone && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="size-3.5" />
                {r.phone}
              </div>
            )}
          </li>
        ))}

        {results.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            조건에 맞는 모범음식점이 없어요.
          </li>
        )}
      </ul>
    </div>
  );
}
