import { useRef, useState } from 'react';
import { useAuth } from '../lib/auth';
import { t, type Language } from '../lib/i18n';
import { CROP_OPTIONS, getDiseaseByName, type DiseaseInfo } from '../lib/diseaseEngine';
import { translateDisease } from '../lib/diseaseTranslations';
import { translateCropName } from '../lib/cropTranslations';
import { analyzeCropImage, ImageAnalysisError, type ImageDiagnosisResult, type DiagnosisSeverity } from '../lib/imageEngine';
import {
  ScanLine, Upload, Loader2, ImageIcon, CheckCircle2, AlertTriangle,
  Shield, FlaskConical, Bug, Sparkles, ChevronDown, X, Stethoscope, HelpCircle, ShieldAlert, ClipboardList, Lightbulb,
} from 'lucide-react';

export default function ImageSearchPage() {
  const { language } = useAuth();
  const tr = t(language);
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [crop, setCrop] = useState('Rice');
  const [cropOpen, setCropOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageDiagnosisResult | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/') || file.size === 0 || file.size > 10 * 1024 * 1024) {
      setErrorCode('INVALID_IMAGE');
      return;
    }
    setImageName(file.name);
    setErrorCode(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
    };
    reader.onerror = () => {
      setErrorCode('FILE_READ_ERROR');
    };
    reader.readAsDataURL(file);
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleFile(file);
  }

  // Real analysis: sends the image to the backend, which runs it through a
  // local Ollama vision model (server/visionModel.js) plus a second,
  // code-level validation pass (server/diagnosisValidator.js) that refuses
  // to let a HEALTHY verdict stand if the model's own reported evidence
  // contradicts it. No client-side fabrication, no dependency on the crop
  // dropdown to pick a canned result. See src/lib/imageEngine.ts.
  async function analyze() {
    if (!image) return;
    setAnalyzing(true);
    setResult(null);
    setErrorCode(null);
    try {
      const diagnosis = await analyzeCropImage(image, crop, language);
      setResult(diagnosis);
    } catch (err) {
      const code = err instanceof ImageAnalysisError ? err.code : 'ANALYSIS_FAILED';
      console.error('[UzhavanAI] Image analysis failed:', code, err);
      setErrorCode(code);
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    setImage(null);
    setImageName('');
    setResult(null);
    setErrorCode(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  // When the vision model identified a specific issue name that matches
  // one of our curated reference entries, enrich it with full localized
  // cause/treatment/prevention text. If it doesn't match anything known,
  // knownDisease stays null and the UI falls back to the model's own
  // possibleCauses/recommendation text instead — never a fabricated write-up.
  const knownDisease: DiseaseInfo | null =
    result && ['SUSPECTED_ISSUE', 'DISEASE_DETECTED'].includes(result.status) && result.suspectedIssueName
      ? getDiseaseByName(result.suspectedIssueName)
      : null;
  const localizedDisease = knownDisease ? translateDisease(knownDisease, language) : null;
  const confidencePercent = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">{tr.imageSearch}</h1>
        <p className="mt-0.5 text-sm text-gray-500">{tr.imageSearchDesc}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload + controls */}
        <div className="space-y-4">
          {/* Upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all ${
              dragging
                ? 'border-primary-500 bg-primary-50'
                : image
                ? 'border-primary-200 bg-primary-50/30'
                : 'border-gray-300 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/30'
            }`}
          >
            {image ? (
              <div className="relative w-full">
                <img src={image} alt="Uploaded crop" className="mx-auto max-h-64 rounded-xl object-contain" />
                <button
                  onClick={(e) => { e.stopPropagation(); reset(); }}
                  className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-md transition-colors hover:bg-error-50"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
                <p className="mt-3 text-center text-sm text-gray-500">{imageName}</p>
              </div>
            ) : (
              <>
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
                  <Upload className="h-8 w-8 text-primary-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">{tr.dragDrop}</p>
                <p className="mt-1 text-xs text-gray-400">PNG, JPG up to 10MB</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              className="hidden"
            />
          </div>

          {/* Crop selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">{tr.selectCrop}</label>
            <div className="relative">
              <button
                onClick={() => setCropOpen(!cropOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all hover:border-primary-300"
              >
                {crop}
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${cropOpen ? 'rotate-180' : ''}`} />
              </button>
              {cropOpen && (
                <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {CROP_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCrop(c); setCropOpen(false); }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 ${
                        crop === c ? 'font-semibold text-primary-700' : 'text-gray-700'
                      }`}
                    >
                      {c}
                      {crop === c && <CheckCircle2 className="h-4 w-4 text-primary-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={!image || analyzing}
            className="btn-primary w-full"
          >
            {analyzing ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> {tr.analyzing}</>
            ) : (
              <><ScanLine className="h-5 w-5" /> {tr.analyzeImage}</>
            )}
          </button>
        </div>

        {/* Results */}
        <div>
          {errorCode ? (
            <ErrorState code={errorCode} tr={tr} onRetry={analyze} />
          ) : result ? (
            <ResultState
              result={result}
              localizedDisease={localizedDisease}
              confidencePercent={confidencePercent}
              tr={tr}
              language={language}
            />
          ) : analyzing ? (
            <div className="card flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
                <ScanLine className="h-8 w-8 animate-pulse text-primary-600" />
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900">{tr.analyzing}</h3>
              <p className="mt-1 text-sm text-gray-500">{tr.scanningHint}</p>
              <div className="mt-4 flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary-500" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : (
            <div className="card flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
                <ImageIcon className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900">{tr.noImage}</h3>
              <p className="mt-1 max-w-xs text-sm text-gray-500">{tr.uploadPromptHint}</p>
              <div className="mt-6 flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 text-sm text-primary-700">
                <Sparkles className="h-4 w-4" />
                {tr.aiPoweredLabel}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type Tr = ReturnType<typeof t>;

const SEVERITY_STYLE: Record<DiagnosisSeverity, string> = {
  LOW: 'bg-success-100 text-success-700',
  MEDIUM: 'bg-accent-100 text-accent-700',
  HIGH: 'bg-error-100 text-error-700',
  UNKNOWN: 'bg-gray-100 text-gray-600',
};

function severityLabel(severity: DiagnosisSeverity, tr: Tr): string {
  switch (severity) {
    case 'LOW': return tr.severityLow;
    case 'MEDIUM': return tr.severityMedium;
    case 'HIGH': return tr.severityHigh;
    default: return tr.severityUnknown;
  }
}

function ResultState({
  result, localizedDisease, confidencePercent, tr, language,
}: {
  result: ImageDiagnosisResult;
  localizedDisease: DiseaseInfo | null;
  confidencePercent: number;
  tr: Tr;
  language: Language;
}) {
  if (result.status === 'NOT_A_PLANT') {
    return <InfoCard icon={ShieldAlert} tone="warning" title={tr.notAPlantTitle} hint={tr.notAPlantHint} />;
  }
  if (result.status === 'CROP_MISMATCH') {
    return (
      <InfoCard icon={AlertTriangle} tone="warning" title={tr.cropMismatchTitle} hint={tr.cropMismatchHint}>
        {result.identifiedCrop && (
          <p className="mt-2 text-xs text-gray-500">{tr.identifiedAs}: {translateCropName(result.identifiedCrop, language)}</p>
        )}
      </InfoCard>
    );
  }
  if (result.status === 'UNKNOWN_CROP') {
    return <InfoCard icon={HelpCircle} tone="neutral" title={tr.unknownCropTitle} hint={tr.lowConfidenceHint} />;
  }
  if (result.status === 'UNCERTAIN') {
    return (
      <InfoCard icon={HelpCircle} tone="neutral" title={tr.lowConfidenceTitle} hint={tr.lowConfidenceHint}>
        {result.observedSymptoms.length > 0 && (
          <ListBlock title={tr.diagnosis} items={result.observedSymptoms} className="mt-3" />
        )}
        {result.recommendation && (
          <p className="mt-3 text-sm text-gray-600"><span className="font-semibold text-gray-700">{tr.recommendationLabel}: </span>{result.recommendation}</p>
        )}
      </InfoCard>
    );
  }

  const isHealthy = result.status === 'HEALTHY';
  // SUSPECTED_ISSUE beyond this point.
  const displaySeverity = localizedDisease ? null : result.severity; // known-disease card uses its own severity vocabulary
  const title = isHealthy
    ? tr.healthy
    : result.status === 'DISEASE_DETECTED'
    ? localizedDisease?.name ?? result.suspectedIssueName ?? tr.diseaseDetectedTitle
    : result.status === 'PEST_DETECTED'
    ? result.suspectedIssueName ?? tr.pestDetectedTitle
    : localizedDisease?.name ?? result.suspectedIssueName ?? tr.unknownIssueLabel;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className={`card overflow-hidden ${isHealthy ? 'ring-2 ring-success-300' : 'ring-2 ring-error-200'}`}>
        <div className={`flex items-center gap-3 p-5 ${isHealthy ? 'bg-success-50' : 'bg-error-50'}`}>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
            isHealthy ? 'bg-success-100 text-success-600' : 'bg-error-100 text-error-600'
          }`}>
            {isHealthy ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-bold text-gray-900">{title}</h3>
              {!isHealthy && localizedDisease && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  localizedDisease.severity === 'Low' ? SEVERITY_STYLE.LOW : localizedDisease.severity === 'High' ? SEVERITY_STYLE.HIGH : SEVERITY_STYLE.MEDIUM
                }`}>
                  {localizedDisease.severity}
                </span>
              )}
              {!isHealthy && displaySeverity && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[displaySeverity]}`}>
                  {severityLabel(displaySeverity, tr)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{confidencePercent}% {tr.confidence}</p>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold text-gray-900">{confidencePercent}%</div>
          </div>
        </div>

        {!isHealthy && (
          <div className="space-y-4 p-5">
            {result.observedSymptoms.length > 0 && (
              <ListSection icon={Stethoscope} title={tr.diagnosis} items={result.observedSymptoms} />
            )}
            {localizedDisease ? (
              <>
                <DiagnosisSection icon={Bug} title={tr.cause} text={localizedDisease.cause} />
                <DiagnosisSection icon={FlaskConical} title={tr.treatment} text={localizedDisease.treatment} />
                <DiagnosisSection icon={Shield} title={tr.prevention} text={localizedDisease.prevention} />
              </>
            ) : (
              <>
                {result.possibleCauses.length > 0 && (
                  <ListSection icon={Bug} title={tr.possibleCausesLabel} items={result.possibleCauses} />
                )}
                {result.recommendation && (
                  <DiagnosisSection icon={Lightbulb} title={tr.recommendationLabel} text={result.recommendation} />
                )}
              </>
            )}
          </div>
        )}

        {isHealthy && result.recommendation && (
          <div className="p-5 pt-0">
            <DiagnosisSection icon={Lightbulb} title={tr.recommendationLabel} text={result.recommendation} />
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon, tone, title, hint, children,
}: {
  icon: typeof ShieldAlert;
  tone: 'warning' | 'neutral';
  title: string;
  hint: string;
  children?: React.ReactNode;
}) {
  const toneClasses = tone === 'warning'
    ? { ring: 'ring-2 ring-accent-200', bg: 'bg-accent-50', icon: 'bg-accent-100 text-accent-600' }
    : { ring: 'ring-2 ring-gray-200', bg: 'bg-gray-50', icon: 'bg-gray-100 text-gray-500' };
  return (
    <div className={`card overflow-hidden ${toneClasses.ring} animate-slide-up`}>
      <div className={`flex items-start gap-3 p-5 ${toneClasses.bg}`}>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${toneClasses.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{hint}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ code, tr, onRetry }: { code: string; tr: Tr; onRetry: () => void }) {
  const isUnavailable = code === 'VISION_MODEL_UNAVAILABLE';
  const isInvalidImage = code === 'INVALID_IMAGE';
  return (
    <div className="card flex h-full min-h-[300px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-error-100">
        <AlertTriangle className="h-8 w-8 text-error-600" />
      </div>
      <h3 className="font-display text-lg font-semibold text-gray-900">
        {isUnavailable ? tr.visionModelUnavailableTitle : isInvalidImage ? tr.lowConfidenceTitle : tr.analysisFailedTitle}
      </h3>
      <p className="mt-1 max-w-xs text-sm text-gray-500">
        {isUnavailable ? tr.visionModelUnavailableHint : isInvalidImage ? tr.lowConfidenceHint : tr.analysisFailedHint}
      </p>
      <button onClick={onRetry} className="btn-secondary mt-4 px-4 py-2 text-sm">
        {tr.retry}
      </button>
    </div>
  );
}

function DiagnosisSection({ icon: Icon, title, text }: {
  icon: typeof Stethoscope; title: string; text: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      </div>
      <p className="ml-6 text-sm leading-relaxed text-gray-600">{text}</p>
    </div>
  );
}

// Renders a list of short, real, model-reported phrases (symptoms /
// possible causes) — never a single fabricated sentence standing in for
// evidence the model didn't actually report.
function ListSection({ icon: Icon, title, items }: {
  icon: typeof Stethoscope; title: string; items: string[];
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <Icon className="h-4 w-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      </div>
      <ul className="ml-6 list-disc space-y-0.5 text-sm leading-relaxed text-gray-600">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

function ListBlock({ title, items, className }: { title: string; items: string[]; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-1 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      </div>
      <ul className="ml-6 list-disc space-y-0.5 text-sm leading-relaxed text-gray-600">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}
