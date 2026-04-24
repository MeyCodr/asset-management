import { NextRequest, NextResponse } from "next/server";

function getCatAbbrev(categoryName: string): string {
  const words = categoryName.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).padEnd(3, "X");
  return words.map((w) => w.slice(0, Math.min(4, Math.ceil(w.length / 2)))).join("");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryName = searchParams.get("categoryName") ?? "";
  const name = searchParams.get("name") ?? "";

  const catPart = getCatAbbrev(categoryName);
  const namePart = name.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const tag = `IT-${catPart}-${namePart}`;

  return NextResponse.json({ tag });
}
