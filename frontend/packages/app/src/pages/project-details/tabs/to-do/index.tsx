/**
 * External dependencies.
 */
import { useState } from "react";
import { Button } from "@rtcamp/frappe-ui-react";
import { Plus } from "lucide-react";

/**
 * Internal dependencies.
 */
import { CreateTodoModal } from "./create-todo";

export function Todo() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-ink-gray-8">To-do</h1>
        <Button
          variant="solid"
          label="Add to-do"
          iconLeft={Plus}
          onClick={() => setIsCreateOpen(true)}
        />
      </div>

      <CreateTodoModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
