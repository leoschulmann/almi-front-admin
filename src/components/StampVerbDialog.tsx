import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form.tsx";
import {
  deleteData,
  getDataScalar,
  getDataVector,
  postData,
  postDataVector,
} from "@/util/ApiClient.ts";
import { CreateVerbDto, Verb, VerbShortDto } from "@/model/Verb.ts";
import {
  BulkCreateVerbFormDto,
  BulkCreateVerbFormItemDto,
  VerbForm,
} from "@/model/VerbForm.ts";
import { Root, RootPage } from "@/model/Root.ts";
import { InputRoot } from "@/components/InputRoot.tsx";
import { PreviewRow, stampVerb } from "@/util/VerbStamper.ts";
import { toPluralityGender, toTensePerson } from "@/model/VerbParameters.ts";
import { CreateVerbTranslation, VerbTranslation } from "@/model/VerbTranslation.ts";
import { TranslationsField } from "@/components/TranslationsField.tsx";

interface EditablePreviewRow {
  row: PreviewRow;
  edited: string;
}

export function StampVerbDialog({
  open,
  onOpenChange,
  modelVerbId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelVerbId: number | null;
  onSuccess: (
    id: number,
    value: string,
    version: number,
    translations: VerbTranslation[],
  ) => void;
}) {
  const [modelVerb, setModelVerb] = useState<Verb | null>(null);
  const [modelForms, setModelForms] = useState<VerbForm[]>([]);
  const [loadingModel, setLoadingModel] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [roots, setRoots] = useState<Root[]>([]);

  const [targetGlyphs, setTargetGlyphs] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const targetRootValue = targetGlyphs.filter(Boolean).join("");

  const [previewRows, setPreviewRows] = useState<EditablePreviewRow[]>([]);
  const [stampError, setStampError] = useState<string | null>(null);

  const [conflictValue, setConflictValue] = useState<string | null>(null);

  const [translations, setTranslations] = useState<CreateVerbTranslation[]>(
    [],
  );
  // TranslationsField renders shadcn FormLabel/FormItem, which need a
  // react-hook-form context to exist even though this dialog doesn't use
  // react-hook-form for its own state (see CreateVerbDialogButton for the
  // form-driven usage this mirrors).
  const translationsForm = useForm();

  const [sending, setSending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [orphanVerbId, setOrphanVerbId] = useState<number | null>(null);
  const [deletingOrphan, setDeletingOrphan] = useState(false);

  // Reset & load model verb data whenever the dialog opens for a given verb.
  useEffect(() => {
    if (!open || modelVerbId === null) return;

    setLoadingModel(true);
    setLoadError(null);
    setTargetGlyphs(["", "", "", ""]);
    setPreviewRows([]);
    setStampError(null);
    setConflictValue(null);
    setSaveError(null);
    setOrphanVerbId(null);
    setTranslations([]);

    (async () => {
      try {
        const [verb, forms, rootPage] = await Promise.all([
          getDataScalar(`verb/${modelVerbId}`, Verb),
          getDataVector(`vform/${modelVerbId}`, VerbForm),
          getDataScalar("root", RootPage, {
            searchParams: { page: 0, size: 1000 },
          }),
        ]);
        setModelVerb(verb);
        setModelForms(forms);
        setRoots(rootPage.content);
      } catch (error) {
        console.error("Failed to load model verb data:", error);
        setLoadError(
          "Failed to load model verb data. Close the dialog and try again.",
        );
      } finally {
        setLoadingModel(false);
      }
    })();
  }, [open, modelVerbId]);

  // Recompute the diff/substitution preview whenever the target root or the
  // model data changes. Pure client-side, no network (AD-2).
  useEffect(() => {
    if (!modelVerb || modelForms.length === 0) return;
    if (targetRootValue.length < 2) {
      setPreviewRows([]);
      setStampError(null);
      return;
    }

    try {
      const rows = stampVerb(
        modelForms,
        modelVerb.root.name,
        targetRootValue,
        modelVerb.binyan,
      );
      setPreviewRows(rows.map((row) => ({ row, edited: row.result })));
      setStampError(null);
    } catch (error) {
      setPreviewRows([]);
      setStampError(error instanceof Error ? error.message : String(error));
    }
  }, [modelVerb, modelForms, targetRootValue]);

  const matchedRoot = useMemo(
    () => roots.find((r) => r.name === targetRootValue) ?? null,
    [roots, targetRootValue],
  );

  const infinitiveEdited = useMemo(() => {
    const infinitiveRow = previewRows.find(
      (r) => r.row.sourceForm.tense === "INFINITIVE",
    );
    return infinitiveRow?.edited ?? null;
  }, [previewRows]);

  // Local CAP-3 conflict check: only meaningful once the target root resolves
  // to an already-existing Root — a brand-new root cannot have a conflicting
  // verb yet.
  useEffect(() => {
    if (!matchedRoot || !infinitiveEdited) {
      setConflictValue(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // GET /api/verb/root/{targetRootId}
        const verbs = await getDataVector(
          `verb/root/${matchedRoot.id}`,
          VerbShortDto,
        );
        if (cancelled) return;
        const conflict = verbs.find((v) => v.value === infinitiveEdited);
        setConflictValue(conflict ? conflict.value : null);
      } catch (error) {
        console.error("Failed to check for conflicting verbs:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [matchedRoot, infinitiveEdited]);

  function updateRowValue(index: number, value: string) {
    setPreviewRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, edited: value } : r)),
    );
  }

  function resetAndClose() {
    if (sending) return;
    if (
      orphanVerbId !== null &&
      !confirm(
        `There is an orphaned verb (id ${orphanVerbId}) that still needs to be deleted. Close anyway?`,
      )
    ) {
      return;
    }
    onOpenChange(false);
    setModelVerb(null);
    setModelForms([]);
    setTargetGlyphs(["", "", "", ""]);
    setPreviewRows([]);
    setConflictValue(null);
    setSaveError(null);
    setOrphanVerbId(null);
    setTranslations([]);
  }

  const canSave =
    !!modelVerb &&
    previewRows.length > 0 &&
    !stampError &&
    !conflictValue &&
    !sending &&
    !orphanVerbId;

  async function handleSave() {
    if (!modelVerb || !infinitiveEdited) return;

    setSending(true);
    setSaveError(null);

    try {
      // Resolve the target root: reuse an already-loaded exact match, or
      // create it only now (not on every keystroke) to avoid garbage Root
      // rows from unfinished input.
      let targetRootId = matchedRoot?.id ?? null;
      if (targetRootId === null) {
        const createdRoot = await postData("root", targetRootValue, Root);
        targetRootId = createdRoot.id;
      }

      // Binyan and gizrahs are copied 1:1 from the model verb; prepositions
      // stay empty (no existing edit flow to fill them in later, but they
      // aren't required to use the verb — out of scope for this dialog).
      const createVerbPayload = new CreateVerbDto(
        infinitiveEdited,
        targetRootId,
        modelVerb.binyan.id,
        modelVerb.gizrahs.map((g) => g.id),
        [],
        translations.filter((t) => t.value.trim() !== ""),
      );

      const newVerb = await postData("verb", createVerbPayload, Verb);

      try {
        const bulkDto = new BulkCreateVerbFormDto(
          newVerb.id,
          previewRows.map(
            (r) =>
              new BulkCreateVerbFormItemDto(
                r.edited,
                toTensePerson(r.row.sourceForm.tense, r.row.sourceForm.person),
                toPluralityGender(
                  r.row.sourceForm.plurality,
                  r.row.sourceForm.gender,
                ),
              ),
          ),
        );

        await postDataVector("vform/bulk", bulkDto, VerbForm);

        onSuccess(newVerb.id, newVerb.value, newVerb.version, newVerb.translations);
        resetAndClose();
      } catch (bulkError) {
        // AD-6: createVerb succeeded but bulk failed — surface the orphaned
        // verbId and let the admin delete it manually. No auto-rollback.
        console.error("Bulk vform save failed:", bulkError);
        setOrphanVerbId(newVerb.id);
        setSaveError(
          `Verb ${newVerb.id} was created, but saving its forms failed. Delete the orphaned verb and try again.`,
        );
      }
    } catch (error) {
      console.error("Failed to save stamped verb:", error);
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save the verb (possibly a conflict). Nothing was created.",
      );
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteOrphan() {
    if (orphanVerbId === null) return;
    if (
      !confirm(
        `Delete orphaned verb ${orphanVerbId}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingOrphan(true);
    try {
      // DELETE /api/verb/{id}
      await deleteData(`verb/${orphanVerbId}`);
      setOrphanVerbId(null);
      setSaveError(null);
    } catch (error) {
      console.error("Failed to delete orphaned verb:", error);
      alert("Failed to delete the orphaned verb. Please try again.");
    } finally {
      setDeletingOrphan(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetAndClose();
        else onOpenChange(next);
      }}
    >
      <DialogContent className="w-[95vw] h-[90vh] max-w-none flex flex-col">
        <DialogDescription className="hidden" />
        <DialogHeader>
          <DialogTitle className="text-center">
            Stamp verb from{" "}
            <span className="text-2xl">{modelVerb?.value ?? "..."}</span>
          </DialogTitle>
        </DialogHeader>

        {loadingModel ? (
          <div className="flex-grow flex items-center justify-center">
            Loading model verb...
          </div>
        ) : loadError ? (
          <div className="flex-grow flex items-center justify-center text-red-500">
            {loadError}
          </div>
        ) : (
          <div className="flex-grow flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center gap-4">
              <span className="font-medium">Target root:</span>
              <InputRoot glyphs={targetGlyphs} setGlyphs={setTargetGlyphs} />
              {matchedRoot ? (
                <span className="text-sm text-muted-foreground">
                  existing root (id {matchedRoot.id})
                </span>
              ) : targetRootValue.length >= 2 ? (
                <span className="text-sm text-muted-foreground">
                  new root — will be created on save
                </span>
              ) : null}
            </div>

            <div>
              <span className="font-medium">Translations:</span>
              <Form {...translationsForm}>
                <TranslationsField
                  translations={translations}
                  onChange={setTranslations}
                />
              </Form>
            </div>

            {conflictValue && (
              <div className="text-red-500 text-sm">
                Verb "{conflictValue}" already exists for this root. Change
                the target root or edit the infinitive value below.
              </div>
            )}

            {stampError && (
              <div className="text-red-500 text-sm">{stampError}</div>
            )}

            <ScrollArea className="flex-grow border rounded p-3 overflow-y-auto">
              {previewRows.length === 0 ? (
                <div className="text-muted-foreground text-sm p-3">
                  Enter a target root of the same length as the model root (
                  {modelVerb?.root.name}) to see the preview.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="p-1">Tense/Person</th>
                      <th className="p-1">Source</th>
                      <th className="p-1">Result</th>
                      <th className="p-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-1 whitespace-nowrap">
                          {r.row.sourceForm.tense}
                          {r.row.sourceForm.person !== "NONE"
                            ? ` / ${r.row.sourceForm.person}`
                            : ""}
                          {r.row.sourceForm.plurality !== "NONE"
                            ? ` / ${r.row.sourceForm.plurality}`
                            : ""}
                          {r.row.sourceForm.gender !== "NONE"
                            ? ` / ${r.row.sourceForm.gender}`
                            : ""}
                        </td>
                        <td className="p-1" dir="rtl">
                          {r.row.sourceForm.value}
                        </td>
                        <td className="p-1">
                          <Input
                            dir="rtl"
                            value={r.edited}
                            onChange={(e) =>
                              updateRowValue(index, e.target.value)
                            }
                            className="h-8"
                          />
                        </td>
                        <td className="p-1">
                          {(r.row.letterAbsent || r.row.needsReview) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle
                                    className={`h-4 w-4 ${
                                      r.row.needsReview
                                        ? "text-red-500"
                                        : "text-amber-500"
                                    }`}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {r.row.needsReview
                                      ? (r.row.needsReviewReason ??
                                        "Needs review")
                                      : "Root letter absent in this form (expected for this gizra)"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ScrollArea>

            {saveError && (
              <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-300 rounded p-3">
                <span className="text-red-600 text-sm">{saveError}</span>
                {orphanVerbId !== null && (
                  <Button
                    variant="destructive"
                    disabled={deletingOrphan}
                    onClick={handleDeleteOrphan}
                    className="flex items-center gap-2 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete orphaned verb
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={sending} onClick={resetAndClose}>
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
