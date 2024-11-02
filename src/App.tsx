import { useMemo } from "react";
import Component from "./components/mobile-data-card";
import "./App.css";
import {
  client,
  useConfig,
  useElementData,
  useElementColumns,
} from "@sigmacomputing/plugin";

client.config.configureEditorPanel([
  { name: "source", type: "element" },
  { name: "columns", type: "column", source: "source", allowMultiple: true },
  { name: "Title", type: "text", defaultValue: "Untitled" },
  {
    name: "Card Height",
    type: "dropdown",
    values: ["400px", "500px", "600px", "700px", "800px"],
  },
]);

function App() {
  const config = useConfig();
  const sigmaData = useElementData(config.source);
  const columnInfo = useElementColumns(config.source);
  const title = (client.config.getKey as any)("Title") as string;
  const cardHeight = (client.config.getKey as any)("Card Height") as string;

  // arrays of the ids corresponding to the "dimension" and "measures" data columns from the editor panel
  const { columns } = config;

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
          const value = sigmaData[columnId][rowIndex];

          // Add the value to our row object using the friendly name as the key
          rowObj[friendlyName] = value;
        }
      });

      // Return the completed row object
      return rowObj;
    });
  }, [sigmaData, columnInfo, columns]); // Re-run when any of these dependencies change

  console.log(JSON.stringify(tableData, null, 2));

  /* sample data format
  const tableData = [
    { name: "Bob", age: 40, state: "PA", amount: 10 },
    { name: "Joe", age: 30, state: "CA", amount: 20 },
    // ... more rows
  ];
*/
  return tableData ? (
    <Component data={tableData} title={title} cardHeight={cardHeight} />
  ) : null;
}

export default App;
