import fs from "fs";
import { parse } from "csv-parse";

// Função para converter datas do formato DD/MM/YYYY para YYYY-MM-DD
const convertDate = (dateStr) => {
  if (!dateStr) return "";
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return dateStr; // Já está no formato correto
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

export const parseCSVToJSON = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(
        parse({
          columns: true,
          delimiter: ";",
          skip_empty_lines: true,
          trim: true,
        }),
      )
      .on("data", (row) => {
        try {
          // Mapear os campos do CSV para a estrutura do XML
          const movimento = {
            tipoMovimento: mapTipoMovimento(row.tipo_movimentacao),
            dados: {
              // Identificação do beneficiário
              identificacao: {
                cpf: row.cpf || "",
                dn: row.dn || "",
                pisPasep: row.pisPasep || "",
                cns: row.cns || "",
                nome: row.nome || "",
                sexo: row.sexo || "",
                dataNascimento: row.dataNascimento || "",
                nomeMae: row.nomeMae || "",
              },
              // Endereço
              endereco: {
                logradouro: row.logradouro || "",
                numero: row.numero || "",
                complemento: row.ds_complemento || "",
                bairro: row.bairro || "",
                codigoMunicipio: row.codigoMunicipio || "",
                codigoMunicipioResidencia: row.codigoMunicipioResidencia || "",
                cep: row.cep || "",
                tipoEndereco: row.tipoEndereco || "",
                resideExterior: row.resideExterior || "0",
              },
              // Vínculo/Contrato
              vinculo: {
                codigoBeneficiario: row.codigoBeneficiario || "",
                relacaoDependencia: row.relacaoDependencia || "1",
                dataContratacao:
                  convertDate(row.dataContratacao) ||
                  new Date().toISOString().split("T")[0],
                numeroPlanoANS: row.numeroPlanoANS || "",
                coberturaParcialTemporaria:
                  row.coberturaParcialTemporaria || "0",
                itensExcluidosCobertura: row.itensExcluidosCobertura || "0",
              },
              // Campos específicos para cancelamento
              cancelamento: {
                cco: row.cco || "",
                dataCancelamento: row.dataCancelamento
                  ? convertDate(row.dataCancelamento)
                  : "",
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

          results.push(movimento);
        } catch (error) {
          console.error("Erro ao processar linha:", row, error);
        }
      })
      .on("end", () => {
        console.log(`CSV processado: ${results.length} registros`);
        resolve(results);
      })
      .on("error", (err) => {
        console.error("Erro ao ler CSV:", err);
        reject(err);
      });
  });
};
