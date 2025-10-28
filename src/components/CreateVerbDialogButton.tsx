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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useSelectedRoot } from "@/ctx/SelectedRootCtx.tsx";
import { MultiSelect } from "@/components/ui/multi-select.tsx";
import { DialogDescription } from "@radix-ui/react-dialog";
import { postData } from "@/util/ApiClient.ts";
import { CreateVerbDto, createVerbSchema, Verb } from "@/model/Verb.ts";
import { plainToInstance } from "class-transformer";
import { TranslationsField } from "@/components/TranslationsField.tsx";
import { Binyan } from "@/model/VerbParameters.ts";
import { VerbTranslation } from "@/model/VerbTranslation.ts";


function CreateVerbDialogButton({
  enabled,
  onSuccess,
}: {
  enabled: boolean;
  onSuccess: (
    id: number,
    value: string,
    version: number,
    translations: VerbTranslation[],
  ) => void;
}) {
  const [isOpen, setOpen] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const { binyans, gizrahs, prepositions, langs } = useDictionaryContext();
  const { selectedRoot } = useSelectedRoot();

  const defaultVerbData: CreateVerbDto = {
    value: "אאאא",
    rootId: -1,
    binyanId: 1,
    gizrahId: [],
    prepositionId: [],
    translations: [],
  };

  const form = useForm<z.infer<typeof createVerbSchema>>({
    resolver: zodResolver(createVerbSchema),
    defaultValues: defaultVerbData,
  });

  // Synchronize `rootId` in the form with the selected root
  useEffect(() => {
    if (selectedRoot?.id) {
      form.setValue("rootId", selectedRoot.id);
    }
  }, [selectedRoot, selectedRoot?.id, form]);

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
        <DialogDescription className="hidden" />
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
                  <Input type="hidden" {...field} />
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
            <FormField
              control={form.control}
              name="gizrahId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gizrah's</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={gizrahs.map((g) => ({
                        label: g.value,
                        value: g.id.toString(),
                      }))}
                      onValueChange={(values: string[]) => {
                        field.onChange(
                          values.map((val: string) => parseInt(val, 10)),
                        );
                      }}
                      // defaultValue={}
                      placeholder="Select gizrah"
                      variant="secondary"
                      maxCount={3}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prepositionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prepositions</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={prepositions.map((p) => ({
                        label: p.value,
                        value: p.id.toString(),
                      }))}
                      onValueChange={(values: string[]) => {
                        field.onChange(
                          values.map((val: string) => parseInt(val, 10)),
                        );
                      }}
                      // defaultValue={}
                      placeholder="Select preposition"
                      variant="secondary"
                      maxCount={3}
                    />
                  </FormControl>
                  <FormDescription />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="translations"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <TranslationsField
                      translations={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
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
              form.reset({ ...defaultVerbData, rootId: selectedRoot?.id });
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-1/4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
            disabled={sending}
            onClick={form.handleSubmit(async (data) => {
              try {
                setSending(true);

                const payload: CreateVerbDto = plainToInstance(
                  CreateVerbDto,
                  data,
                  { ignoreDecorators: true },
                );

                const verb: Verb = await postData("verb", payload, Verb);
                onSuccess(verb.id, verb.value, verb.version, verb.translations);

                setOpen(false);
                form.reset({ ...defaultVerbData, rootId: selectedRoot?.id });
              } catch (error) {
                console.error("Failed to submit the form:", error);
                alert(
                  "An error occurred while submitting the form. Please try again.",
                );
              } finally {
                setSending(false);
              }
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

export default CreateVerbDialogButton
