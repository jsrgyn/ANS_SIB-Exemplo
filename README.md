# ANS SIB Exemplo

Aplicação Node.js integrada para geração e validação de XML de beneficiários conforme especificação ANS/SIB.

## Características
- **Backend**: Express.js com parsing CSV, geração e validação XML
- **Frontend**: React integrado servido pelo backend
- **Interface única**: Tudo rodando em uma única aplicação
- **Validação XSD**: Validação automática contra schemas da ANS

## Como rodar

### Instalação e execução
```bash
cd backend
npm install
npm run dev
```

### Acesso
- Aplicação principal: http://localhost:3001/sib
- API: http://localhost:3001/api/

## Exemplo de CSV
O arquivo CSV deve conter as seguintes colunas:
```csv
nome,cpf,dataNascimento,codigoOperadora,numeroRegistroANS,numeroMatricula,tipoMovimentacao
João da Silva,12345678901,1980-01-15,123456,987654321,123456789,1
```

## Scripts disponíveis
- `npm run dev`: Executa em modo de desenvolvimento com nodemon
- `npm start`: Executa em modo produção
- `npm test`: Executa os testes unitários

## Estrutura do projeto
```
backend/
├── public/           # Frontend integrado (HTML/CSS/JS)
├── src/
│   ├── controllers/  # Controladores da API
│   ├── routes/       # Rotas do Express
│   ├── services/     # Serviços (CSV, XML)
│   └── validators/   # Validação XML contra XSD
├── schemas/          # Arquivos XSD da ANS
├── example/          # Arquivo CSV de exemplo
└── uploads/          # Pasta temporária para uploads
```

## Funcionalidades
1. ✅ Upload de arquivo CSV
2. ✅ Conversão CSV → JSON → XML
3. ✅ Geração de XML conforme estrutura SIB
4. ✅ Validação contra schemas XSD da ANS
5. ✅ Download do XML gerado
6. ✅ Interface responsiva com Bootstrap

## Referências
- [SIB ANS](https://www.gov.br/ans/pt-br/sobre-o-sib)
- [XSD SIB](https://www.gov.br/ans/pt-br/arquivos/assuntos/espaco-da-operadora-de-plano-de-saude/aplicativos-ans/sib/sib.xsd)
- [Documentação SIB](https://www.gov.br/ans/pt-br/arquivos/assuntos/espaco-da-operadora-de-plano-de-saude/aplicativos-ans/sib/17012019-sib-instrucoes-xml.pdf)
