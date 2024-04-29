import { useFrappeAuth } from "frappe-react-sdk";
import { FC, PropsWithChildren } from "react";
import { createContext } from "react";
import { useNavigate } from "react-router-dom";
interface UserContextProps {
  isLoading: boolean;
  currentUser: string;
  logout: () => Promise<void>;
  updateCurrentUser: VoidFunction;
}

export const UserContext = createContext<UserContextProps>({
  currentUser: "",
  isLoading: false,
  logout: () => Promise.resolve(),
  updateCurrentUser: () => {},
});

export const UserProvider: FC<PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const { logout, currentUser, updateCurrentUser, isLoading } = useFrappeAuth();
  const handleLogout = async () => {
    return logout()
      .then(() => {
        navigate("/login?redirect-to=/timesheet");
        window.location.reload();
      });
  };

  return (
    <UserContext.Provider
      value={{
        isLoading,
        updateCurrentUser,
        logout: handleLogout,
        currentUser: currentUser ?? "",
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
