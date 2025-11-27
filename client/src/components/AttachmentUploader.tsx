import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Upload, FileText, Download, Trash2, Image as ImageIcon, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/react/dashboard";
import XHRUpload from "@uppy/xhr-upload";

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

export function AttachmentUploader({
  repairOrderId,
  canUpload = true,
  canDelete = false,
}: AttachmentUploaderProps) {
  const { toast } = useToast();
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      },
    }).use(XHRUpload, {
      endpoint: `/api/repair-orders/${repairOrderId}/attachments`,
      fieldName: "file",
      formData: true,
      withCredentials: true,
    })
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);

  // Update Uppy endpoint when repairOrderId changes
  useEffect(() => {
    const plugin = uppy.getPlugin('XHRUpload');
    if (plugin) {
      uppy.setOptions({
        id: uppy.getID(),
      });
      // @ts-ignore - Update XHRUpload endpoint
      plugin.setOptions({
        endpoint: `/api/repair-orders/${repairOrderId}/attachments`,
      });
    }
  }, [repairOrderId, uppy]);

  // Cleanup Uppy instance on unmount
  useEffect(() => {
    return () => {
      try {
        uppy.cancelAll();
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [uppy]);

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
  const [retryCount, setRetryCount] = useState<Map<string, number>>(new Map());
  const [loadedAttachmentIds, setLoadedAttachmentIds] = useState<string>("");

  // Load image previews - use stable dependency to prevent infinite loops
  const attachmentIds = attachments.map(a => a.id).join(",");
  
  useEffect(() => {
    if (attachmentIds === loadedAttachmentIds) return;
    
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
      setLoadedAttachmentIds(attachmentIds);
    };

    if (attachments.length > 0) {
      loadPreviews();
    } else {
      setAttachmentsWithPreviews([]);
      setLoadedAttachmentIds("");
    }
  }, [attachmentIds, attachments, loadedAttachmentIds]);

  // Retry loading a preview for a specific attachment (max 3 retries)
  const retryPreview = async (attachmentId: string) => {
    const currentRetries = retryCount.get(attachmentId) || 0;
    if (currentRetries >= 3) {
      // Max retries exhausted - clear preview URL to show fallback
      setAttachmentsWithPreviews(prev =>
        prev.map(att =>
          att.id === attachmentId ? { ...att, previewUrl: undefined } : att
        )
      );
      return;
    }
    
    setRetryCount(prev => new Map(prev).set(attachmentId, currentRetries + 1));
    
    try {
      const response = await fetch(`/api/repair-orders/attachments/${attachmentId}/download?preview=true`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAttachmentsWithPreviews(prev =>
          prev.map(att =>
            att.id === attachmentId ? { ...att, previewUrl: data.signedUrl } : att
          )
        );
      } else {
        // Failed to fetch - retry again on next error
      }
    } catch (error) {
      console.error('Failed to retry preview:', error);
    }
  };

  // Reset retry count when image loads successfully
  const handlePreviewLoad = (attachmentId: string) => {
    setRetryCount(prev => {
      const newMap = new Map(prev);
      newMap.delete(attachmentId); // Reset retry count on successful load
      return newMap;
    });
  };

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

  useEffect(() => {
    const handleComplete = () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/repair-orders", repairOrderId, "attachments"],
      });
      toast({
        title: "File caricato",
        description: "L'allegato è stato caricato con successo",
      });
    };

    const handleError = (file: any, error: any) => {
      toast({
        title: "Errore caricamento",
        description: error.message || "Impossibile caricare il file",
        variant: "destructive",
      });
    };

    uppy.on("complete", handleComplete);
    uppy.on("upload-error", handleError);

    return () => {
      uppy.off("complete", handleComplete);
      uppy.off("upload-error", handleError);
    };
  }, [uppy, repairOrderId, toast]);

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

  // Show error state if fetch failed
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
            <Dashboard
              uppy={uppy}
              proudlyDisplayPoweredByUppy={false}
              height={300}
              locale={{
                strings: {
                  dropPasteFiles: "Trascina i file qui o %{browseFiles}",
                  browseFiles: "sfoglia",
                  uploadXFiles: {
                    0: "Carica %{smart_count} file",
                    1: "Carica %{smart_count} file",
                  },
                  uploadComplete: "Caricamento completato",
                  uploadFailed: "Caricamento fallito",
                  xFilesSelected: {
                    0: "%{smart_count} file selezionato",
                    1: "%{smart_count} file selezionati",
                  },
                },
              }}
            />
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
                                onLoad={() => {
                                  // Reset retry count on successful load
                                  handlePreviewLoad(attachment.id);
                                }}
                                onError={() => {
                                  // Retry fetching preview URL (likely expired)
                                  retryPreview(attachment.id);
                                }}
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
                                  const data = await response.json();
                                  
                                  // Open signed URL in new tab for download
                                  window.open(data.signedUrl, '_blank');
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
