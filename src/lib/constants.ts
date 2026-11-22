export const LICENCE_CLASSES = [
  { value: "C+E", label: "Class 1 (C+E)" },
  { value: "C", label: "Class 2 (C)" },
  { value: "C1", label: "7.5t (C1)" },
] as const;

export function licenceLabel(v: string) {
  return LICENCE_CLASSES.find((c) => c.value === v)?.label ?? v;
}

export const SKILLS = [
  "ADR",
  "HIAB",
  "Moffett",
  "FLT",
  "Tanker",
  "Fridge / Reefer",
  "Tipper",
  "Low loader",
  "Car transporter",
  "Double deck",
  "Nights",
  "Weekends",
  "Trunking",
  "Multi-drop",
  "Tramping",
] as const;

export const JOB_TYPES = [
  "Trunking",
  "Multi-drop",
  "General haulage",
  "Container",
  "Tramping (nights out)",
  "Shunting / Yard",
  "Tipper",
  "Tanker",
  "Other",
] as const;

export const VEHICLE_TYPES = [
  "Curtainsider",
  "Box",
  "Fridge / Reefer",
  "Flatbed",
  "Tipper",
  "Tanker",
  "Skeletal / Container",
  "Low loader",
  "Rigid",
  "Other",
] as const;

export const DOCUMENT_TYPES = [
  {
    type: "LICENCE",
    label: "Driving licence",
    referenceLabel: "Last 8 characters of your licence number",
    help: "Get a check code at gov.uk/view-driving-licence and paste it below so we can verify your categories and points.",
    needsCheckCode: true,
    required: true,
  },
  {
    type: "CPC",
    label: "Driver CPC (DQC card)",
    referenceLabel: "DQC card number",
    help: "Your Driver Qualification Card number and its expiry date.",
    needsCheckCode: false,
    required: true,
  },
  {
    type: "TACHO",
    label: "Digital tachograph card",
    referenceLabel: "Tacho card number",
    help: "Your driver tachograph card number and expiry date.",
    needsCheckCode: false,
    required: true,
  },
  {
    type: "RIGHT_TO_WORK",
    label: "Right to work (UK)",
    referenceLabel: "Share code or 'British/Irish passport'",
    help: "Get a share code at gov.uk/prove-right-to-work. British or Irish citizens can just write 'British/Irish passport'.",
    needsCheckCode: false,
    required: true,
  },
  {
    type: "ADR",
    label: "ADR certificate",
    referenceLabel: "ADR certificate number",
    help: "Only if you hold ADR (dangerous goods).",
    needsCheckCode: false,
    required: false,
  },
] as const;

export const PLATFORM_NAME = "Drive My Truck";
export const SUPPORT_EMAIL = "help@drivemytruck.co.uk";
export const CONTACT_EMAIL = "hello@drivemytruck.co.uk";

/** Higher categories cover lower ones: C+E can drive C and C1, C can drive C1. */
const COVERS: Record<string, string[]> = { "C+E": ["C+E", "C", "C1"], C: ["C", "C1"], C1: ["C1"] };

export function canDriveClass(driverClasses: string[], jobClass: string) {
  return driverClasses.some((c) => COVERS[c]?.includes(jobClass));
}

/** All job classes a driver is qualified for. */
export function drivableClasses(driverClasses: string[]) {
  return [...new Set(driverClasses.flatMap((c) => COVERS[c] ?? []))];
}
