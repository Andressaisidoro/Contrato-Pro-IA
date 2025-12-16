
import { GoogleGenAI } from "@google/genai";
import { ContractData } from "../types";

const getSystemInstruction = () => `
Você é um advogado sênior especialista em direito contratual e civil brasileiro.
Sua tarefa é redigir contratos de prestação de serviços profissionais com alto rigor técnico, mas linguagem clara.

DIRETRIZES VISUAIS E ESTRUTURAIS:
1. NÃO use Markdown de tabelas.
2. Use Títulos em CAIXA ALTA e NEGRITO para as seções (Ex: **1. DO OBJETO**).
3. Destaque dados variáveis (nomes, valores, prazos) em negrito para fácil conferência.
4. O texto deve ser justificado visualmente (evite quebras de linha desnecessárias no meio das frases).
5. No final, crie a área de assinaturas.

ESTRUTURA OBRIGATÓRIA:
- TÍTULO
- PREÂMBULO (Qualificação completa das partes com E-mail e Endereço detalhado)
- CLÁUSULAS (Objeto, Obrigações, Valor, Prazo, Rescisão, Foro)
- ASSINATURAS (Incluindo testemunhas se solicitado)
`;

const formatDate = (dateString: string) => {
  if (!dateString) return "____/____/____";
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export const generateContractText = async (data: ContractData): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    
    // Monta a seção de testemunhas apenas se solicitado
    let witnessesText = "";
    if (data.includeWitnesses) {
      witnessesText = `
      TESTEMUNHAS (QUALIFICAÇÃO COMPLETA):
      1. Nome: ${data.witness1.name}, CPF: ${data.witness1.doc}, E-mail: ${data.witness1.email}, Telefone: ${data.witness1.phone}, Endereço: ${data.witness1.address}, CEP: ${data.witness1.cep}, Cidade: ${data.witness1.city}/${data.witness1.state}
      2. Nome: ${data.witness2.name}, CPF: ${data.witness2.doc}, E-mail: ${data.witness2.email}, Telefone: ${data.witness2.phone}, Endereço: ${data.witness2.address}, CEP: ${data.witness2.cep}, Cidade: ${data.witness2.city}/${data.witness2.state}
      
      IMPORTANTE: Inclua a qualificação completa das testemunhas no texto do contrato (geralmente no final, antes ou depois das assinaturas), e gere os espaços para assinatura delas.
      `;
    } else {
      witnessesText = "IMPORTANTE: Este contrato NÃO terá testemunhas. Gere apenas os espaços para assinatura das partes (Contratante e Contratado).";
    }

    const startDateFormatted = formatDate(data.startDate);
    const endDateFormatted = formatDate(data.endDate);

    const prompt = `
      Elabore um CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ${data.serviceType.toUpperCase()}.
      
      DADOS PARA O PREÂMBULO (QUALIFICAÇÃO DAS PARTES):
      
      CONTRATANTE (Cliente): 
      Nome/Razão Social: ${data.clientName}
      CPF/CNPJ: ${data.clientDoc}
      ${data.clientRg ? `RG: ${data.clientRg}` : ''}
      Endereço: ${data.clientAddress}, CEP: ${data.clientCep}, Cidade: ${data.clientCity}/${data.clientState}
      E-mail: ${data.clientEmail}
      Telefone: ${data.clientPhone}
      ${data.clientDoc.length > 14 ? '(Pessoa Jurídica)' : `Estado Civil: ${data.clientCivilStatus}, Profissão: ${data.clientProfession}`}
      
      CONTRATADO (Prestador): 
      Nome/Razão Social: ${data.providerName}
      CPF/CNPJ: ${data.providerDoc}
      ${data.providerRg ? `RG: ${data.providerRg}` : ''}
      Endereço: ${data.providerAddress}, CEP: ${data.providerCep}, Cidade: ${data.providerCity}/${data.providerState}
      E-mail: ${data.providerEmail}
      Telefone: ${data.providerPhone}
      ${data.providerDoc.length > 14 ? '(Pessoa Jurídica)' : `Estado Civil: ${data.providerCivilStatus}, Profissão: ${data.providerProfession}`}
      
      DADOS ESPECÍFICOS DO SERVIÇO:
      OBJETO (Escopo): ${data.scope}.
      VALOR TOTAL: R$ ${data.value}.
      PRAZO/VIGÊNCIA: O contrato terá início em **${startDateFormatted}** e término previsto para **${endDateFormatted}**.
      
      ${witnessesText}
      
      IMPORTANTE: NÃO gere a linha de data e local (ex: São Paulo, 25 de Outubro...) no final. Deixe sem data, pois isso será inserido automaticamente pelo sistema. Apenas gere o texto das cláusulas e os espaços de assinatura.

      CLAUSULAS PADRÃO:
      - Confidencialidade
      - Inexistência de vínculo empregatício
      - Multa por descumprimento
      - Foro da comarca de ${data.providerCity}/${data.providerState}
      
      Retorne o contrato completo pronto para impressão.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: getSystemInstruction(),
        temperature: 0.4, 
      }
    });

    return response.text || "Erro ao gerar o contrato. Por favor, tente novamente.";
  } catch (error) {
    console.error("Error generating contract:", error);
    throw new Error("Falha na comunicação com a IA.");
  }
};