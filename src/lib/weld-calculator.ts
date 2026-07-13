// WeldSizer — Weld Size Calculation Logic
// Based on AWS D1.1, ASME B31.3, and general welding code practices

export type JointType = "butt" | "fillet" | "groove" | "socket" | "lap";
export type MaterialType = "carbon-steel" | "stainless-steel" | "aluminum";
export type MaterialGrade = "standard" | "304" | "316l" | "6061-t6" | "5083-h116";
export type CodeStandard = "aws-d1.1" | "asme-b31.3" | "general" | "custom";
export type UnitSystem = "inches" | "mm";

export interface WeldInput {
  thickness: number;
  jointType: JointType;
  materialType: MaterialType;
  materialGrade?: MaterialGrade;
  codeStandard: CodeStandard;
  customCodeNote?: string;
  unitSystem: UnitSystem;
}

export interface WeldResult {
  /** Recommended weld leg size (in inches, internal) */
  legSizeInches: number;
  /** Throat thickness (in inches, internal) */
  throatInches: number;
  /** Recommended weld leg size in the user's chosen unit */
  legSize: number;
  /** Throat thickness in the user's chosen unit */
  throat: number;
  /** Code reference note */
  codeNote: string;
  /** Unit label */
  unit: string;
}

// Material grade definitions
export interface MaterialGradeInfo {
  label: string;
  factor: number;
  yieldStrengthKsi: number;
}

// Base material factors (for backward compat when grade is "standard")
const BASE_MATERIAL_FACTORS: Record<MaterialType, number> = {
  "carbon-steel": 1.0,
  "stainless-steel": 1.1,
  "aluminum": 1.25,
};

const MATERIAL_LABELS: Record<MaterialType, string> = {
  "carbon-steel": "Carbon Steel",
  "stainless-steel": "Stainless Steel",
  "aluminum": "Aluminum",
};

// Grade-specific data
export const MATERIAL_GRADES: Record<MaterialType, { value: MaterialGrade; label: string; factor: number; yieldKsi: number }[]> = {
  "carbon-steel": [
    { value: "standard", label: "Standard (A36)", factor: 1.0, yieldKsi: 36 },
  ],
  "stainless-steel": [
    { value: "standard", label: "Standard (304)", factor: 1.1, yieldKsi: 30 },
    { value: "304", label: "304", factor: 1.1, yieldKsi: 30 },
    { value: "316l", label: "316L", factor: 1.15, yieldKsi: 25 },
  ],
  "aluminum": [
    { value: "standard", label: "Standard (6061-T6)", factor: 1.25, yieldKsi: 35 },
    { value: "6061-t6", label: "6061-T6", factor: 1.25, yieldKsi: 35 },
    { value: "5083-h116", label: "5083-H116", factor: 1.3, yieldKsi: 29 },
  ],
};

const JOINT_LABELS: Record<JointType, string> = {
  butt: "Butt",
  fillet: "Fillet",
  groove: "Groove",
  socket: "Socket",
  lap: "Lap",
};

const CODE_LABELS: Record<CodeStandard, string> = {
  "aws-d1.1": "AWS D1.1",
  "asme-b31.3": "ASME B31.3",
  general: "General",
  custom: "Custom",
};

function toUserUnit(inches: number, unit: UnitSystem): number {
  if (unit === "mm") return Math.round(inches * 25.4 * 10) / 10;
  return Math.round(inches * 64) / 64; // Round to nearest 1/64"
}

function formatFraction(inches: number): string {
  if (inches < 0.001) return "0";
  const fracs: [number, string][] = [
    [1 / 64, "1/64"], [1 / 32, "1/32"], [3 / 64, "3/64"],
    [1 / 16, "1/16"], [5 / 64, "5/64"], [3 / 32, "3/32"],
    [7 / 64, "7/64"], [1 / 8, "1/8"], [9 / 64, "9/64"],
    [5 / 32, "5/32"], [11 / 64, "11/64"], [3 / 16, "3/16"],
    [13 / 64, "13/64"], [7 / 32, "7/32"], [15 / 64, "15/64"],
    [1 / 4, "1/4"], [17 / 64, "17/64"], [9 / 32, "9/32"],
    [19 / 64, "19/64"], [5 / 16, "5/16"], [21 / 64, "21/64"],
    [11 / 32, "11/32"], [23 / 64, "23/64"], [3 / 8, "3/8"],
    [25 / 64, "25/64"], [13 / 32, "13/32"], [27 / 64, "27/64"],
    [7 / 16, "7/16"], [29 / 64, "29/64"], [15 / 32, "15/32"],
    [31 / 64, "31/64"], [1 / 2, "1/2"],
  ];
  let best = "";
  let bestDiff = Infinity;
  for (const [val, label] of fracs) {
    const diff = Math.abs(inches - val);
    if (diff < bestDiff) { bestDiff = diff; best = label; }
  }
  return best;
}

function getMaterialFactor(materialType: MaterialType, materialGrade?: MaterialGrade): number {
  if (materialGrade && materialGrade !== "standard") {
    const grades = MATERIAL_GRADES[materialType];
    const grade = grades.find((g) => g.value === materialGrade);
    if (grade) return grade.factor;
  }
  return BASE_MATERIAL_FACTORS[materialType];
}

function getGradeLabel(materialType: MaterialType, materialGrade?: MaterialGrade): string {
  if (materialGrade && materialGrade !== "standard") {
    const grades = MATERIAL_GRADES[materialType];
    const grade = grades.find((g) => g.value === materialGrade);
    if (grade) return grade.label;
  }
  return MATERIAL_LABELS[materialType];
}

function getYieldStrength(materialType: MaterialType, materialGrade?: MaterialGrade): number | null {
  if (materialGrade && materialGrade !== "standard") {
    const grades = MATERIAL_GRADES[materialType];
    const grade = grades.find((g) => g.value === materialGrade);
    if (grade) return grade.yieldKsi;
  }
  // Default yield strengths by material type
  const defaults: Record<MaterialType, number> = {
    "carbon-steel": 36,
    "stainless-steel": 30,
    "aluminum": 35,
  };
  return defaults[materialType];
}

export function calculateWeld(input: WeldInput): WeldResult {
  const { thickness, jointType, materialType, materialGrade, codeStandard, customCodeNote, unitSystem } = input;
  const materialFactor = getMaterialFactor(materialType, materialGrade);
  const materialLabel = getGradeLabel(materialType, materialGrade);

  // Ensure thickness is in inches internally
  const t = unitSystem === "mm" ? thickness / 25.4 : thickness;

  let legSizeInches = 0;
  let codeNote = "";

  switch (jointType) {
    case "fillet": {
      const baseLeg = t * 0.707;
      legSizeInches = baseLeg * materialFactor;

      if (codeStandard === "aws-d1.1") {
        const minLeg = t > 0.25 ? 0.1875 : Math.max(0.125, t * 0.75);
        legSizeInches = Math.max(legSizeInches, minLeg);
        codeNote = `AWS D1.1 Table 8.1: Minimum fillet weld leg size = ${formatFraction(minLeg)}" for ${materialLabel} thickness ${formatFraction(t)}".`;
      } else if (codeStandard === "asme-b31.3") {
        const minLeg = 0.15625;
        legSizeInches = Math.max(legSizeInches, minLeg);
        codeNote = `ASME B31.3 §328.5.2: Minimum fillet weld leg = 5/32" for ${materialLabel}.`;
      } else if (codeStandard === "custom") {
        const minLeg = Math.max(0.125, t * 0.5);
        legSizeInches = Math.max(legSizeInches, minLeg);
        codeNote = customCodeNote?.trim() || `Custom reference: Fillet weld for ${materialLabel}.`;
      } else {
        const minLeg = Math.max(0.125, t * 0.5);
        legSizeInches = Math.max(legSizeInches, minLeg);
        codeNote = `General practice: Fillet weld leg size = ${formatFraction(toUserUnit(legSizeInches, "inches"))}" for ${JOINT_LABELS[jointType]} in ${materialLabel}.`;
      }
      break;
    }

    case "butt":
    case "groove": {
      if (t <= 0.5) {
        legSizeInches = t;
        if (codeStandard === "aws-d1.1") {
          codeNote = `AWS D1.1 Table 3.1: Complete joint penetration (CJP) groove weld. Thickness ≤ 1/2", full penetration required.`;
        } else if (codeStandard === "asme-b31.3") {
          codeNote = `ASME B31.3 §328.5.4: Full penetration butt weld for thickness ≤ 1/2". Weld size equals base material thickness.`;
        } else if (codeStandard === "custom") {
          codeNote = customCodeNote?.trim() || `Custom reference: Full penetration weld for ${materialLabel} thickness ${formatFraction(t)}".`;
        } else {
          codeNote = `General practice: Full penetration weld for thickness ≤ 1/2". Weld size = full material thickness of ${formatFraction(t)}".`;
        }
      } else {
        const pjpDepth = t * 0.6;
        legSizeInches = pjpDepth * materialFactor;
        if (codeStandard === "aws-d1.1") {
          const minPJP = 0.25;
          legSizeInches = Math.max(legSizeInches, minPJP);
          codeNote = `AWS D1.1 Table 3.2: Partial joint penetration (PJP) groove weld for thickness > 1/2". Effective throat = ${formatFraction(t * 0.6)}" of ${formatFraction(t)}" material.`;
        } else if (codeStandard === "asme-b31.3") {
          codeNote = `ASME B31.3 §328.5.4: Partial penetration weld. Weld size based on ${formatFraction(t)}" material thickness with ${materialLabel} factor.`;
        } else if (codeStandard === "custom") {
          codeNote = customCodeNote?.trim() || `Custom reference: Partial penetration weld for ${materialLabel} thickness ${formatFraction(t)}".`;
        } else {
          codeNote = `General practice: Partial penetration weld for thickness > 1/2". Effective weld size = ${formatFraction(pjpDepth)}".`;
        }
      }
      break;
    }

    case "socket": {
      const socketLeg = t * 1.09 + 0.0625;
      legSizeInches = socketLeg * materialFactor;
      if (codeStandard === "asme-b31.3") {
        const minSocketLeg = 0.1875;
        legSizeInches = Math.max(legSizeInches, minSocketLeg);
        codeNote = `ASME B31.3 §328.5.2(c): Socket weld fillet leg = 1.09t + 1/16" = ${formatFraction(socketLeg)}". Minimum 3/16".`;
      } else if (codeStandard === "aws-d1.1") {
        codeNote = `AWS D1.1 Table 8.1 applied to socket joint: Fillet leg based on pipe wall thickness ${formatFraction(t)}" with ${materialLabel} factor.`;
      } else if (codeStandard === "custom") {
        codeNote = customCodeNote?.trim() || `Custom reference: Socket weld for ${materialLabel} wall thickness ${formatFraction(t)}".`;
      } else {
        codeNote = `General practice: Socket weld fillet leg = 1.09t + 1/16" = ${formatFraction(socketLeg)}" for ${materialLabel}.`;
      }
      break;
    }

    case "lap": {
      const baseLeg = t * 0.75;
      legSizeInches = baseLeg * materialFactor;
      const minLeg = 0.125;
      legSizeInches = Math.max(legSizeInches, minLeg);
      if (codeStandard === "aws-d1.1") {
        codeNote = `AWS D1.1 Table 8.1: Lap joint fillet weld. Minimum leg = 3/4 × thinner member thickness = ${formatFraction(baseLeg)}".`;
      } else if (codeStandard === "asme-b31.3") {
        codeNote = `ASME B31.3 §328.5.2: Lap joint weld. Leg size = 0.75 × ${formatFraction(t)}" = ${formatFraction(baseLeg)}" with ${materialLabel} factor.`;
      } else if (codeStandard === "custom") {
        codeNote = customCodeNote?.trim() || `Custom reference: Lap joint weld for ${materialLabel} thickness ${formatFraction(t)}".`;
      } else {
        codeNote = `General practice: Lap joint fillet weld. Minimum leg = 0.75 × thinner member = ${formatFraction(baseLeg)}" for ${materialLabel}.`;
      }
      break;
    }
  }

  let throatInches: number;
  if (jointType === "butt" || jointType === "groove") {
    throatInches = legSizeInches;
  } else {
    throatInches = legSizeInches * 0.707;
  }

  return {
    legSizeInches,
    throatInches,
    legSize: toUserUnit(legSizeInches, unitSystem),
    throat: toUserUnit(throatInches, unitSystem),
    codeNote,
    unit: unitSystem,
  };
}

// Human-readable labels for the UI
export function getJointTypeLabel(type: JointType): string {
  return JOINT_LABELS[type];
}

export function getMaterialTypeLabel(type: MaterialType): string {
  return MATERIAL_LABELS[type];
}

export function getCodeStandardLabel(code: CodeStandard): string {
  return CODE_LABELS[code];
}

export function getGradeInfo(materialType: MaterialType, materialGrade?: MaterialGrade): { label: string; yieldKsi: number | null; factor: number } {
  const label = getGradeLabel(materialType, materialGrade);
  const yieldKsi = getYieldStrength(materialType, materialGrade);
  const factor = getMaterialFactor(materialType, materialGrade);
  return { label, yieldKsi, factor };
}