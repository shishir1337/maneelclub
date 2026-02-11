import * as Minio from "minio";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import ImageKit from "@imagekit/nodejs";

export interface StorageService {
  upload(file: Buffer, key: string, contentType: string): Promise<string>;
  getPublicUrl(key: string): string;
}

function isImageKitConfigured(): boolean {
  return !!process.env.IMAGEKIT_PRIVATE_KEY;
}

function createImageKitClient(): ImageKit {
  return new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  });
}

function isMinIOConfigured(): boolean {
  return !!(
    process.env.MINIO_ENDPOINT &&
    process.env.MINIO_ACCESS_KEY &&
    process.env.MINIO_SECRET_KEY
  );
}

class MinIOStorage implements StorageService {
  private client: Minio.Client;
  private bucket: string;
  private endpoint: string;
  private useSSL: boolean;

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT!;
    const port = parseInt(process.env.MINIO_PORT || "9000", 10);
    const useSSL = process.env.MINIO_USE_SSL === "true";
    this.bucket = process.env.MINIO_BUCKET || "uploads";
    this.useSSL = useSSL;
    this.endpoint = `${useSSL ? "https" : "http"}://${endpoint}${port !== (useSSL ? 443 : 80) ? `:${port}` : ""}`;

    this.client = new Minio.Client({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey: process.env.MINIO_ACCESS_KEY!,
      secretKey: process.env.MINIO_SECRET_KEY!,
    });
  }

  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, "us-east-1");
    }

    await this.client.putObject(this.bucket, key, file, file.length, {
      "Content-Type": contentType,
    });

    return this.getPublicUrl(key);
  }

  getPublicUrl(key: string): string {
    const endpoint = process.env.MINIO_ENDPOINT!;
    const port = parseInt(process.env.MINIO_PORT || "9000", 10);
    const useSSL = process.env.MINIO_USE_SSL === "true";
    const protocol = useSSL ? "https" : "http";
    const portPart = (useSSL && port !== 443) || (!useSSL && port !== 80) ? `:${port}` : "";
    return `${protocol}://${endpoint}${portPart}/${this.bucket}/${key}`;
  }
}

class ImageKitStorage implements StorageService {
  private client: ImageKit;
  private baseFolder: string;

  constructor() {
    this.client = createImageKitClient();
    this.baseFolder = process.env.IMAGEKIT_UPLOAD_FOLDER || "maneelclub";
  }

  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    // Determine folder based on key pattern or default to 'general'
    // Key format: {timestamp}-{random}.{ext}
    // We can infer folder from context, but for now use a general approach
    // The upload API route can pass folder context if needed
    const folder = this.baseFolder;

    try {
      // Convert buffer to base64 string for ImageKit SDK
      // ImageKit accepts base64 string or file stream
      const fileBase64 = file.toString("base64");
      
      // Optional: Apply pre-transformation during upload to compress images
      // This compresses images at upload time instead of on-the-fly
      // Quality: 80 is a good balance between file size and visual quality
      // You can adjust this via environment variable IMAGEKIT_UPLOAD_QUALITY (default: 80)
      const uploadQuality = process.env.IMAGEKIT_UPLOAD_QUALITY 
        ? parseInt(process.env.IMAGEKIT_UPLOAD_QUALITY, 10) 
        : 80;
      
      const uploadParams: any = {
        file: fileBase64,
        fileName: key,
        folder: folder,
        useUniqueFileName: true,
      };

      // Only apply pre-transformation for images (not other file types)
      if (contentType.startsWith("image/")) {
        // Pre-transformation: compress image during upload
        // This reduces storage size but the original is still accessible via URL transformations
        uploadParams.transformation = JSON.stringify({
          pre: `q-${uploadQuality}`, // Quality compression (1-100, lower = smaller file)
        });
      }
      
      const result = await this.client.files.upload(uploadParams);

      // Type assertion needed as TypeScript may not infer the response type correctly
      const uploadResult = result as { url?: string };
      if (!uploadResult.url) {
        throw new Error("ImageKit upload succeeded but no URL returned");
      }

      return uploadResult.url;
    } catch (error) {
      console.error("ImageKit upload error:", error);
      throw new Error(`ImageKit upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  getPublicUrl(key: string): string {
    // For ImageKit, we typically return transformation URLs
    // But for now, return the base URL endpoint + key
    // In practice, uploaded files will have full URLs from upload response
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT!;
    const baseFolder = this.baseFolder;
    return `${urlEndpoint}/${baseFolder}/${key}`;
  }
}

class LocalStorage implements StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
  }

  async upload(file: Buffer, key: string, contentType: string): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, file);
    return this.getPublicUrl(key);
  }

  getPublicUrl(key: string): string {
    return `/uploads/${key.replace(/\\/g, "/")}`;
  }
}

let cachedStorage: StorageService | null = null;

export function createStorageClient(): StorageService {
  if (cachedStorage) {
    return cachedStorage;
  }
  
  // Priority: ImageKit > MinIO > Local
  if (isImageKitConfigured()) {
    cachedStorage = new ImageKitStorage();
  } else if (isMinIOConfigured()) {
    cachedStorage = new MinIOStorage();
  } else {
    cachedStorage = new LocalStorage();
  }
  
  return cachedStorage;
}
