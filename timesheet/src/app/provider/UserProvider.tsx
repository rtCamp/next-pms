import { useFrappeAuth } from "frappe-react-sdk";
import { FC, PropsWithChildren } from "react";
import { createContext } from "react";
interface UserContextProps {
  isLoading: boolean;
  currentUser: string|null;
  logout: () => Promise<void>;
  updateCurrentUser: VoidFunction;
}

export const UserContext = createContext<UserContextProps>({
  currentUser: null,
  isLoading: false,
  logout: () => Promise.resolve(),
  updateCurrentUser: () => {},
});

export const UserProvider: FC<PropsWithChildren> = ({ children }) => {
  const { logout, currentUser, updateCurrentUser, isLoading } = useFrappeAuth();
  const handleLogout = async () => {
    return logout()
      .then(() => {
        window.location.replace("/login?redirect-to=/timesheet");
        window.location.reload();
      });
  };

  return (
    <UserContext.Provider
      value={{
        isLoading,
        updateCurrentUser,
        logout: handleLogout,
        currentUser: currentUser ?? null,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
