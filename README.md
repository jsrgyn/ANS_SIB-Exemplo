# ANS SIB XML Generator

Sistema completo para geração e validação de XML de beneficiários conforme especificação ANS/SIB (Sistema de Informações de Beneficiários).

## 📋 Sobre o Projeto

Aplicação web completa para geração de arquivos XML no padrão ANS/SIB, permitindo que operadoras de saúde gerem arquivos válidos para transmissão ao sistema da Agência Nacional de Saúde Suplementar.

### 🎯 Principais Funcionalidades

- **Conversão CSV → XML**: Transforma arquivos CSV em XML SIB válido
- **Validação XSD**: Validação automática contra schemas XSD da ANS
- **Geração de Hash MD5**: Calcula hash conforme especificação SIB
- **Suporte a múltiplos tipos de movimento**: Inclusão, Retificação, Mudança Contratual e Cancelamento
- **Interface intuitiva**: Frontend React integrado com Bootstrap
- **Validação em tempo real**: Verificação instantânea de dados

## 🚀 Começando

### Pré-requisitos

- Node.js 18 ou superior
- npm 9 ou superior

### Instalação

1. **Clone o repositório**
```bash
git clone [url-do-repositorio]
cd ans-sib-backend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente** (opcional)
```bash
cp .env.example .env
# Edite o arquivo .env conforme necessário
```

4. **Execute o servidor**
```bash
npm run dev
```

5. **Acesse a aplicação**
Abra o navegador e acesse: http://localhost:3001/sib

## 🏗️ Estrutura do Projeto

```
ans-sib-backend/
├── src/
│   ├── controllers/
│   │   └── csvController.js      # Controlador de upload e processamento CSV
│   ├── services/
│   │   ├── csvService.js         # Serviço de parsing CSV para JSON
│   │   └── xmlService.js         # Serviço de geração de XML
│   ├── validators/
│   │   └── xmlValidator.js       # Validador XML contra XSD
│   ├── routes/
│   │   ├── index.js             # Rotas principais da API
│   │   └── csvRoutes.js         # Rotas específicas para CSV
│   └── index.js                 # Ponto de entrada da aplicação
├── schemas/
│   ├── sib.xsd                  # Schema principal SIB
│   ├── sibSimpleType.xsd        # Tipos simples SIB
│   └── sibComplexType.xsd       # Tipos complexos SIB
├── public/
│   └── index.html              # Frontend React integrado
├── uploads/                    # Pasta temporária para uploads
├── .env.example               # Exemplo de variáveis de ambiente
├── package.json              # Dependências e scripts
└── README.md                 # Esta documentação
```

## 📁 Estrutura do CSV

O arquivo CSV deve usar delimitador ponto-e-vírgula (;) e conter as seguintes colunas:

### Colunas Obrigatórias
- **nome**: Nome completo do beneficiário
- **sexo**: "1" (masculino) ou "3" (feminino)
- **dataNascimento**: Data no formato DD/MM/YYYY ou YYYY-MM-DD
- **codigoBeneficiario**: Código único do beneficiário na operadora (1-30 caracteres)
- **dataContratacao**: Data de contratação no formato DD/MM/YYYY
- **numeroPlanoANS**: Número do plano ANS (9 dígitos)
- **codigoMunicipio**: Código IBGE do município (6 dígitos)

### Colunas Opcionais
- **cpf**: CPF do beneficiário (11 dígitos)
- **cns**: Cartão Nacional de Saúde (15 dígitos)
- **dn**: Declaração de Nascido Vivo (11 dígitos)
- **pisPasep**: PIS/PASEP (11 dígitos)
- **nomeMae**: Nome da mãe do beneficiário
- **logradouro**: Nome da rua/avenida
- **numero**: Número do endereço
- **complemento**: Complemento do endereço
- **bairro**: Bairro
- **codigoMunicipioResidencia**: Código IBGE do município de residência
- **cep**: CEP (8 dígitos)
- **tipoEndereco**: "1" (Comercial) ou "2" (Residencial)
- **resideExterior**: "0" (Não) ou "1" (Sim)
- **relacaoDependencia**: Código da relação de dependência
- **cnpj**: CNPJ da empresa contratante (14 dígitos)
- **cei**: CEI da empresa contratante (12 dígitos)
- **caepf**: CAEPF da empresa contratante (14 dígitos)
- **coberturaParcialTemporaria**: "0" (Não) ou "1" (Sim)
- **itensExcluidosCobertura**: "0" (Não) ou "1" (Sim)
- **cco**: Código de Cadastro Consolidado (12 dígitos, obrigatório para movimentos 2,4,5)
- **tipo_movimentacao**: Código do tipo de movimento

### Tipos de Movimentação
| Código | Tipo | Descrição |
|--------|------|-----------|
| 1 | inclusao | Inclusão de novo beneficiário |
| 2 | retificacao | Retificação de dados |
| 4 | mudancaContratual | Mudança contratual |
| 5 | cancelamento | Cancelamento de vínculo |

## 🔧 API Endpoints

### POST `/api/csv/upload`
**Upload de arquivo CSV**
- Content-Type: `multipart/form-data`
- Body: `file` (arquivo CSV)
- Limites: tamanho máximo configurado por `MAX_FILE_SIZE` (padrão 50MB); apenas MIME `text/csv` ou `application/vnd.ms-excel`
- Erros: `413 Payload Too Large` se exceder o limite; `400` se tipo inválido ou arquivo vazio

### POST `/api/csv/process`
**Processamento do CSV para XML**
```json
{
  "filePath": "caminho/do/arquivo.csv",
  "sequencialTransacao": "1",
  "registroANS": "123456",
  "nomeAplicativo": "Nome do Sistema",
  "fabricanteAplicativo": "Empresa Desenvolvedora",
  "versaoAplicativo": "1.0.0",
  "motivoNaoEnvioBeneficiarios": "",
  "cnpjDestino": "03589068000146"
}
```
**Resposta de sucesso (200)**
```json
{
  "xml": "<?xml ...",
  "fileName": "123456YYYYMMDDHHMISS.SBX",
  "isValid": true,
  "errors": [],
  "recordCount": 10,
  "totalProcessados": 10,
  "totalRejeitados": 2,
  "errosCSV": [
    { "linha": 3, "campo": "sexo", "mensagem": "Obrigatório e deve ser 1 ou 3" },
    { "linha": 7, "campo": "cco", "mensagem": "Obrigatório e deve ter 12 dígitos para retificação/cancelamento" }
  ]
}
```
**Resposta sem linhas válidas (422)**
```json
{
  "error": "Nenhuma linha válida encontrada. Verifique os erros de validação.",
  "totalProcessados": 0,
  "totalRejeitados": 5,
  "errosCSV": [...]
}
```

### POST `/api/xml/validate`
**Validação de XML**
```json
{
  "xml": "<?xml version=\"1.0\" encoding=\"ISO-8859-1\"?>..."
}
```

## 📊 Formato do XML Gerado

O sistema gera XML no seguinte formato:

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<mensagemSIB>
  <cabecalho>
    <identificacaoTransacao>
      <tipoTransacao>ATUALIZACAO SIB</tipoTransacao>
      <sequencialTransacao>1</sequencialTransacao>
      <dataHoraRegistroTransacao>2025-12-07T10:30:00</dataHoraRegistroTransacao>
    </identificacaoTransacao>
    <origem>
      <registroANS>123456</registroANS>
    </origem>
    <destino>
      <cnpj>03589068000146</cnpj>
    </destino>
    <versaoPadrao>1.1</versaoPadrao>
    <identificacaoSoftwareGerador>
      <nomeAplicativo>Sistema Exemplo</nomeAplicativo>
      <versaoAplicativo>1.0.0</versaoAplicativo>
      <fabricanteAplicativo>Empresa XYZ</fabricanteAplicativo>
    </identificacaoSoftwareGerador>
  </cabecalho>
  <mensagem>
    <operadoraParaANS>
      <beneficiarios>
        <!-- Beneficiários aqui -->
      </beneficiarios>
    </operadoraParaANS>
  </mensagem>
  <epilogo>
    <hash>HASH_MD5_GERADO</hash>
  </epilogo>
</mensagemSIB>
```

## 🧪 Validações Realizadas

### Validações de Dados
1. **CPF**: 11 dígitos numéricos
2. **CNS**: 15 dígitos numéricos
3. **CEP**: 8 dígitos numéricos
4. **CNPJ**: 14 dígitos numéricos
5. **Datas**: Formato correto e datas válidas
6. **Códigos**: Conformidade com enumerações do XSD

### Validações de Negócio
1. **CCO obrigatório** para movimentos de retificação, mudança contratual e cancelamento
2. **Campos obrigatórios** conforme tipo de movimento
3. **Datas não futuras**
4. **Relacionamento de dependência** (codigoBeneficiarioTitular para dependentes)

## 📝 Configuração do Sistema

### Variáveis de Ambiente
```env
PORT=3001
NODE_ENV=development
UPLOAD_DIR=uploads/
MAX_FILE_SIZE=52428800  # Tamanho máximo de upload em bytes (padrão 50MB)
SIB_SCHEMA_VERSION=1.2
```

### Scripts NPM
```json
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "test": "jest",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

## 🐛 Solução de Problemas

### Erro: "Cannot find package 'express'"
```bash
npm install express dotenv cors multer csv-parse xmlbuilder2 libxmljs2
```

### Erro: "XML inválido"
1. Verifique o arquivo CSV contra o exemplo fornecido
2. Confirme que todos os campos obrigatórios estão preenchidos
3. Valide formatos de data e campos numéricos

### Erro: "Hash inválido"
O sistema recalcula automaticamente o hash. Se persistir, verifique:
1. A função `concatenateContent` não inclui o elemento `<epilogo>`
2. A codificação do XML está como ISO-8859-1
3. Não há espaços ou quebras de linha extras

## 📚 Recursos e Referências

- **[ANS SIB](https://www.gov.br/ans/pt-br/sobre-o-sib)**: Site oficial do SIB
- **[Manual SIB](https://www.gov.br/ans/pt-br/centrais-de-conteudo/manuais-do-portal-operadoras)**: Manuais e documentação oficial
- **[XSD SIB](https://www.gov.br/ans/pt-br/arquivos/assuntos/espaco-da-operadora-de-plano-de-saude/aplicativos-ans/sib/sib.xsd)**: Schema XSD oficial
- **[Critérios de Preenchimento](https://www.gov.br/ans/pt-br/centrais-de-conteudo/manuais-do-portal-operadoras/sib-manual-de-instalacao-historico-de-versao-e-outros-arquivos/manual/criticas-de-preenchimento-dos-campos)**: Regras de validação

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## ✨ Melhorias Recentes

- ✅ Linhas rejeitadas do CSV reportadas na resposta (`errosCSV`) e exibidas no log da interface
- ✅ Limite de tamanho de arquivo configurável via `MAX_FILE_SIZE` no `.env`
- ✅ Validação de MIME type no upload (apenas CSV aceito)
- ✅ Formato de data corrigido para `xsd:dateTime` (YYYY-MM-DDTHH:MM:SS)
- ✅ Campo `versaoAplicativo` adicionado ao formulário
- ✅ Nome do arquivo no padrão ANS: `{registroANS}{YYYYMMDDHHMISS}.SBX`
- ✅ Validação completa contra schemas XSD
- ✅ Suporte a 4 tipos de movimento diferentes
- ✅ Interface React otimizada com validação em tempo real

---

**Versão**: 2.1.0
**Última atualização**: Abril 2026
**Compatível com**: ANS/SIB Versão 1.2