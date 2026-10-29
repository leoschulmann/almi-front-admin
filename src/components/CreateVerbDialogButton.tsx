import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useEffect, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
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
import { postData, putData, getDataScalar } from "@/util/ApiClient.ts";
import { CreateVerbDto, createVerbSchema, Verb } from "@/model/Verb.ts";
import { plainToInstance } from "class-transformer";
import { TranslationsField } from "@/components/TranslationsField.tsx";
import { Binyan } from "@/model/VerbParameters.ts";
import {
  CreateVerbTranslation,
  VerbTranslation,
} from "@/model/VerbTranslation.ts";
import { aiMeanings } from "@/util/AiClient.ts";
import { hebrewLettersOnly } from "@/util/HebrewUtil.ts";

// Create dialog (no editVerbId) and edit dialog (editVerbId): the same form.
// In edit mode the value (changed through the infinitive form), root and binyan are read-only.
export function VerbDialog({
  open,
  onOpenChange,
  editVerbId,
  onCreated,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editVerbId?: number | null;
  onCreated?: (verb: Verb) => void;
  onUpdated?: (verb: Verb) => void;
}) {
  const editing = editVerbId != null;
  const [loadedVerb, setLoadedVerb] = useState<Verb | null>(null);
  const [loadingVerb, setLoadingVerb] = useState(false);
  const [sending, setSending] = useState<boolean>(false);
  const { binyans, gizrahs, prepositions, langs } = useDictionaryContext();
  const { selectedRoot } = useSelectedRoot();
  const [aiLoading, setAiLoading] = useState(false);
  // remounts the uncontrolled selects after values were set from outside
  const [aiRevision, setAiRevision] = useState(0);
  const [aiResult, setAiResult] = useState<{
    note: string;
    correction: string | null;
    unmatchedPrepositions: string[];
    error: string | null;
  } | null>(null);

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
    if (!editing && selectedRoot?.id) {
      form.setValue("rootId", selectedRoot.id);
    }
  }, [editing, selectedRoot, selectedRoot?.id, form]);

  function resetToDefaults() {
    form.reset({ ...defaultVerbData, rootId: selectedRoot?.id });
    setAiRevision((r) => r + 1);
    setAiResult(null);
  }

  // edit mode: load the full verb (the list holds only a short dto) every time the dialog opens
  useEffect(() => {
    if (!open || editVerbId == null) return;
    let cancelled = false;
    setLoadingVerb(true);
    setAiResult(null);
    getDataScalar(`verb/${editVerbId}`, Verb)
      .then((verb) => {
        if (cancelled) return;
        setLoadedVerb(verb);
        form.reset({
          value: verb.value,
          rootId: verb.root.id,
          binyanId: verb.binyan.id,
          gizrahId: verb.gizrahs.map((g) => g.id),
          prepositionId: verb.prepositions.map((p) => p.id),
          translations: verb.translations.map((t) => ({
            id: t.id,
            value: t.value,
            lang: t.lang,
          })),
        });
        setAiRevision((r) => r + 1);
      })
      .catch((error) => {
        console.error("Failed to load the verb:", error);
        if (!cancelled) onOpenChange(false);
      })
      .finally(() => {
        if (!cancelled) setLoadingVerb(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editVerbId, form]);

  async function suggestMeanings() {
    const { value, binyanId, gizrahId, prepositionId } = form.getValues();
    const binyan = binyans.find((b) => b.id === binyanId)?.value;
    const gizrot = gizrahs
      .filter((g) => gizrahId.includes(g.id))
      .map((g) => g.value);
    const rootName = editing ? loadedVerb?.root.name : selectedRoot?.name;
    if (!rootName || !binyan || gizrot.length === 0) {
      setAiResult({
        note: "",
        correction: null,
        unmatchedPrepositions: [],
        error: "Select a binyan and at least one gizrah first.",
      });
      return;
    }

    setAiLoading(true);
    setAiResult(null);
    try {
      const response = await aiMeanings({
        root: rootName,
        binyan,
        gizrot,
        infinitive: value,
      });

      if (!response.recognized) {
        setAiResult({
          note: response.note,
          correction: response.correction,
          unmatchedPrepositions: [],
          error: null,
        });
        return;
      }

      // translations by language replace the current ones for these languages
      const returnedLangs = Object.keys(response.translations);
      const kept = form
        .getValues("translations")
        .filter((t) => !returnedLangs.includes(t.lang));
      const suggested = returnedLangs.flatMap((lang) =>
        response.translations[lang].map(
          (t) => new CreateVerbTranslation(t, lang),
        ),
      );
      form.setValue("translations", [...kept, ...suggested]);

      // prepositions are dictionary entries: match them by text, add to the current selection
      const matchedIds: number[] = [];
      const unmatched: string[] = [];
      for (const p of response.prepositions) {
        const target = p.normalize("NFC");
        const found =
          prepositions.find((d) => d.value.normalize("NFC") === target) ??
          prepositions.find(
            (d) => hebrewLettersOnly(d.value) === hebrewLettersOnly(target),
          );
        if (found) matchedIds.push(found.id);
        else unmatched.push(p);
      }
      form.setValue("prepositionId", [
        ...new Set([...prepositionId, ...matchedIds]),
      ]);
      setAiRevision((r) => r + 1);

      setAiResult({
        note: response.note,
        correction: null,
        unmatchedPrepositions: unmatched,
        error: null,
      });
    } catch (error) {
      console.error("Meanings request failed:", error);
      setAiResult({
        note: "",
        correction: null,
        unmatchedPrepositions: [],
        error: "Request failed. Is almi-ai running?",
      });
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[30rem]">
        <DialogDescription className="hidden" />
        <DialogHeader>
          <DialogTitle className="text-center">
            {editing ? "Edit verb" : "Create verb for root"}
            <span className="text-2xl">
              {" "}
              {editing
                ? (loadedVerb?.value ?? "")
                : (selectedRoot?.name ?? "n/a")}
            </span>
          </DialogTitle>
        </DialogHeader>

        {loadingVerb && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-black" />
          </div>
        )}
        <Form {...form}>
          <form className={`space-y-8 ${loadingVerb ? "hidden" : ""}`}>
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
                    <Input
                      placeholder="unga-bunga"
                      disabled={editing}
                      {...field}
                    />
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
                      key={aiRevision}
                      disabled={editing}
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
                      key={aiRevision}
                      defaultValue={field.value.map(String)}
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
                      key={aiRevision}
                      defaultValue={field.value.map(String)}
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
                  <div className="flex items-start gap-2">
                    <FormControl>
                      <TranslationsField
                        translations={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="mt-7 shrink-0"
                      disabled={aiLoading}
                      title="Suggest translations and prepositions (needs binyan and gizrah)"
                      onClick={() => void suggestMeanings()}
                    >
                      {aiLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black" />
                      ) : (
                        <Sparkles />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        {aiResult && (
          <div className="text-sm space-y-1">
            {aiResult.error && <p className="text-red-600">{aiResult.error}</p>}
            {aiResult.note && (
              <p className="text-neutral-600">{aiResult.note}</p>
            )}
            {aiResult.correction && (
              <p>
                Not recognized. Suggested verb:{" "}
                <button
                  type="button"
                  dir="rtl"
                  className="text-lg text-green-700 underline"
                  onClick={() => {
                    form.setValue("value", aiResult.correction!);
                    setAiResult(null);
                  }}
                >
                  {aiResult.correction}
                </button>
              </p>
            )}
            {aiResult.unmatchedPrepositions.length > 0 && (
              <p className="text-amber-600">
                Not in the dictionary:{" "}
                <span dir="rtl">
                  {aiResult.unmatchedPrepositions.join(", ")}
                </span>
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            onClick={() => {
              onOpenChange(false);
              if (!editing) resetToDefaults();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-1/4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
            disabled={sending || loadingVerb}
            onClick={form.handleSubmit(async (data) => {
              try {
                setSending(true);

                if (editVerbId != null) {
                  const updated: Verb = await putData(
                    "verb/details",
                    {
                      id: editVerbId,
                      g: data.gizrahId,
                      p: data.prepositionId,
                      t: data.translations
                        .filter((t) => t.value.trim() !== "")
                        .map((t) => ({ id: t.id, t: t.value, l: t.lang })),
                    },
                    Verb,
                  );
                  onUpdated?.(updated);
                  onOpenChange(false);
                  return;
                }

                const payload: CreateVerbDto = plainToInstance(
                  CreateVerbDto,
                  data,
                  { ignoreDecorators: true },
                );

                const verb: Verb = await postData("verb", payload, Verb);
                onCreated?.(verb);

                onOpenChange(false);
                resetToDefaults();
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

  return (
    <>
      <Button
        disabled={!enabled}
        onClick={() => setOpen(true)}
        className="h-9 w-full flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        <Plus className="h-5 w-5" /> verb
      </Button>
      <VerbDialog
        open={isOpen}
        onOpenChange={setOpen}
        onCreated={(verb) =>
          onSuccess(verb.id, verb.value, verb.version, verb.translations)
        }
      />
    </>
  );
}

export default CreateVerbDialogButton;
