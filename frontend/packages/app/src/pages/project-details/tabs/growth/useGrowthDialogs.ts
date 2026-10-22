/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { useToasts } from "@rtcamp/frappe-ui-react";
import { useFrappeDeleteDoc, type FrappeError } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { GROWTH_DETAIL_PARAM, GROWTH_DOCTYPE } from "./constants";

export function useGrowthDialogs(onDeleted: () => void) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [editName, setEditName] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string | null>(null);
  const [, setSearchParams] = useSearchParams();
  const { deleteDoc } = useFrappeDeleteDoc();
  const toast = useToasts();

  const openCreate = useCallback((status?: string) => {
    setEditName(null);
    setCreateStatus(status ?? null);
    setIsCreateOpen(true);
  }, []);
  const closeCreate = useCallback(() => {
    setIsCreateOpen(false);
    setEditName(null);
    setCreateStatus(null);
  }, []);
  const openEdit = useCallback((name: string) => {
    setEditName(name);
    setIsCreateOpen(true);
  }, []);
  const openDelete = useCallback((name: string) => setDeleteName(name), []);
  const closeDelete = useCallback(() => setDeleteName(null), []);

  const deleteGrowth = useCallback(
    async (name: string) => {
      try {
        await deleteDoc(GROWTH_DOCTYPE, name);
        setSearchParams((prev) => {
          prev.delete(GROWTH_DETAIL_PARAM);
          return prev;
        });
        onDeleted();
        toast.success("Growth initiative deleted");
      } catch (err) {
        toast.error(parseFrappeErrorMsg(err as FrappeError));
      }
    },
    [deleteDoc, setSearchParams, onDeleted, toast],
  );

  return useMemo(
    () => ({
      isCreateOpen,
      createStatus,
      editName,
      deleteName,
      openCreate,
      closeCreate,
      openEdit,
      openDelete,
      closeDelete,
      deleteGrowth,
    }),
    [
      isCreateOpen,
      createStatus,
      editName,
      deleteName,
      openCreate,
      closeCreate,
      openEdit,
      openDelete,
      closeDelete,
      deleteGrowth,
    ],
  );
}
