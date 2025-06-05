import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Type, Minus, Plus } from "lucide-react";

export function FontSizeControls() {
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    // Load saved font size from localStorage
    const savedSize = localStorage.getItem('ghostli-font-size');
    if (savedSize) {
      const size = parseInt(savedSize);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}px`;
    }
  }, []);

  const updateFontSize = (newSize: number) => {
    const clampedSize = Math.max(12, Math.min(24, newSize));
    setFontSize(clampedSize);
    document.documentElement.style.fontSize = `${clampedSize}px`;
    localStorage.setItem('ghostli-font-size', clampedSize.toString());
  };

  const resetFontSize = () => {
    updateFontSize(16);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Font Size">
          <Type className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <h4 className="font-semibold">Font Size</h4>
          
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFontSize(fontSize - 1)}
              disabled={fontSize <= 12}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium">{fontSize}px</span>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateFontSize(fontSize + 1)}
              disabled={fontSize >= 24}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFontSize(14)}
              className="w-full"
            >
              Small (14px)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFontSize(16)}
              className="w-full"
            >
              Medium (16px)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFontSize(18)}
              className="w-full"
            >
              Large (18px)
            </Button>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={resetFontSize}
            className="w-full"
          >
            Reset to Default
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}