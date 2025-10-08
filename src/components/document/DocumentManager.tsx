import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Image, File } from "lucide-react";
import { DocumentProcessor } from "./DocumentProcessor";
import { DocumentViewer } from "./DocumentViewer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const DocumentManager = () => {
  const [documentId, setDocumentId] = useState<string>("");
  const [content, setContent] = useState("");
  const [processed, setProcessed] = useState<any>(null);
  const [view, setView] = useState<"upload" | "process" | "view">("upload");
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('document-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('document-assets')
        .getPublicUrl(filePath);

      // For non-text files, pass the storage URL - edge function will extract text
      let text = "";
      if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        text = await file.text();
      } else {
        // Pass URL for document processor to extract content
        text = publicUrl;
      }

      setContent(text);
      setDocumentId(crypto.randomUUID());
      setView("process");

      toast({
        title: "Document Uploaded",
        description: `${file.name} ready for AI-MOS hierarchical processing`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload file",
        variant: "destructive",
      });
    }
  };

  const handleProcessed = (result: any) => {
    setProcessed(result);
    setView("view");
  };

  return (
    <div className="h-full p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          AI-MOS Document System
        </h2>
        
        {view !== "upload" && (
          <Button
            variant="outline"
            onClick={() => {
              setView("upload");
              setContent("");
              setProcessed(null);
            }}
          >
            New Document
          </Button>
        )}
      </div>

      {view === "upload" && (
        <Card className="p-12 bg-black/40 border-primary/20 border-dashed">
          <div className="flex flex-col items-center justify-center space-y-6">
            <Upload className="w-16 h-16 text-primary/50" />
            <h3 className="text-xl font-semibold">Upload Document</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Upload documents for hierarchical AI-MOS processing with Google Gemini 2.5 Pro.
              <br />
              Creates multi-level summaries, master index, and contextual tags.
            </p>
            
            <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
              <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg border border-primary/10">
                <FileText className="w-8 h-8 text-primary mb-2" />
                <span className="text-xs font-medium">Documents</span>
                <span className="text-xs text-muted-foreground">.txt .md .doc .docx</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg border border-primary/10">
                <Image className="w-8 h-8 text-primary mb-2" />
                <span className="text-xs font-medium">Images</span>
                <span className="text-xs text-muted-foreground">.jpg .png .webp</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg border border-primary/10">
                <File className="w-8 h-8 text-primary mb-2" />
                <span className="text-xs font-medium">Code</span>
                <span className="text-xs text-muted-foreground">.js .py .tsx .go</span>
              </div>
            </div>

            <Input
              type="file"
              accept=".txt,.md,.doc,.docx,.pdf,.jpg,.png,.webp,.js,.jsx,.ts,.tsx,.py,.go,.rs"
              onChange={handleFileUpload}
              className="max-w-md"
            />
          </div>
        </Card>
      )}

      {view === "process" && (
        <DocumentProcessor
          documentId={documentId}
          content={content}
          onProcessed={handleProcessed}
        />
      )}

      {view === "view" && processed && (
        <DocumentViewer
          documentId={documentId}
          content={content}
          masterIndex={processed.masterIndex}
          summaries={processed.summaries}
        />
      )}
    </div>
  );
};