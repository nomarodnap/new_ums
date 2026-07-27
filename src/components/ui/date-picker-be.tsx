"use client";

import * as React from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePickerBE({
  id,
  name,
  defaultValue,
  required,
  disabled,
}: {
  id?: string;
  name?: string;
  defaultValue?: string | Date | null;
  required?: boolean;
  disabled?: boolean;
}) {
  const [date, setDate] = React.useState<Date | undefined>(
    defaultValue ? new Date(defaultValue) : undefined
  );

  const formatBE = (d: Date) => {
    const year = d.getFullYear() + 543;
    const dayMonth = format(d, "d MMMM", { locale: th });
    return `${dayMonth} ${year}`;
  };

  return (
    <>
      <Popover>
        <PopoverTrigger render={
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? formatBE(date) : <span>เลือกวันที่</span>}
          </Button>
        } />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
          />
        </PopoverContent>
      </Popover>
      {/* Visually hidden text input for form submission (native YYYY-MM-DD) so HTML5 required validation works */}
      <input
        type="text"
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
        id={id}
        name={name}
        value={date ? format(date, "yyyy-MM-dd") : ""}
        disabled={disabled}
        readOnly
      />
    </>
  );
}
