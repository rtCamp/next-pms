/**
 * External dependencies.
 */
import { createContext, ReactNode, useContext, useState } from "react";

type MutateFn = (...args: unknown[]) => void;

interface FormContextType {
  docname: string;
  doctype: string;
  mutateData: MutateFn | null;
  setDocname: React.Dispatch<React.SetStateAction<string>>;
  setDoctype: React.Dispatch<React.SetStateAction<string>>;
  setMutateData: (fn: MutateFn) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

interface MyProviderProps {
  children: ReactNode;
}

export const FormContextProvider = ({ children }: MyProviderProps) => {
  const [docname, setDocname] = useState<string>("");
  const [doctype, setDoctype] = useState<string>("");
  const [mutateData, setMutateData] = useState<MutateFn | null>(null);

  return (
    <FormContext.Provider
      value={{
        docname,
        setDocname,
        doctype,
        setDoctype,
        mutateData,
        setMutateData,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormContextProvider");
  }
  return context;
};
