import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const EXTRACTION_PROMPT = `You are a marine cargo insurance data extraction assistant.
Extract shipment data from this client document text.

Return ONLY a valid JSON object with this structure:
{
  "nameOfInsured": "business unit name / insured party",
  "shipper": "shipper name",
  "descriptionOfCargo": "cargo description",
  "consigneeBuyer": "consignee / buyer name and address",
  "invoiceNo": "invoice or purchase order number",
  "conveyance": "vessel name, truck number, or mode of transport",
  "lcBankDetails": "letter of credit or bank details",
  "portOfLoading": "port/place of loading / voyage from",
  "portOfDischarge": "port/place of discharge / voyage to",
  "basisOfValuation": "incoterms / basis of valuation (e.g. CIF, FOB, EXWORKS)",
  "sumInsuredCurrency": "currency code (e.g. USD, EUR, SAR, AED)",
  "sumInsured": "insured amount with comma formatting (e.g. 17,160.00)",
  "additionalRemarks": "any special instructions or remarks"
}

Field mapping rules:
- "Name of the BU" or "Business Unit" or "Debit (Company Name)" → nameOfInsured
- "Subject matter Insured" → descriptionOfCargo
- "Consignee" → consigneeBuyer (look for the Consignee field carefully; it may appear as "Consignee: value" or in a separate line; if marked "(empty)" it means the field was blank in the document)
- "Purchase order/ Invoice No." → invoiceNo (include all numbers separated by /)
- "Voyage from" → portOfLoading
- "Voyage to" → portOfDischarge
- "L/C details / wording" → lcBankDetails (this is letter of credit / bank info, NOT incoterms. If the value is an incoterm like EXWORKS/CIF/FOB, it means the L/C field was blank and the value belongs to basisOfValuation instead — set lcBankDetails to "")
- "Currency" → sumInsuredCurrency
- "Conveyance (Vessel Name)" → conveyance
- "Incoterms" value (e.g. CIF, FOB, EXWORKS) → basisOfValuation (NOT lcBankDetails)
- "Sum Insured" → extract the numeric amount as sumInsured, preserve comma formatting (e.g. "17,160.00")
- If a field has both a value and an incoterm together (e.g. "17,160.00" next to "EXWORKS"), split them: number → sumInsured, incoterm → basisOfValuation

Rules:
- The document may be formatted as "Label: Value" pairs extracted from text boxes
- Extract ONLY what is present in the document text
- Do NOT guess or hallucinate data
- If a field is not found or marked "(empty)", use an empty string ""
- Return ONLY the JSON object, no markdown, no explanation, no code fences`;

export async function POST(request: NextRequest) {
  try {
    const { text, apiKey } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "No document text provided" },
        { status: 400 }
      );
    }

    const claudeApiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!claudeApiKey) {
      return NextResponse.json(
        { error: "Claude API key not configured" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `${EXTRACTION_PROMPT}\n\n--- DOCUMENT TEXT ---\n${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return NextResponse.json(
        { error: `Claude API error: ${response.status}` },
        { status: 500 }
      );
    }

    const result = await response.json();
    const content = result.content?.[0]?.text || "";

    // Parse the JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const extractedFields = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ fields: extractedFields });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract data from document" },
      { status: 500 }
    );
  }
}
