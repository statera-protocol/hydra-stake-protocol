import { DeployedContractContext } from "@/contextProviders/DeployedContractProvider";
import { useContext } from "react"

const useDeployment = () => {
    const context = useContext(DeployedContractContext);
    if (!context) return;

    return context;
}

export default useDeployment;