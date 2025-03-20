/**
 * External dependencies.
 */
import { FC, PropsWithChildren } from "react";
import { useFrappeAuth } from "frappe-react-sdk";
import { createContext } from "use-context-selector";

interface UserContextProps {
  state: {
    isLoading: boolean;
    currentUser: string | null;
  };
  actions: {
    logout: () => Promise<void>;
    updateCurrentUser: VoidFunction;
  };
}

export const UserContext = createContext<UserContextProps>({
  state: {
    currentUser: null,
    isLoading: false,
  },
  actions: {
    logout: () => Promise.resolve(),
    updateCurrentUser: () => {},
  },
});

export const UserProvider: FC<PropsWithChildren> = ({ children }) => {
  const { logout, currentUser, updateCurrentUser, isLoading } = useFrappeAuth();
  const handleLogout = async () => {
    return logout().then(() => {
      window.location.replace("/login?redirect-to=/timesheet");
      window.location.reload();
    });
  };

  return (
    <UserContext.Provider
      value={{
        state: {
          isLoading,
          currentUser: currentUser ?? null,
        },
        actions: {
          updateCurrentUser,
          logout: handleLogout,
        },
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
