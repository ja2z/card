'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type DataRow = Record<string, string | number>

interface ComponentProps {
  title?: string;
  data?: DataRow[];
  cardHeight?: string;
  cardWidth?: string;
  minCardWidth?: string;
}

const TruncatedText = ({ text }: { text: string | number }) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
      }
    };

    checkTruncation();

    const resizeObserver = new ResizeObserver(checkTruncation);
    if (textRef.current) {
      resizeObserver.observe(textRef.current.parentElement as Element);
    }

    window.addEventListener('resize', checkTruncation);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkTruncation);
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
            onMouseLeave={() => clearTimeout(handleLongPress as unknown as number)}
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
  title, 
  data, 
  cardHeight = '400px', 
  cardWidth = '100%', 
  minCardWidth = '300px' 
}: ComponentProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const defaultData: DataRow[] = [
    { name: 'Bob', age: 40, state: 'PA', amount: 10 },
    { name: 'Joe', age: 30, state: 'CA', amount: 20 },
    { name: 'Alice', age: 35, state: 'NY', amount: 15 },
    { name: 'Emma', age: 28, state: 'TX', amount: 25 },
  ];

  const displayData = data || defaultData;

  if (displayData.length === 0) {
    return <p>No data available.</p>;
  }

  const headers = Object.keys(displayData[0]);

  // Calculate actual card width based on container width and constraints
  const actualCardWidth = Math.max(
    parseInt(minCardWidth) || 400,
    Math.min(containerWidth, parseInt(cardWidth) || containerWidth)
  );

  return (
    <div 
      ref={containerRef}
      className="w-full flex justify-center"
    >
      <div 
        style={{ 
          width: actualCardWidth,
          overflow: 'hidden'
        }}
        className="relative"
      >
        {title && (
          <div className="sticky top-0 bg-background z-10 pb-4">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">Showing {displayData.length} rows</p>
          </div>
        )}
        <Card className={title ? 'mt-4' : ''}>
          <CardContent className="p-0">
            <ScrollArea style={{ height: cardHeight }} className="w-full">
              {displayData.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  <div
                    className={`p-4 transition-colors duration-200 ${
                      hoveredIndex === rowIndex 
                        ? 'bg-blue-100 dark:bg-blue-900' 
                        : rowIndex % 2 === 0 
                          ? 'bg-gray-100 dark:bg-gray-800' 
                          : 'bg-white dark:bg-gray-900'
                    }`}
                    onMouseEnter={() => setHoveredIndex(rowIndex)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {headers.map((header, index) => (
                      <div key={index} className="flex items-center space-x-4 py-1 pr-4">
                        <div className="w-2/5 flex-shrink-0">
                          <span className="font-medium text-muted-foreground capitalize text-left">
                            <TruncatedText text={`${header}:`} />
                          </span>
                        </div>
                        <div className="w-3/5 flex-shrink-0">
                          <span className="text-right block">
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