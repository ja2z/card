import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DataRow = Record<string, string | number>;

interface ComponentProps {
  title?: string;
  data?: DataRow[];
  minCardWidth?: string;
  showHeader?: boolean;
}

// Mobile-friendly TruncatedText component with touch support
const TruncatedText = ({ text }: { text: string | number }) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        setIsTruncated(
          textRef.current.scrollWidth > textRef.current.clientWidth
        );
      }
    };

    checkTruncation();

    const resizeObserver = new ResizeObserver(checkTruncation);
    if (textRef.current) {
      resizeObserver.observe(textRef.current.parentElement as Element);
    }

    window.addEventListener("resize", checkTruncation);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkTruncation);
    };
  }, [text]);

  // Handle long press for mobile
  const handleTouchStart = () => {
    if (isTruncated) {
      longPressTimer.current = window.setTimeout(() => {
        setShowTooltip(true);
      }, 500); // 500ms long press
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Hide tooltip after a delay
    setTimeout(() => setShowTooltip(false), 2000);
  };

  const handleTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Handle mouse events for desktop
  const handleMouseDown = () => {
    if (isTruncated) {
      longPressTimer.current = window.setTimeout(() => {
        setShowTooltip(true);
      }, 450);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setTimeout(() => setShowTooltip(false), 1000);
  };

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setShowTooltip(false);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={isTruncated && showTooltip}>
        <TooltipTrigger asChild>
          <span
            ref={textRef}
            className="truncate block w-full cursor-pointer select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'none',
              userSelect: 'none'
            }}
          >
            {text}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs whitespace-pre-wrap">
          {String(text)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function Component({
  title = "No title",
  data = [],
  minCardWidth = "200px",
  showHeader = true,
}: ComponentProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState("100%");
  
  const testMode: boolean = false;

  const defaultData: DataRow[] = [
    { name: "Bob", age: 40, state: "A very long state name could be here. It is very possible. Some states have really long names that can make the window very wide.", amount: 10 },
    { name: "Joe", age: 30, state: "CA", amount: 20 },
    { name: "Alice", age: 35, state: "NY", amount: 15 },
    { name: "Emma", age: 28, state: "TX", amount: 25 },
  ];

  const displayData = testMode ? defaultData : data;

  useEffect(() => {
    const updateMaxHeight = () => {
      if (!containerRef.current) return;
      
      const vh = window.innerHeight;
      const containerTop = containerRef.current.getBoundingClientRect().top;
      const availableHeight = vh - containerTop - 32;
      
      setMaxHeight(`${availableHeight}px`);
    };

    updateMaxHeight();
    window.addEventListener('resize', updateMaxHeight);
    
    const timeout = setTimeout(updateMaxHeight, 100);
    
    return () => {
      window.removeEventListener('resize', updateMaxHeight);
      clearTimeout(timeout);
    };
  }, []);

  if (displayData.length === 0) {
    return <p>No data available.</p>;
  }

  const headers = Object.keys(displayData[0]);

  // Handle both touch and mouse interactions
  const handleRowActivate = (rowIndex: number) => {
    setActiveIndex(rowIndex);
  };

  const handleRowDeactivate = () => {
    setActiveIndex(null);
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full overflow-hidden"
      style={{ 
        height: maxHeight,
        WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
      }}
    >
      <div style={{ minWidth: minCardWidth }} className="h-full">
        {showHeader && (
          <div className="mb-4">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">
              Showing {displayData.length} rows
            </p>
          </div>
        )}
        
        <Card className={`${showHeader ? 'h-[calc(100%-4rem)]' : 'h-full'}`}>
          <CardContent className="p-0 h-full">
            <ScrollArea className="h-full">
              {displayData.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <div
                    className={`p-4 transition-colors duration-200 ${
                      activeIndex === rowIndex
                        ? "bg-blue-100 dark:bg-blue-900"
                        : rowIndex % 2 === 0
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "bg-white dark:bg-gray-900"
                    }`}
                    onMouseEnter={() => handleRowActivate(rowIndex)}
                    onMouseLeave={handleRowDeactivate}
                    onTouchStart={() => handleRowActivate(rowIndex)}
                    onTouchEnd={handleRowDeactivate}
                    style={{
                      WebkitTapHighlightColor: 'transparent' // Remove tap highlight on mobile
                    }}
                  >
                    {headers.map((header, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-5 gap-4 py-1 px-4"
                      >
                        <div className="col-span-2 text-left">
                          <span className="text-base font-medium text-muted-foreground capitalize">
                            {`${header}:`}
                          </span>
                        </div>
                        <div className="col-span-3 max-w-full overflow-hidden">
                          <span className="text-base block text-right">
                            <TruncatedText text={row[header]} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {rowIndex < displayData.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}