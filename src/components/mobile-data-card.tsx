'use client'

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

type DataRow = Record<string, string | number>

interface ComponentProps {
  title?: string;
  data?: DataRow[];
  cardHeight?: string;
}

export default function Component({ title, data, cardHeight = '400px' }: ComponentProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  // Hard-coded data as fallback
  const defaultData: DataRow[] = [
    { name: 'Bob', age: 40, state: 'PA', amount: 10 },
    { name: 'Joe', age: 30, state: 'CA', amount: 20 },
    { name: 'Alice', age: 35, state: 'NY', amount: 15 },
    { name: 'Emma', age: 28, state: 'TX', amount: 25 },
  ]

  // Use passed in data if available, otherwise use default data
  const displayData = data || defaultData

  if (displayData.length === 0) {
    return <p>No data available.</p>
  }

  const headers = Object.keys(displayData[0])

  return (
    <div className="w-full max-w-md mx-auto relative">
      {title && (
        <div className="sticky top-0 bg-background z-10 pb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">Showing {displayData.length} rows</p>
        </div>
      )}
      <Card className={title ? 'mt-4' : ''}>
        <CardContent className="p-0">
 
          <ScrollArea style={{ height: cardHeight }}>
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
                    <div key={index} className="flex justify-between py-1 space-x-4">
                      <span className="font-medium text-muted-foreground capitalize">{header}:</span>
                      <span className="text-right">{row[header]}</span>
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
  )
}