import type {
   FeeLine,
   FeeSummary,
   MandateSection,
   ProposedMandate,
   StaffWithRate,
} from "@packages/types";
import { useEffect, useMemo, useState } from "react";
import { NumberInput } from "../components/NumberInput";
import { SearchableSelect } from "../components/SearchableSelect";
import { getStaffWithRates } from "../utils/actions";

const STORAGE_KEY = (mandate: string) => `fee_section_${mandate}`;

function uuid(): string {
   if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return (crypto as { randomUUID: () => string }).randomUUID();
   }
   return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
   });
}

export function clearFeeStorage() {
   localStorage.removeItem("fee_section_Estimating");
   localStorage.removeItem("fee_section_Proforma");
}

function loadSection(mandate: string, firstStaff: StaffWithRate | undefined): MandateSection {
   const stored = localStorage.getItem(STORAGE_KEY(mandate));
   if (stored) {
      try {
         const parsed = JSON.parse(stored) as MandateSection;
         // Coerce numeric fields that may have been serialized as strings
         parsed.lines = parsed.lines.map((l) => ({
            ...l,
            id: l.id ?? uuid(),
            hours: Number(l.hours),
            rate: Number(l.rate),
            lineTotal: Number(l.lineTotal),
         }));
         if (parsed.suggestedFee !== null) parsed.suggestedFee = Number(parsed.suggestedFee);
         return parsed;
      } catch {
         localStorage.removeItem(STORAGE_KEY(mandate));
      }
   }
   return {
      lines: firstStaff
         ? [{ id: uuid(), staffId: firstStaff.id, staffName: firstStaff.name, hours: 1, rate: Number(firstStaff.rate), lineTotal: Number(firstStaff.rate) }]
         : [],
      suggestedFee: null,
   };
}

function saveSection(mandate: string, section: MandateSection) {
   localStorage.setItem(STORAGE_KEY(mandate), JSON.stringify(section));
}

function emptyLine(staff: StaffWithRate): FeeLine {
   const rate = Number(staff.rate);
   return { id: uuid(), staffId: staff.id, staffName: staff.name, hours: 1, rate, lineTotal: rate };
}

function computeLineTotal(line: FeeLine): FeeLine {
   return { ...line, lineTotal: Number((line.hours * line.rate).toFixed(2)) };
}

type Props = {
   selectedMandates: ProposedMandate[];
   onChange?: (summary: FeeSummary) => void;
};

export function FeeBuilder({ selectedMandates, onChange }: Props) {
   const [staffList, setStaffList] = useState<StaffWithRate[]>([]);
   const [sections, setSections] = useState<Record<string, MandateSection>>({});
   const [savedAt, setSavedAt] = useState<Date | null>(null);

   // Load staff once
   useEffect(() => {
      getStaffWithRates().then(setStaffList);
   }, []);

   // Sync sections when selectedMandates or staffList changes
   useEffect(() => {
      if (staffList.length === 0) return;
      setSections((prev) => {
         const next: Record<string, MandateSection> = {};
         for (const mandate of selectedMandates) {
            next[mandate] = prev[mandate] ?? loadSection(mandate, staffList[0]);
         }
         return next;
      });
   }, [selectedMandates, staffList]);

   // Persist sections to localStorage whenever they change
   useEffect(() => {
      if (Object.keys(sections).length === 0) return;
      for (const [mandate, section] of Object.entries(sections)) {
         saveSection(mandate, section);
      }
      setSavedAt(new Date());
   }, [sections]);

   const finalFee = useMemo(() => {
      return Object.values(sections).reduce((total, section) => {
         const sectionTotal =
            section.suggestedFee !== null
               ? section.suggestedFee
               : section.lines.reduce((sum, l) => sum + l.lineTotal, 0);
         return total + sectionTotal;
      }, 0);
   }, [sections]);

   const hasZeroHours = useMemo(
      () => Object.values(sections).some((s) => s.lines.some((l) => l.hours === 0)),
      [sections],
   );

   // Notify parent
   useEffect(() => {
      onChange?.({ sections, total: Number(finalFee.toFixed(2)) });
   }, [sections, finalFee, onChange]);

   function updateSection(mandate: string, patch: Partial<MandateSection>) {
      setSections((prev) => ({
         ...prev,
         [mandate]: { ...prev[mandate], ...patch },
      }));
   }

   function addLine(mandate: string) {
      const staff = staffList[0];
      if (!staff) return;
      updateSection(mandate, {
         lines: [...sections[mandate].lines, emptyLine(staff)],
      });
   }

   function removeLine(mandate: string, index: number) {
      updateSection(mandate, {
         lines: sections[mandate].lines.filter((_, i) => i !== index),
      });
   }

   function updateLine(mandate: string, index: number, patch: Partial<FeeLine>) {
      const lines = [...sections[mandate].lines];
      const current = lines[index];
      let updated = computeLineTotal({ ...current, ...patch });

      // If staff changed, auto-fill rate from staffList
      if (patch.staffId && patch.staffId !== current.staffId) {
         const staff = staffList.find((s) => s.id === patch.staffId);
         if (staff) {
            updated = computeLineTotal({ ...updated, staffName: staff.name, rate: staff.rate });
         }
      }
      lines[index] = updated;
      updateSection(mandate, { lines });
   }

   if (selectedMandates.length === 0) {
      return (
         <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm text-gray-500">Select a proposed mandate to start building fees.</p>
         </div>
      );
   }

   return (
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
         <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Fee Generator</div>
            {savedAt && (
               <span className="text-xs text-gray-400 dark:text-gray-500">
                  Autosaved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
               </span>
            )}
         </div>

         {selectedMandates.map((mandate) => {
            const section = sections[mandate];
            if (!section) return null;

            const calcTotal = section.lines.reduce((sum, l) => sum + l.lineTotal, 0);

            return (
               <div key={mandate} className="space-y-3">
                  {/* Section header */}
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2">
                     {mandate}
                  </div>

                  {/* Column headers */}
                  {section.lines.length > 0 && (
                     <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                        <div className="sm:col-span-4">Staff</div>
                        <div className="sm:col-span-3">Hours</div>
                        <div className="sm:col-span-3">Rate ($/hr)</div>
                        <div className="sm:col-span-1">Total</div>
                        <div className="sm:col-span-1" />
                     </div>
                  )}

                  {/* Rows */}
                  {section.lines.map((line, i) => (
                     <div
                        key={line.id}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-center py-1"
                     >
                        <div className="sm:col-span-4">
                           <SearchableSelect
                              options={staffList.map((s) => ({
                                 label: `${s.name}${s.surname ? ` ${s.surname}` : ""} — $${s.rate}/hr`,
                                 value: s.id,
                              }))}
                              value={line.staffId}
                              onChange={(id) => updateLine(mandate, i, { staffId: id })}
                           />
                        </div>

                        <div className="sm:col-span-3">
                           <NumberInput
                              value={line.hours}
                              onChange={(v) => updateLine(mandate, i, { hours: v })}
                              min={0}
                              step={0.5}
                           />
                        </div>

                        <div className="sm:col-span-3">
                           <NumberInput
                              value={line.rate}
                              onChange={(v) => updateLine(mandate, i, { rate: v })}
                              min={0}
                              step={1}
                           />
                        </div>

                        <div className="sm:col-span-1 text-sm text-gray-700 dark:text-gray-300 font-medium">
                           ${line.lineTotal.toFixed(2)}
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                           <button
                              type="button"
                              onClick={() => removeLine(mandate, i)}
                              aria-label="Remove row"
                              className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-1.5 transition-colors cursor-pointer"
                           >
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                 <title>Remove</title>
                                 <polyline points="3 6 5 6 21 6" />
                                 <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                 <path d="M10 11v6M14 11v6" />
                                 <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                              </svg>
                           </button>
                        </div>
                     </div>
                  ))}

                  {/* Section subtotal */}
                  {section.lines.length > 0 && (
                     <div className="flex justify-end text-xs text-gray-500 dark:text-gray-400 pr-10">
                        Subtotal:&nbsp;<span className="font-medium text-gray-700 dark:text-gray-300">${calcTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                     </div>
                  )}

                  {/* Section footer: Add Row + Suggested Fee */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                     <button
                        type="button"
                        onClick={() => addLine(mandate)}
                        disabled={staffList.length === 0}
                        className="text-xs text-blue-600 dark:text-blue-400 border border-blue-400 rounded px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer w-fit"
                     >
                        + Add Row
                     </button>

                     <div className="flex items-center gap-3">
                        <label
                           htmlFor={`suggested-fee-${mandate}`}
                           className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap"
                        >
                           Suggested Fee
                        </label>
                        <div className="relative">
                           <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">$</span>
                           <input
                              id={`suggested-fee-${mandate}`}
                              type="number"
                              min={0}
                              step={0.01}
                              value={section.suggestedFee ?? calcTotal}
                              onChange={(e) => {
                                 const val = e.target.value === "" ? null : Number(e.target.value);
                                 updateSection(mandate, { suggestedFee: val });
                              }}
                              className="w-36 h-8 rounded-md border border-gray-300 dark:border-gray-700 pl-5 pr-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                           />
                        </div>
                     </div>
                  </div>
               </div>
            );
         })}

         {/* Zero hours warning */}
         {hasZeroHours && (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
               </svg>
               One or more fee lines have 0 hours. Proposal generation is disabled until all hours are set.
            </div>
         )}

         {/* Final Fee */}
         <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Final Fee</span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
               ${finalFee.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
         </div>
      </div>
   );
}
