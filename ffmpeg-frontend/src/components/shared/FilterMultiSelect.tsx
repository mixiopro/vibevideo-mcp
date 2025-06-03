"use client";

import * as React from "react";
import { CheckIcon, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
  CommandItem, // Added CommandItem here
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

// Define the structure for filter options, including categories
interface FilterParameter {
  name: string;
  type: "number" | "string" | "boolean" | "enum";
  description: string;
  default?: any;
  min?: number;
  max?: number;
  options?: string[]; // For string (with options) or enum types
}

interface FilterOption {
  label: string;
  value: string;
  ffmpeg_type: "audio" | "video" | "common"; // Added ffmpeg_type
  complex_filter?: boolean; // Added complex_filter property
  default_extension?: string; // Added default_extension property
  parameters?: FilterParameter[];
}

interface FilterCategory {
    category: string;
    filters: FilterOption[];
}

interface FilterMultiSelectProps {
  filters: FilterCategory[]; // All available filters, categorized
  value: string[]; // Array of selected filter values (global state)
  onValueChange: (value: string[]) => void; // Callback to update the global selectedFilters array
  disabled?: boolean;
  filterType?: "audio" | "video" | "common"; // Optional prop to filter displayed options
  categoryName: string; // New prop for the button text
}

export function FilterMultiSelect({
  filters,
  value,
  onValueChange,
  disabled,
  filterType, // Use the filterType prop
  categoryName, // Use the new categoryName prop
}: FilterMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (filterValue: string) => {
    const isSelected = value.includes(filterValue);
    let newValue: string[];

    if (isSelected) {
      // Remove filter
      newValue = value.filter((val) => val !== filterValue);
    } else {
      // Add filter
      newValue = [...value, filterValue];
    }
    onValueChange(newValue); // Call the global update function
  };

  // Filter categories and filters based on the optional filterType prop
  const filteredCategories = filters
    .map(category => {
      const filteredFilters = filterType
        ? category.filters.filter(filter => filter.ffmpeg_type === filterType)
        : category.filters;
      return {
        ...category,
        filters: filteredFilters,
      };
    })
    .filter(category => category.filters.length > 0); // Only keep categories with filters after filtering


  // Get only the filters from the original list that are currently selected
  // This ensures we count selected filters correctly even if they are filtered out by filterType prop
  const allAvailableFilters = filters.flatMap(cat => cat.filters);
  const selectedFiltersInAllCategories = value.filter(filterValue =>
      allAvailableFilters.some(f => f.value === filterValue)
  );


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-dashed"
          disabled={disabled}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {categoryName} {/* Use the categoryName prop here */}
          {selectedFiltersInAllCategories.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedFiltersInAllCategories.length}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedFiltersInAllCategories.length > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedFiltersInAllCategories.length} selected
                  </Badge>
                ) : (
                  selectedFiltersInAllCategories.map((filterValue) => {
                    // Find the filter label for the selected value
                    const filter = allAvailableFilters.find(f => f.value === filterValue);
                    return filter ? (
                      <Badge
                        variant="secondary"
                        key={filterValue}
                        className="rounded-sm px-1 font-normal"
                      >
                        {filter.label}
                      </Badge>
                    ) : null;
                  })
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start"> {/* Adjust width as needed */}
        <Command>
          <CommandInput placeholder="Filter by filter..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {filteredCategories.map((category) => ( // Use filteredCategories here
              <CommandGroup key={category.category} heading={category.category}>
                {category.filters.map((filter) => {
                  const isSelected = value.includes(filter.value); // Check against global selectedFilters
                  return (
                    <CommandItem
                      key={filter.value}
                      onSelect={() => handleSelect(filter.value)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <CheckIcon className={cn("h-4 w-4")} />
                      </div>
                      <span>{filter.label}</span>
                      {filter.parameters && filter.parameters.length > 0 && (
                        <span className="ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs text-muted-foreground">
                          ({filter.parameters.length} params)
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
            ))}
            {selectedFiltersInAllCategories.length > 0 && ( // Clear all button uses total selected count
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onValueChange([])} // Clear all selected filters
                    className="justify-center text-center"
                  >
                    Clear all filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}