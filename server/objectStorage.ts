import { AwsClient } from "aws4fetch";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable, PassThrough } from "stream";

function getR2BucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME not set");
  return bucket;
}

function getR2BaseUrl(): string {
  const accountId = process.env.R2_ACCOUNT_ID;
  if (!accountId) throw new Error("R2_ACCOUNT_ID not set");
  return `https://${accountId}.r2.cloudflarestorage.com/${getR2BucketName()}`;
}

let _aws: AwsClient | null = null;
function r2(): AwsClient {
  if (!_aws) {
    _aws = new AwsClient({
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      service: "s3",
      region: "auto",
    });
  }
  return _aws;
}

export class R2File {
  private key: string;

  constructor(_ignoredBucket: string, key: string) {
    this.key = key;
  }

  private url(): string {
    return `${getR2BaseUrl()}/${this.key}`;
  }

  async save(
    buffer: Buffer,
    options?: {
      contentType?: string;
      metadata?: { contentType?: string; [key: string]: string | undefined };
    }
  ): Promise<void> {
    const contentType =
      options?.contentType ||
      options?.metadata?.contentType ||
      "application/octet-stream";

    const res = await r2().fetch(this.url(), {
      method: "PUT",
      body: buffer,
      headers: { "Content-Type": contentType },
    });
    if (!res.ok) {
      throw new Error(`R2 upload failed: ${res.status} ${await res.text()}`);
    }
  }

  async exists(): Promise<[boolean]> {
    const res = await r2().fetch(this.url(), { method: "HEAD" });
    if (res.status === 404 || res.status === 403) return [false];
    if (res.ok) return [true];
    // consume body to avoid leak
    await res.text().catch(() => {});
    return [false];
  }

  async download(): Promise<[Buffer]> {
    const res = await r2().fetch(this.url());
    if (!res.ok) throw new Error(`R2 download failed: ${res.status}`);
    const ab = await res.arrayBuffer();
    return [Buffer.from(ab)];
  }

  async delete(): Promise<void> {
    const res = await r2().fetch(this.url(), { method: "DELETE" });
    if (!res.ok && res.status !== 404) {
      throw new Error(`R2 delete failed: ${res.status}`);
    }
  }

  async getMetadata(): Promise<[{ contentType?: string; size?: number }]> {
    const res = await r2().fetch(this.url(), { method: "HEAD" });
    if (!res.ok) throw new Error(`R2 HEAD failed: ${res.status}`);
    return [
      {
        contentType: res.headers.get("content-type") || undefined,
        size: Number(res.headers.get("content-length")) || undefined,
      },
    ];
  }

  createReadStream(): Readable {
    const passThrough = new PassThrough();
    r2()
      .fetch(this.url())
      .then((res) => {
        if (!res.ok || !res.body) {
          passThrough.destroy(new Error(`R2 stream failed: ${res.status}`));
          return;
        }
        Readable.fromWeb(res.body as any).pipe(passThrough);
      })
      .catch((err) => passThrough.destroy(err));
    return passThrough;
  }

  getBucketName(): string {
    return getR2BucketName();
  }
  getKey(): string {
    return this.key;
  }
}

class R2Bucket {
  private bucketName: string;
  constructor(bucketName: string) {
    this.bucketName = bucketName;
  }
  file(key: string): R2File {
    return new R2File(this.bucketName, key);
  }
}

export const objectStorageClient = {
  bucket(_name: string): R2Bucket {
    return new R2Bucket(_name);
  },
};

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  getPrivateObjectDir(): string {
    return `/${getR2BucketName()}`;
  }

  getPublicObjectSearchPaths(): Array<string> {
    return [`/${getR2BucketName()}`];
  }

  async searchPublicObject(filePath: string): Promise<R2File | null> {
    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const fullPath = `${searchPath}/${filePath}`;
      const { bucketName, objectName } = parseObjectPath(fullPath);
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      const [exists] = await file.exists();
      if (exists) return file;
    }
    return null;
  }

  async downloadObject(file: R2File, res: Response, cacheTtlSec: number = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });
      const stream = file.createReadStream();
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const privateObjectDir = this.getPrivateObjectDir();
    const objectId = randomUUID();
    const fullPath = `${privateObjectDir}/uploads/${objectId}`;
    const { bucketName, objectName } = parseObjectPath(fullPath);
    return signObjectURL({ bucketName, objectName, method: "PUT", ttlSec: 900 });
  }

  async getObjectEntityFile(objectPath: string): Promise<R2File> {
    if (!objectPath.startsWith("/objects/")) throw new ObjectNotFoundError();
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) throw new ObjectNotFoundError();
    const entityId = parts.slice(1).join("/");
    let entityDir = this.getPrivateObjectDir();
    if (!entityDir.endsWith("/")) entityDir = `${entityDir}/`;
    const objectEntityPath = `${entityDir}${entityId}`;
    const { bucketName, objectName } = parseObjectPath(objectEntityPath);
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();
    return file;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (rawPath.startsWith("https://")) return rawPath;
    return rawPath;
  }

  async trySetObjectEntityAclPolicy(rawPath: string, _aclPolicy: any): Promise<string> {
    return rawPath;
  }

  async canAccessObjectEntity(_opts: {
    userId?: string;
    objectFile: R2File;
    requestedPermission?: any;
  }): Promise<boolean> {
    return true;
  }
}

export function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  if (!path.startsWith("/")) path = `/${path}`;
  const pathParts = path.split("/").filter(Boolean);
  if (pathParts.length < 2) {
    throw new Error("Invalid path: must contain at least bucket name and object name");
  }
  return {
    bucketName: pathParts[0],
    objectName: pathParts.slice(1).join("/"),
  };
}

export async function signObjectURL({
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const url = new URL(`${getR2BaseUrl()}/${objectName}`);
  url.searchParams.set("X-Amz-Expires", String(ttlSec));
  const signed = await r2().sign(
    new Request(url.toString(), { method }),
    { aws: { signQuery: true } }
  );
  return signed.url;
}
