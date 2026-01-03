import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string[] }> }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    // Await params (Next.js 15+ requires params to be awaited)
    const resolvedParams = await params;

    // Join the path segments to reconstruct the full file path (e.g., "friendId/timestamp-randomId.webm")
    const fileName = resolvedParams.fileName.join("/");

    if (!fileName) {
      return NextResponse.json({ error: "File name required" }, { status: 400 });
    }

    console.warn(`[Audio API] Requesting file: ${fileName}`);

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      console.error("[Audio API] Supabase admin client not available");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Download the file from storage
    const { data, error } = await supabase.storage.from("audio-snippets").download(fileName);

    if (error) {
      console.error("[Audio API] Error downloading audio file:", {
        error,
        fileName,
        message: error.message,
      });
      // Check if it's a 404 error by checking the message
      const isNotFound =
        error.message?.toLowerCase().includes("not found") ||
        error.message?.toLowerCase().includes("404");
      return NextResponse.json(
        {
          error: "Failed to retrieve audio file",
          details: error.message,
          fileName,
        },
        { status: isNotFound ? 404 : 500 }
      );
    }

    if (!data) {
      console.error("[Audio API] No data returned for file:", fileName);
      return NextResponse.json({ error: "Audio file not found", fileName }, { status: 404 });
    }

    // Get blob size for Content-Length header
    const blobSize = data.size;
    console.warn(`[Audio API] Successfully serving file: ${fileName} (${blobSize} bytes)`);

    // Use the blob's stream directly to avoid corruption
    // This preserves the original file data without conversion
    const stream = data.stream();

    // Create a new Response with the stream
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "audio/webm",
        "Content-Length": blobSize.toString(),
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("[Audio API] Unexpected error:", {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
