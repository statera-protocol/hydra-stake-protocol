import {
  createContext,
  useEffect,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";
import type { NotificationType } from "../lib/types";

type actionType = "stake" | "redeem";

export const DappContext = createContext<DappConfigType | null>(null);

type routes = "dashboard" | "admin";

export interface DappConfigType {
  notification: {
    type: NotificationType;
    message: string;
  } | null;
  setNotification: Dispatch<
    SetStateAction<{
      type: NotificationType;
      message: string;
    } | null>
  >;
  route: routes;
  setRoute: Dispatch<SetStateAction<routes>>;
  openCreatePoolModal: boolean;
  setOpenCreatePoolModal: Dispatch<SetStateAction<boolean>>;
  isStakingOpen: boolean;
  setIsStakingOpen: Dispatch<SetStateAction<boolean>>;
  isOpenCreatePool: boolean;
  setIsOpenCreatePool: Dispatch<SetStateAction<boolean>>;
  action: actionType;
  setAction: Dispatch<SetStateAction<actionType>>;
}

const DappContextProvider: React.FC<Readonly<PropsWithChildren>> = ({
  children,
}) => {
  const [route, setRoute] = useState<routes>("dashboard");
  const [isStakingOpen, setIsStakingOpen] = useState(false);
  const [isOpenCreatePool, setIsOpenCreatePool] = useState(false);
  const [action, setAction] = useState<actionType>("stake");

  const [openCreatePoolModal, setOpenCreatePoolModal] =
    useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  }, [notification]);

  const value: DappConfigType = {
    notification,
    setNotification,
    route,
    setRoute,
    openCreatePoolModal,
    setOpenCreatePoolModal,
    isStakingOpen,
    setIsStakingOpen,
    isOpenCreatePool,
    setIsOpenCreatePool,
    action,
    setAction,
  };

  return <DappContext.Provider value={value}>{children}</DappContext.Provider>;
};

export default DappContextProvider;
