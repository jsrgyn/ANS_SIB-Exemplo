import fs from "fs";
import { parse } from "csv-parse";

// Função para converter datas do formato DD/MM/YYYY para YYYY-MM-DD
const convertDate = (dateStr) => {
  if (!dateStr || dateStr.trim() === "") return "";
  // Remove hora se existir
  dateStr = dateStr.split(" ")[0];

  // Verifica formato DD/MM/YYYY
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
    }
  }

  // Verifica formato YYYY-MM-DD
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      // Garante que o formato está correto
      const year = parts[0].length === 4 ? parts[0] : parts[2];
      const month = parts[1].padStart(2, "0");
      const day = parts[0].length === 4 ? parts[2] : parts[0].padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }

  return dateStr;
};

// Função para validar e formatar CPF
const formatCPF = (cpf) => {
  if (!cpf) return "";
  // Remove caracteres não numéricos
  cpf = cpf.toString().replace(/\D/g, "");
  // Garante 11 dígitos
  return cpf.padStart(11, "0").substring(0, 11);
};

// Função para validar e formatar CNS
const formatCNS = (cns) => {
  if (!cns) return "";
  // Remove caracteres não numéricos
  cns = cns.toString().replace(/\D/g, "");
  // Garante 15 dígitos
  return cns.padStart(15, "0").substring(0, 15);
};

// Função para validar e formatar CEP
const formatCEP = (cep) => {
  if (!cep) return "";
  // Remove caracteres não numéricos
  cep = cep.toString().replace(/\D/g, "");
  // Garante 8 dígitos
  return cep.padStart(8, "0").substring(0, 8);
};

// Função para mapear tipo de movimento para o código correto
const mapTipoMovimento = (tipoMovimentacao) => {
  const map = {
    1: "inclusao",
    2: "retificacao",
    4: "mudancaContratual",
    5: "cancelamento",
  };
  return map[tipoMovimentacao] || "inclusao";
};

// Função para validar dados obrigatórios
const validateRequiredFields = (row, tipoMovimento) => {
  const errors = [];

  // Validações comuns para todos os tipos
  if (!row.nome || row.nome.trim().length < 3) {
    errors.push("Nome é obrigatório e deve ter pelo menos 3 caracteres");
  }

  if (!row.sexo || !["1", "3"].includes(row.sexo)) {
    errors.push("Sexo é obrigatório e deve ser 1 (masculino) ou 3 (feminino)");
  }

  if (!row.dataNascimento) {
    errors.push("Data de nascimento é obrigatória");
  }

  // Validações específicas por tipo de movimento
  if (tipoMovimento === "inclusao") {
    if (!row.codigoBeneficiario) {
      errors.push("Código do beneficiário é obrigatório para inclusão");
    }
    if (!row.dataContratacao) {
      errors.push("Data de contratação é obrigatória para inclusão");
    }
    if (!row.numeroPlanoANS) {
      errors.push("Número do plano ANS é obrigatório para inclusão");
    }
    if (!row.codigoMunicipio) {
      errors.push("Código do município é obrigatório para inclusão");
    }
  }

  if (tipoMovimento === "retificacao" || tipoMovimento === "cancelamento") {
    if (!row.cco || row.cco.length !== 12) {
      errors.push(
        "CCO é obrigatório e deve ter 12 dígitos para retificação/cancelamento",
      );
    }
  }

  return errors;
};

export const parseCSVToJSON = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];

    fs.createReadStream(filePath)
      .pipe(
        parse({
          columns: true,
          delimiter: ";",
          skip_empty_lines: true,
          trim: true,
          bom: true,
        }),
      )
      .on("data", (row) => {
        try {
          const tipoMovimento = mapTipoMovimento(row.tipo_movimentacao);

          // Valida campos obrigatórios
          const validationErrors = validateRequiredFields(row, tipoMovimento);
          if (validationErrors.length > 0) {
            errors.push(
              `Linha ${results.length + 1}: ${validationErrors.join(", ")}`,
            );
            return;
          }

          // Mapear os campos do CSV para a estrutura do XML
          const movimento = {
            tipoMovimento: tipoMovimento,
            dados: {
              // Identificação do beneficiário
              identificacao: {
                cpf: formatCPF(row.cpf),
                dn: row.dn || "",
                pisPasep: row.pisPasep || "",
                cns: formatCNS(row.cns),
                nome: (row.nome || "").trim(),
                sexo: row.sexo || "",
                dataNascimento: convertDate(row.dataNascimento),
                nomeMae: (row.nomeMae || "").trim(),
              },
              // Endereço
              endereco: {
                logradouro: (row.logradouro || "").trim(),
                numero: (row.numero || "").trim(),
                complemento: (row.ds_complemento || "").trim(),
                bairro: (row.bairro || "").trim(),
                codigoMunicipio: row.codigoMunicipio || "",
                codigoMunicipioResidencia: row.codigoMunicipioResidencia || "",
                cep: formatCEP(row.cep),
                tipoEndereco: row.tipoEndereco || "2",
                resideExterior: row.resideExterior || "0",
              },
              // Vínculo/Contrato
              vinculo: {
                codigoBeneficiario: (row.codigoBeneficiario || "").trim(),
                relacaoDependencia: row.relacaoDependencia || "1",
                dataContratacao:
                  convertDate(row.dataContratacao) ||
                  new Date().toISOString().split("T")[0],
                numeroPlanoANS: (row.numeroPlanoANS || "").trim(),
                coberturaParcialTemporaria:
                  row.coberturaParcialTemporaria || "0",
                itensExcluidosCobertura: row.itensExcluidosCobertura || "0",
                // Campos para empresa contratante
                ...(row.cnpj && { cnpjEmpresaContratante: row.cnpj }),
                ...(row.cei && { ceiEmpresaContratante: row.cei }),
                ...(row.caepf && { caepfEmpresaContratante: row.caepf }),
              },
              // Campos específicos para cancelamento
              cancelamento: {
                cco: row.cco || "",
                dataCancelamento: convertDate(row.dataCancelamento),
                motivoCancelamento: row.motivoCancelamento || "",
              },
              // Campos específicos para retificação
              retificacao: {
                cco: row.cco || "",
                codigoProcedimentoAdministrativo:
                  row.codigoProcedimentoAdministrativo || "",
              },
              // Campo CCO geral
              cco: row.cco || "",
            },
          };

          // Validação adicional para datas
          const hoje = new Date();
          const dataNascimento = new Date(
            movimento.dados.identificacao.dataNascimento,
          );
          if (dataNascimento > hoje) {
            errors.push(
              `Linha ${results.length + 1}: Data de nascimento não pode ser futura`,
            );
            return;
          }

          if (movimento.dados.vinculo.dataContratacao) {
            const dataContratacao = new Date(
              movimento.dados.vinculo.dataContratacao,
            );
            if (dataContratacao > hoje) {
              errors.push(
                `Linha ${results.length + 1}: Data de contratação não pode ser futura`,
              );
              return;
            }
          }

          results.push(movimento);
        } catch (error) {
          errors.push(
            `Linha ${results.length + 1}: Erro ao processar - ${error.message}`,
          );
        }
      })
      .on("end", () => {
        console.log(`CSV processado: ${results.length} registros válidos`);
        if (errors.length > 0) {
          console.warn(`Foram encontrados ${errors.length} erros:`);
          errors.forEach((error) => console.warn(`  ${error}`));
        }
        resolve(results);
      })
      .on("error", (err) => {
        console.error("Erro ao ler CSV:", err);
        reject(err);
      });
  });
};
