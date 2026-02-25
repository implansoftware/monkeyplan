import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";
import { Readable, PassThrough } from "stream";

function getR2BucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME not set. Add R2_BUCKET_NAME to your environment secrets.");
  }
  return bucket;
}

function buildR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
  if (!accountId) {
    throw new Error("R2_ACCOUNT_ID not set. Add R2_ACCOUNT_ID to your environment secrets.");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

let _client: S3Client | null = null;
function r2(): S3Client {
  if (!_client) _client = buildR2Client();
  return _client;
}

export class R2File {
  private bucket: string;
  private key: string;

  constructor(_ignoredBucket: string, key: string) {
    this.bucket = getR2BucketName();
    this.key = key;
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
    await r2().send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.key,
        Body: buffer,
        ContentType: contentType,
      })
    );
  }

  async exists(): Promise<[boolean]> {
    try {
      await r2().send(new HeadObjectCommand({ Bucket: this.bucket, Key: this.key }));
      return [true];
    } catch (err: any) {
      if (
        err.name === "NotFound" ||
        err.$metadata?.httpStatusCode === 404 ||
        err.name === "NoSuchKey"
      ) {
        return [false];
      }
      throw err;
    }
  }

  async download(): Promise<[Buffer]> {
    const response = await r2().send(
      new GetObjectCommand({ Bucket: this.bucket, Key: this.key })
    );
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    return [Buffer.concat(chunks)];
  }

  async delete(): Promise<void> {
    await r2().send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.key }));
  }

  async getMetadata(): Promise<[{ contentType?: string; size?: number }]> {
    const response = await r2().send(
      new HeadObjectCommand({ Bucket: this.bucket, Key: this.key })
    );
    return [{ contentType: response.ContentType, size: response.ContentLength }];
  }

  createReadStream(): Readable {
    const passThrough = new PassThrough();
    r2()
      .send(new GetObjectCommand({ Bucket: this.bucket, Key: this.key }))
      .then((response) => {
        (response.Body as any).pipe(passThrough);
      })
      .catch((err) => passThrough.destroy(err));
    return passThrough;
  }

  getBucketName(): string { return this.bucket; }
  getKey(): string { return this.key; }
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
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) {
      throw new ObjectNotFoundError();
    }
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
    throw new Error("Invalid path: must contain at least a bucket name and object name");
  }
  const bucketName = pathParts[0];
  const objectName = pathParts.slice(1).join("/");
  return { bucketName, objectName };
}

export async function signObjectURL({
  bucketName: _ignored,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const bucket = getR2BucketName();
  let command: any;
  if (method === "PUT") {
    command = new PutObjectCommand({ Bucket: bucket, Key: objectName });
  } else if (method === "DELETE") {
    command = new DeleteObjectCommand({ Bucket: bucket, Key: objectName });
  } else if (method === "HEAD") {
    command = new HeadObjectCommand({ Bucket: bucket, Key: objectName });
  } else {
    command = new GetObjectCommand({ Bucket: bucket, Key: objectName });
  }
  return getSignedUrl(r2(), command, { expiresIn: ttlSec });
}
