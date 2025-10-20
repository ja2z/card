import { useMemo, useEffect } from "react";
import Component from "./components/mobile-data-card";
import "./App.css";
import {
  client,
  useConfig,
  useElementData,
  useElementColumns,
} from "@sigmacomputing/plugin";
import * as d3 from "d3";

client.config.configureEditorPanel([
  { name: "source", type: "element" },
  { name: "columns", type: "column", source: "source", allowMultiple: true },
  { name: "Title", type: "text", defaultValue: "Untitled" },
  { name: "Show Header", type: "checkbox" },
  {
    name: "minCardWidth",
    type: "dropdown",
    values: ["300px", "400px", "500px", "600px", "700px", "800px"],
  },
  {
    name: "containerPadding",
    type: "dropdown",
    values: ["0rem", "1rem", "2rem", "3rem"],
    defaultValue: "2rem"
  },
]);

interface ExtendedColumnInfo extends Record<string, any> {
  name: string;
  columnType: string;
  format?: {
    format: string;
  };
}

// Helper function to detect if a column is a date/datetime type based on Sigma metadata
const isDateTimeColumn = (columnType: string): boolean => {
  // Check if the column type indicates it's a date or datetime field
  return columnType === 'datetime' || columnType === 'date';
};

// Helper function to detect if a numeric value looks like a Unix timestamp
const looksLikeTimestamp = (value: number): boolean => {
  // Unix timestamps in milliseconds are 13 digits
  // Unix timestamps in seconds are 10 digits
  const valueStr = Math.abs(value).toString();
  
  // Check if it's a reasonable timestamp (between year 1970 and 2100)
  // Milliseconds: 13 digits, range roughly 0 to 4102444800000
  // Seconds: 10 digits, range roughly 0 to 4102444800
  if (valueStr.length === 13 && value > 0 && value < 4102444800000) return true;
  if (valueStr.length === 10 && value > 0 && value < 4102444800) return true;
  
  return false;
};

// Helper function to format Unix timestamp
const formatTimestamp = (value: number): string => {
  try {
    // Determine if timestamp is in seconds or milliseconds
    const valueStr = Math.abs(value).toString();
    const timestamp = valueStr.length === 10 ? value * 1000 : value;
    
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return String(value);
    }
    
    // Format: "Jan 15, 3:30 PM"
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return formatter.format(date);
  } catch (e) {
    console.warn(`Failed to format timestamp ${value}`);
    return String(value);
  }
};

function App() {
  const config = useConfig();
  const sigmaData = useElementData(config.source);
  const columnInfo = useElementColumns(config.source) as Record<string, ExtendedColumnInfo>;
  const title = (client.config.getKey as any)("Title") as string;
  const minCardWidth = (client.config.getKey as any)("minCardWidth") as string;
  const showHeader = (client.config.getKey as any)("Show Header") as boolean;
  const { columns } = config;
  const containerPadding = (client.config.getKey as any)("containerPadding") as string;

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.padding = containerPadding;
    }
  }, [containerPadding]);

  interface TableRow {
    [key: string]: string | number;
  }

  const tableData = useMemo(() => {
    if (!sigmaData || !columnInfo || !columns || columns.length === 0) {
      return [];
    }

    const firstColumnId = columns[0];

    if (!sigmaData[firstColumnId] || !Array.isArray(sigmaData[firstColumnId])) {
      return [];
    }

    const numRows = sigmaData[firstColumnId].length;

    return Array.from({ length: numRows }, (_, rowIndex) => {
      const rowObj: TableRow = {};

      columns.forEach((columnId: string) => {
        if (columnInfo[columnId] && sigmaData[columnId]) {
          const friendlyName = columnInfo[columnId].name;
          let value = sigmaData[columnId][rowIndex];

          // Check if value is a Unix timestamp (number type)
          if (typeof value === 'number' && isUnixTimestamp(value)) {
            // Format as timestamp
            value = formatTimestamp(value);
          } 
          // Apply d3 number formatting if column is numeric and has a format specified
          else if (columnInfo[columnId].columnType === 'number' && 
              typeof value === 'number' && 
              columnInfo[columnId].format?.format) {
            try {
              value = d3.format(columnInfo[columnId].format.format)(value);
            } catch (e) {
              console.warn(`Failed to apply format ${columnInfo[columnId].format.format} to value ${value}`);
            }
          }

          rowObj[friendlyName] = value;
        }
      });

      return rowObj;
    });
  }, [sigmaData, columnInfo, columns]);

  return tableData ? (
    <Component
      data={tableData}
      title={title}
      minCardWidth={minCardWidth}
      showHeader={showHeader}
    />
  ) : null;
}

export default App;