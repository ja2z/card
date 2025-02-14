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

// TruncatedText component remains unchanged as it works well
const TruncatedText = ({ text }: { text: string | number }) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

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

  const handleLongPress = () => {
    setIsLongPressed(true);
    setTimeout(() => setIsLongPressed(false), 1000);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={isTruncated && (isLongPressed || undefined)}>
        <TooltipTrigger asChild>
          <span
            ref={textRef}
            className="truncate block w-full"
            onMouseDown={() => {
              if (isTruncated) {
                setTimeout(handleLongPress, 450);
              }
            }}
            onMouseUp={() => clearTimeout(handleLongPress as unknown as number)}
            onMouseLeave={() =>
              clearTimeout(handleLongPress as unknown as number)
            }
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
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
      
      // Get the viewport height
      const vh = window.innerHeight;
      // Get the container's position from the top of the viewport
      const containerTop = containerRef.current.getBoundingClientRect().top;
      // Calculate maximum available height (subtract some padding for safety)
      const availableHeight = vh - containerTop - 32; // 32px safety padding
      
      setMaxHeight(`${availableHeight}px`);
    };

    updateMaxHeight();
    window.addEventListener('resize', updateMaxHeight);
    
    // Run again after a short delay to handle any dynamic content
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

  return (
    // Main container with overflow hidden to prevent body scroll
    <div 
      ref={containerRef} 
      className="w-full overflow-hidden"
      style={{ height: maxHeight }}
    >
      {/* Content wrapper with min-width constraint */}
      <div style={{ minWidth: minCardWidth }} className="h-full">
        {/* Only render header if showHeader is true */}
        {showHeader && (
          <div className="mb-4">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">
              Showing {displayData.length} rows
            </p>
          </div>
        )}
        
        {/* Adjust card height based on whether header is shown */}
        <Card className={`${showHeader ? 'h-[calc(100%-4rem)]' : 'h-full'}`}>
          <CardContent className="p-0 h-full">
            <ScrollArea className="h-full">
              {displayData.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <div
                    className={`p-4 transition-colors duration-200 ${
                      hoveredIndex === rowIndex
                        ? "bg-blue-100 dark:bg-blue-900"
                        : rowIndex % 2 === 0
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "bg-white dark:bg-gray-900"
                    }`}
                    onMouseEnter={() => setHoveredIndex(rowIndex)}
                    onMouseLeave={() => setHoveredIndex(null)}
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