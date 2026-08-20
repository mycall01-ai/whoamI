"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";

import { downloadSourceCsv } from "@/lib/download-source-csv.server";

const CSV_PATH = path.join(process.cwd(), "data", "모범음식점정보.csv");

export async function refreshRestaurantData(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    const buffer = await downloadSourceCsv();
    fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
    fs.writeFileSync(CSV_PATH, buffer);
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
