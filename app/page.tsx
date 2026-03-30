import Link from "next/link";
import { Upload, FileEdit, Download, FileSpreadsheet } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">
            Marine Census Tool
          </h1>
          <Link
            href="/marine"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
          >
            Start
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary-light text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Marine Cargo Certificates Made Easy
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Upload client shipping documents, extract data automatically, and
            export Marine Certificate Format IFFCO Excel files in minutes.
          </p>
          <Link
            href="/marine"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary rounded-xl text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            <FileSpreadsheet size={22} />
            Start Marine Census
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-800 mb-10">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              step={1}
              icon={<Upload size={28} />}
              title="Upload Documents"
              description="Upload client Excel (.xlsx) or Word (.docx) shipping declaration files. Drag & drop supported."
            />
            <StepCard
              step={2}
              icon={<FileEdit size={28} />}
              title="Review & Edit"
              description="Data is extracted and mapped automatically. Review in the spreadsheet, edit any fields as needed."
            />
            <StepCard
              step={3}
              icon={<Download size={28} />}
              title="Export"
              description="Export in exact Marine Certificate Format IFFCO with all 18 columns. Ready to use."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-8 px-4 text-center">
        <p className="text-sm text-gray-500">
          Marine Census Tool - IFFCO Marine Cargo Insurance Certificate Generator
        </p>
      </footer>
    </div>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-primary rounded-2xl mb-4">
        {icon}
      </div>
      <div className="text-sm font-semibold text-primary mb-1">
        Step {step}
      </div>
      <h4 className="text-lg font-bold text-gray-800 mb-2">{title}</h4>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
