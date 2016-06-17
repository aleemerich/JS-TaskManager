// Criand domínio
var ARICH = ARICH || {};


ARICH.config = (function() {
	var _params = {};


	return {

		load: function(data) {
			for (var i = 0; i < data.length; i++) {
				ARICH.config.set(data[i]["name"], data[i]["value"]);
			}
		},

		get: function(param) {
			try {
				var result = eval(_params[param]);
				return result;
			} catch (e) {
				//TODO: Implementar algum sinal de erro
				console.log("[ARICH.config.get] Erro ao buscar o valor para o parâmetro '" + param + "'. Erro: " + e.message);
				return null;
			}
		},

		set: function(param, value) {
			var temp = {};
			temp[param] = value
			if (!ARICH.helper.hashtable.exist([_params], temp)) {
				_params[param] = value;
			}
		},

		// TODO: Retirar quando estiver em testes
		params: _params
	}
})();