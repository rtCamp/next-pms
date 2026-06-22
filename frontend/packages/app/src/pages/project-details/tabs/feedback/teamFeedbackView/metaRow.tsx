/**
 * External dependencies.
 */
import { Avatar } from "@rtcamp/frappe-ui-react";

interface MetaRowTextProps {
  label: string;
  value: string;
  person?: never;
}

interface MetaRowPersonProps {
  label: string;
  person: { name: string; image?: string };
  value?: never;
}

type MetaRowProps = MetaRowTextProps | MetaRowPersonProps;

export function MetaRow({ label, value, person }: MetaRowProps) {
  return (
    <div className="flex items-center gap-4 py-1">
      <span className="w-28 shrink-0 text-base text-ink-gray-6">{label}</span>
      <div className="flex flex-1 items-center gap-2 px-2">
        {person ? (
          <>
            <Avatar size="xs" label={person.name} image={person.image} />
            <span className="text-base text-ink-gray-6">{person.name}</span>
          </>
        ) : (
          <span className="text-base text-ink-gray-6">{value}</span>
        )}
      </div>
    </div>
  );
}
