import { Skeleton } from "@/components/ui/skeleton.tsx";
import { GrammaticalGender } from "@/model/GrammaticalGender.ts";
import { GrammaticalPerson } from "@/model/GrammaticalPerson.ts";
import { Plurality } from "@/model/Plurality.ts";
import { getIcon } from "@/util/VerbFormCombinator.ts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { TriangleAlert } from "lucide-react";
import React from "react";

export function renderMessageCentered(message: string) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm text-center">
      <p>{message}</p>
    </div>
  );
}

export function renderSkeleton(count: number = 30) {
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-5 flex ${
            index % 3 === 0 ? "w-1/2" : index % 3 === 1 ? "w-2/3" : "w-3/4"
          } mb-4`}
        />
      ))}
    </div>
  );
}

export function renderIcon(
  gender: GrammaticalGender,
  person: GrammaticalPerson,
  plurality: Plurality,
) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <img
            src={getIcon(gender, person, plurality)}
            className="w-6 h-6"
            alt={`gender: ${gender}, person: ${person}, plurality: ${plurality}`}
          ></img>
        </TooltipTrigger>
        <TooltipContent>
          <p>{`gender: ${gender}, person: ${person}, plurality: ${plurality}`}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
