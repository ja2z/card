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

// Add this interface to extend the WorkbookElementColumn type
interface ExtendedColumnInfo extends Record<string, any> {
  name: string;
  columnType: string;
  format?: {
    format: string;
  };
}

function App() {
  const config = useConfig();
  const sigmaData = useElementData(config.source);
  // Cast columnInfo to use our extended type
  const columnInfo = useElementColumns(config.source) as Record<string, ExtendedColumnInfo>;
  const title = (client.config.getKey as any)("Title") as string;
  const minCardWidth = (client.config.getKey as any)("minCardWidth") as string;
  const showHeader = (client.config.getKey as any)("Show Header") as boolean;
  const { columns } = config;
  const containerPadding = (client.config.getKey as any)("containerPadding") as string;

  // Add this useEffect to dynamically update the root padding
  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.padding = containerPadding;
    }
  }, [containerPadding]);

  // Define type for our output row object
  interface TableRow {
    [key: string]: string | number;
  }

  const tableData = useMemo(() => {
    // Safety check: ensure all required data structures are present
    if (!sigmaData || !columnInfo || !columns || columns.length === 0) {
      return [];
    }

    // Get first column ID to determine number of rows
    const firstColumnId = columns[0];

    // Safety check: ensure first column exists and is an array
    if (!sigmaData[firstColumnId] || !Array.isArray(sigmaData[firstColumnId])) {
      return [];
    }

    // Determine number of rows from first column's data
    const numRows = sigmaData[firstColumnId].length;

    // Create an array of row objects using Array.from
    // The array length will be numRows, and we'll populate each element
    return Array.from({ length: numRows }, (_, rowIndex) => {
      // Initialize empty object for this row
      const rowObj: TableRow = {};

      // Iterate through each column ID from the columns array
      columns.forEach((columnId: string) => {
        // Safety check: ensure both column info and data exist for this column
        if (columnInfo[columnId] && sigmaData[columnId]) {
          // Get the user-friendly column name from columnInfo
          const friendlyName = columnInfo[columnId].name;

          // Get the actual data value for this row and column
          let value = sigmaData[columnId][rowIndex];

          // Apply number formatting if column is numeric and has a format specified
          if (columnInfo[columnId].columnType === 'number' && 
              typeof value === 'number' && 
              columnInfo[columnId].format?.format) {
            try {
              value = d3.format(columnInfo[columnId].format.format)(value);
            } catch (e) {
              console.warn(`Failed to apply format ${columnInfo[columnId].format.format} to value ${value}`);
            }
          }

          // Add the value to our row object using the friendly name as the key
          rowObj[friendlyName] = value;
        }
      });

      // Return the completed row object
      return rowObj;
    });
  }, [sigmaData, columnInfo, columns]); // Removed numberFormatsArray from dependencies

//  console.log(JSON.stringify(tableData, null, 2));

  /* sample data format
  const tableData = [
    { name: "Bob", age: 40, state: "PA", amount: 10 },
    { name: "Joe", age: 30, state: "CA", amount: 20 },
    // ... more rows
  ];
*/
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
