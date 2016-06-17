// Verificando domínio
var ARICH = ARICH || {};

// Inicialização do sistema
ARICH.initialize = function(){
	// TODO: Rever essas configurações e scripts manuais
	//		 porque tira um pouco a ideia 'tudo remoto'

	// Configurações que precisam ser informadas
	// antes de se obter dados do servidor
	ARICH.config.set("sys_timeout_beforeExecute", 1000); //Timeout de esperas
	ARICH.config.set("sys_attempts_beforeExecute", 100); //Tentativas de execução

	// Scripts e itens de fila que devem ser carregados manualmente pois
	// se referem a obtenção de todas as outras informações necessárias
	ARICH.queue.load(
		[{
			id: 0,
			script_ids: '[1]',
			key_action: "['before_inicialize_config']",
			name: "getConfig",
			description: "Obtendo configurações remotas ",
			order: 0
		},
		{
			id: 1,
			key_action: "['before_inicialize_queue']",
			name: "getQueue",
			description: "Obtendo  fila do servidor",
			order: 0
		}], "scripts");
	// - Inserindo os passos do Script de carga
	// TODO: Retirar o SCRIPT_ORDER e SCRIPT_DETAIL_ID do Banco
	ARICH.queue.load(
		[{
			id: 0,
			script_id: 0,
			function_exec: "ARICH.helper.ajax",
			description: "Solicita ao servidor as configurações do sistema",
			// CURIOSIDADE: Sem os parênteses, o EVAL não transforma essa string em OBJ
			params: '({remote_element: "settings", remote_action: "all", function_return: "ARICH.composer.afterScript"})',
			order: 0,
			remote: true
		},
		{
			id: 1,
			script_id: 1,
			function_exec: "ARICH.helper.ajax",
			description: "Solicita ao servidor os scripts agregadores",
			params: '({remote_element: "scripts", remote_action: "all", function_return:"ARICH.composer.afterScript"})', 
			order: 0,
			remote: true
		},
		{
			id: 2,
			script_id: 1,
			function_exec: "ARICH.helper.ajax",
			description: "Solicita ao servidor os itens da fila (detalhes dos scripts)",
			params: '({remote_element: "script_details",remote_action: "all", function_return: "ARICH.composer.afterScript"})',
			order: 0,
			remote: true
		},
		{
			id: 3,
			script_id: 0,
			function_exec: "ARICH.config.load",
			description: "Lê os dados vindos do servidor e carrega o CONFIG",
			params: '%%0%%',
			order: 1,
			remote: false
		},
		{
			id: 4,
			script_id: 1,
			function_exec: "ARICH.queue.load",
			description: "Lê os dados vindos do servidor e carrega os SCRIPTS",
			params: '%%1%%|"scripts"',
			order: 1,
			remote: false
		},
		{
			id: 5,
			script_id: 1,
			function_exec: "ARICH.queue.load",
			description: "Lê os dados vindos do servidor e carrega a FILA",
			params: '%%2%%|"details"',
			order: 1,
			remote: false
		}], "details");



	// Carregandos diretivas do sistema
	ARICH.composer.beforeScript("before_inicialize_config");

	// Carregando modal de aviso, mas NÃO EXIBINDO-A
	ARICH.composer.beforeScript("create_modal");

	// Fazendo autenticação
	ARICH.composer.beforeScript("before_authentication");
};