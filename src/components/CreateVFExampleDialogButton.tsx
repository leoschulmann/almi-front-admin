import {
  CreateVFormExampleDto,
  createVFormExampleDtoSchema,
  VFormExample,
} from "@/model/VFormExample.ts";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { aiExamples } from "@/util/AiClient.ts";
import { AI_LANGS, loadAiVerbContext } from "@/util/AiVerbContext.ts";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import { VerbForm } from "@/model/VerbForm.ts";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx"; // import { Select, SelectTrigger } from "@/components/ui/select.tsx";
import { TranslationsField } from "@/components/TranslationsField.tsx";
import { deleteData, postData, putData } from "@/util/ApiClient.ts";
import { plainToInstance } from "class-transformer";
import { Textarea } from "@/components/ui/textarea.tsx";
import { SelectGroup } from "@radix-ui/react-select";

export function CreateVFExampleDialogButton({
  enabled,
  onSuccess,
}: {
  enabled: boolean;
  onSuccess: (example: VFormExample) => void;
}) {
  const [isOpen, setOpen] = useState<boolean>(false);
  return (
    <>
      <Button
        className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        disabled={!enabled}
        onClick={() => setOpen(true)}
      >
        <Plus className="h-5 w-5" /> example
      </Button>
      <ExampleDialog open={isOpen} onOpenChange={setOpen} onSaved={onSuccess} />
    </>
  );
}

// create (no editExample) and edit (editExample set) dialog; the verb form of an existing example is read-only
export function ExampleDialog({
  open: isOpen,
  onOpenChange: setOpen,
  editExample = null,
  onSaved,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editExample?: VFormExample | null;
  onSaved: (example: VFormExample) => void;
  onDeleted?: (id: number) => void;
}) {
  const [sending, setSending] = useState<boolean>(false);
  const { verb, verbForms } = useSelectedVerb();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [localForms, setLocalForms] = useState<VerbForm[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const defaultCreateVFormExampleDto: CreateVFormExampleDto = {
    verbFormId: -1,
    value: "",
    translations: [],
  };

  const form = useForm<z.infer<typeof createVFormExampleDtoSchema>>({
    resolver: zodResolver(createVFormExampleDtoSchema),
    defaultValues: defaultCreateVFormExampleDto,
  });

  const editedForm = editExample
    ? verbForms.find(
        (f) =>
          f.tense === editExample.tense &&
          f.person === editExample.person &&
          f.plurality === editExample.plurality &&
          f.gender === editExample.gender,
      )
    : undefined;

  useEffect(() => {
    if (!isOpen) return;
    setLocalForms(verbForms.filter((vf) => vf.value.length > 0));
    setAiError(null);
    setConfirmDelete(false);
    if (editExample) {
      form.reset({
        verbFormId: editedForm?.id ?? -1,
        value: editExample.value,
        file: editExample.file,
        translations: editExample.translations.map((t) => ({
          id: t.id,
          value: t.value,
          lang: t.lang,
        })),
      });
    } else {
      form.reset(defaultCreateVFormExampleDto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editExample, verbForms]);

  async function removeExample() {
    if (!editExample) return;
    try {
      setSending(true);
      // DELETE /api/vform/example/{id}
      await deleteData(`vform/example/${editExample.id}`);
      onDeleted?.(editExample.id);
      setOpen(false);
    } catch (error) {
      console.error("Failed to delete example:", error);
      alert("Failed to delete the example. Please try again.");
    } finally {
      setSending(false);
    }
  }

  // fills the sentence and its translations for the chosen verb form
  async function suggestExample() {
    const formId = form.getValues("verbFormId");
    const vf = verbForms.find((f) => f.id === formId);
    if (!verb || !vf) {
      setAiError("Select a verb form first.");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    try {
      const context = await loadAiVerbContext(verb.id);
      const response = await aiExamples({
        ...context,
        forms: [
          {
            tense: vf.tense,
            person: vf.person,
            plurality: vf.plurality,
            gender: vf.gender,
            form: vf.value,
          },
        ],
        languages: AI_LANGS,
        perForm: 1,
      });
      const result = response.results[0];
      const example = result?.examples?.[0];
      if (!example) {
        setAiError(result?.error ?? "No example was generated.");
        return;
      }
      form.setValue("value", example.sentence, { shouldValidate: true });
      form.setValue(
        "translations",
        Object.entries(example.translations).map(([lang, value]) => ({
          value,
          lang,
        })),
      );
    } catch (error) {
      console.error("Example generation failed:", error);
      setAiError("Request failed. Is almi-ai running?");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="w-96">
        <DialogDescription className="hidden" />
        <DialogHeader>
          <DialogTitle className="text-center">
            {editExample ? "Edit example" : "Create example"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-8">
            <FormField
              name="verbFormId"
              control={form.control}
              render={({ field }) =>
                editExample ? (
                  <FormItem>
                    <FormLabel>Verb form</FormLabel>
                    <Input
                      dir="rtl"
                      readOnly
                      disabled
                      value={editedForm?.value ?? ""}
                    />
                  </FormItem>
                ) : (
                  <FormItem>
                    <FormLabel>Verb form</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(e) => field.onChange(parseInt(e, 10))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={"Select verb form"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-96">
                          {localForms.filter((vf) => vf.tense === "INFINITIVE")
                            .length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Infinitive</SelectLabel>
                              {localForms
                                .filter((vf) => vf.tense === "INFINITIVE")
                                .map((vf) => (
                                  <SelectItem
                                    key={
                                      vf.tense +
                                      vf.plurality +
                                      vf.gender +
                                      vf.person
                                    }
                                    value={vf.id.toString()}
                                  >
                                    {vf.value}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          )}
                          {localForms.filter((vf) => vf.tense === "PRESENT")
                            .length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Present</SelectLabel>
                              {localForms
                                .filter((vf) => vf.tense === "PRESENT")
                                .map((vf) => (
                                  <SelectItem
                                    key={
                                      vf.tense +
                                      vf.plurality +
                                      vf.gender +
                                      vf.person
                                    }
                                    value={vf.id.toString()}
                                  >
                                    {vf.value}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          )}
                          {localForms.filter((vf) => vf.tense === "PAST")
                            .length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Past</SelectLabel>
                              {localForms
                                .filter((vf) => vf.tense === "PAST")
                                .map((vf) => (
                                  <SelectItem
                                    key={
                                      vf.tense +
                                      vf.plurality +
                                      vf.gender +
                                      vf.person
                                    }
                                    value={vf.id.toString()}
                                  >
                                    {vf.value}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          )}
                          {localForms.filter((vf) => vf.tense === "FUTURE")
                            .length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Future</SelectLabel>
                              {localForms
                                .filter((vf) => vf.tense === "FUTURE")
                                .map((vf) => (
                                  <SelectItem
                                    key={
                                      vf.tense +
                                      vf.plurality +
                                      vf.gender +
                                      vf.person
                                    }
                                    value={vf.id.toString()}
                                  >
                                    {vf.value}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          )}
                          {localForms.filter((vf) => vf.tense === "IMPERATIVE")
                            .length > 0 && (
                            <SelectGroup>
                              <SelectGroup>Imperative</SelectGroup>
                              {localForms
                                .filter((vf) => vf.tense === "IMPERATIVE")
                                .map((vf) => (
                                  <SelectItem
                                    key={
                                      vf.tense +
                                      vf.plurality +
                                      vf.gender +
                                      vf.person
                                    }
                                    value={vf.id.toString()}
                                  >
                                    {vf.value}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )
              }
            />
            <FormField
              name="value"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Example</FormLabel>
                  <div className="flex items-start gap-2">
                    <FormControl>
                      <Textarea
                        dir="rtl"
                        placeholder="Example sentence in Hebrew"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      disabled={aiLoading}
                      title="Generate an example sentence with translations for the selected form"
                      onClick={() => void suggestExample()}
                    >
                      {aiLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black" />
                      ) : (
                        <Sparkles />
                      )}
                    </Button>
                  </div>
                  {aiError && <p className="text-sm text-red-600">{aiError}</p>}
                </FormItem>
              )}
            />
            <FormField
              name="translations"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Translations:</FormLabel>
                  <FormControl>
                    <TranslationsField
                      enableMultipleTranslations={false}
                      asColumns={true}
                      asTextAreas={true}
                      translations={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter className="sm:justify-between">
          {editExample ? (
            <Button
              type="button"
              variant={confirmDelete ? "destructive" : "outline"}
              disabled={sending}
              onClick={() =>
                confirmDelete ? void removeExample() : setConfirmDelete(true)
              }
            >
              <Trash2 />
              {confirmDelete ? "Really delete?" : "Delete"}
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="submit"
            className="w-1/4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
            disabled={sending}
            onClick={form.handleSubmit(async (data) => {
              try {
                setSending(true);

                if (editExample) {
                  // PUT /api/vform/example; the verb form cannot be changed
                  const example = await putData(
                    "vform/example",
                    {
                      id: editExample.id,
                      e: data.value,
                      f: editExample.file ?? null,
                      tr: data.translations
                        .filter((t) => t.value.trim() !== "")
                        .map((t) => ({ id: t.id, t: t.value, l: t.lang })),
                    },
                    VFormExample,
                  );
                  onSaved(example);
                  setOpen(false);
                  return;
                }

                const payload: CreateVFormExampleDto = plainToInstance(
                  CreateVFormExampleDto,
                  data,
                  { ignoreDecorators: true },
                );

                const example = await postData(
                  "vform/example",
                  payload,
                  VFormExample,
                );
                onSaved(example);
                setOpen(false);
                form.reset(defaultCreateVFormExampleDto);
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
