import { create } from "xmlbuilder2";

export const generateXML = (jsonData) => {
  // Gerar XML conforme estrutura SIB da ANS
  const dataAtual = new Date().toISOString().slice(0, 19);
  
  const root = create({ version: "1.0", encoding: "ISO-8859-1" })
    .ele("mensagemSIB")
    .ele("cabecalho")
      .ele("codigoOperadora").txt("123456").up()
      .ele("nomeOperadora").txt("Operadora Exemplo").up()
      .ele("numeroRegistroANS").txt("987654321").up()
      .ele("dataHoraTransacao").txt(dataAtual).up()
      .ele("sequencialTransacao").txt("1").up()
      .ele("tipoTransacao").txt("SIBE").up()
    .up()
    .ele("mensagem")
      .ele("operadoraParaANS")
        .ele("beneficiarios");

  // Processar cada beneficiário
  jsonData.forEach((item, index) => {
    root.ele("beneficiario")
      .ele("sequencialBeneficiario").txt((index + 1).toString()).up()
      .ele("codigoOperadora").txt(item.codigoOperadora || "123456").up()
      .ele("numeroRegistroANS").txt(item.numeroRegistroANS || "987654321").up()
      .ele("numeroMatricula").txt(item.numeroMatricula || "").up()
      .ele("nome").txt(item.nome || "").up()
      .ele("cpf").txt(item.cpf || "").up()
      .ele("dataNascimento").txt(item.dataNascimento || "").up()
      .ele("tipoMovimentacao").txt(item.tipoMovimentacao || "1").up()
      .up();
  });

  // Finalizar estrutura XML
  const xmlString = root.up().up().up()
    .ele("epilogo")
      .ele("hash").txt("exemplo_hash").up()
    .end({ prettyPrint: true });

  return xmlString;
};
