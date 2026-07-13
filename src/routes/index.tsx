import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  calculateWeld,
  getGradeInfo,
  MATERIAL_GRADES,
  type JointType,
  type MaterialType,
  type MaterialGrade,
  type CodeStandard,
  type UnitSystem,
} from "~/lib/weld-calculator";
import {
  loadHistory,
  saveCalculation,
  deleteEntry,
  clearHistory,
  formatTimestamp,
  JOINT_LABELS as HIST_JOINT_LABELS,
  MATERIAL_LABELS as HIST_MATERIAL_LABELS,
  CODE_LABELS as HIST_CODE_LABELS,
  type CalcHistoryEntry,
} from "~/lib/calc-history";
import {
  buildReportHtml,
  openPrintWindow,
} from "~/lib/calc-report";
import { isProUser, setProStatus, isProPreview, setProPreview, STRIPE_CONFIG } from "~/lib/stripe";
import { UpgradeModal } from "~/components/UpgradeModal";

export const Route = createFileRoute("/")({
  component: Home,
});

const JOINT_TYPES: { value: JointType; label: string }[] = [
  { value: "fillet", label: "Fillet" },
  { value: "butt", label: "Butt" },
  { value: "groove", label: "Groove" },
  { value: "socket", label: "Socket" },
  { value: "lap", label: "Lap" },
];

const MATERIAL_TYPES: { value: MaterialType; label: string }[] = [
  { value: "carbon-steel", label: "Carbon Steel" },
  { value: "stainless-steel", label: "Stainless Steel" },
  { value: "aluminum", label: "Aluminum" },
];

const CODE_STANDARDS: { value: CodeStandard; label: string }[] = [
  { value: "general", label: "General Practice" },
  { value: "aws-d1.1", label: "AWS D1.1 (Structural)" },
  { value: "asme-b31.3", label: "ASME B31.3 (Piping)" },
  { value: "custom", label: "Custom" },
];

function Home() {
  const [thickness, setThickness] = useState("");
  const [jointType, setJointType] = useState<JointType>("fillet");
  const [materialType, setMaterialType] = useState<MaterialType>("carbon-steel");
  const [materialGrade, setMaterialGrade] = useState<MaterialGrade>("standard");
  const [codeStandard, setCodeStandard] = useState<CodeStandard>("general");
  const [customCodeNote, setCustomCodeNote] = useState("");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("inches");
  const [result, setResult] = useState<ReturnType<typeof calculateWeld> | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<CalcHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isPro, setIsPro] = useState(() => isProUser() || isProPreview());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureName, setUpgradeFeatureName] = useState("");

  // Reset grade when material type changes
  useEffect(() => {
    const grades = MATERIAL_GRADES[materialType];
    const currentIsValid = grades.some((g) => g.value === materialGrade);
    if (!currentIsValid) {
      setMaterialGrade("standard");
    }
  }, [materialType, materialGrade]);

  // Load history on mount
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const requirePro = useCallback((featureName: string): boolean => {
    if (isPro) return false;
    setUpgradeFeatureName(featureName);
    setShowUpgradeModal(true);
    return true;
  }, [isPro]);

  const gradeInfo = getGradeInfo(materialType, materialGrade);

  const handleCalculate = () => {
    setError("");
    const t = parseFloat(thickness);
    if (isNaN(t) || t <= 0) {
      setError("Please enter a valid positive thickness value.");
      return;
    }
    if (t > 10) {
      setError("Thickness seems unusually high. Please enter a value in " + unitSystem + " (max 10).");
      return;
    }
    const calcResult = calculateWeld({
      thickness: t,
      jointType,
      materialType,
      materialGrade,
      codeStandard,
      customCodeNote,
      unitSystem,
    });
    setResult(calcResult);

    // Save to history
    saveCalculation({
      thickness,
      jointType,
      materialType,
      materialGrade,
      codeStandard,
      customCodeNote,
      unitSystem,
      legSize: calcResult.legSize,
      legSizeInches: calcResult.legSizeInches,
      throat: calcResult.throat,
      throatInches: calcResult.throatInches,
      codeNote: calcResult.codeNote,
    });
    setHistory(loadHistory());
    setShowHistory(true);
  };

  const handleReset = () => {
    setThickness("");
    setJointType("fillet");
    setMaterialType("carbon-steel");
    setMaterialGrade("standard");
    setCodeStandard("general");
    setCustomCodeNote("");
    setUnitSystem("inches");
    setResult(null);
    setError("");
  };

  const otherUnit = unitSystem === "inches" ? "mm" : "inches";

  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thicknessRef = useRef<HTMLInputElement>(null);

  const handleCopyResults = useCallback(() => {
    if (!result) return;
    const unitLabel = unitSystem === "inches" ? "in" : "mm";
    const jointLabel = JOINT_TYPES.find((j) => j.value === jointType)?.label ?? jointType;
    const codeLabel = CODE_STANDARDS.find((c) => c.value === codeStandard)?.label ?? codeStandard;

    const summary = [
      `WeldSizer Calculation Summary`,
      `─────────────────────────────`,
      `Joint Type:     ${jointLabel}`,
      `Material:       ${gradeInfo.label}`,
      `Yield Strength: ${gradeInfo.yieldKsi} ksi`,
      `Code Standard:  ${codeLabel}`,
      `Thickness:      ${thickness} ${unitLabel}`,
      `─────────────────────────────`,
      `Weld Size (Leg):   ${result.legSize.toFixed(unitSystem === "inches" ? 3 : 1)} ${unitLabel}`,
      `Throat Thickness:  ${result.throat.toFixed(unitSystem === "inches" ? 3 : 1)} ${unitLabel}`,
      `─────────────────────────────`,
      `Code Ref: ${result.codeNote}`,
    ].join("\n");

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = summary;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [result, jointType, gradeInfo, codeStandard, thickness, unitSystem]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCalculate();
    }
  }, [handleCalculate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleHistorySelect = useCallback((entry: CalcHistoryEntry) => {
    setThickness(entry.thickness);
    setJointType(entry.jointType as JointType);
    setMaterialType(entry.materialType as MaterialType);
    if (entry.materialGrade) setMaterialGrade(entry.materialGrade as MaterialGrade);
    setCodeStandard(entry.codeStandard as CodeStandard);
    if (entry.customCodeNote) setCustomCodeNote(entry.customCodeNote);
    setUnitSystem(entry.unitSystem as UnitSystem);
    setResult({
      legSize: entry.legSize,
      legSizeInches: entry.legSizeInches,
      throat: entry.throat,
      throatInches: entry.throatInches,
      codeNote: entry.codeNote,
    } as ReturnType<typeof calculateWeld>);
    setError("");
  }, []);

  const handleDeleteEntry = useCallback((id: string) => {
    deleteEntry(id);
    setHistory(loadHistory());
  }, []);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
    setShowHistory(false);
  }, []);

  const handlePrintReport = useCallback(() => {
    if (!result) return;
    const unitLabel = unitSystem === "inches" ? "in" : "mm";
    const otherUnitLabel = unitSystem === "inches" ? "mm" : "in";
    const jointLabel = JOINT_TYPES.find((j) => j.value === jointType)?.label ?? jointType;
    const codeLabel = CODE_STANDARDS.find((c) => c.value === codeStandard)?.label ?? codeStandard;
    let materialFactorNote = "";
    if (materialType !== "carbon-steel" || materialGrade !== "standard") {
      materialFactorNote = `${gradeInfo.label}: ×${gradeInfo.factor} factor, ${gradeInfo.yieldKsi} ksi yield`;
    }

    const reportHtml = buildReportHtml({
      jointTypeLabel: jointLabel,
      materialTypeLabel: MATERIAL_TYPES.find((m) => m.value === materialType)?.label ?? materialType,
      materialGradeLabel: materialGrade !== "standard" ? gradeInfo.label : undefined,
      codeStandardLabel: codeLabel,
      thickness: thickness,
      unitLabel,
      otherUnitLabel,
      legSize: result.legSize,
      legSizeInches: result.legSizeInches,
      throat: result.throat,
      throatInches: result.throatInches,
      legSizeOther: unitSystem === "inches" ? result.legSizeInches * 25.4 : result.legSizeInches,
      throatOther: unitSystem === "inches" ? result.throatInches * 25.4 : result.throatInches,
      codeNote: result.codeNote,
      materialFactorNote,
    });

    openPrintWindow(reportHtml);
  }, [result, jointType, materialType, materialGrade, gradeInfo, codeStandard, thickness, unitSystem]);

  // Get available grades for current material type
  const availableGrades = MATERIAL_GRADES[materialType];

  return (
    <div className="min-h-dvh bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <svg className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xl font-bold text-slate-100">WeldSizer</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">
              Fast. Accurate. Code-Compliant.
            </span>
            {isPro ? (
              <span className="flex items-center gap-1.5 rounded-md bg-cyan-500/15 px-3 py-1.5 text-xs font-semibold text-cyan-400">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
                Pro
              </span>
            ) : (
              <button
                onClick={() => { setUpgradeFeatureName(""); setShowUpgradeModal(true); }}
                className="rounded-md bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
            Weld Size Calculator
          </h1>
          <p className="mt-2 text-slate-400">
            Enter joint details to get code-compliant weld dimensions instantly.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Input Section */}
          <div className="card lg:col-span-3">
            <h2 className="mb-6 text-lg font-semibold text-slate-200">Joint Parameters</h2>

            {/* Unit Toggle */}
            <div className="mb-6">
              <span className="label-text">Units</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setUnitSystem("inches")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    unitSystem === "inches"
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  Inches (in)
                </button>
                <button
                  onClick={() => setUnitSystem("mm")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    unitSystem === "mm"
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  Millimeters (mm)
                </button>
              </div>
            </div>

            {/* Material Thickness */}
            <div className="mb-5">
              <label htmlFor="thickness" className="label-text">
                Material Thickness ({unitSystem === "inches" ? "in" : "mm"})
              </label>
              <input
                id="thickness"
                type="number"
                step={unitSystem === "inches" ? "0.0625" : "1"}
                min="0.01"
                max="10"
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                onKeyDown={handleKeyDown}
                ref={thicknessRef}
                placeholder={unitSystem === "inches" ? "e.g. 0.375" : "e.g. 9.5"}
                className="input-field"
              />
            </div>

            {/* Joint Type */}
            <div className="mb-5">
              <label htmlFor="jointType" className="label-text">Joint Type</label>
              <select
                id="jointType"
                value={jointType}
                onChange={(e) => setJointType(e.target.value as JointType)}
                className="select-field"
              >
                {JOINT_TYPES.map((jt) => (
                  <option key={jt.value} value={jt.value}>
                    {jt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Type (two-level) */}
            <div className="mb-3">
              <label htmlFor="materialType" className="label-text">Material Type</label>
              <select
                id="materialType"
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value as MaterialType)}
                className="select-field"
              >
                {MATERIAL_TYPES.map((mt) => (
                  <option key={mt.value} value={mt.value}>
                    {mt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Grade */}
            <div className="mb-3">
              <label htmlFor="materialGrade" className="label-text">Grade / Specification</label>
              <div className="relative">
                <select
                  id="materialGrade"
                  value={materialGrade}
                  onChange={(e) => {
                    if (!isPro && e.target.value !== "standard") {
                      requirePro("Alloy-Specific Grades");
                      return;
                    }
                    setMaterialGrade(e.target.value as MaterialGrade);
                  }}
                  className="select-field"
                >
                  {availableGrades.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label} (×{g.factor}, {g.yieldKsi} ksi)
                    </option>
                  ))}
                </select>
                {!isPro && (
                  <div className="pointer-events-none absolute inset-y-0 right-10 flex items-center">
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">Pro</span>
                  </div>
                )}
              </div>
              {!isPro && (
                <p className="mt-1 text-xs text-slate-500">
                  Advanced grades (316L, 5083-H116) available in Pro.
                </p>
              )}
            </div>

            {/* Yield strength note */}
            {gradeInfo.yieldKsi && isPro && (
              <div className="mb-5 rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-300/80">
                Yield Strength: <strong>{gradeInfo.yieldKsi} ksi</strong> · Material Factor: ×{gradeInfo.factor}
              </div>
            )}
            {!isPro && (
              <div className="mb-5 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-xs text-slate-500">
                Yield strength data available in <button onClick={() => requirePro("Yield Strength Data")} className="font-medium text-amber-400 underline hover:text-amber-300">Pro</button>.
              </div>
            )}

            {/* Code Standard */}
            <div className="mb-3">
              <label htmlFor="codeStandard" className="label-text">Code Standard</label>
              <select
                id="codeStandard"
                value={codeStandard}
                onChange={(e) => {
                  if (!isPro && e.target.value === "custom") {
                    requirePro("Custom Code Standards");
                    return;
                  }
                  setCodeStandard(e.target.value as CodeStandard);
                }}
                className="select-field"
              >
                {CODE_STANDARDS.map((cs) => (
                  <option key={cs.value} value={cs.value}>
                    {cs.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom code note input */}
            {codeStandard === "custom" && isPro && (
              <div className="mb-5">
                <label htmlFor="customCodeNote" className="label-text">
                  Custom Reference Note
                </label>
                <input
                  id="customCodeNote"
                  type="text"
                  value={customCodeNote}
                  onChange={(e) => setCustomCodeNote(e.target.value)}
                  placeholder="e.g. Company standard XYZ-123, Section 4.2"
                  className="input-field"
                />
                <p className="mt-1 text-xs text-slate-500">
                  This text will appear as the code reference in results.
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={handleCalculate} className="btn-primary flex-1">
                Calculate Weld Size
              </button>
              <button onClick={handleReset} className="btn-secondary">
                Reset
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {result ? (
              <div className="card h-full">
                <h2 className="mb-6 text-lg font-semibold text-slate-200">Weld Results</h2>

                <div className="space-y-5">
                  {/* Leg Size */}
                  <div>
                    <span className="result-label">Recommended Weld Size (Leg)</span>
                    <div className="result-value">
                      {result.legSize.toFixed(unitSystem === "inches" ? 3 : 1)}{" "}
                      <span className="text-lg text-slate-400">{unitSystem === "inches" ? "in" : "mm"}</span>
                    </div>
                    <span className="mt-1 block text-xs text-slate-500">
                      {result.legSizeInches.toFixed(3)} in / {(result.legSizeInches * 25.4).toFixed(1)} mm
                    </span>
                  </div>

                  {/* Throat Thickness */}
                  <div>
                    <span className="result-label">Throat Thickness</span>
                    <div className="result-value">
                      {result.throat.toFixed(unitSystem === "inches" ? 3 : 1)}{" "}
                      <span className="text-lg text-slate-400">{unitSystem === "inches" ? "in" : "mm"}</span>
                    </div>
                    <span className="mt-1 block text-xs text-slate-500">
                      {result.throatInches.toFixed(3)} in / {(result.throatInches * 25.4).toFixed(1)} mm
                    </span>
                  </div>

                  {/* Conversion note */}
                  {(jointType === "butt" || jointType === "groove") && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                      For {jointType === "butt" ? "butt" : "groove"} welds, "leg size" represents effective weld penetration depth.
                    </div>
                  )}

                  {/* Code Note */}
                  <div className="rounded-lg border border-slate-600 bg-slate-800 p-3">
                    <span className="mb-1 block text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Code Reference
                    </span>
                    <p className="text-sm leading-relaxed text-slate-300">{result.codeNote}</p>
                  </div>

                  {/* Material info note */}
                  {isPro ? (
                    <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300">
                      {gradeInfo.label} · <strong>{gradeInfo.yieldKsi} ksi</strong> yield · Factor: ×{gradeInfo.factor}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-xs text-slate-500">
                      <button onClick={() => requirePro("Alloy-Specific Grades")} className="font-medium text-amber-400 underline hover:text-amber-300">Upgrade to Pro</button> for material-specific data.
                    </div>
                  )}

                  {/* Copy Results + Confirmation */}
                  <div className="relative pt-2">
                    <button
                      onClick={handleCopyResults}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy Results
                    </button>
                    {copied && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full animate-bounce-once rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg">
                        <div className="flex items-center gap-1.5">
                          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                          Copied!
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PDF Report Button */}
                  {isPro ? (
                    <div className="pt-2">
                      <button
                        onClick={handlePrintReport}
                        className="btn-outline flex w-full items-center justify-center gap-2"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 14h12v8H6z" />
                        </svg>
                        Generate PDF Report
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">Pro</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <button
                        onClick={() => requirePro("PDF Report Export")}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-700/40 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 14h12v8H6z" />
                        </svg>
                        PDF Reports
                        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">Pro</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card flex h-full items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto mb-4 h-12 w-12 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-slate-500">
                    Enter parameters and click "Calculate Weld Size" to get started.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Calculation History */}
        {showHistory && isPro && (
          <div className="mt-8">
            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-200">Calculation History</h2>
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                    Pro
                    <span className="ml-1 hidden sm:inline text-amber-400/70 text-[10px]">— works now during preview</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{history.length} saved</span>
                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="rounded-md border border-red-700/40 bg-red-900/20 px-3 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {history.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">No calculation history yet.</p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="group flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 transition-colors hover:border-slate-600 hover:bg-slate-800"
                    >
                      <button
                        onClick={() => handleHistorySelect(entry)}
                        className="flex flex-1 items-center gap-3 text-left focus:outline-none"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-200">
                              {HIST_JOINT_LABELS[entry.jointType] ?? entry.jointType}
                            </span>
                            <span className="text-xs text-slate-500">·</span>
                            <span className="text-xs text-slate-400">
                              {HIST_MATERIAL_LABELS[entry.materialType] ?? entry.materialType}
                            </span>
                            {entry.materialGrade && entry.materialGrade !== "standard" && (
                              <>
                                <span className="text-xs text-slate-500">·</span>
                                <span className="text-xs text-cyan-400/70 uppercase">
                                  {entry.materialGrade}
                                </span>
                              </>
                            )}
                            <span className="text-xs text-slate-500">·</span>
                            <span className="text-xs text-slate-400">
                              {HIST_CODE_LABELS[entry.codeStandard] ?? entry.codeStandard}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            <span>{entry.thickness} {entry.unitSystem === "inches" ? "in" : "mm"}</span>
                            <span>→</span>
                            <span className="font-medium text-cyan-400">
                              {entry.legSize.toFixed(entry.unitSystem === "inches" ? 3 : 1)} {entry.unitSystem === "inches" ? "in" : "mm"}
                            </span>
                          </div>
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-600">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="shrink-0 rounded p-1 text-slate-600 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                        title="Delete entry"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paid Tier Teaser (Coming Soon) */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-slate-300">PDF Reports</span>
            </div>
            <p className="text-xs text-slate-500">
              Export professional weld calculation reports with full code references. <span className="italic text-green-400/70">Active in preview — Pro feature.</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
              </svg>
              <span className="text-sm font-medium text-slate-300">Batch History</span>
            </div>
            <p className="text-xs text-slate-500">
              Save and review your previous calculations. Share project libraries with your team. <span className="italic text-green-400/70">Active in preview — Pro feature.</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-5 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
            <div className="mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
              <span className="text-sm font-medium text-slate-300">Alloy Data & Custom Codes</span>
            </div>
            <p className="text-xs text-slate-500">
              Access alloy-specific data and custom code selection with specific material grades. <span className="italic text-green-400/70">Active in preview — Pro feature.</span>
            </p>
          </div>
        </div>
      </main>

      {/* Hidden print container for PDF report generation */}
      <div id="print-container" className="hidden" style={{ display: "none" }} />

      {/* Upgrade to Pro Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName={upgradeFeatureName}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center">
        <p className="text-sm text-slate-600">
          Built with{" "}
          <a
            href="https://cto.new"
            className="underline hover:text-slate-400 transition-colors"
          >
            cto.new
          </a>
        </p>
      </footer>
    </div>
  );
}