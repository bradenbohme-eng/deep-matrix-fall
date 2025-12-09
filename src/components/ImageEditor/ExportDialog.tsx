// V3 Image Editor - Export Dialog

import React, { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditorProject } from '@/lib/canvas/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/canvas/constants';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: EditorProject | null;
}

export function ExportDialog({ open, onOpenChange, project }: ExportDialogProps) {
  const [width, setWidth] = useState(CANVAS_WIDTH);
  const [height, setHeight] = useState(CANVAS_HEIGHT);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState(90);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!project) return;

    setIsExporting(true);

    try {
      // Create export canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Cannot get canvas context');

      // Scale factor for export
      const scaleX = width / CANVAS_WIDTH;
      const scaleY = height / CANVAS_HEIGHT;

      // Fill background
      ctx.fillStyle = format === 'jpeg' ? '#ffffff' : 'transparent';
      ctx.fillRect(0, 0, width, height);

      // Draw layers
      for (const layer of project.layers) {
        if (!layer.visible || !layer.image) continue;

        ctx.save();
        ctx.globalAlpha = layer.opacity;

        const { x, y, width: layerWidth, height: layerHeight } = layer.bounds;
        const transform = layer.transform || { rotation: 0, scaleX: 1, scaleY: 1 };

        // Apply scale and transform
        ctx.translate((x + layerWidth / 2) * scaleX, (y + layerHeight / 2) * scaleY);
        ctx.rotate((transform.rotation * Math.PI) / 180);
        ctx.scale(transform.scaleX, transform.scaleY);
        ctx.translate(-layerWidth * scaleX / 2, -layerHeight * scaleY / 2);

        ctx.drawImage(layer.image, 0, 0, layerWidth * scaleX, layerHeight * scaleY);
        ctx.restore();
      }

      // Export
      const mimeType = `image/${format}`;
      const qualityValue = format === 'jpeg' ? quality / 100 : undefined;
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error('Export failed');
            setIsExporting(false);
            return;
          }

          // Download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${project.name || 'export'}.${format}`;
          a.click();
          URL.revokeObjectURL(url);

          toast.success('Image exported successfully!');
          setIsExporting(false);
          onOpenChange(false);
        },
        mimeType,
        qualityValue
      );
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
      setIsExporting(false);
    }
  }, [project, width, height, format, quality, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Export Image</DialogTitle>
          <DialogDescription>
            Configure export settings for your image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="bg-muted border-border"
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="bg-muted border-border"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={(val) => setFormat(val as 'png' | 'jpeg' | 'webp')}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Lossless)</SelectItem>
                <SelectItem value="jpeg">JPEG (Lossy)</SelectItem>
                <SelectItem value="webp">WebP (Modern)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {format === 'jpeg' && (
            <div>
              <Label>Quality: {quality}%</Label>
              <Slider
                value={[quality]}
                onValueChange={([val]) => setQuality(val)}
                min={1}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="bg-primary">
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              'Export'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
