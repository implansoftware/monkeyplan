import { useTranslation } from "react-i18next";
import { useState, useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UploadResult {
  successful: Array<{ uploadURL?: string; name: string }>;
  failed: Array<{ name: string }>;
}

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: UploadResult) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const toUpload = Array.from(files).slice(0, maxNumberOfFiles);
    const failed: UploadResult["failed"] = [];
    const successful: UploadResult["successful"] = [];

    setUploading(true);
    try {
      for (const file of toUpload) {
        if (file.size > maxFileSize) {
          toast({ title: t("common.error"), description: `${file.name} è troppo grande`, variant: "destructive" });
          failed.push({ name: file.name });
          continue;
        }
        try {
          const { method, url } = await onGetUploadParameters();
          const res = await fetch(url, {
            method,
            body: file,
            headers: { "Content-Type": file.type || "application/octet-stream" },
          });
          if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
          successful.push({ uploadURL: url.split("?")[0], name: file.name });
        } catch (err) {
          failed.push({ name: file.name });
        }
      }
      onComplete?.({ successful, failed });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple={maxNumberOfFiles > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        data-testid="input-file-upload"
      />
      <Button
        onClick={() => inputRef.current?.click()}
        className={buttonClassName}
        disabled={uploading}
        data-testid="button-upload-file"
      >
        {uploading ? t("common.loading") : children}
      </Button>
    </div>
  );
}
