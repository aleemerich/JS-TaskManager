// Criand domínio
var ARICH = ARICH || {};

/***************************************************************

						COMPOSER

Este módulo é uma espécie de maetro do sistema, no lado client.

PREMISSAS
---------

Um script é executado quando um gatilho (trigger) é disparado, 
ou seja, quando uma KEY_ACTION enviada consta na fila e está
vinculada a uma função.

Assim que um KEY_ACTION vinculada a um SCRIPT é acionada, 
todas as execuções referente a aquele scritp serão armazenadas
na fila para execução e o início da fila de execução começa.

Há uma ordem pré_definida de execução para cada grupo de linhas
a serem executadas na fila e essa execução segue até a ultima linha
da fila a ser executada.

Quando isso acaba, a fila é limpa e se prepara para outra execução.


FUNÇÕES DE EXECUÇÃO
------------------- 

A KEY_ACTION chamará sempre a função BEFORE SCRIPT, que checará se há
um script a ser executado mediante a KEY informada.

Assim que é verificado a existência para a KEY informada, a fila é carregada
e a função RUM SCRIPT passa a executar todas as ações do nível menor

Quando acaba as execuções do nível menor, a RUM SCRIPT chama a AFTER SCRIPT
que verificará se tudo está pronto para a execução do próximo nível ou se 
já não há mais execuções (limpando a fila)


PADRÃO DE PARÂMETROS
--------------------

Todas as funções que forem executadas pela fila DEVEM ter como padrão inicial
seus parâmetros informados para posteriormente receber parâmetros de retorno
ou algo assim.

Exemplo: Se vou executar uma função que montará uma tela junto com dados de um
uma chamada AJAX de dados do usuário e ja tenho a tela a ser executada, DEVO escrever
a função de modo que ela irá obter os dados que já sei e passarei primeiro pra depois
obter os dados do AJAX.

****************************************************************/

// Criandos módulo
ARICH.composer = {}


// Objeto que conterá a lista com os retornos 
// das atividades atividades assíncronas
ARICH.composer = (function(){
	// Objetos privados
	var _order = 0;

	var _resetOrder = function(){
		_order = 0;
	}

	// Função de PRÉ-EXECUÇÃO - Recebe as tags do navegador, verificar 
	// se é uma tag que demanda ação e realiza outras atividade preparatórias 
	// para então chamar a função de execução
	var _beforeScript = function(key_action, attempts){
		try{
			var _attempts = attempts || 0;
			if (!ARICH.queue.isBlocked()){ // Checa se a fila está bloqueada por estar em execução
				if (ARICH.queue.triggerExecution(key_action)){ // Checa se a key_action existe
					if (ARICH.queue.setExecute(key_action)){ // Informa a key_action para ser executada
						// Bloqueia a fila para execuções extras
						ARICH.queue.blocked();
						// Chama a _rumScript para executar a fila
						_rumScript();
					} else {
						// TODO: Implementar alerta
						console.log("[ARICH.composer._beforeScript] KEY_ACTION informada não conseguiu ser setada para execução | KEY_ACTION = " + key_action);
					}
				} else {
					// TODO: Implementar alerta
					console.log("[ARICH.composer._beforeScript] KEY_ACTION informada não existe | KEY_ACTION = " + key_action);
				}
			} else {
				// Checando se quantidade de tentativas de execução
				// chegaram em um limite pré_definido
				if(_attempts < ARICH.config.get("sys_attempts_beforeExecute")){
					// Aguardando um dado tempo para verificar se a fila está 
					// desbloqueada para execução
					console.log("[ARICH.composer._beforeScript] KEY_ACTION '" + key_action + "' está esperando para execução de outra KEY_ACTION");
					setTimeout(function(){ _beforeScript(key_action, _attempts + 1)}
						, ARICH.config.get("sys_timeout_beforeExecute"));
				} else {
					// TODO: Implementar retorno de erro ou algo assim
					console.log("[ARICH.composer._beforeScript] Limite de tentativas de execução foi excedido | KEY_ACTION = " + key_action);
				}
			}
		} catch(e) { 
			//TODO: Implementar algum sinal de erro
			console.log("[ARICH.composer._beforeScript] Erro geral: " + e.message);
		}
	};

	// Função de EXECUÇÃO - Executa as ações com status WAIT, com a ORDEM enviada.
	var _rumScript = function(){
		try{
			// obtem a lista de execução da ordem atual
			var queue = ARICH.queue.getQueueExecute(_order),
				i
			// varre a lista para executar as funções determinadas
			for (i = 0; i < queue.length; i++){
				try{
					// obtem a função a ser executada
					var func = _discoveryFunctionExecute(queue[i]["function_exec"]);
					var params = [];

					// Valida se há parâmetros a sere usados ou se será deixado
					// a variável PARAMS como um array vazio (padrão)
					if (queue[i]["params"] != undefined)
					{
						// Checando se há necessidade de se obter cache
						var item_bruto  = ARICH.helper.page.getCache(queue[i]["params"]);
						
						// Quebra parâmetros por '|'
						var items = item_bruto.split('|'),
							j;

						// Varre os parâmetros procurando pelas chaves
						// de id identificadas por %%N%% onde N é o numero
						// do id que se deve buscar em cache
						for(j = 0; j < items.length; j++){
							// Se não tem '%%' no início, é um valor absoluto
							if (items[j].search('%%') < 0){
								// TODO: Ver uma forma mais elegante de fazer isso
								params.push(eval(items[j]));
							} else {
								// Se tem '%%', pega o objeto do cache e checa se deve
								// procurar objetos atrelados. Obtem o ID informado e 
								// busca em cache os dados armazenados
								// TODO: Ver uma forma mais elegante de fazer isso
								var newObj = ARICH.composer.cache.load(eval(items[j].match(/[0-9]+/)[0]));
								// Se '.' foi encontrado, então tem a necessidade
								// de obter os objetos filhos
								// ---> ATENÇÃO: Só é permitido passar '%%xxx%%.nome'
								if (items[j].search('[.]') >= 0){
									var subItens = items[j].split('.');
									var h;
									// Inicia em 1 pq o primeiro elemento é o ID do cache ('%%')
									for(h = 1; h < subItens.length; h++){
										newObj = newObj[subItens[h]];
									}
								}
								params.push(newObj);
							}
						}
					}

					// Se a propriedade "remote" estiver preenchida,
					// significa que a função a ser executada terá que fornecer
					// seu ID para referência futura
					if (queue[i]["remote"]){
						// Adiciona o proprio ID como parâmetro
						// para inserir em cache, junto com os dados
						// que serão recebidos, para ser resgatado posteriormente 
						params.push(queue[i]["id"]);
					}

					// Executa a função propriamente dita
					func.apply(null, params);

					// Muda-se o status da fila para OK apenas de ações que
					// NÃO são remotas. Para as remotas, somente muda-se
					// o status depois que elas retornam.
					if (!queue[i]["remote"]){
						// Muda status o item para "ok"
						ARICH.queue.alterQueueExecute({status: "ok"}, "id", queue[i]["id"]);
					}

				} catch(e) {
					// Muda status o item para "erro"
					ARICH.queue.alterQueueExecute({status: "fail"}, "id", queue[i]["id"]);
					// Notifica a fila que um erro ocorreu
					ARICH.queue.errorQueueExecute("ID Queue: " + queue[i].id.toString() + " | " + e.message + " | " + e.name + " | " + e.lineNumber + " | " + e.fileName);
				}
			}
			// Chama a _afterScript para dar continuidade
			_afterScript();
		} catch(e) {
			//TODO: Implementar algum sinal de erro
			console.log("[ARICH.composer._rumScript] Erro geral: " + e.message);
		}
	};

	// Função de PÓS-EXECUÇÃO - utilizada quando há ações remotas, fazendo o papel de
	// carregar os dados em cache e dar manutenção na fila
	var _afterScript = function(){
		try{
			// Se dados estão sendo retornados, é retorno AJAX
			// TODO: Melhorar isso. Será que sempre o argumento
			// com os dados será o primeiro?
			if (arguments[0] !== undefined){
				// Guardando em cache um objeto contendo DATA, METADATA e ID_EXECUÇÃO
				// que será sempre os dados informados pelo AJAX em retornos assíncronos
				ARICH.composer.cache.insert({"data": arguments[0], "status": arguments[1], "metadata": arguments[2], "id_exec": arguments[3]});
				// Atualiza o status do item em execução para "ok"
				ARICH.queue.alterQueueExecute({status: "ok"}, "id", arguments[3]);
			} else {
				// Checa se há erros de execução
				if (!ARICH.queue.errorInExecution()){ 
					// Checa se acabou os steps na ordem atual 
					// (se ainda houver não faz nada)
					if (!ARICH.queue.hasExecute(_order)){ 
						// checa se há steps a serem executados em
						// ordem posterior, se houver...
						if (ARICH.queue.hasExecute(_order + 1)){
							// Passa para a ordem posterior
							_order++;
							// Reinicia a execução
							_rumScript(); 
						} 
						// ... se não houver
						else {
								// Volta a fila ao estado inicial
								// porque não há mais nada a executar
								ARICH.queue.resetQueueExecute(); 
								// limpa o cache
								ARICH.composer.cache.clear();
								// Reseta order
								_order = 0;
							}
					} else { 
						setTimeout(ARICH.composer.afterScript, 1000);
					}
				} 
				// Se há, reseta a fila de execução e finaliza
				else {
					// Implementar
					// - Mostrar erro para o user
					ARICH.helper.page.message("Foi encontrado erros no processo solicitado.", "error");
					console.log("[ARICH.composer._afterScript] Foi encontrado erros na execução da fila");
					// Volta a fila ao estado inicial
					ARICH.queue.resetQueueExecute(); 
					// Limpa o cache
					ARICH.composer.cache.clear();
					// Reseta order
					_order = 0;

					// Caso esteja com a MODAL aberta, fecha-a. Caso
					// contrário não há erro.
					ARICH.helper.modal.hide();
				}
			}
		} catch(e) { 
			//TODO: Implementar algum sinal de erro
			console.log("[ARICH.composer._afterScript] Erro geral: " + e.message);
		}
	};

	// Esta função retorna um objeto Function mediante um string
	// informada. Caso não se consiga descobrir a função baseado
	// na string, null será retornado.
	var _discoveryFunctionExecute = function(value){
		var arr = value.split("."),
			i,
			func = window;

		// Corre o array para checar os nomes
		for(i = 0; i < arr.length; i++){
			// checa se, no nivel de função atual, o nome
			// faz referencia a alto que não esteja indefinido
			// TODO: Restringir a apenas funções?
			if (typeof func[arr[i]] !== "undefined"){
				// a variável de retorno recebe o novo nível
				func = func[arr[i]];
			} else {
				// a variável de retorno fica nula
				func = null;
				// a busca é finalizada porque um dos itens
				// informados está errado
				break;
			}
		}
		return func;
	}


	// API
	return {
		beforeScript: _beforeScript,
		rumScript: _rumScript,
		afterScript: _afterScript,
		resetOrder: _resetOrder
	};
}());

/***************************************************************

						CACHE

Este módulo tem a finalidade de armazenar os retornos assíncronos
da fila para posterior processamento.

Inicialmente está armazenando todas as informações disponíveis:
- DATA: Conjunto de informações retornadas pelo AJAX;
- METADATA: Conjunto de informações iniciais enviada a função
de ajax e que originou a chamada AJAX. Pode ser utilizada para
diversos fins, inclusive auditoria do sistema.
- ID_EXEC: (Opcional) Usado para identificar retorno que foram
chamados por funções em fila de execução. O ID é o identificador
da fila a qual a chamada está gravada.

Os dados devolvidos quando um cache é chamado são apenas os
dados enviados pelo AJAX, as demais informações são armazenadas
para futuras utilizações.

TODO: Verificar se realmente é necessário armazenar todas essas
informações passadas.

****************************************************************/

ARICH.composer.cache = (function(){
	var _cache = [];

	return{
		insert: function(obj){
			_cache.push({data: obj.data, status: obj.status, metadata: obj.metadata, id: obj.id_exec});
		},

		load: function(id){
			var ret = ARICH.helper.hashtable.find(_cache, {id: id});
			// TODO: Remover as informações agora?
			//this.remove(id);
			if (ret !== undefined ){
				return ret.data;
			} else {
				return [];
			}
		},

		remove: function(id){
			_cache = ARICH.helper.hashtable.remove(_cache, "id", id);
		},

		clear: function(){
			_cache = [];
		},

		// TODO: Remover quando em produção
		internalCache: _cache
	}
})();



