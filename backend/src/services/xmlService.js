import { create } from "xmlbuilder2";
import crypto from "crypto";

// Função para concatenar o conteúdo de todos elementos e atributos na ordem de ocorrência, ignorando elementos vazios e epilogo
function concatenateContent(domNode) {
  let result = "";

  if (domNode.nodeType !== 1) {
    // Não é um elemento
    return "";
  }

  // Processa atributos em ordem alfabética
  if (domNode.attributes) {
    const attrs = Array.from(domNode.attributes);
    attrs.sort((a, b) => a.name.localeCompare(b.name));

    for (const attr of attrs) {
      const value = (attr.value || "").trim();
      if (value) {
        result += value;
      }
    }
  }

  // Processa nós filhos
  for (const child of domNode.childNodes) {
    if (child.nodeType === 1) {
      // Elemento
      if (child.nodeName !== "epilogo") {
        result += concatenateContent(child);
      }
    } else if (child.nodeType === 3) {
      // Texto
      const text = (child.nodeValue || "").trim();
      if (text) {
        result += text;
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

  // Inserir o valor do cnpjDestino na tag <cnpj> do XML
  const cnpjDestinoValue = cnpjDestino || ""; // Valor passado na função ou vazio
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
    .txt(cnpjDestinoValue)
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
  const doc = root.doc();
  const xmlWithoutEpilogo = doc.end({ prettyPrint: true });

  // Concatenar conteúdo para o hash
  const concatenatedString = concatenateContent(doc.root().node);

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
