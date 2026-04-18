import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface CsvImportButtonProps {
  /** Database table name */
  table: string;
  /** Display label e.g. "Equipment" */
  entityLabel: string;
  /** CSV column headers (in order) */
  templateColumns: string[];
  /** Example row matching columns */
  templateExample: Record<string, string>;
  /** Map a parsed CSV row -> insert payload (return null to skip). Receives lookups context. */
  mapRow: (row: Record<string, string>, ctx: { now: Date }) => Promise<Record<string, any> | null> | Record<string, any> | null;
  /** React Query key to invalidate after import */
  invalidateKey: string;
  /** Filename for downloaded template (without .csv) */
  templateFilename: string;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQuotes = false;
        else cur += ch;
      } else {
        if (ch === ',') { out.push(cur); cur = ""; }
        else if (ch === '"') inQuotes = true;
        else cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = parseLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
}

export function CsvImportButton({
  table,
  entityLabel,
  templateColumns,
  templateExample,
  mapRow,
  invalidateKey,
  templateFilename,
}: CsvImportButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const downloadTemplate = () => {
    const header = templateColumns.join(",");
    const example = templateColumns.map((c) => {
      const v = templateExample[c] ?? "";
      return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(",");
    const blob = new Blob([header + "\n" + example + "\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateFilename}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toast({ variant: "destructive", title: "Empty file", description: "No data rows found." });
        return;
      }
      const now = new Date();
      const payloads: Record<string, any>[] = [];
      const skipped: number[] = [];
      for (let i = 0; i < rows.length; i++) {
        try {
          const mapped = await mapRow(rows[i], { now });
          if (mapped) payloads.push(mapped);
          else skipped.push(i + 2);
        } catch {
          skipped.push(i + 2);
        }
      }
      if (payloads.length === 0) {
        toast({ variant: "destructive", title: "Nothing to import", description: "All rows were invalid or skipped." });
        return;
      }
      const { error } = await supabase.from(table as any).insert(payloads as any);
      if (error) {
        toast({ variant: "destructive", title: "Import failed", description: error.message });
      } else {
        toast({
          title: `Imported ${payloads.length} ${entityLabel}`,
          description: skipped.length ? `Skipped ${skipped.length} invalid row(s).` : undefined,
        });
        qc.invalidateQueries({ queryKey: [invalidateKey] });
      }
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={downloadTemplate}>
        <Download className="mr-2 h-4 w-4" /> Template
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={importing}>
        <Upload className="mr-2 h-4 w-4" /> {importing ? "Importing…" : "Import CSV"}
      </Button>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
    </>
  );
}
