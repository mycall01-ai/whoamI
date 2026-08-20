// data.go.kr는 실제 파일을 localdata.go.kr에서 서빙한다. 그 사이트는 브라우저에서
// 정보 페이지 방문 -> 다운로드 횟수 검증 -> 다운로드 순으로만 파일을 내려준다
// (직접 다운로드 URL만 호출하면 세션이 없어 /error.html로 튕긴다).
const REFERER = "https://www.data.go.kr/data/15096282/standard.do";
const INFO_URL = "https://file.localdata.go.kr/file/excellent_restaurant_info/info";
const VALIDATE_URL = "https://file.localdata.go.kr/file/validate/download-count";
const DOWNLOAD_URL = "https://file.localdata.go.kr/file/download/excellent_restaurant_info/info";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function readCookies(response: Response, jar: Map<string, string>) {
  const setCookies = response.headers.getSetCookie?.() ?? [];
  for (const line of setCookies) {
    const [pair] = line.split(";");
    const separator = pair.indexOf("=");
    if (separator === -1) continue;
    jar.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
  }
}

function cookieHeader(jar: Map<string, string>) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

export async function downloadSourceCsv(): Promise<Buffer> {
  const jar = new Map<string, string>();

  const infoRes = await fetch(INFO_URL, {
    headers: { "User-Agent": USER_AGENT, Referer: REFERER },
  });
  readCookies(infoRes, jar);
  if (!infoRes.ok) {
    throw new Error(`정보 페이지 요청 실패: ${infoRes.status}`);
  }

  const validateRes = await fetch(VALIDATE_URL, {
    headers: {
      "User-Agent": USER_AGENT,
      Referer: INFO_URL,
      Cookie: cookieHeader(jar),
    },
  });
  readCookies(validateRes, jar);
  if (validateRes.status === 429) {
    throw new Error("다운로드 횟수 제한에 걸렸습니다. 잠시 후 다시 시도하세요.");
  }
  if (!validateRes.ok) {
    throw new Error(`다운로드 검증 실패: ${validateRes.status}`);
  }

  const downloadRes = await fetch(DOWNLOAD_URL, {
    headers: {
      "User-Agent": USER_AGENT,
      Referer: INFO_URL,
      Cookie: cookieHeader(jar),
    },
  });
  if (!downloadRes.ok) {
    throw new Error(`파일 다운로드 실패: ${downloadRes.status}`);
  }

  return Buffer.from(await downloadRes.arrayBuffer());
}
