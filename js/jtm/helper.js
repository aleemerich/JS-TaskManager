// Obtendo domínio com segurança
var ARICH = ARICH || {};

// Criando módulo Helper
ARICH.helper = {};

// TODO: Separar melhors as entidades
// pŕincipais de tabalho

// ====
// AJAX
// ====

// Funções para requisições assíncronas 
// data: traz conjunto de dados para diversas ações
// id_execute: traz o id de execução, quando executado por fials (opciona)
ARICH.helper.ajax = function(data, id_execute) {
	// Checando se há necessidade de se obter cache
	//data = ARICH.helper.page.getCache(data);

	// Definindo parametros para o AJAX
	var parms = ARICH.helper.resolverPath(data["remote_element"],
		data["remote_action"],
		data["remote_id"],
		data["remote_custon_url"]);
	// TODO: Pensar se aqui será assim mesmo
	var localData = typeof(data["remote_data"]) != "undefined" ? jQuery.param(data["remote_data"]) : null;

	// Chamada Ajax
	$.ajax({
		url: parms["url"],
		type: parms["verb"],
		crossDomain: true,
		data: localData
	})
		.fail(
			// TODO: Implementar algum sinal de erro

			function(jqXHR, textStatus, errorThrown) {
				console.log("[ARICH.helper.ajax] Erro: " + errorThrown);
				_returnWithParameters(jqXHR, textStatus, data, id_execute);
			}
	)
		.done(function(data_return, textStatus) {
			// Usando função interna para conseguir usar CLOSURE
			// e repassar informações do momento da chamada
			// TODO: Rever se essa é a melhor forma
			_returnWithParameters(data_return, textStatus, data, id_execute);
		});

	// Função de apoio a ser usada dentro do DONE e FAIL do AJAX

	function _returnWithParameters(data_return, textStatus, data, id_execute) {
		if (textStatus == "success") {
			var callback = eval(data["function_return"]);
			// Faz a análise se a função CALLBACK informada
			// é válida
			if (typeof(callback) != "undefined") {
				// Não importa a função que irá receber os dados (passado
				// via callback), sempre serão informados 3 parâmetros como
				// referência:
				// - DATA_RETURN: Contém os dados detornados pelo AJAX
				// - DATA: Contem os dados da chamada ajax, com os parâmetros
				// iniciais e demais informaçoes para referência
				// - ID_EXECUTE: Contém o ID do item da fila que foi
				// executado. Esse parâmetro é opcional.
				callback(data_return, textStatus, data, id_execute);
			} else {
				// Implementar erro
				console.log("[ARICH.helper.ajax] Sucesso no envio das informações, porem a função de retorno não existe ou não é válida! | function_return = " + data["function_return"]);
			}
		} else {
			// Muda status o item para "erro"
			ARICH.queue.alterQueueExecute({
				status: "fail"
			}, "id", id_execute);

			// Notifica a fila que um erro ocorreu
			ARICH.queue.errorQueueExecute("ID Queue: " + id_execute.toString());

			var callback = eval(data["function_return_error"]);
			// Faz a análise se a função CALLBACK informada é válida

			if (typeof(callback) != "undefined") {
				// Não importa a função que irá receber os dados (passado
				// via callback), sempre serão informados 3 parâmetros como
				// referência:
				// - DATA_RETURN: Contém os dados detornados pelo AJAX
				// - DATA: Contem os dados da chamada ajax, com os parâmetros
				// iniciais e demais informaçoes para referência
				// - ID_EXECUTE: Contém o ID do item da fila que foi
				// executado. Esse parâmetro é opcional.
				callback(data_return, textStatus, data, id_execute);
			} else {
				if (data_return.statusText.trim() == 'Unauthorized') {
					// Volta a fila ao estado inicial
					ARICH.queue.resetQueueExecute();
					// Leva o usuário a tela de autenticação
					ARICH.composer.beforeScript("initialize_login_main");
					// TODO: Falta mensagem de erro de autenticação
				} else {
					ARICH.helper.page.message("Erro ao conectar com o servidor", 'error');
					console.log("[ARICH.helper.ajax] ERRO no retorno, porém a função de para tratar erros não existe! | textStatus = " + textStatus + ' | statusCode = ' + data_return.statusCode());

					// Volta a fila ao estado inicial
					ARICH.queue.resetQueueExecute();

					// Caso esteja com a MODAL aberta, fecha-a. Caso
					// contrário não há erro.
					ARICH.helper.modal.hide();
				}
			}
		}
	}
}

// Função que define PATH a ser chamado
ARICH.helper.resolverPath = function(el, action, id, custon) {
	var path;
	switch (action) {
		case "insert":
			path = {
				url: ARICH.config.get("sys_remote_path") + el + "?company_id=" + ARICH.config.get("company_id") + "&token=" + ARICH.helper.cookie.getCookie(),
				url_method: "post",
				verb: "POST",
			};
			break;
		case "update":
			path = {
				url: ARICH.config.get("sys_remote_path") + el + "/" + id + "?company_id=" + ARICH.config.get("company_id") + "&token=" + ARICH.helper.cookie.getCookie(),
				url_method: "post",
				verb: "PUT"
			};
			break;
		case "delete":
			path = {
				url: ARICH.config.get("sys_remote_path") + el + "/" + id + "?company_id=" + ARICH.config.get("company_id") + "&token=" + ARICH.helper.cookie.getCookie(),
				url_method: "post",
				verb: "DELETE"
			};
			break;
		case "show":
			path = {
				url: ARICH.config.get("sys_remote_path") + el + "/" + id + "?company_id=" + ARICH.config.get("company_id") + "&token=" + ARICH.helper.cookie.getCookie(),
				url_method: "get",
				verb: "GET"
			};
			break;
		case "all":
			path = {
				url: ARICH.config.get("sys_remote_path") + el + "?company_id=" + ARICH.config.get("company_id") + "&token=" + ARICH.helper.cookie.getCookie(),
				url_method: "get",
				verb: "GET"
			};
			break;
		case "custon":
			path = {
				url: ARICH.config.get("sys_remote_path") + custon["url"] + "?company_id=" + ARICH.config.get("company_id") + "&token=" + ARICH.helper.cookie.getCookie(),
				url_method: custon["url_method"],
				verb: custon["verb"]
			};
			break;
	}
	return path;
}

// ====
// PAGE
// ====


// Elemento principal
ARICH.helper.page = {};


// Função para adicionar funcionalidades a elementos
// ATENÇÃO: As funcionalidade que serão adicionadas são eventos DO JQUERY
// e NÃO os eventos do DOCUMENT. Isso muda alguns nomes de evendos como
// por exemplo: ONCLICK passa a ser CLICK, ONMOUSEOVER passa a ser MOUSEOVER
// ATENÇÃO 2: Todo elemento que começar com "_" é considerado um nome de objeto
// e será buscado como "#elemento". Ex: "_btn_elemento" -> "#btn_elemento", 
// "td" -> "td"
// 
// Modelo de objeto a ser passado é um ARRAY de objetos como os abaixo
// obj = [
//{
// 	element: "#nomeElemento",
// 	event: "nomeEvento1 nomeEvento2",
// 	func: "funcao_a_ser_executada"
// }.
//{
// 	element: "#nomeElemento",
// 	event: "nomeEvento1 nomeEvento2",
// 	func: "funcao_a_ser_executada"
// } ]
ARICH.helper.page.setAction = function(obj) {
	var j;
	for (j = 0; j < obj.length; j++) {
		if (obj[j].func === undefined) {
			$(obj[j].element).bind(obj[j].event, ARICH.config.get("func_event_default"));
		} else {
			$(obj[j].element).bind(obj[j].event, eval(obj[j].func));
		}
	}
}

// Função para checar se um enter foi dado (em caso de formulários)
ARICH.helper.page.setKeyEnter = function(obj) {
	if (obj.which == 13) {
		ARICH.helper.page.callCompose(obj);
	}
}


// Função para chamar o COMPOSE com uma KEY_ACTION válida
ARICH.helper.page.callCompose = function(obj) {
	var ValidNode = ARICH.helper.page.getValidNode(obj, "id");
	ARICH.composer.beforeScript(ValidNode["id"]);
}

// Função para EXECUTAR qualquer FUNÇÃO IMEDIATA
ARICH.helper.page.executeJS = function() {
	var i;
	try {
		for (i = 0; i < arguments[0].length; i++) {
			arguments[0][i]();
		}
	} catch (e) {
		// add erro
		console.log("[ARICH.helper.page.executeJS] ERRO ao executar a função = " + arguments[0][i], toString)
	}
}

// Função RECURSIVA que busca a existência de um atributo no nó e, caso
// a função VALUE esteja preenchida, procura um nó com um atributo
// de valor específico.Caso ele não encontre no objeto atual, ela procurará
// nos objetos anteriores (pais)
// TODO: Essa função está com a lógica errada! Para que ela funcione é preciso 
// passar o atributo e o valor, o que não faz muita sentido. Além disso, onde ela
// está funcionando (baseado em ID) faz com que todos IDs sejam iguais ou ela
// não trará o esperado (o que é grave em HTML). Pensar na lógica da func ARICH.helper.page.setCacheIDLayer
ARICH.helper.page.getValidNode = function(node, attr, value) {
	var validNode = ARICH.helper.page.getElement(node);
	if (validNode[attr] == "" && validNode.nodeName != "#document") {
		return ARICH.helper.page.getValidNode(validNode.parentNode, attr, value);
	} else {
		if (value !== undefined && validNode.nodeName != "#document") {
			if (validNode[attr] != value) {
				return ARICH.helper.page.getValidNode(validNode.parentNode, attr, value);
			} else {
				return validNode;
			}
		} else {
			return validNode;
		}
	}
}

// Função para armazenar em cache um ID de registro
ARICH.helper.page.setCacheIDFromTable = function() {
	var node = ARICH.helper.page.getValidNode(this, "id", "row_edit")
	ARICH.helper.cache.insert("row_id", $(node).find("#row_id").val());
}


// Função para armazenar em cache um ID de layer
ARICH.helper.page.setCacheIDLayer = function() {
	ARICH.helper.cache.insert("layer_id", this.value);
}

// Função para obter corretamente
// o retorno de elementos de qualquer navegador
ARICH.helper.page.getElement = function(obj) {
	obj = obj || window.event; //IE
	var targ = obj.target || obj.srcElement; //Outros
	if (typeof(targ) == "undefined") {
		targ = obj; // Objeto direto
	} else {
		if (targ.nodeType == 3) { //bug Safari
			targ = targ.parentNode;
		}
	}
	return targ;
}

// Função para agregar um template a uma
// dada parte da página informada.

ARICH.helper.page.create = function(main_el, data, type) {
	switch (type) {
		case "overwrite":
			$(main_el).html(data);
			break;
		case "before":
			$(main_el).before(data);
			break;
		case "after":
			$(main_el).after(data);
			break;
		default: // append =~ after
			$(main_el).append(data);
			break;
	}
};


// Função para agregar um template a uma
// dada parte da página informada USANDO MUSTACHE.

ARICH.helper.page.createM = function(main_el, temp, data, type) {
	switch (type) {
		case "overwrite":
			$(main_el).html(Mustache.to_html(temp, data));
			break;
		case "before":
			$(main_el).before(Mustache.to_html(temp, data));
			break;
		case "after":
			$(main_el).after(Mustache.to_html(temp, data));
			break;
		default: // append =~ after
			$(main_el).append(Mustache.to_html(temp, data));
			break;
	}
};

/*
Função que coleta as informações da página e submete ao servidor

Modelo:
before_data = [
		{
			element: "layers",
			entity: "layer",
			function_return: null,
			id: null,
			structure: {
				campo1: {
					type: "text",
					validate: "string",
					server_field:"campo1"
				},
				campo2: {
					type: "text",
					validate: "string"
				},
			}
		},
		{
			element: "layers",
			entity: "layer",
			function_return: null,
			id: ##99##,adm.html#
			structure: {
				campo1: {
					type: "text",
					validate: "string",
					server_field:"campo1"
				},
				campo2: {
					type: "text",
					validate: "string",
					server_field:"campo1"
				},
			}
		}];

*/
ARICH.helper.page.sendData = function(before_data, id_execute) {

	// Função de apoio interno para a extração de dados
	// TODO: Verificar se não seria interessante repensar essa função
	//       ou deixá-la externa para outros usos
	function _stractData(field, type) {
		switch (type) {
			case "text":
				return $('#' + field).val();
				break;
			case "date":

				// return $.datepicker.formatDate('yy-mm-dd', $.datepicker.parseDate("dd/mm/yy", $('#'+field).val()));

				// TODO: A forma acima não funcionou devido a limitações de formatação
				// do Mustache. Não fui muito a fundo mas atualmente o sistema encara uma data como texto

				// implementar
				break;
			case "checkbox":
				return $('#' + field).is(":checked");
				break;
			case "cache":
				return ARICH.helper.cache.load(field);
				break;
			case "combobox": 
				// implementar
				break;
			case "botton":
				return $('#' + field).text();
				break;
			case "image":
				// implementar
				break;
			case "file":
				// implementar
				break;
			default:
				// implementar erro
				console.log("[ARICH.helper.page.getData._stractData] Não foi possível achar o tipo de dado informado (type = '" + before_data[i].structure[field].type + "')")
				return "";
				break;
		}
	}

	var i,
		field, // apoio ao for in
		localData = {}; // dados a serem processados

	for (i = 0; i < before_data.length; i++) {

		// Criando uma instância com o nome da entidade para 
		// que se faça a estrutura adequada ao envio de dados
		// para servidor em RAILS
		if (typeof(before_data[i].entity) != "undefined") {
			localData[before_data[i].entity] = {};
			// Varrendo a estrutura de dados para uma coleta
			// de informações de formulário
			for (field in before_data[i].structure) {
				localData[before_data[i].entity][before_data[i].structure[field].server_field] = _stractData(field, before_data[i].structure[field].type);
			}
			// Caso não exista uma entidade, cada item da estrutura será tratado como uma entidade
			// e será enviado dessa forma para o servidor RAILS
		} else {
			// Varrendo a estrutura de dados para uma coleta
			// de informações de formulário
			for (field in before_data[i].structure) {
				localData[before_data[i].structure[field].server_field] = _stractData(field, before_data[i].structure[field].type);
			}
		}

		// Fazendo a chamada AJAX com os parâmetros processados
		ARICH.helper.ajax({
			remote_data: localData,
			remote_element: before_data[i].element,
			remote_action: before_data[i].action,
			remote_id: before_data[i].id,
			function_return: before_data[i].function_return || "ARICH.composer.afterScript",
			function_return_error: before_data[i].function_return_error || "ARICH.helper.page.notifyError"
		}, id_execute);
	}
}

// Função que varre qualquer objeto procurando a referência "##9999##" para 
// procurar no cache do helper e obter o valor verdadeiro
ARICH.helper.page.getCache = function(before_data, id_execute) {
	// Checando o tipo de dado
	if (typeof before_data == 'string') {
		if (before_data.search('##') >= 0) {
			// TODO: Repensar
			// - Não está elegante
			// - E se tiver mais que um ID?
			// - Há como ficar mais ágil?

			var cod = before_data.match(/##\w+##/)[0]; // Obtendo código
			cod = cod.replace(/#/gi, '') // Limpa cod
			var localCache = ARICH.helper.cache.load(cod); // obtém dado do cache
			before_data = before_data.replace(/##\w+##/, localCache); // Substituindo a ref pelo valor do cache
		}
	} else if (before_data instanceof Array) {
		var i;
		for (i = 0; i < before_data.length; i++) {
			before_data[i] = ARICH.helper.page.getCache(before_data[i]);
		}
	} else {
		var item;
		for (item in before_data) {
			if (!((before_data[item] instanceof Number) && (before_data[item] instanceof Date))) {
				before_data[item] = ARICH.helper.page.getCache(before_data[item]);
			}
		}
	}
	return before_data;
}

//Função para tratamento de erro padrão no retorno do AJAX
// TODO: Refatorar esse código para melhorar isso
ARICH.helper.page.notifyError = function(data_return, textStatus, data, id_execute) {
	ARICH.helper.page.message("Um erro ocorreu ao enviar dado para o servidor. Cheque suas conexões com a internet ou seus dados de autenticação.", "error");
	console.log('[ARICH.helper.page.notifyErro] ERRO no retorno do servidor!| ID Queue: ' + id_execute.toString() + ' | textStatus = ' + textStatus);
	// Volta a fila ao estado inicial
	ARICH.queue.resetQueueExecute();

	// Caso esteja com a MODAL aberta, fecha-a. Caso
	// contrário não há erro.
	ARICH.helper.modal.hide();
}

// Função para mensagens em geral no sistema
// TODO: A formatação da mensagem de erro não está boa
// É preciso melhorar e, principalmente, aperfeiçoar
ARICH.helper.page.message = function(text, type) {
	var msg = "";
	switch (type) {
		case 'error':
			msg += '<div class="alert alert-error">';
			msg += '<button type="button" class="close" data-dismiss="alert">×</button>';
			msg += '<strong>Erro!</strong> ' + text;
			msg += '</div>';
			break;
		case 'sucess':
			msg += '<div class="alert alert-success">';
			msg += '<button type="button" class="close" data-dismiss="alert">×</button>';
			msg += '<strong>Sucesso!</strong> ' + text;
			msg += '</div>';
			break;
		case 'info':
			msg += '<div class="alert alert-info">';
			msg += '<button type="button" class="close" data-dismiss="alert">×</button>';
			msg += '<strong>Informativo</strong> ' + text;
			msg += '</div>';
			break;
		default:
			msg += '<div class="alert">';
			msg += '<button type="button" class="close" data-dismiss="alert">×</button>';
			msg += '<strong>Aviso!</strong> ' + text;
			msg += '</div>';
			break;
	}

	// TODO: melhor isso com urgência 
	// 1 - pode haver casos que a fila precise ser limpa
	// 2 - melhorar os casos em que o objeto de mensagem não existe
	if ($('#alert-message').length > 0) {
		$('#alert-message').html(msg);
	} else {
		$('body').html(msg);
	}
}

// Formata o calendário do JqWuery UI para os padrões BR
ARICH.helper.page.date = function(el) {
	$(el).datepicker({

		// TODO: Essa linha foi comentada porque necessita de tratamento
		// ao gravar os dados. Resolver essa questão assim que possível
		//dateFormat: 'dd/mm/yy',

		dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
		dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
		dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
		monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
		monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
		nextText: 'Próximo',
		prevText: 'Anterior',
		minDate: +1
	});
}

// Função para carregar selects que estejam usando o plugin SELECT2
// com os valores retornados de uma chamada de API
ARICH.helper.page.attSelect2 = function(el, arr) {
	$(el).select2("val", arr);
}
// ====
// JSON
// ====


// Elemento principal
ARICH.helper.json = {};

// Função que transforma objetos JS (ou notação explicita)
// em objetos JSON
ARICH.helper.json.toJSON = function(data) {
	var json;
	if (data != "" || typeof(data) != "undefined") {
		json = JSON.stringify(data)
	} else {
		json = "";
		//TODO: Implementar algum sinal de erro
	}
	return json;
}

// Função que tranforma um dado JSON
// em um objeto JS
ARICH.helper.json.toObject = function(data) {
	try {
		if (data !== null) {
			var localData = data.replace(/'/g, "\"") // Tratamento para identação errada 
			return JSON.parse(localData);
		} else {
			return "";
		}
	} catch (e) {
		//TODO: Implementar algum sinal de erro
		console.log("[ARICH.helper.json.toObject] Erro ao executar o PARSE: " + e.message);
	}
}


// ============
// FUSION TABLE
// ============


// Elemento principal
ARICH.helper.fusiontable = {};

// Função que obtém os campos de uma tabela
ARICH.helper.fusiontable.structure = function(table, callback) {
	var url = ["https://www.googleapis.com/fusiontables/v1/tables/"];
	url.push(table);
	url.push("/columns?key=" + ARICH.config.get("google_api_key"));

	var result;
	$.ajax({
		type: 'GET',
		dataType: 'jsonp',
		url: url.join(''),
		success: function(data) {
			callback(data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			ARICH.helper.page.message("Erro na tentativa de obter a estrutura da tabela", "error");
			console.log("[ARICH.helper.fusiontable.structure] Erro obter a estrutura de uma tabela: " + errorThrown)
		}
	});
	return result;
}

// Função que obtém elementos (FEATURES) de um layer e os carregas
// para, na sequência, serem incluídos no mapa padrão fazendo assim
// que o layer seja realmente um elemento geográfico (até então só 
// se tinha o nome no cache, mas não havia nada de elementos)
//
// TODO: Mudar o uso do mapa padrão (hoje é usa hardcode e deve
// ser usado de maneira flexivel para poder se trabalhar com
// vários mapas)
//
// IMPORTANTE: 
// 1 - Essa função retorna um ARRAY de LAYERS
// 2 - O cache só armazena UMA LISTA de layers e não os layers em sí.

ARICH.helper.fusiontable.createLayer = function(layer) {
	// Exibindo modal
	// TODO: Retirar daqui e colocar em fila de execução
	//ARICH.helper.modal.show(["Carregando os dados do layer " + layer.name + ".", "Isso pode demorar dependendo da quantidade de dados."]);


	var strategy = [new OpenLayers.Strategy.Fixed()];
	// Se o layer for tipo de ponto, atribuirá a estratégia de cluster (agrupar)
	// OBS: geometry_type 0 = PONTOS
	if (layer.geometry_type == 0){
		strategy.push(new OpenLayers.Strategy.Cluster({distance: ARICH.config.get("layer_default_cluster_distance"), threshold: ARICH.config.get("layer_default_cluster_threshold")}));
	}

	// Obtendo os elementos do layer
	var lFusion = new OpenLayers.Layer.Vector(layer.name, {
		projection: new OpenLayers.Projection(ARICH.config.get("maps_projection_default")),
		strategies: strategy,
		protocol: new OpenLayers.Protocol.Script({
			url: "https://www.googleapis.com/fusiontables/v1/query",
			params: {
				sql: "select * from " + layer.worktable_name,
				key: ARICH.config.get("google_api_key")
			},
			format: new OpenLayers.Format.GeoJSON({
				ignoreExtraDims: true,
				// ===============================
				// Tratamento dos dados retornados
				// ===============================
				read: function(json) {
					// TODO: URGENTE -> É preciso tirar a função daqui e deixar separado
					// juntamente com o resto abaixo (vide "TODO: RESTO" )
					var row, feature, atts = {}, features = [];
					var cols = json.columns; // Colunas
					for (var i = 0; i < json.rows.length; i++) {
						row = json.rows[i]; // Obtendo uma linha pra processamento
						feature = new OpenLayers.Feature.Vector(); // Criando uma FEATURE em branco
						atts = {}; // Criando um objeto para guardar os atributos
						for (var j = 0; j < row.length; j++) {
							// ----------------------------------
							// Lendo os dados trazidos pelo JSON
							// ----------------------------------
							// Dados geográficos (coluna geometry) são OBJECT quando convertidos
							// outros dados serão tratados como STRINGs
							//
							// TODO: É preciso modificar essa carga de dados para termos
							// também dados do tipo INT, BOOL e etc
							//if (typeof row[j] === "object") {
							if (cols[j] == layer.geometry_field) {
								// É pressuposto, como já dito, que esse dado do tipo
								// OBJECT é um dado geográfico.
								//
								// TODO: Essa suposíção precisa ser garantida pelo sistema
								feature.geometry = this.parseGeometry(row[j].geometry);


								// RASCUNHO: Futura simplificação baseada em zoom
								//feature.geometry_full = jQuery.extend(true, {}, this.parseGeometry(row[j].geometry));
								//feature.data.full_geometry = this.parseGeometry(row[j].geometry);

								// Fazendo a simplificação de vértices
								// TODO: [IMPORTANTE] Essa simplificação é feitas de uma única forma e
								// para qualquer uso do layer daqui pra frente. É importante
								// fazer a lógica de se aplicar essa simplificação de acordo
								// com o ZOOM do layer
								// OBS: Não se pode aplicar simplificação em PONTOS

								//if (layer.geometry_type != 0 && typeof feature.geometry.components != "undefined"){
								//if (layer.geometry_type != 0 && feature.geometry != null){
								//	feature.geometry.components[0] = feature.geometry.components[0].simplify(ARICH.config.get("maps_simplify_factor_default"));
								//}
							} else {
								atts[cols[j]] = row[j]; // carrega dado da coluna
							}
						}
						feature.attributes = atts; // adiciona os atributos coletados na FEATURE

						// Analisa se há geometria da FEATURE, ou seja, se há 
						// alguma mapa real na feature evitando features sem
						// nenhum elemento geográfico
						if (feature.geometry) {
							features.push(feature);
						}
					}

					// TODO: Retirar daqui e colocar em fila de execução
					ARICH.helper.modal.hide();

					return features;
				}
			})
		})
	});

	// TODO: RESTO -> É preciso tirar essas ações daqui e deixar separado
	// juntamente com o resto acima (vide "TODO: IMPORTANTE" )

	// Definindo Estilo do mapa
	// OBS: geometry_type 0 = PONTOS
	if (layer.geometry_type == 0){
		var lStyle = new OpenLayers.Style({
			pointRadius: ARICH.config.get("layer_default_point_radius"),
	        graphicWidth: ARICH.config.get("layer_default_graphic_width"),
			externalGraphic: "${external_grafic}",
			label: "${label}"
		}, {
	        context: {
	        	label: function(feature){ 
					// OBS: geometry_type 0 = PONTOS
					if (layer.label.length > 1){
						if (typeof feature.cluster != "undefined"){
							if (feature.cluster.length > 1){
								return feature.cluster.length; 
							} else {
								return feature.cluster[0].attributes[layer.label]; 
							}
						} else {
							return feature.attributes[layer.label];
						} 
					}
				},
				external_grafic: function(feature){ 
					if (typeof feature.cluster == "undefined"){
						return  layer.external_graphic || ARICH.config.get("layer_default_external_graphic");
					} else {
						return ARICH.config.get("layer_default_cluster_graphic");
					}
				}
			}
		});
		if (layer.label.length > 1){
			lStyle.defaultStyle.labelAlign = ARICH.config.get("layer_labelAlign_default");
			lStyle.defaultStyle.labelOutlineColor = ARICH.config.get("layer_labelOutlineColor_default");
			lStyle.defaultStyle.labelOutlineWidth = ARICH.config.get("layer_labelOutlineWidth_default");
			lStyle.defaultStyle.fontWeight = ARICH.config.get("layer_fontWeight_default");
			lStyle.defaultStyle.fontFamily = ARICH.config.get("layer_fontFamily_default");
			lStyle.defaultStyle.fontSize = ARICH.config.get("layer_fontSize_default");
		}
	} else {
		var lStyle = new OpenLayers.Style();
		lStyle.defaultStyle.fillColor = layer.fill_color || ARICH.config.get("layer_default_fill_color");
		lStyle.defaultStyle.strokeColor = layer.outline_color || ARICH.config.get("layer_default_outline_color");
		lStyle.defaultStyle.fillOpacity = layer.fill_opacity || ARICH.config.get("layer_default_fill_opacity");
		// Definindo estilos para labels, quando se tem definido
		if (layer.label.length > 1){
			lStyle.label = "${label}";
			lStyle.defaultStyle.labelAlign = ARICH.config.get("layer_labelAlign_default");
			lStyle.defaultStyle.labelOutlineColor = ARICH.config.get("layer_labelOutlineColor_default");
			lStyle.defaultStyle.labelOutlineWidth = ARICH.config.get("layer_labelOutlineWidth_default");
			lStyle.defaultStyle.fontWeight = ARICH.config.get("layer_fontWeight_default");
			lStyle.defaultStyle.fontFamily = ARICH.config.get("layer_fontFamily_default");
			lStyle.defaultStyle.fontSize = ARICH.config.get("layer_fontSize_default");
		}
	}


	// Aplicando estilo no layer
	lFusion.styleMap = new OpenLayers.StyleMap({'default': lStyle});

	// Adiciona o ID do OpenLayers no
	// layer que já existe
	layer.ol_id = lFusion.id

	// Atualiza o cache atravé de um update
	// uma vez que esse layer já existe lá
	ARICH.helper.layer.cache.insert(layer);

	// ATRIBUINDO UM CONTROLE DE SELEÇÃO AO VETOR
	// Cheganco se é um layer tipo vetor
	if (lFusion.CLASS_NAME.indexOf("Vector") > 0){
		// Criando um controle de seleção para esse layer
		var select_feature_control = new OpenLayers.Control.SelectFeature(
            lFusion, 
            {
                multiple: false,
                toggle: true
            });
		// Adicionando esse controle ao mapa
		ARICH.helper.maps.defaultMap.addControl(select_feature_control);
		// Ativando o controle
		select_feature_control.activate();
		// Ativando o evento quando a feacture for selecionada
		lFusion.events.register('featureselected', null, ARICH.helper.maps.defaultMap.selectedFeature);
	}


	// Adiciona esse layer graficamente no mapa
	ARICH.helper.maps.defaultMap.addLayer(lFusion);
}


// ============
//     MAPS
// ============


// Elemento principal
ARICH.helper.maps = {};

// Função que prepara o sistema para trabalhar com mapas
// inserindo a referência ao arquivo JS
// IMPORTANTE: Essa referência a um JS interno não pode
// ser na carga de JSs de início porque contem parâmetros
// que só ficam disponíveis depois da carga inicial de JS
// TODO: Verificar se quebrar em CARGA e depois
// caregar o mapa realmente é uma boa ideia.
ARICH.helper.maps.before_initialise = function() {
	// Criando a URL com parâmetros necessários
	var url = ["http://maps.googleapis.com/maps/api/js"];
	url.push("?v=" + ARICH.config.get("google_maps_version"));
	url.push("&sensor=" + ARICH.config.get("google_maps_sensor"));
	url.push("&key=" + ARICH.config.get("google_api_key"));
	url.push("&language=" + ARICH.config.get("google_maps_language"));
	url.push("&callback=ARICH.helper.maps.initialise");

	// Cria elemento e o insere no head da página
	// TODO: Tratar se arquivo está sendo carregado certo
	// via evento de carga do JS
	var file = document.createElement("script");
	file.type = "text/javascript";
	file.src = url.join("");
	document.head.appendChild(file);
}


// Carrega o objeto mapa e exibe ao usuário
ARICH.helper.maps.initialise = function() {
	ARICH.helper.maps.defaultMap = new OpenLayers.Map(ARICH.config.get("element_map_default"), {
		controls: [
			new OpenLayers.Control.Navigation(),
			new OpenLayers.Control.PanZoomBar(),
			//new OpenLayers.Control.LayerSwitcher({'ascending':false}),
			//new OpenLayers.Control.Permalink(),
			new OpenLayers.Control.ScaleLine()//,
			//new OpenLayers.Control.Permalink('permalink'),
			//new OpenLayers.Control.MousePosition(),
			//new OpenLayers.Control.OverviewMap(),
			//new OpenLayers.Control.KeyboardDefaults()
		]
	}); // Cria um objeto de mapa em branco
	var gmap = new OpenLayers.Layer.Google("Google Maps", {
		type: eval(ARICH.config.get("google_maps_default_maptype"))
	}); // Cria um layer para o Google Maps
	ARICH.helper.maps.defaultMap.addLayer(gmap); // Add o layer criado


	// Função para ajustar o nro de vertices via zoom com SIMPLIFY,
	// realizando a operação em todos os mapas do tipo vector

	// ARICH.helper.maps.defaultMap.events.register('zoomend', null, (function(e){
	//     --> A FAZER
	// 	}
	// ));


	// Deslocando mapa principal para o local configurado
	ARICH.helper.maps.defaultMap.setCenter((new OpenLayers.LonLat(ARICH.config.get("google_maps_default_location_y"), ARICH.config.get("google_maps_default_location_x"))).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), ARICH.config.get("google_maps_default_zoom")); // movendo o mapa (zoom máximo é de 15)

	// Função chamada quando se clica em um elementro de um layer
	ARICH.helper.maps.defaultMap.selectedFeature = function(event){
		// TODO: É preciso deixar isso bem melhor e com
		// a possibilidade do user pegar as info que ele quiser

		// Obtem o layer sistêmico no cache (não o do mapa)
		var layer = ARICH.helper.layer.cache.load(event.feature.layer.id, "ol_id");
		// Texto para exibição
		var text = '';

		// Verifica se a prorp
		if (layer.fields_show){
		    text += "<br>";
		    // Ver todas as features disponíveis
		    // Lembrete: Essas informações em forma de string
		    // no formato "nomeCampo&nomeAmigavel;nomeCampo&nomeAmigavel;"
		    var q1 = layer.fields_show.split(';');
		    // Varrendo a string quebrada, pegando seus elementos
		    for(var i = 0; i < q1.length; i++){
		    	// Quebrando novamente a string para que se consiga obter os 
		    	// valores necessários
		    	var q2 = q1[i].split('&');
		    	// Varrendo os atributos do layer geográfico
		    	// em busca dos campos com permissão de serem exibidos
		    	for(var att in event.feature.attributes){
			    	if (att == q2[0]){
				    	text += "<strong>" + q2[1] + ": </strong>";
				    	text += event.feature.attributes[att] + '<br>';
				    }
			    }
	     	}
		 } else {
		 	// Essa opção existe quando não há campos a serem definidos
		 	text += "Não há dados disponíveis";
		 }

		 // Objeto de exibição a ser apresentado no mapa
	     ARICH.helper.maps.defaultMap.addPopup(new OpenLayers.Popup.FramedCloud(
	            "popup", 
	            new OpenLayers.LonLat(event.feature.geometry.getCentroid().x,event.feature.geometry.getCentroid().y),
	            null,
	            text,
	            null,
	            true
	    ));
	}
}


// =========
//  LAYERS
// =========

// Cria a entidade
ARICH.helper.layer = {}

// Cria uma entidade layers
ARICH.helper.layer.create = function(layers) {
	// TODO: Ver se será útil pra algo
}

// Carrega layers oriundos do servidor
// para o cache local
// OBS: Essa chamada é usada como CALLBACK de
// uma função AJAX que traz os layers
ARICH.helper.layer.load = function(layers) {
	var i,
		len = layers.length;
	for (i = 0; i < len; i++) {
		ARICH.helper.layer.cache.insert(layers[i]);
	}

	// TODO: Com essa ação, o objeto layers ficou
	// com alto acoplamento com a fila de execução
	// então é preciso repensar isso.
	if (arguments[3] !== undefined) {
		// Atualiza o status do item em execução para "ok"
		ARICH.queue.alterQueueExecute({
			status: "ok"
		}, "id", arguments[3]);
	}
}

// Essa ação é disparada quando um usuário clica para ativar ou não um layer
// IMPORTANTE: 
// 1 - Essa função funciona basicamente em função de um cache
//     previamente carregado (em ARICH.helper.layer.load).
// 2 - Os layers carregados passa a existir verdadeiramente dentro
//     do mapa padrão. Antes disso só são nomes no cache
ARICH.helper.layer.visibility = function(id) {
	var iLayer = ARICH.helper.layer.cache.load(parseInt(id)),
		i,
		len = ARICH.helper.maps.defaultMap.layers.length,
		exist = false;

	// Varre mapa com layer ativos para ver se
	// o layer já foi criado no mapa
	for (i = 0; i < len; i++) {
		// Analise se é preciso exibir ou ocultar
		if (ARICH.helper.maps.defaultMap.layers[i].id == iLayer.ol_id) {
			if (ARICH.helper.maps.defaultMap.layers[i].visibility) {
				ARICH.helper.maps.defaultMap.layers[i].setVisibility(false);
			} else {
				// Lembrete: Não se pode usar o método "display" porque
				// ele acaba somente escondendo o layer no zoom atual e
				// se o zoom for mexido, o layer volta a ficar visível
				ARICH.helper.maps.defaultMap.layers[i].setVisibility(true);
			}
			// Não usar => ARICH.helper.maps.defaultMap.layers[i].redraw();
			exist = true;
		}
	}

	// Caso o layer não exista, é criado baseado no cache de layers
	// IMPORTANTE: O cache só armazena UMA LISTA de layers e não os layers em sí.
	if (!exist) {
		// TODO: Mudar para poder carregar dados de FUSION e outros tipos
		ARICH.helper.fusiontable.createLayer(iLayer);
	} else {
		// TODO: Temporário! Ajusta para fechar a MODAL via FILA
		ARICH.helper.modal.hide();
	}
}

// Essa função simplifica a geometria de um layer de maneira genéria,
// ou seja, basta chamá-la, passar o layer a ser simplificado e o fator
// de simplificação que será retornado o layer simplificado
// Importante:
// 		1 -  É obrigatório que as fetaures tenham o atributo GEOMETRY_FULL
// Observações sobre o método SIMPLIFY do OpenLayers
// 1 - Quanto maior o fator, mais simplifica
// 2 - Usar o método em uma feature não altera a feature

ARICH.helper.layer.simplify = function(layer, zoom) {
	// Desenvolver
}


// ==================
// Cache para layers
//
// IMPORTANTE: O cache só armazena UMA LISTA de layers e
// não os layers em sí. Os layers propriamente ditos
// ficam no objeto MAP
// ===================
ARICH.helper.layer.cache = (function() {
	var _cache = [];

	return {
		insert: function(layer) {
			var i,
				update = false;
			// Checa se será um UPDATE ou um INSERT
			// TODO: Rever essa lógica para deixá-la
			// mais enxuta e rápida
			for (i = 0; i < _cache.length; i++) {
				if (_cache[i]["id"] == layer.id) {
					_cache[i] = layer;
					update = true;
				}
			}

			// Se não houver UPDATE, insere
			if (!update) {
				layer.date = new Date();
				layer.ol_id = 0;
				_cache.push(layer);
			}
		},

		load: function(param, field) {
			var ret;
			if (field){
				var obj = {};
				obj[field] = param;
				ret = ARICH.helper.hashtable.find(_cache, obj);
				// TODO: Rever esse ponto. Retornar o primeiro é
				//       mesmo confiável?
			} else {
				ret = ARICH.helper.hashtable.find(_cache, {
					id: param
				});
				// TODO: Rever esse ponto. Retornar o primeiro é
				//       mesmo confiável?
			}
			return ret;
		},

		remove: function(id) {
			_cache = ARICH.helper.hashtable.remove(_cache, "id", id);
		},

		clear: function() {
			_cache = [];
		},

		all: function() {
			return _cache;
		},

		// TODO: Remover quando em produção
		internalCache: _cache
	}
})();

// =========
// HASHTABLE
// =========

// Elemento principal
ARICH.helper.hashtable = {};

// Busca uma linha dentro de uma hash table
ARICH.helper.hashtable.exist = function(obj, conditions, logic) {
	var ret = ARICH.helper.hashtable.slice(obj, conditions, logic)
	return ret.length > 0;
}

// Busca A PRIMEIRA linha dentro de uma hash table
// que satisfez as condições informadas
ARICH.helper.hashtable.find = function(obj, conditions, logic) {
	var ret = ARICH.helper.hashtable.slice(obj, conditions, logic)
	if (ret.length > 0) {
		return ret[0];
	} else {
		return {};
	}
}

// Remove uma linha dentro de uma hash table
// TODO: Permitir passar mais que uma condição
ARICH.helper.hashtable.remove = function(obj, field, value) {
	var new_obj = [],
		i;

	for (i = 0; i < obj.length; i++) {
		if (obj[field] !== undefined) {
			if (obj[i][field] != value) {
				new_obj.push(obj[i]);
			}
		}
	}

	return new_obj;
}

// Conta linhas de uma hash table mediante uma condição
// TODO: Permitir passar mais que uma condição
ARICH.helper.hashtable.count = function(obj, conditions, logic) {
	return ARICH.helper.hashtable.slice(obj, conditions, logic).length;
}

// Obtem um novo conjunto de elementos dentro de uma hash table 
// satisfazendo um ou mais critérios informados
//
// Sintax de uso
//
// ARICH.helper.hashtable.slice(objComAtributos, 
//	{campo1: "valor", campo2: "valor"}, 
//	"and");

ARICH.helper.hashtable.slice = function(obj, conditions, logic) {
	var els = [],
		_logic = logic || "and";

	if (conditions !== null) {
		switch (_logic) {
			case "and":
				// Varre todas as condições informadas
				var condition = "";
				for (condition in conditions) {
					// Vê se a HASHTABLE está com conteúdo
					if (typeof(obj) !== "undefined") {
						// Verifica se uma varredura no obj já foi feita, se não
						// vai partir pra varredura no obj
						if (els.length == 0) {
							var i;
							// percorre toda a tabela
							for (i = 0; i < obj.length; i++) {
								// verifica se é o campo desejado e
								// se é o valor desejado
								if (obj[i][condition] == conditions[condition]) {
									// insere elemento para retorno
									els.push(obj[i]);
								}
							}

							// Se nenhum registro foi achado é preciso parar
							// porque não interessa se achará no resto, uma vez
							// que um dos critério jão foi rejeitado.
							if (els.length == 0) {
								break;
							}
						}
						// Caso já se tenha feito alguma busca em obj, o filtro deve ser feito 
						// baseado nesses resultados, pois a busca AND é restritiva e não importa
						// se no OBJ tenha o valor a ser procurado no momento porque não daria MATCH
						// com o valor já procurado anteriormente. 
						else {
							var i, new_els = [];
							for (i = 0; i < els.length; i++) {
								if (els[i][condition] == conditions[condition]) {
									new_els.push(els[i]);
								}
							}

							els = new_els;

							// Se nenhum registro foi achado é preciso parar
							// porque não interessa se achará no resto, uma vez
							// que um dos critério jão foi rejeitado.
							if (new_els.length == 0) {
								els = [];
								break;
							}
						}
					} else {
						// implementar erro
						console.log("[ARICH.helper.hashtable.slice] Hash table não informada");
						els = [];
					}
				}
				break;
			case "or":
				// Um novo objeto é criado para guardar o clone do OBJ,
				// dado que elementos serão retirado do objeto
				var new_obj = []

				// Por incrível que pareça, a clonagem por loop é mais rápida
				// vide bentchmark em http://jsperf.com/loop-vs-slice-copy/3
				var j;
				for (j = 0; j < obj.length; j++) {
					new_obj.push(obj[j]);
				}

				if (typeof(obj) !== "undefined") {
					for (var condition in conditions) {
						// Como é uma HASH TABLE, os nomes dos campos são os mesmos
						// em qualquer registro, então podemos usar o primeiro como referência
						var i;
						for (i = 0; i < new_obj.length; i++) {
							if (new_obj[i][condition] == conditions[condition]) {
								// Por incrível que pareça também, apagar por loop é mais rápido
								// vide bentchmark em http://jsperf.com/remove-item-from-array-splice-vs-lodash-without
								var new_new_obj = [];
								for (var j = 0; j = new_obj.length; j++) {
									if (j != i) {
										new_new_obj.push(new_obj[j]);
									}
								}
								new_obj = new_new_obj;
							}
						}
					}
				} else {
					// implementar erro
					console.log("[ARICH.helper.hashtable.slice] Hash table não informada");
					els = [];
				}
				break;
		}
	} else {
		els = obj;
	}
	return els;
};


// ======
// COOKIE
// ======

// Função usada para setar, checar e apagar um cookie
// usando o TYPE como controle de ação
ARICH.helper.cookie = function(obj, type) {
	switch (type) {
		case "set":
			// Checa se o objeto foi retornado completo,
			// caso não, o usuário não se autenticou
			if (typeof(obj) != "undefined") {
				var item;
				for (item in obj) {
					if (obj.hasOwnProperty(item)) {
						$.cookie(item, obj[item], {
							expires: ARICH.config.get("cookie_expirate_day")
						});
					}
				}
				ARICH.helper.cookie.redirect();
			} else {
				// TODO: Prever mensagens no LOGIN
				ARICH.composer.beforeScript("login");
			}
			break;
		case "delete":
			var listCookie = $.cookie(),
				item;
			for (item in listCookie) {
				if (listCookie.hasOwnProperty(item)) {
					$.removeCookie(item);
				}
			}
			// TODO: Prever mensagens no LOGIN
			ARICH.composer.beforeScript("login");
			break;
		default:
			// add erro
			console.log("[ARICH.helper.page.authentication] O tipo de ação informada não existe");
			// TODO: Prever mensagens no LOGIN
			ARICH.composer.beforeScript("login");
			break;
	}
}

// Define um cookie para o usuário (apenas um cookie por domínio é permitido)
ARICH.helper.cookie.setCookie = function(token) {
	ARICH.helper.cookie({
		'token': token
	}, "set");
}

// Obtem um cookie já definido ou uma string em branco, caso não haja nenhum
// TODO: Será que retorna uma string vazia é o melhor?
ARICH.helper.cookie.getCookie = function() {
	return $.cookie('token') || "";
}

// Chama o script de acordo com o ambiente
// TODO: Rever essa metodologia
// porque ta parecendo uma ganbiarra
ARICH.helper.cookie.redirect = function() {
	// Escolhe a interface a ser carregada baseado no 
	// arquivo HTML da URL de requisição
	// TODO: Rever se essa é a melhor forma e
	// não tem problemas com segurança ou estabilidade
	if (window.location.pathname.match(/index-adm/gi) != null) {
		ARICH.composer.beforeScript("initialize_adm_main");
	} else {
		ARICH.composer.beforeScript("initialize_client_main");
	}
}

// Função que retorna um objeto com todos os dados do Cookie
ARICH.helper.cookie.getAllCookie = function() {
	return $.cookie() || "";
}


// =====
// MODAL
// =====

// Elemento principal
ARICH.helper.modal = {};

// Ativando a modal com a opção de informar ou não textos
// a serem mostrados. 
// ATENÇÃO: Esses texto devem ser passados via ARRAY DE STRING
ARICH.helper.modal.show = function(texts) {
	var contentUL = $("<ul/>").addClass("arich-modal-ul");

	if (typeof(texts) !== "undefined") {
		var i,
			len = texts.length;

		for (i = 0; i < len; i++) {
			var contentLI = $("<li/>");
			contentLI.append(texts[i]);
			contentUL.append(contentLI);
		}
	} else {
		contentLI.append("Aguarde por favor.");
		contentUL.append(contentLI);
	}
	$("#dialog-message").html(contentUL);

	// Ativando a modal
	$("#dialog-message").dialog({
		title: ARICH.config.get("modal_title"),
		modal: true,
		closeOnEscape: false,
		draggable: ARICH.config.get("modal_draggable")
	});
	// Retirando o botão para fechar o MODAL
	$("#dialog-message").dialog("widget")
		.find(".ui-dialog-titlebar-close")
		.hide();
}

// Ocultando a modal e limpando-a
ARICH.helper.modal.hide = function() {
	$("#dialog-message").dialog("close");
}


/***************************************************************

						CACHE

Este módulo tem a finalidade de armazenar informações de uso das
páginas, em tempo de execução, para que seja possível o uso da fila
e outras funcionalidades.

Um exemplo seria uma edição de dados onde o usuário clica em um
registro a ser alterado, guarda o ID nesse cache e, posteriormente,
usa esse cache para fazer a ação de edição, obtendo o ID guardado

Sua estrutura de armazenamento é:
- NOME: Identificador do dado para posterior recuperação;
- VALOR: Informação a ser armazenada.
- DATA/HORA: Data e hora do ultimo armazenamento

TODO: Verificar se realmente é necessário armazenar todas essas
informações passadas.

****************************************************************/

// Cache de trabalho
ARICH.helper.cache = (function() {
	var _cache = [];

	return {
		insert: function(name, value) {
			var i,
				item,
				update = false;
			// Checa se será um UPDATE ou um INSERT
			// TODO: Rever essa lógica para deixá-la
			// mais enxuta e rápida
			for (i = 0; i < _cache.length; i++) {
				if (_cache[i]["name"] == name) {
					// Faz o Update
					_cache[i]["value"] = value;
					update = true;
				}
			}

			// Se não houver UPDATE, insere
			if (!update) {
				_cache.push({
					name: name,
					value: value,
					date: new Date()
				});
			}
		},

		load: function(name) {
			var ret = ARICH.helper.hashtable.find(_cache, {
				name: name
			});
		
			// AVISO: A limpeza de cache gera problemas, pois há dados que
			// precisam serem persistidos mais que em mais que uma chamada.
			// Contudo deixar o cache não é tão ruim porque ele não duplica
			// as chaves armazenadas, apenas sobrescreve.
			// this.remove(name); 
			
			return ret.value;
		},

		remove: function(name) {
			_cache = ARICH.helper.hashtable.remove(_cache, "name", name);
		},

		clear: function() {
			_cache = [];
		},

		// TODO: Remover quando em produção
		internalCache: _cache
	}
})();

// Rascunhos

// ==> Um modo de conseguir capturar o click no mapa
// ==> mas preciso conseguir passar pelos layers e ver quais features
// ==> pegam (algo que não tem tão trivial quando pensei)
// var controle = new OpenLayers.Control.Navigation({
// 	defaultClick: function(el){
// 		console.log("Um clique foi dado no mapa");
// 	}
// });
// ARICH.helper.maps.defaultMap.addControl(controle);



// ==> Fornece lista de nomes APENAS dos layers tipo VECTOR
// ARICH.helper.maps.defaultMap.getVectorLayersName = function() {
// 	var i, 
// 		names = [],
// 		len = ARICH.helper.maps.defaultMap.layers.length;
	
// 	for (i=0; i<len; i++){
// 		if (ARICH.helper.maps.defaultMap.layers[i].CLASS_NAME.indexOf("Vector") > 0){
// 			names.push(ARICH.helper.maps.defaultMap.layers[i].name);
// 		}
// 	}
// 	return names;
// }

// ==> Criando um filtro no ARRAY nativamente
// ARICH.helper.maps.defaultMap.layers.filter(function(els){
// 	if (els.CLASS_NAME.indexOf("Vector") > 0) { return true; }
// 	return false;
// })

// ===> Lê apenas o que se quer dentro de um OBJ
// No caso abaixo, além de ler o obj que queria, tb excluia ele
// ARICH.helper.cache.load("defaultControl")){
// 	ARICH.helper.maps.defaultMap.removeControl(obj);
// }



//RASCUNHO PRA DEBUG
//     factor = (zoom * 0.0005);

//     if (layer.features.length > 0){
//         var tempFeatures = jQuery.extend(true, [], layer.features);
//         layer.removeAllFeatures();

//         for (k = 0; k < tempFeatures.length; k++){
//             if ($.inArray('OpenLayers.Geometry.LinearRing', tempFeatures[k].geometry_full.componentTypes) >= 0){
//                 for (j = 0; j < tempFeatures[k].geometry_full.components.length; j++){
//                     if (tempFeatures[k].geometry_full.components[j].CLASS_NAME == "OpenLayers.Geometry.LinearRing"){
//                         tempFeatures[k].geometry.components[j] = tempFeatures[k].geometry_full.components[j].simplify(factor);
//                     }
//                 }
//             } else { console.log("Layer: " + layer.name + ", Feature: " + i + " não contem tipo OpenLayers.Geometry.LinearRing"); }
//         }
//         //layer.removeFeatures(layer.features[i]); 
//         //layer.removeAllFeatures();
//         layer.addFeatures(tempFeatures);
//     }












// //ARICH.helper.maps.defaultMap.layers[1].refresh()
// var factor = 1100.0;
// var layer = ARICH.helper.maps.defaultMap.layers[1]
// //layer.refresh()
// //var tempFeatures = jQuery.extend(true, [], layer.features);
// var tempFeatures = layer.features;
// layer.removeAllFeatures();//layer.features);
// //console.log(factor);
// //console.log(tempFeatures[1].geometry.components[0].components.length + '(1)');
// //var aux = jQuery.extend(true, [], tempFeatures[1].geometry_full.components[0].simplify(factor));
// //tempFeatures[1].geometry.components[0] = aux;
// //console.log(tempFeatures[1].geometry_full.components[0].components.length + '(full)');
// //console.log(tempFeatures[1].geometry.components[0].components.length + '(2)');
// //console.log(aux.components.length);
// var j,k;
// var qtdeAntes, total = 0, economizada = 0;

// console.log("tempFeatures.length " + tempFeatures.length + " itens");

// for (k = 0; k < tempFeatures.length; k++){
//     if ($.inArray('OpenLayers.Geometry.LinearRing', tempFeatures[k].geometry.componentTypes) >= 0){
//         for (j = 0; j < tempFeatures[k].geometry.components.length; j++){
//             if (tempFeatures[k].geometry.components[j].CLASS_NAME == "OpenLayers.Geometry.LinearRing"){
//                 console.log(tempFeatures[k].geometry.components[j].components.length + ' (antes)['+ k + ',' + j + ']');
//                 qtdeAntes = tempFeatures[k].geometry.components[j].components.length
//                 total = total + qtdeAntes;
//                 //var teste = jQuery.extend(true, {}, tempFeatures[k].geometry.components[j].simplify(factor));
//                 //tempFeatures[k].geometry.components[j] = jQuery.extend(true, {}, tempFeatures[k].geometry.components[j].simplify(factor));
//                 tempFeatures[k].geometry.components[j] = tempFeatures[k].geometry.components[j].simplify(factor);
//                 console.log(tempFeatures[k].geometry.components[j].components.length + ' (depois)['+ k + ',' + j + ']');
//                 economizada = economizada + (qtdeAntes - tempFeatures[k].geometry.components[j].components.length);
//             }
//         }
//     } else { 
//         console.log("Layer: " + layer.name + ", Feature: " + k + " não contem tipo OpenLayers.Geometry.LinearRing"); 
//     }
// }
// console.log("total " + total + " pontos");
// console.log("economizou " + economizada + " pontos");
// console.log("reais " + (total - economizada) + " pontos");
// console.log("% " + (1-(economizada/total)) + " pontos");
// layer.addFeatures(tempFeatures);