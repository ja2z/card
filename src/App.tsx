import { useMemo, useEffect, useState, useCallback } from "react";
import Component from "./components/mobile-data-card";
import "./App.css";
import {
  client,
  useConfig,
  useElementData,
  useElementColumns,
} from "@sigmacomputing/plugin";
import * as d3 from "d3";
import { Button } from "./components/ui/button";
import { Settings as SettingsIcon } from "lucide-react";
import Settings, { DEFAULT_SETTINGS } from "./Settings";
import { PluginSettings } from "./types/sigma";

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
  { name: "config", type: "text", label: "Settings Config (JSON)", defaultValue: "{}" },
  { name: "editMode", type: "toggle", label: "Edit Mode" },
]);

interface ExtendedColumnInfo extends Record<string, any> {
  name: string;
  columnType: string;
  format?: {
    format: string;
  };
}

// Helper function to format date/datetime values
const formatDateValue = (value: any): string => {
  try {
    // Handle null/undefined
    if (value == null) return '';
    
    // If it's already a string, return it (Sigma might pre-format dates)
    if (typeof value === 'string') return value;
    
    // If it's a number, try to interpret as Unix timestamp
    if (typeof value === 'number') {
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
    }
    
    // If it's a Date object
    if (value instanceof Date) {
      const formatter = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      return formatter.format(value);
    }
    
    return String(value);
  } catch (e) {
    console.warn(`Failed to format date value ${value}`, e);
    return String(value);
  }
};

// Mirror of theme presets for applying CSS variables after save
const PRESET_THEMES: Record<string, { name: string; colors: Record<string, string> }> = {
  light: {
    name: 'Light',
    colors: {
      '--background': '0 0% 100%',
      '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '240 10% 3.9%',
      '--primary': '240 9% 10%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '240 4.8% 95.9%',
      '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%',
      '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%',
      '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%',
      '--input': '240 5.9% 90%',
      '--ring': '240 5.9% 10%',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      '--background': '240 10% 3.9%',
      '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%',
      '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%',
      '--popover-foreground': '0 0% 98%',
      '--primary': '0 0% 98%',
      '--primary-foreground': '240 5.9% 10%',
      '--secondary': '240 3.7% 15.9%',
      '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%',
      '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%',
      '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%',
      '--input': '240 3.7% 15.9%',
      '--ring': '240 4.9% 83.9%',
    },
  },
};

const applyThemeFromSettings = (settings: PluginSettings): void => {
  const theme = settings.styling?.theme || 'light';
  const colors = theme === 'custom'
    ? (settings.styling?.customColors || PRESET_THEMES.light.colors)
    : (PRESET_THEMES[theme]?.colors || PRESET_THEMES.light.colors);
  Object.entries(colors).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value);
  });
};

function App() {
  const config = useConfig();
  const sigmaData = useElementData(config.source);
  const columnInfo = useElementColumns(config.source) as Record<string, ExtendedColumnInfo>;
  const title = (client.config.getKey as any)("Title") as string;
  const minCardWidth = (client.config.getKey as any)("minCardWidth") as string;
  const showHeader = (client.config.getKey as any)("Show Header") as boolean;
  const editMode = (client.config.getKey as any)("editMode") as boolean;
  const { columns } = config;
  const containerPadding = (client.config.getKey as any)("containerPadding") as string;
  
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState<PluginSettings>(DEFAULT_SETTINGS);

  // Parse config JSON and load settings
  useEffect(() => {
    if (config.config?.trim()) {
      try {
        const parsedConfig = JSON.parse(config.config) as Partial<PluginSettings>;
        const newSettings: PluginSettings = { ...DEFAULT_SETTINGS, ...parsedConfig };
        setSettings(newSettings);
      } catch (err) {
        console.error('Invalid config JSON:', err);
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [config.config]);

  // Apply saved styling whenever settings change
  useEffect(() => {
    if (settings?.styling) {
      applyThemeFromSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    const root = document.getElementById('root');
    if (root) {
      root.style.padding = containerPadding;
    }
  }, [containerPadding]);

  const handleSettingsSave = useCallback((newSettings: PluginSettings): void => {
    setSettings(newSettings);
    setShowSettings(false);
  }, []);

  const handleShowSettings = useCallback((): void => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback((): void => {
    setShowSettings(false);
  }, []);

  interface TableRow {
    [key: string]: string | number;
  }

  // Get friendly column names for display
  const columnNames = useMemo(() => {
    if (!columnInfo || !columns || columns.length === 0) {
      return [];
    }
    return columns.map((columnId: string) => columnInfo[columnId]?.name || columnId);
  }, [columnInfo, columns]);

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
          const columnType = columnInfo[columnId].columnType;

          // Format based on columnType metadata (not guessing!)
          if (columnType === 'datetime' || columnType === 'date') {
            // Only format as date if Sigma says it's a date/datetime type
            value = formatDateValue(value);
          } 
          // Apply d3 number formatting if column is numeric and has a format specified
          else if (columnType === 'number' && 
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

  return (
    <div className="relative">
      {editMode && (
        <Button 
          className="absolute top-2 right-2 z-10 gap-2"
          onClick={handleShowSettings}
          size="sm"
        >
          <SettingsIcon className="h-4 w-4" />
          Settings
        </Button>
      )}
      
      {tableData && (
        <Component
          data={tableData}
          title={title}
          minCardWidth={minCardWidth}
          showHeader={showHeader}
        />
      )}

      <Settings
        isOpen={showSettings}
        onClose={handleCloseSettings}
        currentSettings={settings}
        onSave={handleSettingsSave}
        client={client}
        title={title}
        showHeader={showHeader}
        minCardWidth={minCardWidth}
        containerPadding={containerPadding}
        columns={columnNames}
      />
    </div>
  );
}

export default App;