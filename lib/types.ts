export interface MarineShipment {
  id: string;
  srNo: string;
  openPolicyNo: string;
  nameOfInsured: string;
  certificateNo: string;
  shipper: string;
  descriptionOfCargo: string;
  consigneeBuyer: string;
  invoiceNo: string;
  conveyance: string;
  lcBankDetails: string;
  portOfLoading: string;
  portOfDischarge: string;
  basisOfValuation: string;
  sumInsuredCurrency: string;
  sumInsured: string;
  covers: string;
  additionalRemarks: string;
  claimsPayable: string;
}

export type MarineShipmentKey = keyof MarineShipment;

export interface UploadedFile {
  id: string;
  file: File;
  fileType: "excel" | "word";
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  errorMessage?: string;
}

export const OPEN_POLICY_NO = "MC0225000023";
export const COVERS_TEXT =
  "All terms and Condition as per Open Cover No: MC0225000023";

export function createEmptyShipment(): MarineShipment {
  return {
    id: crypto.randomUUID(),
    srNo: "",
    openPolicyNo: OPEN_POLICY_NO,
    nameOfInsured: "",
    certificateNo: "",
    shipper: "",
    descriptionOfCargo: "",
    consigneeBuyer: "",
    invoiceNo: "",
    conveyance: "",
    lcBankDetails: "",
    portOfLoading: "",
    portOfDischarge: "",
    basisOfValuation: "",
    sumInsuredCurrency: "",
    sumInsured: "",
    covers: COVERS_TEXT,
    additionalRemarks: "",
    claimsPayable: "",
  };
}
