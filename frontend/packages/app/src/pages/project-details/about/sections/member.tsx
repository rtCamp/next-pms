/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import { Button, Combobox } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { useEmployeeLookup } from "@/hooks/useEmployeeLookup";
import type { EmployeeLookupOption } from "@/hooks/useEmployeeLookup";
import { AddMemberModal } from "../components/addMemberModal";
import { ExpandableList } from "../components/expandableList";
import { MemberRow } from "../components/memberRow";
import { Section } from "../section";
import { useSidebar } from "../sidebarContext";

function toComboboxOptions(
  options: EmployeeLookupOption[],
  userId?: string,
  name?: string,
) {
  const mapped = options
    .filter((option) => option.userId)
    .map((option) => ({ label: option.label, value: option.userId! }));

  if (userId && !mapped.some((option) => option.value === userId)) {
    mapped.unshift({ label: name ?? userId, value: userId });
  }

  return mapped;
}

export function MemberSection() {
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const teamMembers = useSidebar((state) => state.teamMembers);
  const projectManager = useSidebar((state) => state.projectManager);
  const engineeringManager = useSidebar((state) => state.engineeringManager);
  const currentMemberUserIds = useSidebar(
    (state) => state.currentMemberUserIds,
  );
  const memberRoleByUserId = useSidebar((state) => state.memberRoleByUserId);
  const addMember = useSidebar((state) => state.addMember);
  const removeMember = useSidebar((state) => state.removeMember);
  const updateManager = useSidebar((state) => state.updateManager);

  const [projectManagerQuery, setProjectManagerQuery] = useState("");
  const { options: projectManagerOptions, isLoading: projectManagerLoading } =
    useEmployeeLookup({
      shouldFetch: true,
      query: projectManagerQuery,
      roles: ["Project Manager"],
    });
  const projectManagerComboboxOptions = useMemo(
    () =>
      toComboboxOptions(
        projectManagerOptions,
        projectManager?.email,
        projectManager?.name,
      ),
    [projectManagerOptions, projectManager?.email, projectManager?.name],
  );

  const [engineeringManagerQuery, setEngineeringManagerQuery] = useState("");
  const {
    options: engineeringManagerOptions,
    isLoading: engineeringManagerLoading,
  } = useEmployeeLookup({ shouldFetch: true, query: engineeringManagerQuery });
  const engineeringManagerComboboxOptions = useMemo(
    () =>
      toComboboxOptions(
        engineeringManagerOptions,
        engineeringManager?.email,
        engineeringManager?.name,
      ),
    [
      engineeringManagerOptions,
      engineeringManager?.email,
      engineeringManager?.name,
    ],
  );

  return (
    <>
      <Section value="members" title="Members">
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-4.5 text-base text-ink-gray-5 mb-4">
          <span>Project Manager</span>
          <Combobox
            key={projectManager?.email}
            inputClassName="w-fit h-8 border-transparent bg-white"
            loading={projectManagerLoading}
            options={projectManagerComboboxOptions}
            placeholder="N/A"
            searchValue={projectManagerQuery}
            onSearchChange={setProjectManagerQuery}
            value={projectManager?.email ?? null}
            onChange={(value) => updateManager("project_manager", value)}
            openOnFocus
          />

          <span>Lead Engineer</span>
          <Combobox
            key={engineeringManager?.email}
            inputClassName="w-fit h-8 border-transparent bg-white"
            loading={engineeringManagerLoading}
            options={engineeringManagerComboboxOptions}
            placeholder="N/A"
            searchValue={engineeringManagerQuery}
            onSearchChange={setEngineeringManagerQuery}
            value={engineeringManager?.email ?? null}
            onChange={(value) => updateManager("engineering_manager", value)}
            openOnFocus
          />
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-ink-gray-8">
            Team members
          </h3>

          <Button
            icon={AddSm}
            aria-label="Add member"
            onClick={() => setAddMemberOpen(true)}
          />
        </div>

        {teamMembers.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-gray-4">No Members</p>
        ) : (
          <ExpandableList
            items={teamMembers}
            itemLabel="members"
            getKey={(member) => member.email}
            renderItem={(member) => <MemberRow member={member} />}
          />
        )}
      </Section>
      <AddMemberModal
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        currentMemberIds={currentMemberUserIds}
        memberRoleByUserId={memberRoleByUserId}
        onAdd={addMember}
        onRemove={removeMember}
      />
    </>
  );
}
