import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Brain, Network, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentProcessorProps {
  documentId: string;
  content: string;
  onProcessed?: (result: any) => void;
}

export const DocumentProcessor = ({ documentId, content, onProcessed }: DocumentProcessorProps) => {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const { toast } = useToast();

  const processDocument = async () => {
    setProcessing(true);
    setProgress(0);

    try {
      // Stage 1: Hierarchical Chunking
      setCurrentStage("Analyzing document structure...");
      setProgress(25);
      
      const { data: chunkData } = await supabase.functions.invoke("document-processor", {
        body: { documentId, content, operation: "chunk" }
      });

      // Stage 2: Multi-level Summarization
      setCurrentStage("Generating hierarchical summaries...");
      setProgress(50);
      
      const { data: summaryData } = await supabase.functions.invoke("document-processor", {
        body: { documentId, content, operation: "summarize" }
      });

      // Stage 3: Master Index Creation
      setCurrentStage("Building master index with AI-MOS...");
      setProgress(75);
      
      const { data: indexData } = await supabase.functions.invoke("document-processor", {
        body: { documentId, content, operation: "create_index" }
      });

      // Stage 4: Complete
      setCurrentStage("Processing complete!");
      setProgress(100);

      const result = {
        chunks: chunkData,
        summaries: summaryData,
        masterIndex: indexData
      };

      toast({
        title: "Document Processed",
        description: "AI-MOS analysis complete with hierarchical indexing",
      });

      onProcessed?.(result);

    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="p-6 bg-black/40 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">AI-MOS Document Processor</h3>
          </div>
          <Button
            onClick={processDocument}
            disabled={processing}
            className="bg-primary/20 hover:bg-primary/30"
          >
            {processing ? "Processing..." : "Analyze Document"}
          </Button>
        </div>

        {processing && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{currentStage}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg">
            <FileText className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium">Hierarchical Chunking</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg">
            <Network className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium">Master Index</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg">
            <Edit3 className="w-8 h-8 text-primary mb-2" />
            <span className="text-sm font-medium">Contextual Tags</span>
          </div>
        </div>
      </div>
    </Card>
  );
};