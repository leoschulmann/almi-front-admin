import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { TriangleAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { startsWithHebrewLetter } from "@/util/HebrewUtil.ts"; 

export function InputWithWarning({
  showWarning = false,
  warningMessage = "some warning message",
  warningIcon,
  value,
  className,
  textClassName = "",
  placeholderClassName = "", 
  ...props
}: {
  showWarning?: boolean | ((value: string) => boolean);
  warningMessage?: string;
  warningIcon?: React.ReactNode;
  value?: string;
  textClassName?: string;
  placeholderClassName?: string; 
} & React.ComponentPropsWithoutRef<typeof Input>) {

  const [direction, setDirection] = useState('ltr');

  useEffect(() => {
    if (startsWithHebrewLetter(value)) {
      setDirection('rtl');
    } else {
      setDirection('ltr');
    }
  }, [value]);


  const shouldShowWarning = React.useMemo(() => {
    if (typeof showWarning === "function") {
      return showWarning(value?.toString() || "");
    }
    return showWarning;
  }, [showWarning, value]);
  
  return (
    <div className="relative flex items-center">
      <Input
        className={cn(
          className,
          textClassName,
          placeholderClassName,
          "disabled:border-dashed",
        )}
        value={value}
        dir={direction}
        {...props}
      />
      {shouldShowWarning && (
        <div className="absolute right-2 top-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                {warningIcon || (
                  <TriangleAlert className="h-5 w-5 text-orange-600" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>{warningMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
