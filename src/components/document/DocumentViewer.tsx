import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  MessageSquare, 
  Layers, 
  Tag, 
  GitBranch,
  Sparkles 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerProps {
  documentId: string;
  content: string;
  masterIndex?: any;
  summaries?: any;
}

export const DocumentViewer = ({ 
  documentId, 
  content, 
  masterIndex,
  summaries 
}: DocumentViewerProps) => {
  const [selectedText, setSelectedText] = useState("");
  const [editInstruction, setEditInstruction] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [showContext, setShowContext] = useState(false);
  const { toast } = useToast();

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString() || "";
    if (text) {
      setSelectedText(text);
    }
  };

  const handleAIEdit = async () => {
    if (!selectedText || !editInstruction) return;

    try {
      const { data } = await supabase.functions.invoke("document-processor", {
        body: {
          documentId,
          operation: "edit_assist",
          section: selectedText,
          instruction: editInstruction,
          context: { masterIndex, summaries }
        }
      });

      setAiResponse(JSON.stringify(data.suggestion, null, 2));
      
      toast({
        title: "AI Suggestion Generated",
        description: "Review the suggested edits below",
      });
    } catch (error) {
      console.error("AI edit error:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI suggestion",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Main Document View */}
      <div className="col-span-8">
        <Card className="h-full p-6 bg-black/40 border-primary/20">
          <ScrollArea className="h-full">
            <div 
              className="prose prose-invert max-w-none"
              onMouseUp={handleTextSelection}
            >
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {content}
              </pre>
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Context & AI Assistant Panel */}
      <div className="col-span-4 space-y-4">
        {/* Selected Text Editor */}
        {selectedText && (
          <Card className="p-4 bg-black/40 border-primary/20">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-sm">AI Edit Assistant</h4>
              </div>
              
              <div className="p-3 bg-background/50 rounded text-xs">
                <p className="line-clamp-3">{selectedText}</p>
              </div>

              <Textarea
                placeholder="Describe how to edit this section..."
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                className="min-h-[80px] bg-background/50"
              />

              <Button 
                onClick={handleAIEdit}
                className="w-full bg-primary/20 hover:bg-primary/30"
                size="sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Get AI Suggestion
              </Button>

              {aiResponse && (
                <div className="p-3 bg-background/50 rounded">
                  <pre className="text-xs whitespace-pre-wrap">
                    {aiResponse}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Master Index Navigation */}
        <Card className="p-4 bg-black/40 border-primary/20">
          <Button
            variant="ghost"
            onClick={() => setShowContext(!showContext)}
            className="w-full justify-start"
          >
            <Layers className="w-4 h-4 mr-2" />
            Master Index & Context
          </Button>

          {showContext && masterIndex && (
            <ScrollArea className="h-[300px] mt-4">
              <div className="space-y-2 text-xs">
                <div className="p-2 bg-background/50 rounded">
                  <strong>Key Insights:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {masterIndex.keyInsights?.map((insight: string, i: number) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-2 bg-background/50 rounded">
                  <strong>Navigation:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {JSON.stringify(masterIndex.navigationGraph, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </Card>

        {/* Summaries */}
        {summaries && (
          <Card className="p-4 bg-black/40 border-primary/20">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h4 className="font-semibold text-sm">Hierarchical Summaries</h4>
              </div>
              
              <div className="space-y-2">
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Short (50 words)</summary>
                  <p className="mt-2 p-2 bg-background/50 rounded">{summaries.short}</p>
                </details>

                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Medium (200 words)</summary>
                  <p className="mt-2 p-2 bg-background/50 rounded">{summaries.medium}</p>
                </details>

                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">Large (500 words)</summary>
                  <p className="mt-2 p-2 bg-background/50 rounded">{summaries.large}</p>
                </details>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};