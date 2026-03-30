import type { MarineShipmentKey } from "./types";

export const MARINE_CERTIFICATE_COLUMNS = [
  "SR NO",
  "Open Policy No",
  "Name of the insured",
  "Certificate No",
  "Shipper",
  "Description of Cargo",
  "Consignee/Buyer",
  "Invoice No.",
  "Conveyance",
  "LC /Bank Details",
  "PORT OF LOADING",
  "PORT OF DISCHARGE",
  "Basic of Valuation",
  "Sum Insured Currency",
  "Sum Insured ",
  "Covers ",
  "Additional Remarks",
  "Claims Payable",
];

export const FIELD_ORDER: MarineShipmentKey[] = [
  "srNo",
  "openPolicyNo",
  "nameOfInsured",
  "certificateNo",
  "shipper",
  "descriptionOfCargo",
  "consigneeBuyer",
  "invoiceNo",
  "conveyance",
  "lcBankDetails",
  "portOfLoading",
  "portOfDischarge",
  "basisOfValuation",
  "sumInsuredCurrency",
  "sumInsured",
  "covers",
  "additionalRemarks",
  "claimsPayable",
];

export const CLIENT_EXCEL_SYNONYMS: Record<string, string[]> = {
  nameOfInsured: [
    "name of business unit",
    "business unit",
    "insured",
    "name of the insured",
  ],
  shipper: ["name of shipper", "shipper", "name of shipper"],
  descriptionOfCargo: [
    "description of cargo",
    "cargo description",
    "cargo",
    "subject matter insured",
  ],
  consigneeBuyer: ["consignee", "buyer", "consignee/buyer"],
  invoiceNo: [
    "invoice no",
    "invoice no.",
    "invoice number",
    "invoice",
    "purchase order",
  ],
  conveyance: [
    "conveyance sea/air/road",
    "conveyance sea/air /road",
    "conveyance",
    "mode of transport",
  ],
  lcBankDetails: [
    "lc /bank details",
    "lc/bank details",
    "lc details",
    "bank details",
    "l/c details",
  ],
  portOfLoading: ["port of loading", "loading port", "from port"],
  portOfDischarge: ["port of discharge", "discharge port", "to port"],
  basisOfValuation: [
    "basic of valuation/inco terms",
    "basic of valuation/ inco terms",
    "basic of valuation",
    "basis of valuation",
    "inco terms",
    "incoterms",
  ],
  sumInsuredCurrency: ["sum insured currency", "currency"],
  sumInsured: ["sum insured", "insured amount", "amount"],
  additionalRemarks: [
    "remarks/special instructions",
    "remarks/ special instructions",
    "remarks",
    "special instructions",
    "additional remarks",
  ],
};

// Fields the user can map when importing client Excel
export const IMPORTABLE_FIELDS: { key: MarineShipmentKey; label: string }[] = [
  { key: "nameOfInsured", label: "Name of Insured" },
  { key: "shipper", label: "Shipper" },
  { key: "descriptionOfCargo", label: "Description of Cargo" },
  { key: "consigneeBuyer", label: "Consignee/Buyer" },
  { key: "invoiceNo", label: "Invoice No." },
  { key: "conveyance", label: "Conveyance" },
  { key: "lcBankDetails", label: "LC /Bank Details" },
  { key: "portOfLoading", label: "PORT OF LOADING" },
  { key: "portOfDischarge", label: "PORT OF DISCHARGE" },
  { key: "basisOfValuation", label: "Basic of Valuation" },
  { key: "sumInsuredCurrency", label: "Sum Insured Currency" },
  { key: "sumInsured", label: "Sum Insured" },
  { key: "additionalRemarks", label: "Additional Remarks" },
];

// Preview fields shown during row selection in import modal
export const PREVIEW_FIELDS: {
  key: MarineShipmentKey;
  label: string;
  width: string;
}[] = [
  { key: "shipper", label: "Shipper", width: "w-36" },
  { key: "consigneeBuyer", label: "Consignee", width: "w-36" },
  { key: "invoiceNo", label: "Invoice No.", width: "w-28" },
  { key: "portOfLoading", label: "Loading", width: "w-24" },
  { key: "portOfDischarge", label: "Discharge", width: "w-24" },
  { key: "sumInsured", label: "Sum Insured", width: "w-24" },
];
