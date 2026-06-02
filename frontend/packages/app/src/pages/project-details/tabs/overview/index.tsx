/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import {
  Button,
  Skeleton,
  TextEditor,
  useToasts,
} from "@rtcamp/frappe-ui-react";
import { useForm } from "@tanstack/react-form";
import { FrappeError, useFrappeUpdateDoc } from "frappe-react-sdk";
import { Pencil } from "lucide-react";

/**
 * Internal dependencies.
 */
import { mergeClassNames, parseFrappeErrorMsg } from "@/lib/utils";
import { useProjectDetail } from "../../context";
import { OverviewSection } from "./components/overviewSection";
import { overviewSchema, type OverviewFormValues } from "./schema";
import { Communication } from "./sections/communication";
import { Marketing } from "./sections/marketing";
import { RepositoryConnections } from "./sections/repository-connections";
import { Sourcing } from "./sections/sourcing";
import { Specifics } from "./sections/specifics";

export type { OverviewFormValues };

const toBoolStr = (value: 0 | 1 | undefined) => {
  if (value === undefined) {
    return "";
  }
  return value === 1 ? "1" : "0";
};

const useOverviewForm = (
  defaultValues: OverviewFormValues,
  onSubmit: (args: { value: OverviewFormValues }) => Promise<void>,
) =>
  useForm({
    defaultValues,
    validators: { onSubmit: overviewSchema },
    onSubmit,
  });

export type OverviewFormApi = ReturnType<typeof useOverviewForm>;

export function Overview() {
  const { project, isLoading } = useProjectDetail((state) => state);

  if (isLoading || !project) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <section key={i} className="flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-20 w-full" />
          </section>
        ))}
      </div>
    );
  }

  return <OverviewForm />;
}

function OverviewForm() {
  const { project, projectId, mutate } = useProjectDetail((state) => state);

  const defaultValues: OverviewFormValues = {
    summary: project?.custom_executive_summary ?? "",
    keyGoals: project?.custom_key_goals ?? "",
    priority: project?.priority ?? "",
    complexity: project?.custom_complexity ?? "",
    keyAccount: project?.custom_key_account ?? "",
    source: project?.custom_source ?? "",
    primaryLocation: project?.custom_territory ?? "",
    previousCms: project?.custom_previous_cms ?? "",
    pointOfContact: project?.custom_client_point_of_contact ?? "",
    frequency: project?.frequency ?? "",
    ndaSigned: toBoolStr(project?.custom_restricted_under_nda),
    caseStudyApproved: toBoolStr(project?.custom_permission_for_case_study),
    testimonialApproval: toBoolStr(project?.custom_permission_for_testimonial),
    testimonialContact: project?.custom_testimonial_contact ?? "",
  };

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToasts();
  const { updateDoc } = useFrappeUpdateDoc();

  const form = useOverviewForm(defaultValues, async ({ value }) => {
    setSubmitting(true);
    try {
      await updateDoc("Project", projectId, {
        custom_executive_summary: value.summary,
        custom_key_goals: value.keyGoals,
        priority: value.priority,
        custom_complexity: value.complexity,
        custom_key_account: value.keyAccount,
        custom_source: value.source,
        custom_territory: value.primaryLocation,
        custom_previous_cms: value.previousCms,
        custom_client_point_of_contact: value.pointOfContact,
        frequency: value.frequency,
        custom_restricted_under_nda: Number(value.ndaSigned) as 0 | 1,
        custom_permission_for_case_study: Number(value.caseStudyApproved) as
          | 0
          | 1,
        custom_permission_for_testimonial: Number(value.testimonialApproval) as
          | 0
          | 1,
        custom_testimonial_contact: value.testimonialContact,
      });
      mutate();
      form.reset(value);
      setIsEditing(false);
      toast.success("Overview updated");
    } catch (err) {
      toast.error(parseFrappeErrorMsg(err as FrappeError));
    } finally {
      setSubmitting(false);
    }
  });

  const resetForm = useCallback(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink-gray-8">Overview</h1>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              variant="subtle"
              onClick={() => {
                resetForm();
                setIsEditing(false);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.isDirty, state.isSubmitting] as const}
            >
              {([isDirty, isSubmitting]) => (
                <Button
                  variant="solid"
                  onClick={() => {
                    void form.handleSubmit();
                  }}
                  disabled={!isDirty || isSubmitting || submitting}
                >
                  Save
                </Button>
              )}
            </form.Subscribe>
          </div>
        ) : (
          <Button
            variant="solid"
            iconLeft={() => <Pencil size={16} />}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      <form.Field name="summary">
        {(field) => (
          <OverviewSection title="Summary">
            <TextEditor
              editable={isEditing && !submitting}
              content={field.state.value}
              onChange={(value) => field.handleChange(value)}
              fixedMenu={false}
              editorClass={mergeClassNames(
                "text-sm text-ink-gray-7 w-full max-w-full p-2",
                isEditing && "rounded-md ring-1 ring-outline-gray-2",
              )}
            />
          </OverviewSection>
        )}
      </form.Field>

      <form.Field name="keyGoals">
        {(field) => {
          return (
            <OverviewSection title="Key goals of the project">
              <TextEditor
                editable={isEditing && !submitting}
                content={field.state.value}
                onChange={(value) => field.handleChange(value)}
                fixedMenu={false}
                editorClass={
                  isEditing
                    ? "text-sm text-ink-gray-7 w-full max-w-full rounded-md p-2 ring-1 ring-outline-gray-2"
                    : "text-sm text-ink-gray-7 w-full max-w-full p-2"
                }
              />
            </OverviewSection>
          );
        }}
      </form.Field>

      <Specifics form={form} isEditing={isEditing} submitting={submitting} />
      <Sourcing form={form} isEditing={isEditing} submitting={submitting} />
      <Communication
        form={form}
        isEditing={isEditing}
        submitting={submitting}
      />
      <Marketing form={form} isEditing={isEditing} submitting={submitting} />
      <RepositoryConnections />
    </div>
  );
}
