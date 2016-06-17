# js-taskmanager

Task Manager em JS para controle completo de estados no front-end de uma aplicação

## Breve introdução

Tudo se iniciou com o objetivo de evitar que o usuário ficasse refém de situações onde há quebras nos códigos JavaScripts e os sistemas projetados para juncionar a base de puras requisições AJAX (orientados a serviços) deixassem o usuário sem nenhum _status_ do que estava acontecendo. Inspirei-me no comportamento que o Google faz hoje no Gmail (para quem quiser experimentar, entre em seu Gmail e se desconecte da internet, você verá que muitas funções continuarão a funcionar e a página passsa a dar feedbacks do que está acontecendo e como esta tentando resolver o problema). Até aqui, sei que algumas bibliotecas JS já fazem esse trabalho, só que não exatamente como um Task Manager, mostrando o que se está com problemas, controlando filas de execução e podendo tomar ações alternativas. 

Diante disso, pensei em também fazer algo que sempre nos deparamos quando fazemos um deploy em clientes e resolvi juntar a essa ideia do Task Manager em JS a possibilidade de você passar apenas um arquivo HTML (que o cliente poderia colocar em qualquer servidor desejado, sem necessariamente ter suporte a nada) e esse arquivo passaria então a carregar tudo que fosse necessário para que o sistema funcionasse (quando digo tudo, é tudo mesmo... Desde CSS e JS, até layouts). 

Então sentei, passei horas (pra não falar em dias) pra tentar a chegar algo funcional ao menos. _O que esponho aqui é uma versão beta mínima da ideia, mas que ainda está longe de ser a desejada_.

## Como funciona

Em resumo, esse projeto é composto de 6 arquivos que fazem o trabalho de Task Manager de uma aplicação. São eles:
- __index.html__: Ele pode ter qualquer nome que se queria dar e pode ter o layout desejado, desde que ele mantenha a referência a um arquivo chamado "main.js".
- __main.js__: Este arquivo contém as conigurações inicias do sistema que será carregado e também é responsável por iniciar a carga de todos os outros arquivos JS que serão utilizados, garantindo que isso seja feito ou que um erro primário seja dado. Este arquivo pode ficar hospedados junto com o "index.html" ou em um server onde se encontra as blibliotecas e as aplicações em geral. É importante lembrar que esse arquivo deve ser único para cara aplicação, pois contém as configurações de ambiente e cargas iniciais.
- __composer.js__: Este é o executor da fila. É ele que tem a finalidade de pegar cada item adicionado na fila e executar a ação desejada, inclusive se esta for a de adicionar mais itens de execução à fila se for o caso.
- __config.js__: Este arquivo carrega para o nevagador as configurações iniciais informadas pelo "main.js" e outras  configurações cadastradas para aquela aplicação em forma de fila de execução já inseridas no contexto execução via Task Manger. Esse arquivo é a interface com todas as outras blibliotecas no que diz respeito a pegar e definir dados de configuração.
- __queue.js__: Está é a fila propriamente dita e ela armazena todas as ações que devem ser executadas (desde a requisições AJAX a scripts para cada ocasião). Além de tudo que foi dito, a fila ajuda a executar scripts particulares que acabam sendo usados poucas vezes mas que precisam ser carregados (aumentando o volume da carga).
- __helper.js__: O arquivo "helper.js" seria apenas uma bilbioteca de funções genéricas a serem usadas para qualquer finalidade, mas não consegui fechar a arquitetura desse modo porque não tive mais tempo pra isso, então essa biblioteca não teve um acabamento adequado e acabou misturando funcionalidades do projeto "JS Task Manager" com funcionalidade particulares de projetos que eu estava usando esse módulo para desenvolver.

Além dos arquivos, o sistema requer um reposítórios para que as lista de ações seja armazenado. Cada ação pode ter N tarefas a serem executadas. Escolhi inicialmente o MySQL como reposítório, contudo este repositório pode ser feito de várias outras formas.

## O que se esperava da biblioteca

Todas as ações a serem executadas foram projetadas para estarem em tabelas de banco de dados, inclusive layouts. Essa ideia me pareceu mais acertiva inicialmente, principalmente se eu tivesse a possibilidade de criar uma interface gráfica para lidar com essas ações a serem armazenadas. Com isso, a ideia de versionamento de ações, minificação de HTML e JS, facilidade de backups e deploy seria imensa. Quando pensava em criar interfaces para mobile, isso ficava ainda mais evidente se fosse usado um banco não relacional.

Outro dado interessante é que essa  arquitetura possibilita que se trabalhe, em um mesmo sistema, vários clientes simultâneos, pois foi originalmente pensado para ser utilizado em um produto que poderia atender a demandas de empresas diferentes, no que tange a geotecnoloigas.

## Problemas que encontrei

1. Como não havia nenhuma interface gráfica, gastava muito tempo criando as ações no banco de dados manualmente para cada funcionalidade do site que eram implementadas.
2. A manutenção em filas de execução não é tão simples pois envolve você saber a lógica de execução passo a passo de tudo que está acontecendo em determinado momento.
3. Como algumas tarefas eram exatamente executar scripts avulsos, o debug disso não era simples.

## Futuro

A ideia de colocar aqui está criação minha é ver se pode ser reaproveitada, refeita, ajustada ou qualquer coisa do gênero para que se torne uma ferramenta útil aos programadores e, principalmente, ajude aos usuários nos momentos em que eles fiquem órfãos em seus browsers. Gostaria de um dia conseguir realmente oferer a possibilidade do usuário criar e ver uma espécie de Task Manager para ajudar a entender demoras em suas ações, abortar ações problemáticas e, principalmente, ajudar aos desenvolvedores nos momentos de problemas ou atendimentos aos seus usuários, além é claro de ser uma ferramenta com um mínimo de "inteligência" para buscar alternativas quando houver quebras no processo padrão ou o usuário ficar "off-line".

