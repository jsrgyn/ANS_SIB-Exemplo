// Validação dos algoritmos oficiais da ANS para documentos e regras de negócio SIB
// Referência: sib-algoritmos-xml10-17012019.pdf (ANS)

// ─── Dígitos verificadores ────────────────────────────────────────────────────

function validateCPF(cpf) {
  if (!cpf) return null;
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "Deve conter 11 dígitos";
  if (/^(\d)\1{10}$/.test(digits)) return "Todos os dígitos são iguais";

  const calcDV = (base, weights) => {
    const sum = base.split("").reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const dv1 = calcDV(digits.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (dv1 !== Number(digits[9])) return "Dígito verificador inválido";

  const dv2 = calcDV(digits.slice(0, 9) + dv1, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (dv2 !== Number(digits[10])) return "Dígito verificador inválido";

  return null;
}

function validateCNPJ(cnpj) {
  if (!cnpj) return null;
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return "Deve conter 14 dígitos";
  if (/^(\d)\1{13}$/.test(digits)) return "Todos os dígitos são iguais";

  const calcDV = (base, weights) => {
    const sum = base.split("").reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const dv1 = calcDV(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (dv1 !== Number(digits[12])) return "Dígito verificador inválido";

  const dv2 = calcDV(digits.slice(0, 12) + dv1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (dv2 !== Number(digits[13])) return "Dígito verificador inválido";

  return null;
}

function validateCNS(cns) {
  if (!cns) return null;
  const digits = cns.replace(/\D/g, "");
  if (digits.length !== 15) return "Deve conter 15 dígitos";
  if (!["1", "2", "7", "8", "9"].includes(digits[0])) return "Primeiro dígito deve ser 1, 2, 7, 8 ou 9";

  const weights = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  const sum = digits.split("").reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
  if (sum % 11 !== 0) return "Dígito verificador inválido (módulo 11)";

  return null;
}

function validatePISPASEP(pis) {
  if (!pis) return null;
  const digits = pis.replace(/\D/g, "");
  if (digits.length !== 11) return "Deve conter 11 dígitos";

  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = digits.slice(0, 10).split("").reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
  let dv = 11 - (sum % 11);
  if (dv >= 10) dv = 0;

  if (dv !== Number(digits[10])) return "Dígito verificador inválido";
  return null;
}

function validateCEI(cei) {
  if (!cei) return null;
  const digits = cei.replace(/\D/g, "");
  if (digits.length !== 12) return "Deve conter 12 dígitos";

  const weights = [7, 4, 1, 8, 5, 2, 1, 6, 3, 7, 4];
  const sum = digits.slice(0, 11).split("").reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
  const tens = Math.floor(sum / 10);
  const units = sum % 10;
  const total = tens + units;
  const unitsOfTotal = total % 10;
  let dv = 10 - unitsOfTotal;
  if (dv > 9) dv = 0;

  if (dv !== Number(digits[11])) return "Dígito verificador inválido";
  return null;
}

function validateCAEPF(caepf) {
  if (!caepf) return null;
  const digits = caepf.replace(/\D/g, "");
  if (digits.length !== 14) return "Deve conter 14 dígitos";

  const w1 = [6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9];
  const sum1 = digits.slice(0, 12).split("").reduce((acc, d, i) => acc + Number(d) * w1[i], 0);
  const dv1 = sum1 % 11;

  const w2 = [5, 6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9];
  const base2 = digits.slice(0, 12) + String(dv1);
  const sum2 = base2.split("").reduce((acc, d, i) => acc + Number(d) * w2[i], 0);
  const dv2 = sum2 % 11;

  let combined = dv1 * 10 + dv2 + 12;
  if (combined > 99) combined -= 100;

  const expectedDV = String(combined).padStart(2, "0");
  const actualDV = digits.slice(12);
  if (actualDV !== expectedDV) return "Dígitos verificadores inválidos";

  return null;
}

// ─── Validação de nome ────────────────────────────────────────────────────────

const INVALID_NAME_CHARS = /[@"*/{}$^[\]\\&!=?+<>()%;#~,0-9]/;

function validateNome(nome) {
  if (!nome || nome.trim().length === 0) return null; // campo obrigatório verificado antes
  const trimmed = nome.trim();
  if (INVALID_NAME_CHARS.test(trimmed)) return "Contém caracteres inválidos";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 2) return "Deve conter pelo menos nome e sobrenome";
  return null;
}

// ─── Validação de datas ───────────────────────────────────────────────────────

const MIN_NASCIMENTO = new Date("1890-01-01");
const MIN_CONTRATACAO = new Date("1940-01-01");

function validateDate(dateStr, field) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Data inválida";

  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);

  if (d > hoje) return "Data não pode ser futura";

  if (field === "dataNascimento" && d < MIN_NASCIMENTO) {
    return "Data de nascimento não pode ser anterior a 01/01/1890";
  }
  if (field === "dataContratacao" && d < MIN_CONTRATACAO) {
    return "Data de contratação não pode ser anterior a 01/01/1940";
  }
  return null;
}

// ─── Função principal de validação ───────────────────────────────────────────

export const validateANSAlgorithms = (movements) => {
  const errors = [];

  movements.forEach((mov, idx) => {
    const row = idx + 1;
    const { tipoMovimento, dados } = mov;
    const { identificacao, endereco, vinculo, cancelamento, retificacao, cco } = dados;

    const addError = (field, value, message) => errors.push({ row, field, value: value || "", message });

    // CPF
    const cpfErr = validateCPF(identificacao.cpf);
    if (cpfErr) addError("cpf", identificacao.cpf, `CPF: ${cpfErr}`);

    // CNS
    const cnsErr = validateCNS(identificacao.cns);
    if (cnsErr) addError("cns", identificacao.cns, `CNS: ${cnsErr}`);

    // PIS/PASEP
    const pisErr = validatePISPASEP(identificacao.pisPasep);
    if (pisErr) addError("pisPasep", identificacao.pisPasep, `PIS/PASEP: ${pisErr}`);

    // Nome
    const nomeErr = validateNome(identificacao.nome);
    if (nomeErr) addError("nome", identificacao.nome, `Nome: ${nomeErr}`);

    // Data de nascimento
    const dtNascErr = validateDate(identificacao.dataNascimento, "dataNascimento");
    if (dtNascErr) addError("dataNascimento", identificacao.dataNascimento, `Data de nascimento: ${dtNascErr}`);

    // Data de contratação
    const dtContErr = validateDate(vinculo.dataContratacao, "dataContratacao");
    if (dtContErr) addError("dataContratacao", vinculo.dataContratacao, `Data de contratação: ${dtContErr}`);

    // Hierarquia dataNascimento ≤ dataContratacao (só inclusão)
    if (tipoMovimento === "inclusao" && identificacao.dataNascimento && vinculo.dataContratacao) {
      const dtNasc = new Date(identificacao.dataNascimento);
      const dtCont = new Date(vinculo.dataContratacao);
      if (!isNaN(dtNasc) && !isNaN(dtCont) && dtNasc > dtCont) {
        addError("dataNascimento", identificacao.dataNascimento, "Data de nascimento não pode ser posterior à data de contratação");
      }
    }

    // CNPJ empresa contratante
    if (vinculo.cnpjEmpresaContratante) {
      const cnpjErr = validateCNPJ(vinculo.cnpjEmpresaContratante);
      if (cnpjErr) addError("cnpj", vinculo.cnpjEmpresaContratante, `CNPJ: ${cnpjErr}`);
    }

    // CEI empresa contratante
    if (vinculo.ceiEmpresaContratante) {
      const ceiErr = validateCEI(vinculo.ceiEmpresaContratante);
      if (ceiErr) addError("cei", vinculo.ceiEmpresaContratante, `CEI: ${ceiErr}`);
    }

    // CAEPF empresa contratante
    if (vinculo.caepfEmpresaContratante) {
      const caepfErr = validateCAEPF(vinculo.caepfEmpresaContratante);
      if (caepfErr) addError("caepf", vinculo.caepfEmpresaContratante, `CAEPF: ${caepfErr}`);
    }

    // Exclusividade CNPJ/CEI/CAEPF (apenas um pode estar preenchido)
    const empresaFields = [vinculo.cnpjEmpresaContratante, vinculo.ceiEmpresaContratante, vinculo.caepfEmpresaContratante].filter(Boolean);
    if (empresaFields.length > 1) {
      addError("cnpj/cei/caepf", "", "Apenas um dos campos CNPJ, CEI ou CAEPF da empresa contratante pode ser informado");
    }

    // CCO obrigatório para retificação, mudança contratual e cancelamento
    const ccoValue = cco || cancelamento?.cco || retificacao?.cco || "";
    if (["retificacao", "mudancaContratual", "cancelamento"].includes(tipoMovimento)) {
      if (!ccoValue) {
        addError("cco", "", "CCO é obrigatório para este tipo de movimento");
      } else if (!/^\d{12}$/.test(ccoValue)) {
        addError("cco", ccoValue, "CCO deve conter exatamente 12 dígitos numéricos");
      }
    }

    // Dependente — código titular obrigatório quando relacaoDependencia ≠ 1
    if (vinculo.relacaoDependencia && vinculo.relacaoDependencia !== "1" && tipoMovimento === "inclusao") {
      if (!vinculo.codigoBeneficiarioTitular) {
        addError("codigoBeneficiarioTitular", "", "Código do beneficiário titular é obrigatório para dependentes");
      }
    }

    // Código de município — 6 dígitos numéricos
    if (endereco.codigoMunicipio && !/^\d{6}$/.test(endereco.codigoMunicipio)) {
      addError("codigoMunicipio", endereco.codigoMunicipio, "Código do município deve conter exatamente 6 dígitos numéricos (IBGE)");
    }
  });

  return { valid: errors.length === 0, errors };
};
