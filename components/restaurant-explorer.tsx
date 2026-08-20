"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Phone, RefreshCw, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  ALL_SIDO,
  ALL_SIGUNGU,
  filterRestaurants,
  getFoodTypes,
  getSidoList,
  getSigunguList,
  isDataStale,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

const DISPLAY_LIMIT = 200;
const SUGGESTION_LIMIT = 20;

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
  const [foodTypeQuery, setFoodTypeQuery] = React.useState<string>("");
  const [foodTypeDraft, setFoodTypeDraft] = React.useState<string>("");
  const [suggestionsOpen, setSuggestionsOpen] = React.useState(false);
  const foodTypeBoxRef = React.useRef<HTMLDivElement>(null);
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

  const foodTypeSuggestions = React.useMemo(() => {
    const query = foodTypeDraft.trim().toLowerCase();
    if (!query) return [];
    return foodTypes
      .filter((type) => type.toLowerCase().includes(query))
      .slice(0, SUGGESTION_LIMIT);
  }, [foodTypes, foodTypeDraft]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!foodTypeBoxRef.current?.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = React.useMemo(
    () => filterRestaurants(restaurants, { sido, sigungu, foodType: foodTypeQuery }),
    [restaurants, sido, sigungu, foodTypeQuery]
  );
  const visibleResults = results.slice(0, DISPLAY_LIMIT);

  const hasRegionFilter = sido !== ALL_SIDO || sigungu !== ALL_SIGUNGU;
  const hasFoodTypeFilter = foodTypeQuery !== "";
  const canRefresh = isDataStale(updatedAt, new Date());

  function submitFoodTypeSearch() {
    setFoodTypeQuery(foodTypeDraft.trim());
    setSuggestionsOpen(false);
  }

  function selectFoodTypeSuggestion(type: string) {
    setFoodTypeDraft(type);
    setFoodTypeQuery(type);
    setSuggestionsOpen(false);
  }

  function resetFoodTypeFilter() {
    setFoodTypeDraft("");
    setFoodTypeQuery("");
    setSuggestionsOpen(false);
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          믿고 먹을 수 있는 음식점 찾니? 정부에서 인증한 곳으로 안내해줄게....
        </h1>
        <p className="text-sm text-muted-foreground">
          행정안전부 전국모범음식점표준데이터 기준. 폐업한 곳은 제외하고 영업 중인
          곳만 보여줍니다.
        </p>
        <div className="flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={handleRefresh}
            disabled={isRefreshing || !canRefresh}
            title={
              canRefresh
                ? undefined
                : "2일마다 갱신되는 데이터라 현재 데이터가 최신이에요"
            }
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin")} />
            데이터 새로고침
          </Button>
          <p className="text-xs text-muted-foreground">
            {!updatedAt
              ? "데이터 갱신시점 정보 없음"
              : canRefresh
                ? `최신 데이터 갱신시점: ${updatedAt}`
                : `이미 최신 데이터예요 (최신 데이터 갱신시점: ${updatedAt})`}
          </p>
        </div>
        {refreshError && (
          <p className="text-xs text-destructive">새로고침 실패: {refreshError}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">오늘은 어디서 먹고 싶니?</p>
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

          {hasRegionFilter && (
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                setSido(ALL_SIDO);
                setSigungu(ALL_SIGUNGU);
              }}
            >
              지역 필터 초기화
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64" ref={foodTypeBoxRef}>
          <InputGroup>
            <InputGroupInput
              placeholder="음식 종류 검색 (예: 만두) 후 Enter"
              value={foodTypeDraft}
              onChange={(e) => {
                const value = e.target.value;
                setFoodTypeDraft(value);
                setSuggestionsOpen(value.trim() !== "");
              }}
              onFocus={() => {
                if (foodTypeDraft.trim()) setSuggestionsOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitFoodTypeSearch();
                if (e.key === "Escape") setSuggestionsOpen(false);
              }}
            />
            <InputGroupAddon>
              <Search className="size-4 opacity-50" />
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={submitFoodTypeSearch}>검색</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          {suggestionsOpen && foodTypeSuggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md">
              {foodTypeSuggestions.map((type) => (
                <li key={type}>
                  <button
                    type="button"
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => selectFoodTypeSuggestion(type)}
                  >
                    {type}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hasFoodTypeFilter && (
          <Button
            variant="ghost"
            className="text-muted-foreground"
            onClick={resetFoodTypeFilter}
          >
            음식종류 필터 초기화
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
