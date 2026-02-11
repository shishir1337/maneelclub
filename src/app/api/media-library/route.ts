import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import ImageKit from "@imagekit/nodejs";

function createImageKitClient(): ImageKit {
  if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error("ImageKit is not configured");
  }
  
  return new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    // Check if ImageKit is configured
    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "ImageKit is not configured" },
        { status: 500 }
      );
    }

    const imagekit = createImageKitClient();
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const folder = searchParams.get("folder") || undefined;

    // Build search parameters for ImageKit
    const listFilesOptions: any = {
      limit: limit.toString(),
      skip: skip.toString(),
      type: "file", // Only return files, not folders
    };

    if (searchQuery) {
      listFilesOptions.searchQuery = searchQuery;
    }

    if (folder) {
      listFilesOptions.path = folder;
    }

    const result = await imagekit.assets.list(listFilesOptions);

    // Transform ImageKit file objects to our format
    const files = result.map((file: any) => ({
      id: file.fileId,
      name: file.name,
      url: file.url,
      thumbnailUrl: file.thumbnail || file.url,
      path: file.filePath,
      size: file.size,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      width: file.width,
      height: file.height,
      type: file.fileType,
    }));

    return NextResponse.json({
      files,
      total: result.length,
      hasMore: result.length === limit, // Simple check - ImageKit doesn't return total count
    });
  } catch (error) {
    console.error("Media library error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch media library" },
      { status: 500 }
    );
  }
}
