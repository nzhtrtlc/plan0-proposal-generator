import type {
  FeeSummary,
  FormState,
  GenerateProposalPayload,
  ProposedMandate,
} from "@packages/types";
import { logger } from "@packages/utils";
import { type FormEvent, useCallback, useRef, useState } from "react";
import { AddressAutocomplete } from "../../components/AddressAutocomplete";
import { Button } from "../../components/Button";
import { DatePicker } from "../../components/DatePicker";
import { Input } from "../../components/Input";
import { MultiSelect } from "../../components/MultiSelect";
import { Select } from "../../components/Select";
import {
  downloadProposal,
  extractAddressFromDocument,
} from "../../utils/actions";
import { FeeBuilder } from "../FeeBuilder";
import Bios from "./Bios";
import { FormField } from "./FormField";
import Signatures from "./Signatures";

const emptyFee: FeeSummary = { sections: {}, total: 0 };

const DEFAULT_NOTES = `* Project revenue and source of funds calculation are excluded from proforma/peer review. This is included in project monitoring.
* Peer review of CM budget is excluded.
* Tender Recommendation Review will be billed on a per diem basis to an upset limited as noted above.
* Change order reviews are excluded and will be billed on a per diem basis if required.
* Trade contract negotiations are excluded and will be billed on a per diem basis if required.
* Premiums associated with zero carbon, Passive house, etc is excluded.
* Additional Services over the above the mandate outlined herein will be billed on a per diem basis or based on supplementary fixed fee proposals.
* Proposed fees herein exclude H.S.T.

We appreciate this opportunity and strongly believe that we can provide you with excellent service. Please call if you have any questions or require further information on our proposal.

Yours truly,

FINNEGAN-MARSHALL INC.`;

const defaultTestValues = {
  notes: DEFAULT_NOTES,
  signatures: [],
  projectName: "Ancaster Mixed-Use Residential Development",
  billingEntity: "Finnegan Marshall Inc.",
  address: "1021 Garner Road East, Ancaster, Ontario, Canada",
  clientEmail: "john.doe@abcdevelopments.ca",
  clientName: "John Doe",
  clientCompanyName: "ABC Developments Ltd.",
  clientPosition: "Director of Development",
  clientCompanyAddress:
    "ABC Developments Ltd., 250 King Street West, Toronto, ON, Canada",
  assetClass: "Mixed-Use Residential / Commercial",
  projectDescription:
    "The proposed project consists of a mixed-use development including residential condominium units with ground-floor commercial space and associated underground parking. The development is currently in the pre-design phase and will be procured through a traditional design-bid-build delivery method.",
  proposedMandates: ["Estimating"],
  listOfServices: ["concept_to_completion"],
  fee: emptyFee,
  bios: [
    { id: "1", name: "Ciaran Brady" },
    { id: "2", name: "Alisha Gunn" },
  ],
  date: "2026-01-11",
} as FormState;

const defaultValues = {
  notes: DEFAULT_NOTES,
  signatures: [],
  projectName: "",
  billingEntity: "",
  address: "",
  clientEmail: "",
  clientName: "",
  clientCompanyName: "",
  clientPosition: "",
  clientCompanyAddress: "",
  assetClass: "",
  projectDescription: "",
  proposedMandates: [],
  listOfServices: [],
  date: new Date().toISOString().split("T")[0],
  fee: emptyFee,
  bios: [],
} as FormState;

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="col-span-full flex items-center gap-3 pt-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export function FormFields() {
  const searchParams = new URLSearchParams(window.location.search);
  const defaultState: FormState = searchParams.get("test")
    ? defaultTestValues
    : defaultValues;

  const PROPOSED_MANDATES: { label: string; value: ProposedMandate }[] = [
    { label: "Estimating", value: "Estimating" },
    { label: "Proforma", value: "Proforma" },
  ];

  const SERVICES_OPTIONS = [
    { label: "Concept To Completion", value: "concept_to_completion" },
    { label: "Cost Planning", value: "cost_planning" },
    { label: "Project Monitoring", value: "project_monitoring" },
  ];

  const [form, setForm] = useState<FormState>(defaultState);
  const [file, setFile] = useState<File | null>(null);
  const [fee, setFee] = useState<FeeSummary>();
  const [addressList, setAddressList] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [isDocumentLoading, setIsDocumentLoading] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // Progress tracking
  const effectiveAddress = selectedAddress || form.address;
  const requiredFieldChecks = [
    form.projectName.trim(),
    form.billingEntity.trim(),
    form.date.trim(),
    form.clientEmail.trim(),
    form.clientName.trim(),
    form.clientCompanyName.trim(),
    form.clientPosition.trim(),
    form.clientCompanyAddress.trim(),
    form.projectDescription.trim(),
    effectiveAddress.trim(),
    form.proposedMandates.length > 0 ? "ok" : "",
    form.listOfServices.length > 0 ? "ok" : "",
    form.bios.length > 0 ? "ok" : "",
    form.signatures.length > 0 ? "ok" : "",
  ];
  const filledCount = requiredFieldChecks.filter(Boolean).length;
  const totalRequired = requiredFieldChecks.length;

  const hasZeroHours = fee
    ? Object.values(fee.sections).some((s) => s.lines.some((l) => l.hours === 0))
    : false;

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);

    if (!selected) {
      return;
    }

    setIsDocumentLoading(true);
    try {
      const addressList = await extractAddressFromDocument(selected);
      setAddressList(addressList);
      if (addressList.length > 0) {
        setSelectedAddress(addressList[0]);
      }
    } catch (e) {
      setFile(null);
      logger.error(e, "Error while uploading document");
    }
    setIsDocumentLoading(false);
  }

  function clearFile() {
    setFile(null);
    setAddressList([]);
    setSelectedAddress("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function generateProposal() {
    if (!fee) {
      alert("Please add fee details");
      return;
    }

    const address = selectedAddress || form.address;
    const { bios, signatures, ...rest } = form;

    const requiredFields = [
      { value: rest.projectName, label: "Project Name" },
      { value: rest.billingEntity, label: "Billing Entity" },
      { value: rest.date, label: "Date" },
      { value: rest.clientEmail, label: "Client Email" },
      { value: rest.clientName, label: "Client Name" },
      { value: rest.clientCompanyName, label: "Client Company Name" },
      { value: rest.clientPosition, label: "Client Position" },
      { value: rest.clientCompanyAddress, label: "Client Company Address" },
      { value: rest.projectDescription, label: "Project Description" },
      { value: rest.proposedMandates, label: "Proposed Mandates" },
      { value: rest.listOfServices, label: "List of Services" },
      { value: address, label: "Address" },
      { value: bios, label: "Bios" },
      { value: signatures, label: "Signatures" },
    ];

    const missingFields = requiredFields
      .filter((f) => {
        if (typeof f.value === "string") {
          return !f.value.trim();
        }
        if (Array.isArray(f.value)) {
          return f.value.length === 0;
        }
        return !f.value;
      })
      .map((f) => f.label);

    if (missingFields.length > 0) {
      alert(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    if (!isValidEmail(rest.clientEmail)) {
      alert("Please enter a valid email address");
      return;
    }

    const payload: GenerateProposalPayload = {
      ...rest,
      address,
      fee,
      bios: bios.map((b) => b.id),
      signatures: signatures.map((s) => s.id),
    };

    await downloadProposal(payload);
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    generateProposal();
  };

  const onAddressSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAddress(e.target.value);
  };

  const onFeeChange = useCallback((feeObj: FeeSummary) => {
    setFee(feeObj);
    setForm((prev) => ({
      ...prev,
      fee: feeObj,
    }));
  }, []);

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Project */}
        <SectionDivider label="Project" />

        <FormField label="Project Name" id="project_name" required>
          <Input
            value={form.projectName}
            onChange={(e) => updateField("projectName", e.target.value)}
            placeholder="Enter project name"
          />
        </FormField>

        <FormField label="Billing Entity" id="billing_entity" required>
          <Input
            id="billing_entity"
            name="billingEntity"
            placeholder="Billing entity"
            value={form.billingEntity}
            onChange={(e) => updateField("billingEntity", e.target.value)}
          />
        </FormField>

        <FormField label="Date" id="date" required>
          <DatePicker
            id="date"
            name="date"
            value={form.date}
            onChange={(value) => updateField("date", value)}
          />
        </FormField>

        <FormField label="Project Description" id="project_description" required>
          <Input
            id="project_description"
            name="projectDescription"
            placeholder="Project description"
            value={form.projectDescription}
            onChange={(e) => updateField("projectDescription", e.target.value)}
          />
        </FormField>

        {/* Address */}
        <SectionDivider label="Address" />

        <FormField label="Upload PDF" id="upload_pdf">
          {file ? (
            <>
              <div
                className={`flex items-center gap-2 transition-opacity ${
                  isDocumentLoading ? "opacity-40" : "opacity-100"
                }`}
              >
                <span className="text-sm text-gray-700">{file.name}</span>
                <Button
                  type="button"
                  onClick={clearFile}
                  aria-label="Clear selected file"
                  className="text-xs text-gray-500 hover:text-gray-800"
                >
                  &#215;
                </Button>
              </div>
              {isDocumentLoading && (
                <output
                  className="relative bottom-8 left-[45%] w-3 h-3 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"
                  aria-label="Loading"
                />
              )}
            </>
          ) : (
            <Input
              id="pdf_file"
              name="pdf_file"
              type="file"
              onChange={onFileChange}
              ref={fileInputRef}
            />
          )}
        </FormField>

        <FormField label="Address List" id="address_list">
          <Select
            onChange={onAddressSelect}
            disabled={addressList.length === 0}
          >
            {addressList.length === 0 && <option>Select Address</option>}
            {addressList.map((address) => (
              <option key={address}>{address}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Address" id="address" required>
          <Input
            id="address"
            name="address"
            placeholder="Address"
            value={form.address}
            disabled={addressList.length > 0}
            onChange={(e) => updateField("address", e.target.value)}
          />
        </FormField>

        {/* Client */}
        <SectionDivider label="Client" />

        <FormField label="Client Name" id="client_name" required>
          <Input
            id="client_name"
            name="clientName"
            placeholder="Client name"
            value={form.clientName}
            onChange={(e) => updateField("clientName", e.target.value)}
          />
        </FormField>

        <FormField label="Client Email" id="client_email" required>
          <Input
            id="client_email"
            name="clientEmail"
            type="email"
            placeholder="Client email"
            value={form.clientEmail}
            onChange={(e) => {
              updateField("clientEmail", e.target.value);
              setEmailError("");
            }}
            onBlur={(e) => {
              const value = e.target.value;
              setEmailError(
                value && !isValidEmail(value)
                  ? "Please enter a valid email address"
                  : "",
              );
            }}
            aria-invalid={emailError ? "true" : "false"}
          />
          {emailError && (
            <span className="text-sm text-red-600">{emailError}</span>
          )}
        </FormField>

        <FormField label="Client Position" id="client_position" required>
          <Input
            id="client_position"
            name="clientPosition"
            placeholder="Client position / job title"
            value={form.clientPosition}
            onChange={(e) => updateField("clientPosition", e.target.value)}
          />
        </FormField>

        <FormField label="Client Company Name" id="client_company_name" required>
          <Input
            id="client_company_name"
            name="clientCompanyName"
            placeholder="Client company name"
            value={form.clientCompanyName}
            onChange={(e) => updateField("clientCompanyName", e.target.value)}
          />
        </FormField>

        <FormField label="Client Company Address" id="client_company_address" required>
          <AddressAutocomplete
            id="client_company_address"
            name="clientCompanyAddress"
            value={form.clientCompanyAddress}
            onChange={(value) => updateField("clientCompanyAddress", value)}
            onSelect={(_, description) => {
              updateField("clientCompanyAddress", description);
            }}
            placeholder="Start typing an address..."
          />
        </FormField>

        {/* Scope */}
        <SectionDivider label="Scope" />

        <FormField label="Proposed Mandate" id="proposed_mandate" required>
          <MultiSelect
            options={PROPOSED_MANDATES}
            value={form.proposedMandates}
            onChange={(val) => updateField("proposedMandates", val)}
          />
        </FormField>

        <FormField label="List Of Services" id="list_of_services" required>
          <MultiSelect
            options={SERVICES_OPTIONS}
            value={form.listOfServices}
            onChange={(val) => updateField("listOfServices", val)}
          />
        </FormField>

        {/* Staff */}
        <SectionDivider label="Staff" />

        <FormField id="bios" label="Bios" required>
          <Bios
            value={form.bios}
            onChange={(val) => updateField("bios", val)}
          />
        </FormField>

        <FormField id="signatures" label="Signatures (max 2)" required>
          <Signatures
            value={form.signatures}
            onChange={(val) => updateField("signatures", val)}
          />
        </FormField>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setIsNotesOpen((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
        >
          <span>{isNotesOpen ? "▼" : "▶"}</span>
          <span>Notes</span>
        </button>
        {isNotesOpen && (
          <textarea
            id="notes"
            name="notes"
            rows={12}
            value={form.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      <FeeBuilder
        selectedMandates={form.proposedMandates}
        onChange={onFeeChange}
      />

      {/* Sticky submit bar */}
      <div className="sticky bottom-0 -mx-6 px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between rounded-b-lg">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className={`font-semibold ${filledCount === totalRequired ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}`}>
            {filledCount}
          </span>
          <span> / {totalRequired} fields complete</span>
        </div>
        <Button
          type="submit"
          disabled={filledCount < totalRequired || hasZeroHours}
          className="bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 dark:from-blue-600 dark:to-indigo-700 dark:hover:from-blue-700 dark:hover:to-indigo-800 shadow-md"
        >
          Generate Proposal
        </Button>
      </div>
    </form>
  );
}
