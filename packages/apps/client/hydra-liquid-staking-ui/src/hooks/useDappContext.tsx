import { DappContext } from "@/contextProviders/DappContextProvider";
import { useContext } from "react"

const useDappContext = ()  => {
    const context = useContext(DappContext);

    if(!context) return;

    return context;
}

export default useDappContext;