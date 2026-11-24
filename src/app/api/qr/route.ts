import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

/**
 * Renders arbitrary short text (in practice, an interaction link) as a QR PNG.
 *
 * Deliberately a display-only endpoint: the phone's own camera app opens the
 * link, so Umbral needs no camera permission, no scanning library and no
 * native app. Bounded input, no fetching, no redirects.
 */
export async function GET(request: Request) {
  const data = new URL(request.url).searchParams.get("data") ?? "";

  if (!data || data.length > 512) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const png = await QRCode.toBuffer(data, {
      type: "png",
      width: 640,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#08080bff", light: "#ffffffff" },
    });

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        // The payload is in the URL, so the response is immutable for a given URL.
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "encode_failed" }, { status: 400 });
  }
}
