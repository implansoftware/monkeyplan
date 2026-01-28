import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon, Loader2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiagnosisPhotoUploaderProps {
  repairOrderId?: string;
  uploadSessionId?: string;
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

type UploadedPhoto = {
  id: string;
  url: string;
  fileName: string;
  previewUrl?: string;
};

export function DiagnosisPhotoUploader({
  repairOrderId,
  uploadSessionId,
  photos,
  onPhotosChange,
}: DiagnosisPhotoUploaderProps) {
  const { toast } = useToast();
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    let url: string;
    
    if (uploadSessionId) {
      formData.append("uploadSessionId", uploadSessionId);
      url = "/api/attachments/temp";
    } else if (repairOrderId) {
      url = `/api/repair-orders/${repairOrderId}/attachments`;
    } else {
      throw new Error("Either repairOrderId or uploadSessionId is required");
    }

    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Errore durante il caricamento");
    }

    return response.json();
  };

  const deletePhoto = async (photoId: string) => {
    if (uploadSessionId) {
      try {
        await fetch(`/api/attachments/temp/${photoId}`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch (e) {
        console.warn("Could not delete temp attachment:", e);
      }
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Tipo file non valido",
          description: `${file.name} non è un'immagine supportata`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File troppo grande",
          description: `${file.name} supera i 10MB`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);

    for (const file of validFiles) {
      try {
        const previewUrl = URL.createObjectURL(file);
        const attachment = await uploadFile(file);
        
        if (attachment && attachment.id) {
          const newPhoto: UploadedPhoto = {
            id: attachment.id,
            url: attachment.signedUrl || attachment.objectKey,
            fileName: attachment.fileName,
            previewUrl: attachment.signedUrl || previewUrl,
          };
          
          setUploadedPhotos(prev => {
            const updated = [...prev, newPhoto];
            onPhotosChange(updated.map(p => p.id));
            return updated;
          });

          toast({
            title: "Foto caricata",
            description: `${file.name} caricata con successo`,
          });
        }
      } catch (error) {
        toast({
          title: "Errore caricamento",
          description: `Impossibile caricare ${file.name}`,
          variant: "destructive",
        });
      }
    }

    setIsUploading(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const removePhoto = async (photoId: string) => {
    await deletePhoto(photoId);
    setUploadedPhotos(prev => {
      const photoToRemove = prev.find(p => p.id === photoId);
      if (photoToRemove?.previewUrl && !photoToRemove.previewUrl.startsWith('http')) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
      }
      const updated = prev.filter(p => p.id !== photoId);
      onPhotosChange(updated.map(p => p.id));
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        multiple
        onChange={handleInputChange}
        className="hidden"
        data-testid="input-photo-upload"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        data-testid="dropzone-photos"
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Caricamento in corso...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Camera className="h-10 w-10 text-muted-foreground" />
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Trascina le foto qui
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                oppure clicca per selezionare
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, GIF, WEBP - Max 10MB per file
            </p>
          </div>
        )}
      </div>

      {uploadedPhotos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Foto caricate ({uploadedPhotos.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {uploadedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative group"
                data-testid={`photo-preview-${photo.id}`}
              >
                <div className="w-24 h-24 bg-muted rounded-lg overflow-hidden border-2 border-muted">
                  {photo.previewUrl ? (
                    <img
                      src={photo.previewUrl}
                      alt={photo.fileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePhoto(photo.id)}
                  data-testid={`button-remove-photo-${photo.id}`}
                >
                  <X className="h-3 w-3" />
                </Button>
                <p className="text-xs text-muted-foreground truncate w-24 mt-1 text-center">
                  {photo.fileName}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
