import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText } from "lucide-react";
import { DocumentProcessor } from "./DocumentProcessor";
import { DocumentViewer } from "./DocumentViewer";
import { useToast } from "@/hooks/use-toast";

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
      const text = await file.text();
      setContent(text);
      setDocumentId(crypto.randomUUID());
      setView("process");

      toast({
        title: "Document Loaded",
        description: `${file.name} ready for AI-MOS processing`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Could not read file",
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
          <div className="flex flex-col items-center justify-center space-y-4">
            <Upload className="w-16 h-16 text-primary/50" />
            <h3 className="text-xl font-semibold">Upload Document</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Upload documents for hierarchical AI-MOS processing with Google Gemini.
              Supports text, markdown, and more.
            </p>
            <Input
              type="file"
              accept=".txt,.md,.doc,.docx"
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