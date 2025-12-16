
export enum ServiceType {
    CONSULTING = 'Consultoria',
    WEB_DEV = 'Desenvolvimento Web',
    DESIGN = 'Design Gráfico',
    PHOTOGRAPHY = 'Fotografia',
    MARKETING = 'Marketing Digital',
    ARCHITECTURE = 'Arquitetura / Eng.',
    EDUCATION = 'Aulas / Treinamentos',
    LEGAL = 'Serviços Jurídicos',
    EVENTS = 'Eventos / Festas',
    CONSTRUCTION = 'Obras e Reformas',
    VIDEO = 'Edição de Vídeo',
    // New Services
    PERSONAL_TRAINER = 'Personal Trainer',
    HEALTH = 'Saúde / Nutrição',
    BEAUTY = 'Beleza / Estética',
    IT_SUPPORT = 'Suporte T.I. / Reparo',
    CLEANING = 'Limpeza / Diarista',
    TRANSPORT = 'Transporte / Frete',
    REAL_ESTATE = 'Imobiliário',
    MUSIC = 'Música / DJ',
    TRANSLATION = 'Tradução / Texto',
    FINANCE = 'Finanças / Contábil',
    GENERAL = 'Serviços Gerais'
  }
  
  export interface Witness {
    name: string;
    doc: string;
    email: string;
    phone: string;
    cep: string;
    address: string;
    city: string;
    state: string;
  }

  export interface ContractData {
    serviceType: ServiceType;
    
    // Provider Details
    providerName: string;
    providerDoc: string; // CPF or CNPJ
    providerRg?: string; // RG
    providerCivilStatus: string;
    providerProfession: string;
    providerPhone: string;
    providerEmail: string;
    
    // Provider Address
    providerAddress: string; // Logradouro + Numero
    providerCep: string;
    providerCity: string;
    providerState: string;

    // Client Details
    clientName: string;
    clientDoc: string; // CPF or CNPJ
    clientRg?: string; // RG
    clientCivilStatus: string;
    clientProfession: string;
    clientPhone: string;
    clientEmail: string;

    // Client Address
    clientAddress: string; // Logradouro + Numero
    clientCep: string;
    clientCity: string;
    clientState: string;

    // Contract Specifics
    value: string;
    startDate: string; // ISO Date YYYY-MM-DD
    endDate: string;   // ISO Date YYYY-MM-DD
    scope: string;
    
    // Witnesses (Optional)
    includeWitnesses: boolean;
    witness1: Witness;
    witness2: Witness;

    // Meta
    generatedContent: string;
    providerSignature?: string; // Base64 data URL
    clientSignature?: string; // Base64 data URL
    signatureDate?: string;
  }
  
  export enum AppStep {
    SELECT_SERVICE = 0,
    INPUT_DETAILS = 1,
    GENERATING = 2,
    PREVIEW_EDIT = 3,
    SIGNATURE = 4,
    FINAL = 5
  }