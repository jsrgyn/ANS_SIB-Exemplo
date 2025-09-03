import { create } from "xmlbuilder2";
import crypto from "crypto";

// Função para concatenar o conteúdo de todos elementos e atributos na ordem de ocorrência, ignorando elementos vazios e epilogo
function concatenateContent(node) {
  let result = "";

  // Concatenar atributos em ordem
  if (node.attrs) {
    const attrs = Object.entries(node.attrs).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );
    for (const [, value] of attrs) {
      if (value && value.trim() !== "") {
        result += value.trim();
      }
    }
  }

  // Concatenar texto do nó
  if (node.text && node.text().trim() !== "") {
    result += node.text().trim();
  }

  // Recursivamente concatenar filhos
  if (node.children) {
    for (const child of node.children()) {
      if (child.type === "element" && child.node.nodeName !== "epilogo") {
        result += concatenateContent(child.node);
      }
    }
  }

  return result;
}

// Função para gerar hash MD5 da string concatenada
function generateMD5Hash(str) {
  return crypto
    .createHash("md5")
    .update(str, "utf8")
    .digest("hex")
    .toUpperCase();
}

export const generateXML = (jsonData, options = {}) => {
  const {
    sequencialTransacao = "1",
    registroANS = "123456",
    nomeAplicativo = "Operadora Exemplo",
    fabricanteAplicativo = "ANS",
    motivoNaoEnvioBeneficiarios = "",
    cnpjDestino = "",
    tipoTransacao = "ATUALIZACAO SIB",
    versaoPadrao = "1.1",
    versaoAplicativo = "1.00",
  } = options;

  const dataAtual = new Date().toISOString().slice(0, 19);

  const root = create({ version: "1.0", encoding: "ISO-8859-1" })
    .ele("mensagemSIB")
    .ele("cabecalho")
    .ele("identificacaoTransacao")
    .ele("tipoTransacao")
    .txt(tipoTransacao)
    .up()
    .ele("sequencialTransacao")
    .txt(sequencialTransacao)
    .up()
    .ele("dataHoraRegistroTransacao")
    .txt(dataAtual)
    .up()
    .up()
    .ele("origem")
    .ele("registroANS")
    .txt(registroANS)
    .up()
    .up()
    .ele("destino")
    .ele("cnpj")
    .txt(cnpjDestino || "")
    .up()
    .up()
    .ele("versaoPadrao")
    .txt(versaoPadrao)
    .up()
    .ele("identificacaoSoftwareGerador")
    .ele("nomeAplicativo")
    .txt(nomeAplicativo)
    .up()
    .ele("versaoAplicativo")
    .txt(versaoAplicativo)
    .up()
    .ele("fabricanteAplicativo")
    .txt(fabricanteAplicativo)
    .up()
    .up()
    .up()
    .ele("mensagem")
    .ele("operadoraParaANS");

  if (
    motivoNaoEnvioBeneficiarios === "61" ||
    motivoNaoEnvioBeneficiarios === "62"
  ) {
    root
      .ele("naoEnvioBeneficiarios")
      .ele("motivoNaoEnvioBeneficiarios")
      .txt(motivoNaoEnvioBeneficiarios)
      .up()
      .up();
  } else {
    const beneficiarios = root.ele("beneficiarios");
    jsonData.forEach((item, index) => {
      beneficiarios
        .ele("beneficiario")
        .ele("sequencialBeneficiario")
        .txt((index + 1).toString())
        .up()
        .ele("codigoOperadora")
        .txt(item.codigoOperadora || registroANS)
        .up()
        .ele("numeroRegistroANS")
        .txt(item.numeroRegistroANS || registroANS)
        .up()
        .ele("numeroMatricula")
        .txt(item.numeroMatricula || "")
        .up()
        .ele("nome")
        .txt(item.nome || "")
        .up()
        .ele("cpf")
        .txt(item.cpf || "")
        .up()
        .ele("dataNascimento")
        .txt(item.dataNascimento || "")
        .up()
        .ele("tipoMovimentacao")
        .txt(item.tipoMovimentacao || "1")
        .up()
        .up();
    });
  }

  // Gerar string XML temporária sem epilogo
  const xmlWithoutEpilogo = root.up().up().up().end({ prettyPrint: true });

  // Parsear XML para concatenar conteúdo
  const doc = create(xmlWithoutEpilogo);
  const concatenatedString =
    "http://www.ans.gov.br/padroes/sib/schemas " +
    "http://www.ans.gov.br/padroes/sib/schemas/sib.xsd" +
    concatenateContent(doc.root());

  // Gerar hash MD5
  const hash = generateMD5Hash(concatenatedString);

  // Adicionar epilogo com hash
  const finalXML = create(xmlWithoutEpilogo)
    .root()
    .ele("epilogo")
    .ele("hash")
    .txt(hash)
    .up()
    .up()
    .end({ prettyPrint: true });

  return finalXML;
};
