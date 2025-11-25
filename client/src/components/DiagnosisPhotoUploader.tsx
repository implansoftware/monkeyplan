import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import XHRUpload from "@uppy/xhr-upload";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

interface DiagnosisPhotoUploaderProps {
  repairOrderId: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

type UploadedPhoto = {
  id: string;
  url: string;
  fileName: string;
};

export function DiagnosisPhotoUploader({
  repairOrderId,
  photos,
  onPhotosChange,
}: DiagnosisPhotoUploaderProps) {
  const { toast } = useToast();
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxNumberOfFiles: 10,
        allowedFileTypes: [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ],
      },
      autoProceed: true,
    }).use(XHRUpload, {
      endpoint: `/api/repair-orders/${repairOrderId}/attachments`,
      fieldName: "file",
      formData: true,
      withCredentials: true,
    })
  );

  // Update endpoint when repairOrderId changes
  useEffect(() => {
    const plugin = uppy.getPlugin('XHRUpload');
    if (plugin) {
      // @ts-ignore
      plugin.setOptions({
        endpoint: `/api/repair-orders/${repairOrderId}/attachments`,
      });
    }
  }, [repairOrderId, uppy]);

  // Cleanup Uppy on unmount
  useEffect(() => {
    return () => {
      // @ts-ignore
      uppy.close();
    };
  }, [uppy]);

  // Handle upload events
  useEffect(() => {
    const handleUploadStart = () => {
      setIsUploading(true);
    };

    const handleUploadSuccess = (file: any, response: any) => {
      const attachment = response.body;
      if (attachment && attachment.id) {
        const newPhoto: UploadedPhoto = {
          id: attachment.id,
          url: attachment.objectKey,
          fileName: attachment.fileName,
        };
        setUploadedPhotos(prev => {
          const updated = [...prev, newPhoto];
          // Update parent with new photos array
          onPhotosChange(updated.map(p => p.id));
          return updated;
        });
        toast({
          title: "Foto caricata",
          description: `${file.name} caricata con successo`,
        });
      }
    };

    const handleComplete = () => {
      setIsUploading(false);
      uppy.cancelAll();
    };

    const handleError = (file: any, error: any) => {
      setIsUploading(false);
      toast({
        title: "Errore caricamento",
        description: error.message || "Impossibile caricare la foto",
        variant: "destructive",
      });
    };

    uppy.on("upload", handleUploadStart);
    uppy.on("upload-success", handleUploadSuccess);
    uppy.on("complete", handleComplete);
    uppy.on("upload-error", handleError);

    return () => {
      uppy.off("upload", handleUploadStart);
      uppy.off("upload-success", handleUploadSuccess);
      uppy.off("complete", handleComplete);
      uppy.off("upload-error", handleError);
    };
  }, [uppy, toast, onPhotosChange]);

  const removePhoto = (photoId: string) => {
    setUploadedPhotos(prev => {
      const updated = prev.filter(p => p.id !== photoId);
      onPhotosChange(updated.map(p => p.id));
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-4">
          <Dashboard
            uppy={uppy}
            proudlyDisplayPoweredByUppy={false}
            height={200}
            width="100%"
            locale={{
              strings: {
                dropPasteFiles: "Trascina le foto qui o %{browseFiles}",
                browseFiles: "sfoglia",
                uploadXFiles: {
                  0: "Carica %{smart_count} foto",
                  1: "Carica %{smart_count} foto",
                },
                uploadComplete: "Caricamento completato",
                uploadFailed: "Caricamento fallito",
                xFilesSelected: {
                  0: "%{smart_count} foto selezionata",
                  1: "%{smart_count} foto selezionate",
                },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Uploaded Photos Preview */}
      {uploadedPhotos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Foto caricate ({uploadedPhotos.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {uploadedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group"
              >
                <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center border">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => removePhoto(photo.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                <p className="text-xs text-muted-foreground truncate w-20 mt-1">
                  {photo.fileName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Caricamento in corso...
        </div>
      )}
    </div>
  );
}
