import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useDictionaryContext } from "@/ctx/InitialDictionariesLoadCtx.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createVerbSchema } from "@/model/CreateVerbDto.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form.tsx";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select.tsx";
import { Binyan } from "@/model/Binyan.ts";
import { useSelectedRoot } from "@/ctx/SelectedRootCtx.tsx";

export function CreateVerbDialogButton({ enabled }: { enabled: boolean }) {
  const [isOpen, setOpen] = useState<boolean>(false);
  const [sending, setSending] = useState(false);
  const { binyans, gizrahs, prepositions } = useDictionaryContext();
  const { selectedRoot } = useSelectedRoot();

  const form = useForm<z.infer<typeof createVerbSchema>>({
    resolver: zodResolver(createVerbSchema),
    defaultValues: {
      value: "אאאא",
      rootId: -1,
      binyanId: 1,
    },
  });

  // Synchronize `rootId` in the form with the selected root
  useEffect(() => {
    if (selectedRoot?.id) {
      form.setValue("rootId", selectedRoot.id);
    }
  }, [selectedRoot?.id, form]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={!enabled}
          className="h-9 w-full flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" /> verb
        </Button>
      </DialogTrigger>
      <DialogContent className="w-96">
        <DialogHeader>
          <DialogTitle className="text-center">
            Create verb for root
            <span className="text-2xl"> {selectedRoot?.name ?? "n/a"}</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-8">
            <FormField
              control={form.control}
              name="rootId"
              render={({ field }) => (
                <FormItem>
                  <input type="hidden" {...field} />
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verb</FormLabel>
                  <FormControl>
                    <Input placeholder="unga-bunga" {...field} />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="binyanId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Binyan</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(parseInt(value, 10))
                      }
                      defaultValue={field.value.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a binyan" />
                      </SelectTrigger>
                      <SelectContent>
                        {binyans.map((b: Binyan) => (
                          <SelectItem key={b.id} value={b.id.toString()}>
                            {b.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            onClick={() => {
              setOpen(false);
              form.reset();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-1/4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
            disabled={sending}
            onClick={form.handleSubmit(async (data) => {
              setSending(true);
              console.log(
                `sending verb=${data.value}, root-id=${data.rootId}, binyan-id=${data.binyanId}`,
              );
              await new Promise((resolve) => setTimeout(resolve, 1300));
              setSending(false);
              setOpen(false);
              form.reset();
            })}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
