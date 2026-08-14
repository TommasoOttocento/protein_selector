import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import ProteinImpression from "./components/ProteinImpression";
import SequenceHighlight from "./components/SequenceHighlight";
import { parseFasta, type FastaRecord } from "./lib/fasta";
import { reverseComplementText } from "./lib/nucleotides";
import { translate, type SequenceKind } from "./lib/translate";
import "./App.css";

type TranslationResult = {
  header: string;
  length: number;
  protein: string;
  error?: string;
};

export default function App() {
  const [kind, setKind] = useState<SequenceKind>("DNA");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TranslationResult[] | null>(null);
  const [manualProtein, setManualProtein] = useState("");
  const [showComplement, setShowComplement] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const records = useMemo(() => parseFasta(text), [text]);
  const complementText = useMemo(
    () => (showComplement ? reverseComplementText(text, kind) : ""),
    [kind, showComplement, text],
  );

  async function loadFile(file: File) {
    const content = await file.text();
    setFileName(file.name);
    setText(content);
    setResults(null);
    setError(null);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      void loadFile(file);
    }
  }

  function onFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void loadFile(file);
    }
  }

  function runTranslation() {
    setError(null);
    if (records.length === 0) {
      setResults(null);
      setError("Paste a sequence or drop a FASTA file first.");
      return;
    }

    const next: TranslationResult[] = records.map((record: FastaRecord) => {
      try {
        return {
          header: record.header,
          length: record.sequence.replace(/\s+/g, "").length,
          protein: translate(record.sequence, kind),
        };
      } catch (caught) {
        return {
          header: record.header,
          length: record.sequence.replace(/\s+/g, "").length,
          protein: "",
          error: caught instanceof Error ? caught.message : "Translation failed",
        };
      }
    });

    setResults(next);
  }

  function reset() {
    setText("");
    setFileName(null);
    setResults(null);
    setManualProtein("");
    setShowComplement(false);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">Sequence tools</p>
      <h1>Nucleotide translator</h1>
      <h3> created by Tommaso Ottocento</h3>
      <p className="lede">
        Drop a FASTA file or paste a nucleotide string. Choose DNA or RNA, then translate
        to amino acids with the standard genetic code.
      </p>

      <section className="panel">
        <div className="toolbar">
          <div className="switch" role="group" aria-label="Sequence type">
            <button
              type="button"
              className={kind === "DNA" ? "active" : ""}
              onClick={() => setKind("DNA")}
            >
              DNA
            </button>
            <button
              type="button"
              className={kind === "RNA" ? "active" : ""}
              onClick={() => setKind("RNA")}
            >
              RNA
            </button>
          </div>
          <span className="mono">{kind === "DNA" ? "A C G T" : "A C G U"}</span>
        </div>

        <div
          className={`dropzone${dragging ? " dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <strong>Drag and drop a FASTA file</strong>
          <div>or click to browse</div>
          {fileName ? <p className="file-name mono">{fileName}</p> : null}
          <input
            ref={inputRef}
            type="file"
            accept=".fa,.fasta,.fna,.ffn,.txt"
            hidden
            onChange={onFileInput}
          />
        </div>

        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setResults(null);
          }}
          spellCheck={false}
          className="mono"
          placeholder={
            kind === "DNA"
              ? ">example\nATGGAATTCTAA"
              : ">example\nAUGGAAUUCUAA"
          }
        />

        <div className="seq-panel">
          <div className="seq-panel-label">Start / stop preview</div>
          <SequenceHighlight text={text} />
          <ul className="codon-legend">
            <li>
              <span>
                <span className="codon-swatch start" />
                Start {kind === "DNA" ? "ATG" : "AUG"}
              </span>
            </li>
            <li>
              <span>
                <span className="codon-swatch stop" />
                Stop {kind === "DNA" ? "TAA TAG TGA" : "UAA UAG UGA"}
              </span>
            </li>
          </ul>
        </div>

        <div className="actions">
          <button type="button" className="primary" onClick={runTranslation}>
            Translate
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => setShowComplement((current) => !current)}
            disabled={!text.trim()}
          >
            {showComplement ? "Hide complement" : "Preview complement"}
          </button>
          <button type="button" className="ghost" onClick={reset}>
            Clear
          </button>
        </div>

        {showComplement ? (
          <div className="seq-panel complement-panel">
            <div className="seq-panel-label">Reverse complement ({kind})</div>
            <SequenceHighlight
              text={complementText}
              emptyLabel="Add a nucleotide sequence to preview the complement strand."
            />
            <button
              type="button"
              className="ghost"
              disabled={!complementText}
              onClick={() => {
                setText(complementText);
                setResults(null);
              }}
            >
              Use complement as input
            </button>
          </div>
        ) : null}

        {error ? <p className="error">{error}</p> : null}
      </section>

      {results ? (
        <section className="results">
          {results.map((result, index) => (
            <article className="result" key={`${result.header}-${index}`}>
              <h2>{result.header}</h2>
              <p className="meta">
                {result.length} nucleotides · {kind}
              </p>
              {result.error ? (
                <p className="error">{result.error}</p>
              ) : (
                <ProteinImpression
                  header={result.header}
                  kind={kind}
                  protein={result.protein}
                  onProteinChange={(protein) => {
                    setResults((current) =>
                      current
                        ? current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, protein } : item,
                          )
                        : current,
                    );
                  }}
                />
              )}
            </article>
          ))}
        </section>
      ) : (
        <section className="results">
          <article className="result">
            <h2>Chain builder</h2>
            <p className="meta">Drag amino acids from the dock, or translate a sequence first</p>
            <ProteinImpression
              header="chain"
              kind={kind}
              protein={manualProtein}
              onProteinChange={setManualProtein}
            />
          </article>
        </section>
      )}
    </main>
  );
}
