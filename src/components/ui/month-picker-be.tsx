"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const months = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

export function MonthPickerBE({
  id,
  name,
  defaultValue,
  required,
  onChange,
}: {
  id?: string;
  name?: string;
  defaultValue?: string; // Expects "YYYY-MM"
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  const [date, setDate] = React.useState<Date | undefined>(
    defaultValue ? new Date(`${defaultValue}-01T00:00:00`) : undefined,
  );

  // For the view in the popover
  const [viewYear, setViewYear] = React.useState<number>(
    date ? date.getFullYear() : new Date().getFullYear(),
  );
  const [isOpen, setIsOpen] = React.useState(false);

  const formatBE = (d: Date) => {
    const year = d.getFullYear() + 543;
    const month = months[d.getMonth()];
    return `${month} ${year}`;
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(viewYear, monthIndex, 1);
    setDate(newDate);
    setIsOpen(false);
    if (onChange) {
      // Create YYYY-MM format manually to avoid timezone issues with date-fns format
      const mm = String(monthIndex + 1).padStart(2, "0");
      onChange(`${viewYear}-${mm}`);
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? formatBE(date) : <span>เลือกเดือน</span>}
            </Button>
          }
        />
        <PopoverContent className="w-64 p-3" align="start">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              type="button"
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              onClick={() => setViewYear(viewYear - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">พ.ศ. {viewYear + 543}</div>
            <Button
              variant="outline"
              type="button"
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              onClick={() => setViewYear(viewYear + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, idx) => {
              const isSelected =
                date?.getMonth() === idx && date?.getFullYear() === viewYear;
              return (
                <Button
                  key={month}
                  type="button"
                  variant={isSelected ? "default" : "ghost"}
                  className="h-9 text-xs"
                  onClick={() => handleMonthSelect(idx)}
                >
                  {month}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {/* Visually hidden text input for form submission (native YYYY-MM) so HTML5 required validation works */}
      <input
        type="text"
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
        id={id}
        name={name}
        value={date ? format(date, "yyyy-MM") : ""}
        readOnly
      />
    </>
  );
}
