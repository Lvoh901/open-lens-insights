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
    <div className="grid gap-4 lg:gap-8 md:grid-cols-2">
      <div className="grid gap-2">
        <p>Dataset</p>

        <Select value={dataset} onValueChange={(v) => onChange(v as DatasetId)}>
          <SelectTrigger id="dataset" className="w-full">
            <SelectValue placeholder="Select a dataset" />
          </SelectTrigger>
          
          <SelectContent>
            <SelectItem value="economy_gdp_growth_kenya">Kenya • GDP Growth</SelectItem>
            <SelectItem value="population_total_kenya">Kenya • Population, total</SelectItem>
            <SelectItem value="economy_inflation_kenya">Kenya • Inflation, consumer prices</SelectItem>
            <SelectItem value="health_life_expectancy_kenya">Kenya • Life expectancy at birth</SelectItem>
            <SelectItem value="development_access_to_electricity_kenya">Kenya • Access to electricity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <p>Time Window</p>

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
