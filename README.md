# Projeto JS Task Manager

Task Manager em JS para controle completo de estados e execuções no front-end de uma aplicação, usado no projeto [GeoTools-Plataform](https://github.com/aleemerich/GeoTools-Plataform).

## Breve introdução

Tudo se iniciou com o objetivo de evitar que o usuário ficasse refém de situações onde há quebras nos códigos JavaScripts e os sistemas projetados para juncionar a base de puras requisições AJAX (orientados a serviços) deixassem o usuário sem nenhum _status_ do que estava acontecendo. Inspirei-me no comportamento que o Google faz hoje no Gmail (para quem quiser experimentar, entre em seu Gmail e se desconecte da internet, você verá que muitas funções continuarão a funcionar e a página passsa a dar feedbacks do que está acontecendo e como esta tentando resolver o problema). Até aqui, sei que algumas bibliotecas JS já fazem esse trabalho, só que não exatamente como um Task Manager, mostrando o que se está com problemas, controlando filas de execução e podendo tomar ações alternativas. 

Diante disso, pensei em também fazer algo que sempre nos deparamos quando fazemos um deploy em clientes e resolvi juntar a essa ideia do Task Manager em JS a possibilidade de você passar apenas um arquivo HTML (que o cliente poderia colocar em qualquer servidor desejado, sem necessariamente ter suporte a nada) e esse arquivo passaria então a carregar tudo que fosse necessário para que o sistema funcionasse (quando digo tudo, é tudo mesmo... Desde CSS e JS, até layouts). 

Então sentei, passei horas (pra não falar em dias) pra tentar a chegar algo funcional ao menos. _O que esponho aqui é uma versão beta mínima da ideia, mas que precisa de muita melhoria_.

## Como funciona

Antes de começar, é importante deixar claro que __os códigos aqui disponibilizados foram retirados de um sistema, então pode haver dependências que ainda estão dentro dos fontes disponibilizados. No script de banco de dados, há informações para ilustrar como se utilizava tais tabelas, mas essas informações são meramente ilustrativas e darão erro se usadas de forma avulsa.__ 

Em resumo, esse projeto é composto de 6 arquivos que fazem o trabalho de Task Manager de uma aplicação. São eles:
- __index.html__: Ele pode ter qualquer nome que se queria dar e pode ter o layout desejado, desde que ele mantenha a referência a um arquivo chamado "start.js".
- __start.js__: Este arquivo contém as conigurações iniciais do sistema e responsável pela carga de todos os outros arquivos JS que serão utilizados, garantindo que isso seja feito com máxima integridade que o JavaScript puro pode oferecer. Este arquivo pode ficar hospedados junto com o "index.html" ou em um server onde se encontra as blibliotecas e as aplicações em geral. É importante lembrar que esse arquivo deve ser único para cara aplicação (ou cliente), pois contém as configurações de ambiente particulares de cada aplicação a ser executada.
- __main.js__: Este arquivo insere na fila as primeiras execuções que devem ser feitas, visando inciar o processo de carga inicial do sistema. As ações contidas neste arquivo irão até o ponto em que o site tenha carregado os dados mínimos para funcionar. Neste arquivo forma deixados de propósito alguns exemplos para ilutstrar a estrutura de uma fila dentro desta bibliteoca.
- __composer.js__: Este é o executor da fila. É ele que tem a finalidade de pegar cada item adicionado na fila e executar a ação desejada, inclusive se esta for a de adicionar mais itens de execução à fila se for o caso.
- __config.js__: Este arquivo carrega para o nevagador as configurações iniciais informadas pelo "main.js" e outras  configurações cadastradas para aquela aplicação em forma de fila de execução já inseridas no contexto execução via Task Manger. Esse arquivo é a interface com todas as outras blibliotecas no que diz respeito a pegar e definir dados de configuração.
- __queue.js__: Está é a fila propriamente dita e ela armazena todas as ações que devem ser executadas (desde a requisições AJAX a scripts para cada ocasião). Além de tudo que foi dito, a fila ajuda a executar scripts particulares que acabam sendo usados poucas vezes mas que precisam ser carregados (aumentando o volume da carga).
- __helper.js__: O arquivo "helper.js" seria apenas uma bilbioteca de funções genéricas a serem usadas para qualquer finalidade, mas não consegui fechar a arquitetura desse modo porque não tive mais tempo pra isso, então essa biblioteca não teve um acabamento adequado e acabou misturando funcionalidades do projeto "JS Task Manager" com funcionalidade particulares de projetos que eu estava usando esse módulo para desenvolver.

Conceitualmente falando, o sistema funciona como um executor de tarefas onde:

1. Há uma tarefa "pai" (script) que pode conter N subtarefas "filhas" (script_datails).
2. Pode haver correlações entre as tarefas "pai", obrigando o sistema a executar tarefas "pai" antes ou depois de ter que executar aquela terefa "pai" em específico.
3. Cada subtarefa tem uma ordem de execução, um controle para saber se é uma execução remota ou não, a função que ela precisa executar e seus parâmetros. Basta criar as tabelas contidas no repositório para ver alguns exemplos.
4. As subtarefas podem ser um código de JacaScript ao invés de uma função.
5. Nas subtarefas, há "coringas" para que se usem como referências a parâmetros dinâmicos.


Além dos arquivos, o sistema requer um reposítórios para que as lista de ações seja armazenado. Cada ação pode ter N tarefas a serem executadas. Escolhi inicialmente o MySQL como reposítório, contudo este repositório pode ser feito de várias outras formas.

## Objetivo da biblioteca

Ter todas as ações a serem executadas foram projetadas para estarem em tabelas de banco de dados, inclusive layouts. Essa ideia me pareceu mais acertiva inicialmente, principalmente se eu tivesse a possibilidade de criar uma interface gráfica para lidar com essas ações a serem armazenadas. Com isso, eu teria um ganho em versionamento de ações, minificação de HTML e JS, backups e deploy. Quando pensava em criar interfaces para mobile, isso ficava parecia ainda mais evidente se fosse usado em um banco (relacional ou não).

Outro dado interessante é que essa  arquitetura possibilita que se trabalhe, em um mesmo sistema, vários clientes (ambientes, sistemas) simultâneos, pois foi originalmente pensado para ser utilizado em um produto que poderia atender a demandas de empresas diferentes, mas com o mesmo framework.

## Problemas que encontrei

1. Como não havia nenhuma interface gráfica, gastava muito tempo criando as ações no banco de dados manualmente para cada funcionalidade do site que eram implementadas.
2. A manutenção em filas de execução não é tão simples pois envolve você saber a lógica de execução passo a passo de tudo que está acontecendo em determinado momento.
3. Como algumas tarefas eram exatamente executar scripts avulsos, o debug disso não era simples.

## Futuro

A ideia de colocar aqui está criação minha é repartir conhecimento e ver se o que fiz pode/vale ser reaproveitado, refeito, ajustado ou qualquer coisa do gênero para que se torne uma ferramenta útil aos programadores, além de ajudar aos usuários finais nos momentos em que eles ficam órfãos em seus browsers. 

Gostaria de um dia conseguir realmente oferer a possibilidade do usuário criar e ver uma espécie de Task Manager para ajudar a entender demoras em suas ações, abortar ações problemáticas e, principalmente, ajudar a tornar a vida dos desenvolvedores de fornt-end tando no desenvolvimento quanto nos momentos de problemas ou atendimentos entre eles e seus usuários, além é claro de deixar essa biblioteca uma ferramenta com um mínimo de "inteligência" para buscar alternativas quando houver quebras no processo default como quando o usuário ficar "off-line" ou coisas do gênero.

Espero que aproveitem!

