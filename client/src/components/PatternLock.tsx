import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface PatternLockProps {
  value?: string;
  onChange?: (pattern: string) => void;
  readOnly?: boolean;
  minNodes?: number;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

const NODE_POSITIONS = [
  { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
  { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
  { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
];

export function PatternLock({ 
  value = "", 
  onChange, 
  readOnly = false,
  minNodes = 4,
  className 
}: PatternLockProps) {
  const [selectedNodes, setSelectedNodes] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const nodes = value.split("-").map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n >= 1 && n <= 9);
      setSelectedNodes(nodes);
    } else {
      setSelectedNodes([]);
    }
  }, [value]);

  const getNodeCenter = useCallback((nodeIndex: number): Point => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    
    const rect = container.getBoundingClientRect();
    const gridSize = Math.min(rect.width, rect.height);
    const cellSize = gridSize / 3;
    const pos = NODE_POSITIONS[nodeIndex - 1];
    
    return {
      x: pos.col * cellSize + cellSize / 2,
      y: pos.row * cellSize + cellSize / 2,
    };
  }, []);

  const getNodeFromPoint = useCallback((clientX: number, clientY: number): number | null => {
    const container = containerRef.current;
    if (!container) return null;

    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const gridSize = Math.min(rect.width, rect.height);
    const cellSize = gridSize / 3;
    const nodeRadius = cellSize * 0.3;

    for (let i = 0; i < 9; i++) {
      const center = {
        x: NODE_POSITIONS[i].col * cellSize + cellSize / 2,
        y: NODE_POSITIONS[i].row * cellSize + cellSize / 2,
      };
      const distance = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2));
      if (distance <= nodeRadius) {
        return i + 1;
      }
    }
    return null;
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (readOnly) return;
    
    const node = getNodeFromPoint(clientX, clientY);
    if (node) {
      setIsDrawing(true);
      setSelectedNodes([node]);
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setCurrentPoint({ x: clientX - rect.left, y: clientY - rect.top });
      }
    }
  }, [readOnly, getNodeFromPoint]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDrawing || readOnly) return;

    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setCurrentPoint({ x: clientX - rect.left, y: clientY - rect.top });
    }

    const node = getNodeFromPoint(clientX, clientY);
    if (node && !selectedNodes.includes(node)) {
      setSelectedNodes(prev => [...prev, node]);
    }
  }, [isDrawing, readOnly, getNodeFromPoint, selectedNodes]);

  const handleEnd = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setCurrentPoint(null);
    
    if (selectedNodes.length >= minNodes && onChange) {
      onChange(selectedNodes.join("-"));
    } else if (selectedNodes.length > 0 && selectedNodes.length < minNodes) {
      setSelectedNodes([]);
      if (onChange) onChange("");
    }
  }, [isDrawing, selectedNodes, minNodes, onChange]);

  const handleReset = useCallback(() => {
    setSelectedNodes([]);
    setCurrentPoint(null);
    setIsDrawing(false);
    if (onChange) onChange("");
  }, [onChange]);

  const handleMouseDown = (e: React.MouseEvent) => handleStart(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX, e.clientY);
  const handleMouseUp = () => handleEnd();
  const handleMouseLeave = () => handleEnd();

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };
  const handleTouchEnd = () => handleEnd();

  const renderLines = () => {
    const lines: JSX.Element[] = [];
    
    for (let i = 0; i < selectedNodes.length - 1; i++) {
      const from = getNodeCenter(selectedNodes[i]);
      const to = getNodeCenter(selectedNodes[i + 1]);
      lines.push(
        <line
          key={`line-${i}`}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeLinecap="round"
          className="transition-all duration-100"
        />
      );
    }

    if (isDrawing && currentPoint && selectedNodes.length > 0) {
      const lastNode = getNodeCenter(selectedNodes[selectedNodes.length - 1]);
      lines.push(
        <line
          key="current-line"
          x1={lastNode.x}
          y1={lastNode.y}
          x2={currentPoint.x}
          y2={currentPoint.y}
          stroke="hsl(var(--primary) / 0.5)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="5,5"
        />
      );
    }

    return lines;
  };

  const [gridSize, setGridSize] = useState(180);
  const cellSize = gridSize / 3;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement;
        if (parent) {
          const maxSize = Math.min(parent.clientWidth - 16, 180);
          setGridSize(Math.max(120, maxSize));
        }
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        ref={containerRef}
        className={cn(
          "relative bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 select-none touch-none",
          !readOnly && "cursor-pointer hover:border-primary/30",
          readOnly && "opacity-80"
        )}
        style={{ width: gridSize, height: gridSize }}
        data-testid="pattern-lock-grid"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg 
          className="absolute inset-0 pointer-events-none" 
          width={gridSize} 
          height={gridSize}
        >
          {renderLines()}
        </svg>

        {NODE_POSITIONS.map((pos, index) => {
          const nodeNum = index + 1;
          const isSelected = selectedNodes.includes(nodeNum);
          const selectionOrder = selectedNodes.indexOf(nodeNum);
          
          return (
            <div
              key={nodeNum}
              className={cn(
                "absolute flex items-center justify-center rounded-full transition-all duration-150",
                isSelected 
                  ? "bg-primary scale-110" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
              )}
              style={{
                width: cellSize * 0.4,
                height: cellSize * 0.4,
                left: pos.col * cellSize + cellSize / 2 - (cellSize * 0.2),
                top: pos.row * cellSize + cellSize / 2 - (cellSize * 0.2),
              }}
              data-testid={`pattern-node-${nodeNum}`}
            >
              {isSelected && (
                <span className="text-xs font-bold text-primary-foreground">
                  {selectionOrder + 1}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedNodes.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              data-testid="button-pattern-reset"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Cancella
            </Button>
          )}
          {selectedNodes.length > 0 && selectedNodes.length < minNodes && (
            <span className="text-xs text-muted-foreground">
              Minimo {minNodes} punti (selezionati: {selectedNodes.length})
            </span>
          )}
        </div>
      )}

      {readOnly && selectedNodes.length === 0 && (
        <span className="text-sm text-muted-foreground italic">
          Nessuna sequenza impostata
        </span>
      )}

      {selectedNodes.length >= minNodes && (
        <span className="text-xs text-muted-foreground">
          Sequenza: {selectedNodes.join(" → ")}
        </span>
      )}
    </div>
  );
}
