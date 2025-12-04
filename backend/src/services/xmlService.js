import { create } from "xmlbuilder2";
import crypto from "crypto";

// Função para concatenar o conteúdo de todos elementos e atributos na ordem de ocorrência
function concatenateContent(domNode) {
  let result = "";

  if (domNode.nodeType !== 1) {
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

// Função para gerar hash MD5
function generateMD5Hash(str) {
  return crypto
    .createHash("md5")
    .update(str, "utf8")
    .digest("hex")
    .toUpperCase();
}

// Função para gerar elemento de inclusão
function generateInclusaoElement(parent, dados) {
  const inclusao = parent.ele("inclusao");

  // Elemento identificacao
  const identificacao = inclusao.ele("identificacao");
  if (dados.identificacao.cpf)
    identificacao.ele("cpf").txt(dados.identificacao.cpf);
  if (dados.identificacao.dn)
    identificacao.ele("dn").txt(dados.identificacao.dn);
  if (dados.identificacao.pisPasep)
    identificacao.ele("pisPasep").txt(dados.identificacao.pisPasep);
  if (dados.identificacao.cns)
    identificacao.ele("cns").txt(dados.identificacao.cns);
  identificacao.ele("nome").txt(dados.identificacao.nome);
  identificacao.ele("sexo").txt(dados.identificacao.sexo);
  identificacao.ele("dataNascimento").txt(dados.identificacao.dataNascimento);
  if (dados.identificacao.nomeMae)
    identificacao.ele("nomeMae").txt(dados.identificacao.nomeMae);

  // Elemento endereco
  const endereco = inclusao.ele("endereco");
  if (dados.endereco.logradouro)
    endereco.ele("logradouro").txt(dados.endereco.logradouro);
  if (dados.endereco.numero) endereco.ele("numero").txt(dados.endereco.numero);
  if (dados.endereco.complemento)
    endereco.ele("complemento").txt(dados.endereco.complemento);
  if (dados.endereco.bairro) endereco.ele("bairro").txt(dados.endereco.bairro);
  endereco.ele("codigoMunicipio").txt(dados.endereco.codigoMunicipio);
  if (dados.endereco.codigoMunicipioResidencia)
    endereco
      .ele("codigoMunicipioResidencia")
      .txt(dados.endereco.codigoMunicipioResidencia);
  if (dados.endereco.cep) endereco.ele("cep").txt(dados.endereco.cep);
  if (dados.endereco.tipoEndereco)
    endereco.ele("tipoEndereco").txt(dados.endereco.tipoEndereco);
  endereco.ele("resideExterior").txt(dados.endereco.resideExterior || "0");

  // Elemento vinculo
  const vinculo = inclusao.ele("vinculo");
  vinculo.ele("codigoBeneficiario").txt(dados.vinculo.codigoBeneficiario);
  vinculo.ele("relacaoDependencia").txt(dados.vinculo.relacaoDependencia);
  vinculo.ele("dataContratacao").txt(dados.vinculo.dataContratacao);
  vinculo.ele("numeroPlanoANS").txt(dados.vinculo.numeroPlanoANS);
  vinculo
    .ele("coberturaParcialTemporaria")
    .txt(dados.vinculo.coberturaParcialTemporaria);
  vinculo
    .ele("itensExcluidosCobertura")
    .txt(dados.vinculo.itensExcluidosCobertura);

  return inclusao;
}

// Função para gerar elemento de retificação
function generateRetificacaoElement(parent, dados) {
  const retificacao = parent.ele("retificacao");

  retificacao.ele("cco").txt(dados.retificacao.cco);

  // Elemento identificacao
  const identificacao = retificacao.ele("identificacao");
  if (dados.identificacao.cpf)
    identificacao.ele("cpf").txt(dados.identificacao.cpf);
  if (dados.identificacao.dn)
    identificacao.ele("dn").txt(dados.identificacao.dn);
  if (dados.identificacao.pisPasep)
    identificacao.ele("pisPasep").txt(dados.identificacao.pisPasep);
  if (dados.identificacao.cns)
    identificacao.ele("cns").txt(dados.identificacao.cns);
  if (dados.identificacao.nome)
    identificacao.ele("nome").txt(dados.identificacao.nome);
  if (dados.identificacao.sexo)
    identificacao.ele("sexo").txt(dados.identificacao.sexo);
  if (dados.identificacao.dataNascimento)
    identificacao.ele("dataNascimento").txt(dados.identificacao.dataNascimento);
  if (dados.identificacao.nomeMae)
    identificacao.ele("nomeMae").txt(dados.identificacao.nomeMae);

  // Elemento endereco
  const endereco = retificacao.ele("endereco");
  if (dados.endereco.logradouro)
    endereco.ele("logradouro").txt(dados.endereco.logradouro);
  if (dados.endereco.numero) endereco.ele("numero").txt(dados.endereco.numero);
  if (dados.endereco.complemento)
    endereco.ele("complemento").txt(dados.endereco.complemento);
  if (dados.endereco.bairro) endereco.ele("bairro").txt(dados.endereco.bairro);
  if (dados.endereco.codigoMunicipio)
    endereco.ele("codigoMunicipio").txt(dados.endereco.codigoMunicipio);
  if (dados.endereco.codigoMunicipioResidencia)
    endereco
      .ele("codigoMunicipioResidencia")
      .txt(dados.endereco.codigoMunicipioResidencia);
  if (dados.endereco.cep) endereco.ele("cep").txt(dados.endereco.cep);
  if (dados.endereco.tipoEndereco)
    endereco.ele("tipoEndereco").txt(dados.endereco.tipoEndereco);
  if (dados.endereco.resideExterior)
    endereco.ele("resideExterior").txt(dados.endereco.resideExterior);

  // Elemento vinculo
  const vinculo = retificacao.ele("vinculo");
  if (dados.vinculo.codigoBeneficiario)
    vinculo.ele("codigoBeneficiario").txt(dados.vinculo.codigoBeneficiario);
  if (dados.vinculo.relacaoDependencia)
    vinculo.ele("relacaoDependencia").txt(dados.vinculo.relacaoDependencia);
  if (dados.vinculo.dataContratacao)
    vinculo.ele("dataContratacao").txt(dados.vinculo.dataContratacao);
  if (dados.vinculo.numeroPlanoANS)
    vinculo.ele("numeroPlanoANS").txt(dados.vinculo.numeroPlanoANS);
  if (dados.vinculo.coberturaParcialTemporaria)
    vinculo
      .ele("coberturaParcialTemporaria")
      .txt(dados.vinculo.coberturaParcialTemporaria);
  if (dados.vinculo.itensExcluidosCobertura)
    vinculo
      .ele("itensExcluidosCobertura")
      .txt(dados.vinculo.itensExcluidosCobertura);

  if (dados.retificacao.codigoProcedimentoAdministrativo) {
    retificacao
      .ele("codigoProcedimentoAdministrativo")
      .txt(dados.retificacao.codigoProcedimentoAdministrativo);
  }

  return retificacao;
}

// Função para gerar elemento de cancelamento
function generateCancelamentoElement(parent, dados) {
  const cancelamento = parent.ele("cancelamento");

  cancelamento.ele("cco").txt(dados.cancelamento.cco);
  cancelamento.ele("dataCancelamento").txt(dados.cancelamento.dataCancelamento);
  cancelamento
    .ele("motivoCancelamento")
    .txt(dados.cancelamento.motivoCancelamento);

  return cancelamento;
}

// Função para gerar elemento de mudança contratual
function generateMudancaContratualElement(parent, dados) {
  const mudancaContratual = parent.ele("mudancaContratual");

  mudancaContratual.ele("cco").txt(dados.cco);
  mudancaContratual
    .ele("relacaoDependencia")
    .txt(dados.vinculo.relacaoDependencia);
  mudancaContratual.ele("dataContratacao").txt(dados.vinculo.dataContratacao);
  mudancaContratual.ele("numeroPlanoANS").txt(dados.vinculo.numeroPlanoANS);
  mudancaContratual
    .ele("coberturaParcialTemporaria")
    .txt(dados.vinculo.coberturaParcialTemporaria);
  mudancaContratual
    .ele("itensExcluidosCobertura")
    .txt(dados.vinculo.itensExcluidosCobertura);

  return mudancaContratual;
}

export const generateXML = (movements, options = {}) => {
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
    .txt(cnpjDestino)
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

    movements.forEach((movement) => {
      switch (movement.tipoMovimento) {
        case "inclusao":
          generateInclusaoElement(beneficiarios, movement.dados);
          break;
        case "retificacao":
          generateRetificacaoElement(beneficiarios, movement.dados);
          break;
        case "cancelamento":
          generateCancelamentoElement(beneficiarios, movement.dados);
          break;
        case "mudancaContratual":
          generateMudancaContratualElement(beneficiarios, movement.dados);
          break;
        default:
          console.warn(
            `Tipo de movimento não suportado: ${movement.tipoMovimento}`,
          );
          break;
      }
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
