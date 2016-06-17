/***************************************************************

						QUEUE (FILA)

Este módulo tem por objetivo carregar uma fila permanente de ações
que serão executadas no sistema client-side (lado do cliente).

Essas ações serão armazeadas de duas formas:
- SCRIPTS = São os registros que servem de agrupadores de funções
a serem executadas. Seu objetivo, além de agrupar, é a reutilização 
de agrupamentos e determinadas circustâncias. Seus dados são:
	- order: indica a ordem que aquele conjunto de funções será
		executado quando se tem mais que um conjunto
	- description: descreve o que aquele conjunto de funções faz
	- name: nome do script ou do agrupador
	- key_action: palavras-chave que dispararão o uso do script, 
		sempre no formato JSON
	- companies_id: identifica a empresa que aquele script pertence
	- script_ids: indica um ou mais scritps que serão executados
		junto com aqueles. Serão sempre em formato JSON

- QUEUE = Esta é a fila propriamente dita. Uma lista de  funções a
serem executadas (uma por registro de tabela), agrupadas pelo SCRIPT
que informará o contexto e que terão como apoio os dados:
	- remote: informa se a função usará ajax;
	- order: contém a ordem de execução daquela função. Só pé usado
		quanto se tem mais que uma função a ser executada para um
		mesmo script
	- params: contém o parâmetro a ser informado, no formato JSON
	- description: usado para descrever o uso da função naquele 
		momento que será executada
	- function_exec: nome da função a exer executada
	- script_id: script a que essa função pertence
	- script_detail_ids: indica o item da fila que deve ser executado
		posteriormente a esse (auto relacionamento) no formato JSON;

****************************************************************/


// Verificação de domínio
var ARICH = ARICH || {};

ARICH.queue = (function(){

	// =====================
	// PROPRIEDADES PRIVADAS
	// =====================

	// Objetos privados
	var _scripts = [], // armazena os scripts principais
		_queue = [], // armazena os passos de cada script, em forma de fila
		_queue_execute = [], // armazena as fila de execução somente com os itens necessários
		_length = { // armazena o tamanho
			queue: 0,
			queue_execute: 0,
			scripts: 0
		},
		//_index = 0, // armazena o ponteiro interno
		//_active_tag, // guarda a tag que está sendo trabalhada
		_quantity_execute_now = 0, // quantidade de itens a serem executados na fila
		_quantity_execute_now_in_order = 0,
		_block = false, //bloqueia a fila para novas ações
		_errorInExecution = false; // informa se houve erro na execução


	// ====
	// API
	// ====

	return {
		// ========
		// MÉTODOS
		// ========

		// Carrega os objetos da fila
		load: function(data, type){
			var objs = data;
			switch(type){
				case 'details': // carrega DETAILS
					for(var i = 0; i < objs.length; i++){
						// - Nesse ponto pega-se apenas os campos necessários
						//   e acrescenta outros de importantes como STATUS
						// - Também fica garantido a estrutura para o JS
						var step = {};
						step.id = objs[i]["id"];
						step.script_detail_id = objs[i]["script_detail_id"];
						step.script_id = objs[i]["script_id"];
						step.function_exec = objs[i]["function_exec"];
						step.description = objs[i]["description"];
						step.params = objs[i]["params"];
						step.order = objs[i]["order"];
						step.remote = objs[i]["remote"];
						step.status = "sleep";
						_queue.push(step);
					}
					_length.queue = _queue.length;						
					break;
				case 'scripts': // carrega os SCRIPTS
					for(var i = 0; i < objs.length; i++){
						// - Nesse ponto pega-se apenas os campos necessários
						//   e acrescenta outros de importantes se precisar
						// - Também fica garantido a estrutura para o JS
						var script = {};
						script.id = objs[i]["id"];
						script.script_ids = objs[i]["script_ids"];
						script.key_action = objs[i]["key_action"];
						script.name = objs[i]["name"];
						script.description = objs[i]["description"];
						script.order = objs[i]["order"]; // TODO: Acredito que não é necessário
						_scripts.push(script);
					}
					_length.scripts = _scripts.length;
					break;
				default: 
					// throw{
					// 	name: "NoTypeDefined",
					// 	message: "Tipo de dado a ser carregado não foi definido"
					// };
					console.log("[ARICH.queue.load] Tipo de dado a ser carregado não foi definido");
					break;
			}
		},

		// Informa uma key_action para que sejam
		// atualizados os devidos status e a fila seja
		// passível de execução
		setExecute: function(key_action){
			var ret = false,
				i;
			// TODO: Pensar se realmente é necessários dupla checagem
			// e se não é melhor deixar a checagem só aqui.

			// verifica se realmente a fila está bloqueada
			if (!_block)
			{
				//verifica se realmente a key é válida
				if (this.triggerExecution(key_action)){ 
					// procura por um valor no campo 'key_action'
					for (i = 0; i < _queue.length; i++){
						// Analisa se a key_action está presente
						if (ARICH.helper.json.toObject(_scripts[i]["key_action"]).indexOf(key_action) >= 0){
							// Obtens o itens a serem executados
							_queue_execute = ARICH.helper.hashtable.slice(_queue, {script_id: _scripts[i]["id"]});
							// Informando a quantidade de itens a executar na ordem principal
							_quantity_execute_now_in_order = _queue_execute.length;
							// Informando a quantidade de itens a executar na fila de execução
							_length.queue_execute = _queue_execute.length;


							// Mudando o status dos itens da fila pertencente
							// aos scripts vinculados ao script principal, se houver
							// (adicionando outros itens para execução posterior)
							if (_scripts[i]["script_ids"] !== null){
								var outherScripts = ARICH.helper.json.toObject(_scripts[i]["script_ids"]),
									h;
								for (h = 0; h < outherScripts.length; h++){
									_queue_execute = _queue_execute.concat(ARICH.helper.hashtable.slice(_queue, {script_id: outherScripts[h]}));
								}
								// Informando a quantidade de itens a executar no geral
								_quantity_execute_now = _queue_execute.length;
							}

							// Mudando o status dos itens da fila de execução para "wait" e
							// adiciona a ordem de execução do script
							this.alterQueueExecute({status: "wait"});

							// retornando sucesso
							ret = true;

							// cancelando o FOR, uma vez que a busca do script já terminou
							// isso implica que a fila executa a primeira ocorrência do key_action
							// que encontrar e despresará ourtas
							// TODO: Verificar se isso é bom ou não
							break;
						}
					}
				} else {
					// implementar erro
					_errorInExecution = true;
					console.log("[ARICH.queue.setExecute] A key_action não existe");
				}
			} else {
				// implementar erro
				_errorInExecution = true;
				console.log("[ARICH.queue.setExecute] A fila está bloqueada");
			}
			return ret;
		},	

		// Propriedade que informa se há itens a serem executado na fila (pattern FACATE)
		hasExecute: function(order){
			if (order !== undefined){ // na ordem atual
				_quantity_execute_now_in_order = ARICH.helper.hashtable.count(_queue_execute, {status: "wait", order: order})
				return _quantity_execute_now_in_order > 0;
			} else {
				_quantity_execute_now = ARICH.helper.hashtable.count(_queue_execute, {status: "wait"})
				return _quantity_execute_now > 0;
			}
		},

		// Retorna os elementos da fila de execução 
		// baseado na ordem informada
		getQueueExecute: function(order){
			return ARICH.helper.hashtable.slice(_queue_execute, {order: order});
		},

		// Função para modificar o status dos itens da fila
		alterQueueExecute: function(obj, type, id){
			// Varre a fila modificando para os valores 
			// que foram informados
			
			switch(type){
				case "id":
					// Apenas o item com o ID será modificado
					for (var j = 0; j < _queue_execute.length; j++ ){
						if (_queue_execute[j]["id"] == id){
							for (var item in obj){
								if (_queue_execute[j][item] !== undefined){
									_queue_execute[j][item] = obj[item];
								}
							}
						}
					}			
					break;
				case "order":
					// Apenas o item com o 'order' vazios serão modificados
					for (var j = 0; j < _queue_execute.length; j++ ){
						if (_queue_execute[j]["order"] === null){
							for (var item in obj){
								if (_queue_execute[j][item] !== undefined){
									_queue_execute[j][item] = obj[item];
								}
							}
						}
					}	
					break;
				default:
					// Todos serão modificados
					for (var j = 0; j < _queue_execute.length; j++ ){
						for (var item in obj){
							if (_queue_execute[j][item] !== undefined){
								_queue_execute[j][item] = obj[item];
							}
						}
					}				
					break;
			}
		},

		// Informa a fila de execução que um erro aconteceu 
		errorQueueExecute: function(error_message){
			_errorInExecution = true;
			// TODO: gravar o erro de execução
			console.log("[ARICH.queue.errorQueueExecute] Erro na execução de uma função da fila: " + error_message)
		},


		// Reseta a fila em seu estado original
		resetQueueExecute: function(){
			_queue_execute = [];
			_length.queue_execute = 0;
			_quantity_execute_now = 0;
			_quantity_execute_now_in_order = 0;
			_block = false;
			_errorInExecution = false;
			ARICH.composer.resetOrder();
		},


		errorInExecution: function(){
			return _errorInExecution;
		},

		// Checa se um dado valor está contido
		// em um dos objetos de fila
		triggerExecution: function(value, field){
			var ret = false,
				i;

			if (field !== undefined){
				// procura por um valor no campo informado
				for (i = 0; i < _scripts.length; i++){
					if (ARICH.helper.json.toObject(_scripts[i][field]).indexOf(value) >= 0){
						ret = true;
						break;
					}
				}
			} else {
				// procura por um valor no campo 'key_action'
				for (i = 0; i < _scripts.length; i++){
					if (ARICH.helper.json.toObject(_scripts[i]["key_action"]).indexOf(value) >= 0){
						ret = true;
						break;
					}
				}
			}

			return ret;
		},


		// Função que define o bloqueio da fila para execução
		blocked: function(){
			_block = true;
		},

		// Função que retira o bloqueio da fila para execução
		unblocked: function(){
			_block = false;
		},

		// Função que se há bloqueio da fila para execução
		isBlocked: function(){
			return _block;
		},


		// ============
		// PROPRIEDADES
		// ============

		// TODO: Retirar essas propriedades quando em produção
		queue: _queue,
		queue_execute: _queue_execute,
		quantity_execute_now: _quantity_execute_now,
		quantity_execute_now_in_order: _quantity_execute_now_in_order,
		scripts: _scripts	
	}
}());