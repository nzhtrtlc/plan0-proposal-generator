import type { GenerateProposalPayload, StaffWithRate } from "@packages/types";
import { logger } from "@packages/utils";

const API_URI =
   import.meta.env.VITE_API_URL ??
   (import.meta.env.DEV ? "http://localhost:3000" : "");

type ExtractResponse = {
   result: string[];
};

export async function extractAddressFromDocument(file: File) {
   const formData = new FormData();
   formData.append("file", file);

   const res = await fetch(`${API_URI}/api/extract`, {
      method: "POST",
      body: formData,
   });

   if (!res.ok) {
      throw new Error("Document data extraction failed");
   }

   const data: ExtractResponse = await res.json();

   const addressList = data.result ?? [];

   if (addressList.length === 0) {
      throw new Error("No address found in the document.");
   }

   return addressList;
}

export async function placesApiRequest(input: string) {
   return await fetch(
      `${API_URI}/api/map-places?input=${encodeURIComponent(input)}`,
   );
}

export async function getBios() {
   const res = await fetch(`${API_URI}/api/bios`);
   if (!res.ok) {
      throw new Error("Failed to fetch bios");
   }
   return await res.json();
}

export async function getStaff() {
   const res = await fetch(`${API_URI}/api/staff`);
   if (!res.ok) {
      throw new Error("Failed to fetch staff");
   }
   return await res.json();
}

export async function getStaffWithRates(): Promise<StaffWithRate[]> {
   const res = await fetch(`${API_URI}/api/staff-rates`);
   if (!res.ok) {
      throw new Error("Failed to fetch staff rates");
   }
   return await res.json();
}

export async function downloadProposal(payload: GenerateProposalPayload) {
   logger.info({ payload }, "Doc Render Payload");
   const res = await fetch(`${API_URI}/api/generate-proposal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // body: JSON.stringify({
      //    projectName: "My Project",
      //    address: "1021 Garner Road, Ancaster, Ontario",
      //    clientName: "John Doe",
      //    date: new Date().toISOString(),
      //    clientEmail: "john.doe@example.com",
      //    bios: ["1", "2"],
      //    listOfServices: ["cost_planning"],
      //    //listOfServices: ["concept_to_completion", "cost_planning", "project_monitoring"],
      // }),
   });

   if (!res.ok) throw new Error("Failed to generate");

   const blob = await res.blob();
   const url = URL.createObjectURL(blob);

   const a = document.createElement("a");
   a.href = url;
   const timeStr = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
   }).replace(/\s/g, "");
   a.download = `proposal-output-${timeStr}.docx`;
   document.body.appendChild(a);
   a.click();
   a.remove();

   URL.revokeObjectURL(url);
}
