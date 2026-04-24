import * as React from "react"
import { format } from "date-fns"
import { enUS, uk } from "date-fns/locale"
import { ChevronDownIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({ selected, onSelect }) {
  const [month, setMonth] = React.useState(selected || new Date());
  const [isEditingYear, setIsEditingYear] = React.useState(false);
  const [yearInput, setYearInput] = React.useState(month.getFullYear().toString());

  const { t, i18n } = useTranslation();

  const dateLocale = i18n.language?.startsWith('uk') ? uk : enUS;

  React.useEffect(() => {
    setYearInput(month.getFullYear().toString());
  }, [month]);

  const handlePrevMonth = () => {
    const newDate = new Date(month);
    newDate.setMonth(newDate.getMonth() - 1);
    setMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(month);
    newDate.setMonth(newDate.getMonth() + 1);
    setMonth(newDate);
  };

  const applyYear = () => {
    const newYear = parseInt(yearInput, 10);
    if (!isNaN(newYear) && yearInput.length >= 4) {
      const newDate = new Date(month);
      newDate.setFullYear(newYear);
      setMonth(newDate);
    } else {
      setYearInput(month.getFullYear().toString());
    }
    setIsEditingYear(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") applyYear();
    if (e.key === "Escape") {
      setIsEditingYear(false);
      setYearInput(month.getFullYear().toString());
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!selected}
          className="w-[212px] justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
        >
          {selected ? format(selected, "PPP", { locale: dateLocale }) : <span>{t('datepicker.pick_a_date')}</span>}
          <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">

        <div className="flex justify-center pt-3 relative items-center px-2 pb-2">
          <Button
            variant="outline"
            className="absolute left-2 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 text-sm font-medium">
            <span className="capitalize">{format(month, "LLLL", { locale: dateLocale })}</span>
            {isEditingYear ? (
              <input
                autoFocus
                type="number"
                className="w-16 h-6 px-1 py-0 border rounded-md text-sm bg-background outline-none focus:ring-2 focus:ring-ring"
                value={yearInput}
                onChange={(e) => setYearInput(e.target.value)}
                onBlur={applyYear}
                onKeyDown={handleKeyDown}
              />
            ) : (
              <span
                className="cursor-pointer hover:bg-muted px-1 py-0.5 rounded-md transition-colors"
                onClick={() => setIsEditingYear(true)}
                title={t('datepicker.change_year')}
              >
                {month.getFullYear()}
              </span>
            )}
          </div>

          <Button
            variant="outline"
            className="absolute right-2 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            onSelect(date);
            if (date) setMonth(date);
          }}
          month={month}
          onMonthChange={setMonth}
          className="mt-0 pt-0"
          locale={dateLocale}
          components={{
            Caption: () => null,
            MonthCaption: () => null,
            Nav: () => null,
          }}
        />
      </PopoverContent>
    </Popover>
  )
}