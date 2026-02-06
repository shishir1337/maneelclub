import * as Minio from "minio";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export interface StorageService {
  upload(file: Buffer, key: string, contentType: string): Promise<string>;
  getPublicUrl(key: string): string;
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
  cachedStorage = isMinIOConfigured() ? new MinIOStorage() : new LocalStorage();
  return cachedStorage;
}
