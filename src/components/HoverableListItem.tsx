import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { Settings, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";

export function HoverableListItem({
  clickCallback,
  editCallback,
  deleteCallback,
  displayName,
  toolTipDisplay,
  isSelected = false,
  showSeparator = true,
}: {
  clickCallback: () => void;
  editCallback: () => void;
  deleteCallback: () => void;
  displayName: string;
  toolTipDisplay: string;
  isSelected: boolean;
  showSeparator: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { lang } = useSelectedLang();

  return (
    <li key={displayName}>
      <div
        className={`text-sm cursor-pointer text-center truncate hover:bg-gray-100 relative group
                      ${isSelected ? "font-bold bg-gray-100" : ""}`}
        onClick={clickCallback}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="w-full text-left">
              <div className="cursor-pointer text-center">{displayName}</div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{toolTipDisplay}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="absolute right-7 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 active:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  editCallback();
                }}
              >
                <Settings className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className={"absolute -bottom-0 -translate-x-1/2"}>
              <p>{lang.code == "RU" ? "Редактировать" : "Edit"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 active:opacity-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className={"absolute -translate-x-1/2 bottom-0"}>
              <p>{lang.code == "RU" ? "Удалить" : "Delete"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {showSeparator && <Separator className="my-2" />}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {lang.code == "RU" ? "Вы уверены?" : "Are you sure?"}
            </DialogTitle>
            <DialogDescription>
              {lang.code == "RU"
                ? "Это действие нельзя отменить."
                : "This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                deleteCallback();
                setIsOpen(false);
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
