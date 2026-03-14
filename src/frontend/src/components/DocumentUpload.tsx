import { Button } from "@/components/ui/button";
import { CheckCircle, Upload } from "lucide-react";
import { useRef } from "react";

interface DocumentUploadProps {
  label: string;
  value?: string; // data URL
  onChange: (dataUrl: string) => void;
  required?: boolean;
}

export default function DocumentUpload({
  label,
  value,
  onChange,
  required,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) onChange(ev.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="doc-upload"
          className="text-sm font-medium text-foreground"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {value && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Uploaded
          </span>
        )}
      </div>

      <button
        type="button"
        data-ocid="doc.dropzone"
        className={`relative border-2 border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors ${
          value
            ? "border-green-300 bg-green-50"
            : "border-primary/30 hover:border-primary/60 bg-primary/5"
        }`}
        onClick={() => inputRef.current?.click()}
        style={{ width: "100%", textAlign: "left" }}
      >
        {value ? (
          <img
            src={value}
            alt={label}
            className="w-16 h-16 object-cover rounded-lg border border-border"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {value ? "Change document" : "Upload document"}
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG (max 10MB)</p>
        </div>
        <Button
          data-ocid="doc.upload_button"
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          {value ? "Change" : "Upload"}
        </Button>
      </button>

      <input
        ref={inputRef}
        id="doc-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
