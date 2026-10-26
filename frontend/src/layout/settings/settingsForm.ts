import {
  computed,
  inject,
  provide,
  type InjectionKey,
  type WritableComputedRef,
} from "vue";
import type { SystemSettingsForm } from "./systemSettings";

const formKey: InjectionKey<SystemSettingsForm> = Symbol("systemSettingsForm");

/** Shares the dialog's system settings form with its panels; the two system tabs edit one doc. */
export function provideSystemSettingsForm(form: SystemSettingsForm) {
  provide(formKey, form);
}

/** The system settings form, with models for its checks, numbers and child tables. */
export function useSystemSettingsForm() {
  const form = inject(formKey);
  if (!form)
    throw new Error("useSystemSettingsForm() needs the Settings dialog");

  type FlagField = {
    [K in keyof SystemSettingsForm]-?: SystemSettingsForm[K] extends
      0 | 1 | undefined
      ? K
      : never;
  }[keyof SystemSettingsForm];
  type NumberField = {
    [K in keyof SystemSettingsForm]-?: SystemSettingsForm[K] extends
      0 | 1 | undefined
      ? never
      : SystemSettingsForm[K] extends number | undefined
        ? K
        : never;
  }[keyof SystemSettingsForm];

  /** A 0 / 1 field as a checkbox's boolean. */
  function flag(field: FlagField): WritableComputedRef<boolean> {
    return computed({
      get: () => Boolean(form![field]),
      set: (on) => {
        form![field] = on ? 1 : 0;
      },
    });
  }

  /** An Int field as a number input; empty saves as 0, as in React. */
  function number(field: NumberField): WritableComputedRef<string> {
    return computed({
      get: () => String(form![field] ?? ""),
      set: (value) => {
        form![field] = Number(value) || 0;
      },
    });
  }

  /** A one-column child table as the list of its values. */
  function table<
    T extends "ignored_role" | "allowed_departments" | "designations",
  >(field: T, column: string): WritableComputedRef<string[]> {
    return computed({
      get: () =>
        ((form![field] ?? []) as Record<string, string | undefined>[])
          .map((row) => row[column])
          .filter((value): value is string => Boolean(value)),
      set: (values) => {
        (form as Record<string, unknown>)[field] = values.map((value) => ({
          [column]: value,
        }));
      },
    });
  }

  return { form, flag, number, table };
}
