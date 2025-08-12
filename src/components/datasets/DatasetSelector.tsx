import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import React from "react";
import { DatasetId } from "@/services/openData";

export type DatasetSelectorProps = {
  dataset: DatasetId;
  onChange: (next: DatasetId) => void;
  windowPercent: number;
  onWindowPercentChange: (v: number) => void;
};

export const DatasetSelector: React.FC<DatasetSelectorProps> = ({ dataset, onChange, windowPercent, onWindowPercentChange }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="dataset">Dataset</Label>
        <Select value={dataset} onValueChange={(v) => onChange(v as DatasetId)}>
          <SelectTrigger id="dataset" className="w-full">
            <SelectValue placeholder="Select a dataset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="economy_gdp_growth_us">Economics • US GDP Growth</SelectItem>
            <SelectItem value="environment_temp_nyc">Environment • NYC Daily Mean Temperature</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Time Window</Label>
        <Slider
          value={[windowPercent]}
          onValueChange={(arr) => onWindowPercentChange(arr[0] ?? 100)}
          min={20}
          max={100}
          step={5}
        />
        <div className="text-xs text-muted-foreground">Showing last {windowPercent}% of the series</div>
      </div>
    </div>
  );
};
