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
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Plus } from "lucide-react";
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
import { postData } from "@/util/ApiClient.ts";
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
  const [sending, setSending] = useState<boolean>(false);
  const { verbForms } = useSelectedVerb();
  const [localForms, setLocalForms] = useState<VerbForm[]>([]);

  const defaultCreateVFormExampleDto: CreateVFormExampleDto = {
    verbFormId: -1,
    value: "",
    translations: [],
  };

  const form = useForm<z.infer<typeof createVFormExampleDtoSchema>>({
    resolver: zodResolver(createVFormExampleDtoSchema),
    defaultValues: defaultCreateVFormExampleDto,
  });

  useEffect(() => {
    if (isOpen) {
      setLocalForms(verbForms.filter((vf) => vf.value.length > 0));
    }
  }, [isOpen, verbForms]);

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          disabled={!enabled}
        >
          <Plus className="h-5 w-5" /> example
        </Button>
      </DialogTrigger>
      <DialogContent className="w-96">
        <DialogDescription className="hidden" />
        <DialogHeader>
          <DialogTitle className="text-center">Create example</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-8">
            <FormField
              name="verbFormId"
              control={form.control}
              render={({ field }) => (
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
                        {localForms.filter((vf) => vf.tense === "PAST").length >
                          0 && (
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
              )}
            />
            <FormField
              name="value"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Example</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Example sentence in Hebrew"
                      {...field}
                    />
                  </FormControl>
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
        <DialogFooter>
          <Button
            type="submit"
            className="w-1/4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
            disabled={sending}
            onClick={form.handleSubmit(async (data) => {
              try {
                setSending(true);

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
                onSuccess(example);
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
