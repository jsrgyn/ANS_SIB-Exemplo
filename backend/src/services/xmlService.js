import { create } from "xmlbuilder2";
import crypto from "crypto";

// Função para formatar data no formato YYYY-MM-DDTHH:MM:SS (xsd:dateTime)
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Função para formatar data no formato YYYYMMDDHHMISS (sem caracteres especiais)
function formatDateTimeForFileName(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

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

  // Sequência interna (opcional) para inclusão
  const hasEnderecoFields =
    dados.endereco.logradouro ||
    dados.endereco.numero ||
    dados.endereco.complemento ||
    dados.endereco.bairro ||
    dados.endereco.codigoMunicipio ||
    dados.endereco.cep ||
    dados.endereco.tipoEndereco;

  if (hasEnderecoFields) {
    if (dados.endereco.logradouro)
      endereco.ele("logradouro").txt(dados.endereco.logradouro);
    if (dados.endereco.numero)
      endereco.ele("numero").txt(dados.endereco.numero);
    if (dados.endereco.complemento)
      endereco.ele("complemento").txt(dados.endereco.complemento);
    if (dados.endereco.bairro)
      endereco.ele("bairro").txt(dados.endereco.bairro);

    // codigoMunicipio é obrigatório na inclusão
    endereco.ele("codigoMunicipio").txt(dados.endereco.codigoMunicipio);

    if (dados.endereco.codigoMunicipioResidencia)
      endereco
        .ele("codigoMunicipioResidencia")
        .txt(dados.endereco.codigoMunicipioResidencia);
    if (dados.endereco.cep) endereco.ele("cep").txt(dados.endereco.cep);
    if (dados.endereco.tipoEndereco)
      endereco.ele("tipoEndereco").txt(dados.endereco.tipoEndereco);
  }

  // resideExterior é obrigatório
  endereco.ele("resideExterior").txt(dados.endereco.resideExterior || "0");

  // Elemento vinculo
  const vinculo = inclusao.ele("vinculo");
  vinculo.ele("codigoBeneficiario").txt(dados.vinculo.codigoBeneficiario);
  vinculo.ele("relacaoDependencia").txt(dados.vinculo.relacaoDependencia);

  // codigoBeneficiarioTitular é opcional, só inclui se relacaoDependencia não for 1 (titular)
  if (
    dados.vinculo.relacaoDependencia !== "1" &&
    dados.vinculo.codigoBeneficiarioTitular
  ) {
    vinculo
      .ele("codigoBeneficiarioTitular")
      .txt(dados.vinculo.codigoBeneficiarioTitular);
  }

  vinculo.ele("dataContratacao").txt(dados.vinculo.dataContratacao);

  // Choice: numeroPlanoANS (obrigatório) ou numeroPlanoOperadora
  if (dados.vinculo.numeroPlanoANS) {
    vinculo.ele("numeroPlanoANS").txt(dados.vinculo.numeroPlanoANS);
    // numeroPlanoPortabilidade é opcional
    if (dados.vinculo.numeroPlanoPortabilidade) {
      vinculo
        .ele("numeroPlanoPortabilidade")
        .txt(dados.vinculo.numeroPlanoPortabilidade);
    }
  } else if (dados.vinculo.numeroPlanoOperadora) {
    vinculo.ele("numeroPlanoOperadora").txt(dados.vinculo.numeroPlanoOperadora);
  }

  // Campos opcionais
  if (dados.vinculo.coberturaParcialTemporaria !== undefined)
    vinculo
      .ele("coberturaParcialTemporaria")
      .txt(dados.vinculo.coberturaParcialTemporaria);

  if (dados.vinculo.itensExcluidosCobertura !== undefined)
    vinculo
      .ele("itensExcluidosCobertura")
      .txt(dados.vinculo.itensExcluidosCobertura);

  // Choice para empresa contratante
  if (dados.vinculo.cnpjEmpresaContratante) {
    vinculo
      .ele("cnpjEmpresaContratante")
      .txt(dados.vinculo.cnpjEmpresaContratante);
  } else if (dados.vinculo.ceiEmpresaContratante) {
    vinculo
      .ele("ceiEmpresaContratante")
      .txt(dados.vinculo.ceiEmpresaContratante);
  } else if (dados.vinculo.caepfEmpresaContratante) {
    vinculo
      .ele("caepfEmpresaContratante")
      .txt(dados.vinculo.caepfEmpresaContratante);
  }

  return inclusao;
}

// Função para gerar elemento de retificação
function generateRetificacaoElement(parent, dados) {
  const retificacao = parent.ele("retificacao");

  // CCO é obrigatório para retificação
  if (!dados.retificacao.cco) {
    throw new Error("CCO é obrigatório para retificação");
  }
  retificacao.ele("cco").txt(dados.retificacao.cco);

  // Elemento identificacao (todos os campos são opcionais)
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

  // Elemento endereco (todos os campos são opcionais)
  const endereco = retificacao.ele("endereco");
  const hasEnderecoFields =
    dados.endereco.logradouro ||
    dados.endereco.numero ||
    dados.endereco.complemento ||
    dados.endereco.bairro ||
    dados.endereco.codigoMunicipio ||
    dados.endereco.cep ||
    dados.endereco.tipoEndereco;

  if (hasEnderecoFields) {
    if (dados.endereco.logradouro)
      endereco.ele("logradouro").txt(dados.endereco.logradouro);
    if (dados.endereco.numero)
      endereco.ele("numero").txt(dados.endereco.numero);
    if (dados.endereco.complemento)
      endereco.ele("complemento").txt(dados.endereco.complemento);
    if (dados.endereco.bairro)
      endereco.ele("bairro").txt(dados.endereco.bairro);
    if (dados.endereco.codigoMunicipio)
      endereco.ele("codigoMunicipio").txt(dados.endereco.codigoMunicipio);
    if (dados.endereco.codigoMunicipioResidencia)
      endereco
        .ele("codigoMunicipioResidencia")
        .txt(dados.endereco.codigoMunicipioResidencia);
    if (dados.endereco.cep) endereco.ele("cep").txt(dados.endereco.cep);
    if (dados.endereco.tipoEndereco)
      endereco.ele("tipoEndereco").txt(dados.endereco.tipoEndereco);
  }

  if (dados.endereco.resideExterior !== undefined)
    endereco.ele("resideExterior").txt(dados.endereco.resideExterior);

  // Elemento vinculo (todos os campos são opcionais)
  const vinculo = retificacao.ele("vinculo");
  if (dados.vinculo.codigoBeneficiario)
    vinculo.ele("codigoBeneficiario").txt(dados.vinculo.codigoBeneficiario);
  if (dados.vinculo.relacaoDependencia)
    vinculo.ele("relacaoDependencia").txt(dados.vinculo.relacaoDependencia);

  if (
    dados.vinculo.relacaoDependencia !== "1" &&
    dados.vinculo.codigoBeneficiarioTitular
  ) {
    vinculo
      .ele("codigoBeneficiarioTitular")
      .txt(dados.vinculo.codigoBeneficiarioTitular);
  }

  if (dados.vinculo.dataContratacao)
    vinculo.ele("dataContratacao").txt(dados.vinculo.dataContratacao);

  if (dados.vinculo.dataReativacao)
    vinculo.ele("dataReativacao").txt(dados.vinculo.dataReativacao);

  // Campos de cancelamento (apenas se houver)
  if (dados.vinculo.dataCancelamento || dados.vinculo.motivoCancelamento) {
    if (dados.vinculo.dataCancelamento)
      vinculo.ele("dataCancelamento").txt(dados.vinculo.dataCancelamento);
    if (dados.vinculo.motivoCancelamento)
      vinculo.ele("motivoCancelamento").txt(dados.vinculo.motivoCancelamento);
  }

  // Choice: numeroPlanoANS ou numeroPlanoOperadora
  if (dados.vinculo.numeroPlanoANS) {
    vinculo.ele("numeroPlanoANS").txt(dados.vinculo.numeroPlanoANS);
    if (dados.vinculo.numeroPlanoPortabilidade)
      vinculo
        .ele("numeroPlanoPortabilidade")
        .txt(dados.vinculo.numeroPlanoPortabilidade);
  } else if (dados.vinculo.numeroPlanoOperadora) {
    vinculo.ele("numeroPlanoOperadora").txt(dados.vinculo.numeroPlanoOperadora);
  }

  if (dados.vinculo.coberturaParcialTemporaria !== undefined)
    vinculo
      .ele("coberturaParcialTemporaria")
      .txt(dados.vinculo.coberturaParcialTemporaria);

  if (dados.vinculo.itensExcluidosCobertura !== undefined)
    vinculo
      .ele("itensExcluidosCobertura")
      .txt(dados.vinculo.itensExcluidosCobertura);

  // Choice para empresa contratante
  if (dados.vinculo.cnpjEmpresaContratante) {
    vinculo
      .ele("cnpjEmpresaContratante")
      .txt(dados.vinculo.cnpjEmpresaContratante);
  } else if (dados.vinculo.ceiEmpresaContratante) {
    vinculo
      .ele("ceiEmpresaContratante")
      .txt(dados.vinculo.ceiEmpresaContratante);
  } else if (dados.vinculo.caepfEmpresaContratante) {
    vinculo
      .ele("caepfEmpresaContratante")
      .txt(dados.vinculo.caepfEmpresaContratante);
  }

  // Campo opcional codigoProcedimentoAdministrativo
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

  // Valida campos obrigatórios
  if (!dados.cancelamento.cco) {
    throw new Error("CCO é obrigatório para cancelamento");
  }
  if (!dados.cancelamento.dataCancelamento) {
    throw new Error("Data de cancelamento é obrigatória");
  }
  if (!dados.cancelamento.motivoCancelamento) {
    throw new Error("Motivo de cancelamento é obrigatório");
  }

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

  // CCO é obrigatório
  if (!dados.cco) {
    throw new Error("CCO é obrigatório para mudança contratual");
  }

  mudancaContratual.ele("cco").txt(dados.cco);
  mudancaContratual
    .ele("relacaoDependencia")
    .txt(dados.vinculo.relacaoDependencia || "1");

  // codigoBeneficiarioTitular é opcional
  if (
    dados.vinculo.relacaoDependencia !== "1" &&
    dados.vinculo.codigoBeneficiarioTitular
  ) {
    mudancaContratual
      .ele("codigoBeneficiarioTitular")
      .txt(dados.vinculo.codigoBeneficiarioTitular);
  }

  mudancaContratual.ele("dataContratacao").txt(dados.vinculo.dataContratacao);

  // Choice: numeroPlanoANS ou numeroPlanoOperadora
  if (dados.vinculo.numeroPlanoANS) {
    mudancaContratual.ele("numeroPlanoANS").txt(dados.vinculo.numeroPlanoANS);
    if (dados.vinculo.numeroPlanoPortabilidade) {
      mudancaContratual
        .ele("numeroPlanoPortabilidade")
        .txt(dados.vinculo.numeroPlanoPortabilidade);
    }
  } else if (dados.vinculo.numeroPlanoOperadora) {
    mudancaContratual
      .ele("numeroPlanoOperadora")
      .txt(dados.vinculo.numeroPlanoOperadora);
  }

  mudancaContratual
    .ele("coberturaParcialTemporaria")
    .txt(dados.vinculo.coberturaParcialTemporaria || "0");
  mudancaContratual
    .ele("itensExcluidosCobertura")
    .txt(dados.vinculo.itensExcluidosCobertura || "0");

  // Choice para empresa contratante
  if (dados.vinculo.cnpjEmpresaContratante) {
    mudancaContratual
      .ele("cnpjEmpresaContratante")
      .txt(dados.vinculo.cnpjEmpresaContratante);
  } else if (dados.vinculo.ceiEmpresaContratante) {
    mudancaContratual
      .ele("ceiEmpresaContratante")
      .txt(dados.vinculo.ceiEmpresaContratante);
  } else if (dados.vinculo.caepfEmpresaContratante) {
    mudancaContratual
      .ele("caepfEmpresaContratante")
      .txt(dados.vinculo.caepfEmpresaContratante);
  }

  return mudancaContratual;
}

export const generateXML = (movements, options = {}) => {
  const {
    sequencialTransacao = "1",
    registroANS = "",
    nomeAplicativo = "",
    fabricanteAplicativo = "",
    versaoAplicativo = "1.00",
    motivoNaoEnvioBeneficiarios = "",
    cnpjDestino = "03589068000146",
    tipoTransacao = "ATUALIZACAO SIB",
    versaoPadrao = "1.1",
  } = options;

  // Valida campos obrigatórios do cabeçalho
  if (!registroANS || registroANS.length !== 6) {
    throw new Error("Registro ANS é obrigatório e deve ter 6 dígitos");
  }
  if (!nomeAplicativo) {
    throw new Error("Nome do aplicativo é obrigatório");
  }
  if (!fabricanteAplicativo) {
    throw new Error("Fabricante do aplicativo é obrigatório");
  }

  // Usa a hora atual do computador no formato YYYY-MM-DDTHH:MM:SS (xsd:dateTime)
  const now = new Date();
  const dataAtual = formatDateTime(now);

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
    .txt(dataAtual) // Agora no formato correto: YYYY-MM-DDTHH:MM:SS
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

    movements.forEach((movement, index) => {
      try {
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
              `Tipo de movimento não suportado na linha ${index + 1}: ${movement.tipoMovimento}`,
            );
            break;
        }
      } catch (error) {
        console.error(
          `Erro ao processar movimento na linha ${index + 1}:`,
          error.message,
        );
        throw new Error(`Linha ${index + 1}: ${error.message}`);
      }
    });
  }

  // Gerar string XML temporária sem epilogo
  const doc = root.doc();
  const xmlWithoutEpilogo = doc.end({ prettyPrint: true });

  // Concatenar conteúdo para o hash (excluindo epilogo)
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
