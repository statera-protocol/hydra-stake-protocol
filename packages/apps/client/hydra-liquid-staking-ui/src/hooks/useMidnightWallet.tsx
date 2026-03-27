import { MidnightWalletContext } from "@/contextProviders/MidnightWalletProvider"
import { useContext } from "react"

const useNewMidnightWallet = () => {
    const context = useContext(MidnightWalletContext);
    if (!context) return;

    return context;
}

export default useNewMidnightWallet;