"use client";

/* -------------------------------------------------------------------------- */
/*                             External Dependency                            */
/* -------------------------------------------------------------------------- */

import React, { useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                             Internal Dependency                            */
/* -------------------------------------------------------------------------- */

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn, lowerCase } from "@/lib/utils";
import countries from "@/data/countries.json";

import { type CountryProps } from "@/lib/types";
import { useDropdownStore } from "@/store/dropdown";

interface CountryDropdownProps {
  disabled?: boolean;
}

const CountryDropdown = ({ disabled }: CountryDropdownProps) => {
  const {
    countryValue,
    setCountryValue,
    openCountryDropdown,
    setOpenCountryDropdown,
  } = useDropdownStore();
  const C = countries as CountryProps[];
  useEffect(() => {
    // console.log(C);
    C.map((country) => {
      // console.log(country)
    });
  }, []);
  return (
    <Popover open={openCountryDropdown} onOpenChange={setOpenCountryDropdown}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={openCountryDropdown}
          className="w-[300px] justify-between z-10 rounded-[6px] border !border-[var(--border)] !bg-[var(--background)] hover:!bg-[var(--background)] focus:!bg-[var(--background)] focus:!outline-none focus:!ring-2 focus:!ring-[var(--ring)] focus:!ring-offset-2 focus:!ring-offset-[var(--background)]"
          disabled={disabled}
        >
          <span>
            {countryValue ? (
              <div className="flex gap-2 justify-between">
                <span>
                  {
                    countries.find(
                      (country) => lowerCase(country.name) === countryValue
                    )?.emoji
                  }
                </span>
                <span>
                  {
                    countries.find(
                      (country) => lowerCase(country.name) === countryValue
                    )?.name
                  }
                </span>
              </div>
            ) : (
              <span>Select Country...</span>
            )}
          </span>
          <span className="flex justify-center items-center gap-1">
            {countryValue == "" ? (
              ""
            ) : (
              <span
                className="bg-border text-white p-2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-accent hover:scale-110 transition-transform duration-150 cursor-pointer shadow-lg z-50"
                onClick={() => {
                  setCountryValue("");
                  setOpenCountryDropdown(false);
                }}
              >
                x
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] rounded-[6px] border border-[#27272a] p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-[300px] w-full">
              {C.map((country) => (
                <CommandItem
                  key={country.id}
                  value={country.name}
                  onSelect={(currentValue) => {
                    setCountryValue(
                      currentValue === lowerCase(country.name)
                        ? currentValue
                        : ""
                    );
                    setOpenCountryDropdown(false);
                  }}
                  className="flex cursor-pointer items-center justify-between text-xs hover:!bg-[#27272a] hover:!text-white transition-transform duration-100"
                >
                  <div className="flex items-end gap-2 hover:scale-105">
                    <span>{country.emoji}</span>
                    <span className="">{country.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      countryValue === lowerCase(country.name)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CountryDropdown;
