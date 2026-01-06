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

    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Download the file from storage
    const { data, error } = await supabase.storage.from("audio-snippets").download(fileName);

    if (error) {
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
      return NextResponse.json({ error: "Audio file not found", fileName }, { status: 404 });
    }

    // Convert blob to array buffer to ensure proper serving
    const arrayBuffer = await data.arrayBuffer();
    const blobSize = arrayBuffer.byteLength;

    // Determine content type from file extension
    const getContentType = (fileName: string): string => {
      if (fileName.endsWith(".webm")) return "audio/webm";
      if (fileName.endsWith(".ogg")) return "audio/ogg";
      return "audio/webm"; // default
    };

    const contentType = getContentType(fileName);

    // Create a new Response with the array buffer
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": blobSize.toString(),
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
