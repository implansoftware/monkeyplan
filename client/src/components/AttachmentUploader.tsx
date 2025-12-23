import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Upload, FileText, Download, Trash2, Image as ImageIcon, FileCheck, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

type Attachment = {
  id: string;
  repairOrderId: string;
  objectKey: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
};

type AttachmentWithPreview = Attachment & {
  previewUrl?: string;
};

interface AttachmentUploaderProps {
  repairOrderId: string;
  canUpload?: boolean;
  canDelete?: boolean;
}

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AttachmentUploader({
  repairOrderId,
  canUpload = true,
  canDelete = false,
}: AttachmentUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);

  const { data: attachments = [], isLoading, error } = useQuery<Attachment[]>({
    queryKey: ["/api/repair-orders", repairOrderId, "attachments"],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[1];
      const response = await fetch(`/api/repair-orders/${id}/attachments`, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) throw new Error("Riparazione non trovata");
        if (response.status === 403) throw new Error("Accesso negato");
        throw new Error("Errore nel caricamento allegati");
      }
      return response.json();
    },
    enabled: !!repairOrderId,
    retry: false,
  });

  const [attachmentsWithPreviews, setAttachmentsWithPreviews] = useState<AttachmentWithPreview[]>([]);

  // Load image previews when attachments change
  const attachmentIds = attachments.map(a => a.id).join(",");
  
  useEffect(() => {
    if (!attachmentIds) {
      setAttachmentsWithPreviews([]);
      return;
    }
    
    const loadPreviews = async () => {
      const withPreviews = await Promise.all(
        attachments.map(async (attachment) => {
          if (isImage(attachment.fileType)) {
            try {
              const response = await fetch(`/api/repair-orders/attachments/${attachment.id}/download?preview=true`, {
                credentials: 'include',
              });
              if (response.ok) {
                const data = await response.json();
                return { ...attachment, previewUrl: data.signedUrl };
              }
            } catch (error) {
              console.error('Failed to load preview:', error);
            }
          }
          return attachment;
        })
      );
      setAttachmentsWithPreviews(withPreviews);
    };

    loadPreviews();
  }, [attachmentIds]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || 'Errore durante il caricamento'));
            } catch {
              reject(new Error('Errore durante il caricamento'));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Errore di rete durante il caricamento'));
        });

        xhr.open('POST', `/api/repair-orders/${repairOrderId}/attachments`);
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repair-orders", repairOrderId, "attachments"],
      });
      toast({
        title: "File caricato",
        description: "L'allegato è stato caricato con successo",
      });
      setUploadProgress(null);
      setSelectedFiles([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore caricamento",
        description: error.message || "Impossibile caricare il file",
        variant: "destructive",
      });
      setUploadProgress(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      return await apiRequest("DELETE", `/api/repair-orders/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repair-orders", repairOrderId, "attachments"],
      });
      toast({
        title: "File eliminato",
        description: "L'allegato è stato eliminato con successo",
      });
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare l'allegato",
        variant: "destructive",
      });
    },
  });

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `Tipo file non supportato: ${file.type}. Sono ammessi solo immagini, PDF e documenti Word.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Il file è troppo grande (${formatFileSize(file.size)}). Dimensione massima: 10MB`;
    }
    return null;
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Alcuni file non validi",
        description: errors.join('\n'),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  }, [toast]);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    for (const file of selectedFiles) {
      await uploadMutation.mutateAsync(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = (fileType: string) => {
    return fileType.startsWith("image/");
  };

  const getFileIcon = (fileType: string) => {
    if (isImage(fileType)) return <ImageIcon className="h-5 w-5" />;
    if (fileType === "application/pdf") return <FileText className="h-5 w-5" />;
    return <FileCheck className="h-5 w-5" />;
  };

  const handleDeleteClick = (attachment: Attachment) => {
    setAttachmentToDelete(attachment);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (attachmentToDelete) {
      deleteMutation.mutate(attachmentToDelete.id);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-destructive" data-testid="error-attachments-load">
            {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {canUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Carica Allegati
            </CardTitle>
            <CardDescription>
              Carica immagini, PDF o documenti relativi a questa riparazione (max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_FILE_TYPES.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              data-testid="input-file-upload"
            />
            
            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
              data-testid="dropzone-upload"
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Trascina i file qui o{' '}
                <span className="text-primary underline underline-offset-4">sfoglia</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Immagini, PDF, Word - Max 10MB
              </p>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                      data-testid={`button-remove-file-${index}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* Upload Progress */}
                {uploadProgress !== null && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      Caricamento in corso... {uploadProgress}%
                    </p>
                  </div>
                )}

                {/* Upload Button */}
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="w-full"
                  data-testid="button-upload-files"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadMutation.isPending ? 'Caricamento...' : 'Carica file'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Allegati ({attachments.length})
          </CardTitle>
          {attachments.length > 0 && (
            <CardDescription>
              File caricati per questa riparazione
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nessun allegato presente
            </div>
          ) : (
            <div className="space-y-3">
              {attachmentsWithPreviews.map((attachment) => (
                <Card key={attachment.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* File Icon/Preview */}
                      <div className="flex-shrink-0">
                        {isImage(attachment.fileType) ? (
                          <div className="w-16 h-16 bg-muted rounded-md overflow-hidden">
                            {attachment.previewUrl ? (
                              <img
                                src={attachment.previewUrl}
                                alt={attachment.fileName}
                                className="w-full h-full object-cover"
                                data-testid={`img-preview-${attachment.id}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                            {getFileIcon(attachment.fileType)}
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate" data-testid={`text-filename-${attachment.id}`}>
                              {attachment.fileName}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="secondary" className="text-xs">
                                {formatFileSize(attachment.fileSize)}
                              </Badge>
                              {isImage(attachment.fileType) && (
                                <Badge variant="outline" className="text-xs">
                                  Immagine
                                </Badge>
                              )}
                              {attachment.fileType === "application/pdf" && (
                                <Badge variant="outline" className="text-xs">
                                  PDF
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Caricato il {format(new Date(attachment.uploadedAt), "dd/MM/yyyy HH:mm")}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/repair-orders/attachments/${attachment.id}/download`, {
                                    credentials: 'include',
                                  });
                                  if (!response.ok) throw new Error("Download failed");
                                  
                                  // Backend returns binary file, use blob() not json()
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = attachment.fileName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                } catch (error: any) {
                                  toast({
                                    title: "Errore download",
                                    description: error.message || "Impossibile scaricare il file",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              data-testid={`button-download-${attachment.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteClick(attachment)}
                                disabled={deleteMutation.isPending}
                                data-testid={`button-delete-${attachment.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare "{attachmentToDelete?.fileName}"? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover-elevate"
              data-testid="button-confirm-delete"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
