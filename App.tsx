import React, { useState } from "react";
import {
  Briefcase,
  Code,
  Palette,
  Camera,
  Megaphone,
  MoreHorizontal,
  FileText,
  Loader2,
  ArrowRight,
  Download,
  Edit2,
  Check,
  User,
  MapPin,
  Phone,
  DollarSign,
  Calendar,
  FileSignature,
  Mail,
  Users,
  Ruler,
  GraduationCap,
  Scale,
  PartyPopper,
  Hammer,
  Video,
  Dumbbell,
  Stethoscope,
  Scissors,
  Cpu,
  Truck,
  Music,
  Languages,
  Calculator,
  Key,
  Sparkles,
} from "lucide-react";
import { AppStep, ContractData, ServiceType, Witness } from "./types";
import { generateContractText } from "./services/geminiService";
import StepIndicator from "./components/StepIndicator";
import SignaturePad from "./components/SignaturePad";

// --- Formatters / Maskers ---

const formatCPFOrCNPJ = (value: string) => {
  const v = value.replace(/\D/g, "");
  if (v.length <= 11) {
    // CPF: 000.000.000-00
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // CNPJ: 00.000.000/0000-00
    return v
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 18); // Limit length
  }
};

const formatPhone = (value: string) => {
  const v = value.replace(/\D/g, "");
  // (00) 00000-0000
  return v
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);
};

const formatRG = (value: string) => {
  const v = value.replace(/\D/g, "");
  // 00.000.000-0
  return v
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .substring(0, 12);
};

const formatCEP = (value: string) => {
  const v = value.replace(/\D/g, "");
  // 00000-000
  return v.replace(/^(\d{5})(\d)/, "$1-$2").substring(0, 9);
};

const formatCurrency = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (!v) return "";
  v = (parseInt(v) / 100).toFixed(2) + "";
  v = v.replace(".", ",");
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  return v;
};

// --- Initial Data ---

const initialData: ContractData = {
  serviceType: ServiceType.GENERAL,

  providerName: "",
  providerDoc: "",
  providerCivilStatus: "",
  providerProfession: "",
  providerPhone: "",
  providerEmail: "",
  providerAddress: "",
  providerCep: "",
  providerCity: "",
  providerState: "",
  providerRg: "",

  clientName: "",
  clientDoc: "",
  clientCivilStatus: "",
  clientProfession: "",
  clientPhone: "",
  clientEmail: "",
  clientAddress: "",
  clientCep: "",
  clientCity: "",
  clientState: "",
  clientRg: "",

  value: "",
  startDate: "",
  endDate: "",
  scope: "",

  includeWitnesses: false,
  witness1: {
    name: "",
    doc: "",
    email: "",
    phone: "",
    cep: "",
    address: "",
    city: "",
    state: "",
  },
  witness2: {
    name: "",
    doc: "",
    email: "",
    phone: "",
    cep: "",
    address: "",
    city: "",
    state: "",
  },

  generatedContent: "",
};

interface InputFieldProps {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  type?: string;
  icon?: React.ElementType;
  className?: string;
}

// Separate component to prevent focus loss
const InputField = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  type = "text",
  icon: Icon,
  className = "",
}: InputFieldProps) => (
  <div className={`mb-1 ${className}`}>
    <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5 ml-1">
      {label}
    </label>
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-indigo-300">
        {Icon && <Icon size={18} />}
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full ${
          Icon ? "pl-10" : "pl-4"
        } pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none focus:bg-white transition-all text-slate-800 placeholder:text-slate-400 font-medium`}
        placeholder={placeholder}
      />
    </div>
  </div>
);

// --- Contract Renderer Helper ---
const renderFormattedContract = (text: string) => {
  if (!text) return null;

  return text.split("\n").map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={index} className="h-4" />;
    }

    // Parse Markdown Bold (**text**)
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const children = parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-black">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    // Detect Titles/Headers (Upper case lines, or lines starting with 'CLÁUSULA' or 'DO OBJETO')
    // Removing the ** marks for the check to see if it's a title
    const cleanLine = trimmed.replace(/\*\*/g, "");
    const isTitle =
      (cleanLine === cleanLine.toUpperCase() &&
        cleanLine.length > 5 &&
        cleanLine.length < 100) ||
      cleanLine.startsWith("CLÁUSULA") ||
      cleanLine.match(/^\d+\./);

    if (isTitle) {
      return (
        <h3
          key={index}
          className="mt-6 mb-3 font-serif font-bold text-center text-black uppercase tracking-wide text-sm md:text-base"
        >
          {cleanLine}
        </h3>
      );
    }

    // Check for list items
    const isListItem = line.trim().startsWith("-");
    const contentClass = isListItem
      ? "pl-8 text-justify"
      : "text-justify first-line:indent-8";

    return (
      <p
        key={index}
        className={`mb-3 leading-relaxed text-slate-900 text-[11pt] md:text-[12pt] ${contentClass} font-serif`}
      >
        {children}
      </p>
    );
  });
};

export default function App() {
  const [step, setStep] = useState<AppStep>(AppStep.SELECT_SERVICE);
  const [data, setData] = useState<ContractData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Handlers
  const handleServiceSelect = (type: ServiceType) => {
    setData({ ...data, serviceType: type });
    setStep(AppStep.INPUT_DETAILS);
  };

  const fetchAddressByCEP = async (
    cep: string,
    prefix: "provider" | "client"
  ) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanCep}/json/`
        );
        const addressData = await response.json();

        if (!addressData.erro) {
          setData((prev) => ({
            ...prev,
            [`${prefix}Address`]: `${addressData.logradouro}`,
            [`${prefix}City`]: addressData.localidade,
            [`${prefix}State`]: addressData.uf,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      }
    }
  };

  const fetchWitnessAddress = async (index: 1 | 2, cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleanCep}/json/`
        );
        const addressData = await response.json();

        if (!addressData.erro) {
          setData((prev) => ({
            ...prev,
            [`witness${index}`]: {
              ...(prev[`witness${index}` as keyof ContractData] as Witness),
              address: addressData.logradouro,
              city: addressData.localidade,
              state: addressData.uf,
            },
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar CEP testemunha", error);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Apply masks based on field name
    if (
      name.includes("Doc") ||
      (name.includes("witness") && name.includes("doc"))
    ) {
      formattedValue = formatCPFOrCNPJ(value);
    } else if (name.includes("Phone")) {
      formattedValue = formatPhone(value);
    } else if (name.includes('Rg')) {
      formattedValue = formatRG(value);
    } else if (name.includes("Cep")) {
      formattedValue = formatCEP(value);
      // Trigger API call if CEP is complete
      if (formattedValue.replace(/\D/g, "").length === 8) {
        const prefix = name.startsWith("provider") ? "provider" : "client";
        fetchAddressByCEP(formattedValue, prefix);
      }
    } else if (name === "value") {
      formattedValue = formatCurrency(value);
    }

    setData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleWitnessChange = (
    index: 1 | 2,
    field: keyof Witness,
    value: string
  ) => {
    let formattedValue = value;
    if (field === "doc") formattedValue = formatCPFOrCNPJ(value);
    if (field === "phone") formattedValue = formatPhone(value);
    if (field === "cep") {
      formattedValue = formatCEP(value);
      if (formattedValue.replace(/\D/g, "").length === 8) {
        fetchWitnessAddress(index, formattedValue);
      }
    }

    setData((prev) => ({
      ...prev,
      [`witness${index}`]: {
        ...(prev[`witness${index}` as keyof ContractData] as any),
        [field]: formattedValue,
      },
    }));
  };

  const generateContract = async () => {
    setIsLoading(true);
    setStep(AppStep.GENERATING);
    setError(null);
    try {
      const text = await generateContractText(data);
      setData((prev) => ({ ...prev, generatedContent: text }));
      setStep(AppStep.PREVIEW_EDIT);
    } catch (e) {
      setError("Ocorreu um erro ao gerar o contrato. Tente novamente.");
      setStep(AppStep.INPUT_DETAILS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContractEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setData({ ...data, generatedContent: e.target.value });
  };

  const handleSign = (role: "provider" | "client", signature: string) => {
    if (role === "provider") {
      setData((prev) => ({ ...prev, providerSignature: signature }));
    } else {
      setData((prev) => ({ ...prev, clientSignature: signature }));
    }
  };

  const finalizeContract = () => {
    const today = new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setData((prev) => ({ ...prev, signatureDate: today }));
    setStep(AppStep.FINAL);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("printable-contract");
    if (!element) return;

    setIsDownloading(true);

    // @ts-ignore
    if (typeof window.html2pdf === "undefined") {
      alert("A biblioteca de PDF ainda está carregando. Tente novamente.");
      setIsDownloading(false);
      return;
    }

    const opt = {
      margin: [10, 10, 10, 10], // Margins
      filename: `Contrato_${data.providerName.split(" ")[0]}_${
        data.clientName.split(" ")[0]
      }.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    try {
      // @ts-ignore
      await window.html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("Erro ao gerar PDF", err);
      alert("Erro ao gerar PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Render Helpers
  const renderServiceSelection = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-6xl mx-auto p-4">
      {[
        { type: ServiceType.CONSULTING, icon: Briefcase },
        { type: ServiceType.WEB_DEV, icon: Code },
        { type: ServiceType.DESIGN, icon: Palette },
        { type: ServiceType.PHOTOGRAPHY, icon: Camera },
        { type: ServiceType.MARKETING, icon: Megaphone },
        { type: ServiceType.ARCHITECTURE, icon: Ruler },
        { type: ServiceType.EDUCATION, icon: GraduationCap },
        { type: ServiceType.LEGAL, icon: Scale },
        { type: ServiceType.EVENTS, icon: PartyPopper },
        { type: ServiceType.CONSTRUCTION, icon: Hammer },
        { type: ServiceType.VIDEO, icon: Video },
        { type: ServiceType.PERSONAL_TRAINER, icon: Dumbbell },
        { type: ServiceType.HEALTH, icon: Stethoscope },
        { type: ServiceType.BEAUTY, icon: Scissors },
        { type: ServiceType.IT_SUPPORT, icon: Cpu },
        { type: ServiceType.CLEANING, icon: Sparkles },
        { type: ServiceType.REAL_ESTATE, icon: Key },
        { type: ServiceType.TRANSPORT, icon: Truck },
        { type: ServiceType.MUSIC, icon: Music },
        { type: ServiceType.TRANSLATION, icon: Languages },
        { type: ServiceType.FINANCE, icon: Calculator },
        { type: ServiceType.GENERAL, icon: MoreHorizontal },
      ].map((item) => (
        <button
          key={item.type}
          onClick={() => handleServiceSelect(item.type)}
          className="flex flex-col items-center justify-center p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all group duration-300 min-h-[160px]"
        >
          <div className="w-16 h-16 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 shadow-inner">
            <item.icon size={28} />
          </div>
          <span className="font-semibold text-slate-700 text-center text-sm md:text-base leading-tight">
            {item.type}
          </span>
        </button>
      ))}
    </div>
  );

  const renderInputForm = () => (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      {/* Provider Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border-t-4 border-indigo-500">
        <div className="flex items-center gap-3 mb-8 pb-2 border-b border-slate-100">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <User size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Prestador do Serviço
            </h2>
            <p className="text-sm text-slate-400">
              Dados de quem executará o trabalho
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6">
            <InputField
              label="Nome Completo / Razão Social"
              name="providerName"
              value={data.providerName}
              onChange={handleInputChange}
              placeholder="Nome completo"
              icon={User}
            />
          </div>
          <div className="md:col-span-3">
            <InputField
              label="CPF / CNPJ"
              name="providerDoc"
              value={data.providerDoc}
              onChange={handleInputChange}
              placeholder="000.000.000-00"
              icon={FileSignature}
            />
          </div>
          <div className="md:col-span-3">
            <InputField
              label="RG"
              name="providerRg"
              value={data.providerRg}
              onChange={handleInputChange}
              placeholder="00.000.000-0"
              icon={FileSignature}
            />
          </div>
          <div className="md:col-span-4">
            <InputField
              label="Estado Civil"
              name="providerCivilStatus"
              value={data.providerCivilStatus}
              onChange={handleInputChange}
              placeholder="Ex: Solteiro(a)"
            />
          </div>

          <div className="md:col-span-4">
            <InputField
              label="Profissão"
              name="providerProfession"
              value={data.providerProfession}
              onChange={handleInputChange}
              placeholder="Ex: Consultor"
            />
          </div>
          <div className="md:col-span-4">
            <InputField
              label="Telefone / WhatsApp"
              name="providerPhone"
              value={data.providerPhone}
              onChange={handleInputChange}
              placeholder="(00) 00000-0000"
              icon={Phone}
            />
          </div>
          <div className="md:col-span-12">
            <InputField
              label="E-mail"
              name="providerEmail"
              value={data.providerEmail}
              onChange={handleInputChange}
              placeholder="email@exemplo.com"
              icon={Mail}
            />
          </div>

          {/* Address Group */}
          <div className="md:col-span-12 pt-4">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={14} /> Endereço Completo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="md:col-span-3">
                <InputField
                  label="CEP"
                  name="providerCep"
                  value={data.providerCep}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-5">
                <InputField
                  label="Logradouro e Número"
                  name="providerAddress"
                  value={data.providerAddress}
                  onChange={handleInputChange}
                  placeholder="Rua das Flores, 123"
                />
              </div>
              <div className="md:col-span-3">
                <InputField
                  label="Cidade"
                  name="providerCity"
                  value={data.providerCity}
                  onChange={handleInputChange}
                  placeholder="São Paulo"
                />
              </div>
              <div className="md:col-span-1">
                <InputField
                  label="UF"
                  name="providerState"
                  value={data.providerState}
                  onChange={handleInputChange}
                  placeholder="SP"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border-t-4 border-emerald-500">
        <div className="flex items-center gap-3 mb-8 pb-2 border-b border-slate-100">
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
            <User size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Contratante (Cliente)
            </h2>
            <p className="text-sm text-slate-400">
              Dados de quem receberá o serviço
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6">
            <InputField
              label="Nome Completo / Razão Social"
              name="clientName"
              value={data.clientName}
              onChange={handleInputChange}
              placeholder="Nome do Cliente"
              icon={User}
            />
          </div>
          <div className="md:col-span-3">
            <InputField
              label="CPF / CNPJ"
              name="clientDoc"
              value={data.clientDoc}
              onChange={handleInputChange}
              placeholder="000.000.000-00"
              icon={FileSignature}
            />
          </div>
          <div className="md:col-span-3">
            <InputField
              label="RG"
              name="clientRg"
              value={data.clientRg}
              onChange={handleInputChange}
              placeholder="00.000.000-0"
              icon={FileSignature}
            />
          </div>
          <div className="md:col-span-4">
            <InputField
              label="Estado Civil"
              name="clientCivilStatus"
              value={data.clientCivilStatus}
              onChange={handleInputChange}
              placeholder="Ex: Casado(a)"
            />
          </div>

          <div className="md:col-span-4">
            <InputField
              label="Profissão"
              name="clientProfession"
              value={data.clientProfession}
              onChange={handleInputChange}
              placeholder="Profissão do cliente"
            />
          </div>
          <div className="md:col-span-4">
            <InputField
              label="Telefone / WhatsApp"
              name="clientPhone"
              value={data.clientPhone}
              onChange={handleInputChange}
              placeholder="(00) 00000-0000"
              icon={Phone}
            />
          </div>
          <div className="md:col-span-12">
            <InputField
              label="E-mail"
              name="clientEmail"
              value={data.clientEmail}
              onChange={handleInputChange}
              placeholder="cliente@email.com"
              icon={Mail}
            />
          </div>

          {/* Address Group */}
          <div className="md:col-span-12 pt-4">
            <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={14} /> Endereço Completo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="md:col-span-3">
                <InputField
                  label="CEP"
                  name="clientCep"
                  value={data.clientCep}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                />
              </div>
              <div className="md:col-span-5">
                <InputField
                  label="Logradouro e Número"
                  name="clientAddress"
                  value={data.clientAddress}
                  onChange={handleInputChange}
                  placeholder="Av. Principal, 500"
                />
              </div>
              <div className="md:col-span-3">
                <InputField
                  label="Cidade"
                  name="clientCity"
                  value={data.clientCity}
                  onChange={handleInputChange}
                  placeholder="Rio de Janeiro"
                />
              </div>
              <div className="md:col-span-1">
                <InputField
                  label="UF"
                  name="clientState"
                  value={data.clientState}
                  onChange={handleInputChange}
                  placeholder="RJ"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Details Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border-t-4 border-amber-500">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <FileText size={24} strokeWidth={2.5} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">O Contrato</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          <div className="md:col-span-4">
            <InputField
              label="Valor Total (R$)"
              name="value"
              value={data.value}
              onChange={handleInputChange}
              placeholder="Ex: 5.000,00"
              icon={DollarSign}
            />
          </div>
          <div className="md:col-span-4">
            <InputField
              label="Início do Contrato"
              name="startDate"
              type="date"
              value={data.startDate}
              onChange={handleInputChange}
              placeholder=""
              icon={Calendar}
            />
          </div>
          <div className="md:col-span-4">
            <InputField
              label="Fim do Contrato"
              name="endDate"
              type="date"
              value={data.endDate}
              onChange={handleInputChange}
              placeholder=""
              icon={Calendar}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2 ml-1">
            Objeto do Contrato (Escopo Detalhado)
          </label>
          <textarea
            name="scope"
            value={data.scope}
            onChange={handleInputChange}
            rows={5}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all placeholder:text-slate-400 text-slate-800 leading-relaxed"
            placeholder="Descreva detalhadamente o que será feito, quais as entregas, formato e responsabilidades..."
          />
        </div>
      </div>

      {/* Witnesses Toggle Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Users size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">
              Testemunhas (Opcional)
            </h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={data.includeWitnesses}
              onChange={(e) =>
                setData({ ...data, includeWitnesses: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {data.includeWitnesses && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 animate-in fade-in slide-in-from-top-2">
            {[1, 2].map((idx) => {
              const witnessKey = `witness${idx}` as keyof ContractData;
              const witness = data[witnessKey] as Witness;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200"
                >
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <User size={16} /> Testemunha {idx}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    <InputField
                      label="Nome Completo"
                      name={`witness${idx}name`}
                      value={witness.name}
                      onChange={(e) =>
                        handleWitnessChange(
                          idx as 1 | 2,
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="Nome da testemunha"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="CPF"
                        name={`witness${idx}doc`}
                        value={witness.doc}
                        onChange={(e) =>
                          handleWitnessChange(
                            idx as 1 | 2,
                            "doc",
                            e.target.value
                          )
                        }
                        placeholder="000.000.000-00"
                      />
                      <InputField
                        label="Telefone"
                        name={`witness${idx}phone`}
                        value={witness.phone}
                        onChange={(e) =>
                          handleWitnessChange(
                            idx as 1 | 2,
                            "phone",
                            e.target.value
                          )
                        }
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <InputField
                      label="E-mail"
                      name={`witness${idx}email`}
                      value={witness.email}
                      onChange={(e) =>
                        handleWitnessChange(
                          idx as 1 | 2,
                          "email",
                          e.target.value
                        )
                      }
                      placeholder="email@exemplo.com"
                    />

                    <div className="bg-white p-3 rounded-lg border border-slate-200 mt-2">
                      <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                        Endereço
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <InputField
                            label="CEP"
                            name={`witness${idx}cep`}
                            value={witness.cep}
                            onChange={(e) =>
                              handleWitnessChange(
                                idx as 1 | 2,
                                "cep",
                                e.target.value
                              )
                            }
                            placeholder="CEP"
                          />
                        </div>
                        <div className="col-span-2">
                          <InputField
                            label="Rua/Nº"
                            name={`witness${idx}address`}
                            value={witness.address}
                            onChange={(e) =>
                              handleWitnessChange(
                                idx as 1 | 2,
                                "address",
                                e.target.value
                              )
                            }
                            placeholder="Rua..."
                          />
                        </div>
                        <div className="col-span-2">
                          <InputField
                            label="Cidade"
                            name={`witness${idx}city`}
                            value={witness.city}
                            onChange={(e) =>
                              handleWitnessChange(
                                idx as 1 | 2,
                                "city",
                                e.target.value
                              )
                            }
                            placeholder="Cidade"
                          />
                        </div>
                        <div className="col-span-1">
                          <InputField
                            label="UF"
                            name={`witness${idx}state`}
                            value={witness.state}
                            onChange={(e) =>
                              handleWitnessChange(
                                idx as 1 | 2,
                                "state",
                                e.target.value
                              )
                            }
                            placeholder="UF"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg border border-red-100 font-medium">
          {error}
        </div>
      )}

      <button
        onClick={generateContract}
        disabled={!data.providerName || !data.clientName || !data.scope}
        className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200/50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
      >
        <FileText size={20} />
        Gerar Contrato Profissional
      </button>
    </div>
  );

  const renderGenerating = () => (
    <div className="flex flex-col items-center justify-center h-80 text-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Code className="text-indigo-600" size={24} />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mt-8">
        Redigindo Contrato Jurídico
      </h3>
      <p className="text-slate-500 mt-2 max-w-md">
        Estamos organizando as cláusulas, formatando a qualificação e validando
        os dados inseridos...
      </p>
    </div>
  );

  const renderPreviewEdit = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden ring-1 ring-slate-100">
        <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-5 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Edit2 size={18} className="text-indigo-600" />
              Minuta do Contrato
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Revise o texto gerado antes de assinar.
            </p>
          </div>
        </div>
        <textarea
          value={data.generatedContent}
          onChange={handleContractEdit}
          className="w-full h-[650px] p-10 font-serif text-slate-800 leading-8 focus:outline-none resize-none text-base bg-white selection:bg-indigo-100"
        />
        <div className="bg-slate-50 px-8 py-5 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={() => setStep(AppStep.INPUT_DETAILS)}
            className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
          >
            Voltar e Editar Dados
          </button>
          <button
            onClick={() => setStep(AppStep.SIGNATURE)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md"
          >
            Aprovar Texto
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderSignature = () => (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          Assinatura Digital
        </h2>
        <p className="text-slate-500 text-lg">
          Colete as assinaturas para validar o documento.
        </p>
      </div>

      <div className="grid gap-10">
        <div
          className={`transition-all duration-500 ${
            data.providerSignature ? "opacity-60 scale-[0.99]" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-3 text-indigo-700 font-semibold">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold">
              1
            </div>
            PRESTADOR: {data.providerName}
          </div>
          <SignaturePad
            label="Desenhe sua assinatura aqui"
            onSave={(sign) => handleSign("provider", sign)}
            onClear={() =>
              setData((prev) => ({ ...prev, providerSignature: undefined }))
            }
          />
        </div>

        {data.providerSignature && (
          <div
            className={`transition-all duration-500 ${
              data.clientSignature ? "opacity-60 scale-[0.99]" : ""
            } animate-in fade-in slide-in-from-bottom-6`}
          >
            <div className="flex items-center gap-2 mb-3 text-emerald-700 font-semibold">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold">
                2
              </div>
              CLIENTE: {data.clientName}
            </div>
            <SignaturePad
              label="Desenhe sua assinatura aqui"
              onSave={(sign) => handleSign("client", sign)}
              onClear={() =>
                setData((prev) => ({ ...prev, clientSignature: undefined }))
              }
            />
          </div>
        )}
      </div>

      <div className="flex justify-end pt-8">
        <button
          onClick={finalizeContract}
          disabled={!data.providerSignature || !data.clientSignature}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-10 py-4 rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg text-lg"
        >
          <Check size={22} />
          Gerar Documento Final
        </button>
      </div>
    </div>
  );

  const renderFinal = () => (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-8 no-print print:hidden">
        <button
          onClick={() => {
            if (
              window.confirm(
                "Deseja iniciar um novo contrato? Os dados atuais serão perdidos."
              )
            ) {
              setData(initialData);
              setStep(AppStep.SELECT_SERVICE);
            }
          }}
          className="px-6 py-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-200"
        >
          ← Criar Novo
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-slate-800 text-white px-8 py-3 rounded-xl hover:bg-slate-900 transition-colors shadow-lg font-medium disabled:opacity-70 disabled:cursor-wait"
        >
          {isDownloading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Download size={20} />
          )}
          {isDownloading ? "Processando PDF..." : "Baixar PDF Assinado"}
        </button>
      </div>

      {/* Contract Paper Container */}
      <div
        id="printable-contract"
        className="bg-white p-16 md:p-[20mm] shadow-2xl border border-slate-200 min-h-[297mm] relative mx-auto max-w-[210mm] text-slate-900"
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-800 pb-6 mb-12 flex justify-between items-end">
          <div>
            <h1 className="font-serif font-bold text-2xl uppercase tracking-widest text-slate-900">
              Contrato de Prestação de Serviços
            </h1>
            <p className="text-xs font-serif uppercase tracking-wider text-slate-500 mt-1">
              Instrumento Particular Jurídico
            </p>
          </div>
          <div className="text-right">
            <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded-sm">
              <Scale size={24} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="font-serif text-[12pt]">
          {renderFormattedContract(data.generatedContent)}
        </div>

        {/* Signatures */}
        <div className="mt-24 page-break-inside-avoid">
          <p className="mb-12 font-serif text-slate-800 text-justify">
            E, por estarem assim justos e contratados, assinam o presente
            instrumento em 02 (duas) vias de igual teor e forma.
          </p>

          <p className="text-center mb-10 font-serif font-bold text-slate-800">
            {data.providerCity}/{data.providerState}, {data.signatureDate}.
          </p>

          <div className="grid grid-cols-2 gap-x-12 gap-y-16 mb-12">
            <div className="text-center relative">
              {data.providerSignature && (
                <img
                  src={data.providerSignature}
                  alt="Assinatura Prestador"
                  className="h-20 mx-auto mb-[-25px] object-contain relative z-10"
                />
              )}
              <div className="border-t border-slate-800 pt-3 relative z-0">
                <p className="font-bold text-sm uppercase font-serif">
                  {data.providerName}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">
                  Contratado (Prestador)
                </p>
              </div>
            </div>

            <div className="text-center relative">
              {data.clientSignature && (
                <img
                  src={data.clientSignature}
                  alt="Assinatura Cliente"
                  className="h-20 mx-auto mb-[-25px] object-contain relative z-10"
                />
              )}
              <div className="border-t border-slate-800 pt-3 relative z-0">
                <p className="font-bold text-sm uppercase font-serif">
                  {data.clientName}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">
                  Contratante (Cliente)
                </p>
              </div>
            </div>
          </div>

          {data.includeWitnesses && (
            <div className="mt-16 pt-8 border-t border-slate-100">
              <p className="text-xs uppercase font-bold text-slate-400 mb-8 text-center tracking-widest">
                Testemunhas
              </p>
              <div className="grid grid-cols-2 gap-12">
                <div className="text-center relative pt-8">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-xs uppercase font-serif">
                      {data.witness1.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      CPF: {data.witness1.doc}
                    </p>
                  </div>
                </div>
                <div className="text-center relative pt-8">
                  <div className="border-t border-slate-400 pt-2">
                    <p className="font-bold text-xs uppercase font-serif">
                      {data.witness2.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      CPF: {data.witness2.doc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Document Footer */}
        <div className="mt-20 pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-serif uppercase tracking-widest">
          <span>Documento gerado eletronicamente</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 no-print sticky top-0 z-50 bg-opacity-90 backdrop-blur-sm print:hidden">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-indigo-200 shadow-md">
              <FileText className="text-white" size={22} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              ContratoPro <span className="text-indigo-600">IA</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="no-print print:hidden">
          <StepIndicator currentStep={step} />
        </div>

        <div className="w-full px-4 pb-16">
          {step === AppStep.SELECT_SERVICE && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10 mt-4">
                <h2 className="text-3xl font-bold text-slate-800 mb-2">
                  Qual serviço será prestado?
                </h2>
                <p className="text-slate-500 text-lg">
                  Selecione a categoria para personalizar a minuta.
                </p>
              </div>
              {renderServiceSelection()}
            </div>
          )}

          {step === AppStep.INPUT_DETAILS && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderInputForm()}
            </div>
          )}

          {step === AppStep.GENERATING && renderGenerating()}

          {step === AppStep.PREVIEW_EDIT && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              {renderPreviewEdit()}
            </div>
          )}

          {step === AppStep.SIGNATURE && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              {renderSignature()}
            </div>
          )}

          {step === AppStep.FINAL && (
            <div className="animate-in fade-in duration-700">
              {renderFinal()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
