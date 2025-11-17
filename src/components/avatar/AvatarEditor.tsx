import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Image as FabricImage } from 'fabric';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface AvatarEditorProps {
  imageFile: File;
  onSave: (blob: Blob) => void;
  onCancel: () => void;
}

export const AvatarEditor = ({ imageFile, onSave, onCancel }: AvatarEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [image, setImage] = useState<FabricImage | null>(null);
  const [scale, setScale] = useState([1]);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(false);

  const CANVAS_SIZE = 400;
  const CROP_SIZE = 300;

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      backgroundColor: '#f0f0f0',
    });

    setFabricCanvas(canvas);

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      FabricImage.fromURL(e.target?.result as string, {
        crossOrigin: 'anonymous',
      }).then((img) => {
        // Scale image to fit
        const scaleToFit = Math.min(
          CANVAS_SIZE / (img.width || 1),
          CANVAS_SIZE / (img.height || 1)
        ) * 0.8;
        
        img.scale(scaleToFit);
        img.set({
          left: CANVAS_SIZE / 2,
          top: CANVAS_SIZE / 2,
          originX: 'center',
          originY: 'center',
        });

        canvas.add(img);
        setImage(img);
        canvas.setActiveObject(img);

        // Add crop circle overlay
        const cropCircle = new Circle({
          radius: CROP_SIZE / 2,
          left: CANVAS_SIZE / 2,
          top: CANVAS_SIZE / 2,
          originX: 'center',
          originY: 'center',
          stroke: '#fff',
          strokeWidth: 3,
          fill: 'transparent',
          selectable: false,
          evented: false,
          strokeDashArray: [5, 5],
        });

        canvas.add(cropCircle);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(imageFile);

    return () => {
      canvas.dispose();
    };
  }, [imageFile]);

  useEffect(() => {
    if (!image) return;
    image.scale(scale[0]);
    fabricCanvas?.renderAll();
  }, [scale, image, fabricCanvas]);

  useEffect(() => {
    if (!image) return;
    image.rotate(rotation);
    fabricCanvas?.renderAll();
  }, [rotation, image, fabricCanvas]);

  const handleSave = async () => {
    if (!fabricCanvas || !image) return;

    setLoading(true);
    try {
      // Create a temporary canvas for cropping
      const tempCanvas = document.createElement('canvas');
      const size = 500; // Final avatar size
      tempCanvas.width = size;
      tempCanvas.height = size;
      const ctx = tempCanvas.getContext('2d');

      if (!ctx) throw new Error('Could not get canvas context');

      // Calculate crop area
      const centerX = CANVAS_SIZE / 2;
      const centerY = CANVAS_SIZE / 2;
      const cropRadius = CROP_SIZE / 2;

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw the image
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
        left: centerX - cropRadius,
        top: centerY - cropRadius,
        width: CROP_SIZE,
        height: CROP_SIZE,
      });

      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);

        tempCanvas.toBlob((blob) => {
          if (blob) {
            onSave(blob);
          } else {
            throw new Error('Failed to create blob');
          }
        }, 'image/png', 1.0);
      };
      img.src = dataURL;
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast.error('Failed to save avatar');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-center">
        <canvas ref={canvasRef} className="border border-border rounded-lg shadow-lg" />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ZoomOut className="h-4 w-4" />
            <Slider
              value={scale}
              onValueChange={setScale}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4" />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Zoom: {Math.round(scale[0] * 100)}%
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRotation((prev) => prev - 90)}
            className="flex-1"
          >
            <RotateCw className="h-4 w-4 mr-2 scale-x-[-1]" />
            Rotate Left
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRotation((prev) => prev + 90)}
            className="flex-1"
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Rotate Right
          </Button>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex-1" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Avatar'
          )}
        </Button>
      </div>
    </div>
  );
};
