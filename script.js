document.addEventListener('DOMContentLoaded', function () {
  const produtoInput = document.getElementById('produto');
  const embalagemSelect = document.getElementById('embalagem');
  const valorInput = document.getElementById('valor');
  const mercadoInput = document.getElementById('mercado');
  const lista = document.getElementById('lista');
  const salvarListaBtn = document.getElementById('salvarLista');
  const apagarTudoBtn = document.getElementById('apagarTudo');
  const adicionarBtn = document.getElementById('adicionar');
  const listasContainer = document.getElementById('listasContainer');
  const nomeMercadoAtual = document.getElementById('nomeMercadoAtual');

  // ===== VARIÁVEIS =====
  let produtos = [];
  let indiceEdicao = null; // guarda o índice do item que está sendo editado

  // ============================

  function atualizarLista() {
    lista.innerHTML = '';
    produtos.forEach((p, i) => {
      const row = document.createElement('tr');

      // Se o item tiver a propriedade 'cor' definida, aplicamos estilo inline
      // 'cor' pode ser "green" ou "red" (ou null/undefined)
      let tdValor = document.createElement('td');
      tdValor.textContent = p.valor.toFixed(2);
      if (p.cor === 'green') {
        tdValor.classList.add('valor-verde');
      } else if (p.cor === 'red') {
        tdValor.classList.add('valor-vermelho');
      }

      row.innerHTML = `
        <td>${p.nome}</td>
        <td>${p.embalagem}</td>
      `;
      row.appendChild(tdValor);

      // Ao clicar, carrega os dados para edição
      row.addEventListener('click', () => {
        produtoInput.value = p.nome;
        embalagemSelect.value = p.embalagem;
        valorInput.value = p.valor.toFixed(2);
        indiceEdicao = i;

        adicionarBtn.textContent = 'Atualizar';
        adicionarBtn.classList.remove('green');
        adicionarBtn.classList.add('orange');

        // remove destaque de outras linhas e adiciona à atual
        document.querySelectorAll('#lista tr').forEach(tr => tr.classList.remove('editando'));
        row.classList.add('editando');
      });

      lista.appendChild(row);
    });
  }

  function atualizarNomeMercado() {
    const nome = mercadoInput.value.trim();
    nomeMercadoAtual.textContent = nome ? `— ${nome}` : '';
  }

  // Ao clicar em Adicionar / Atualizar
  adicionarBtn.addEventListener('click', () => {
    const nome = produtoInput.value.trim();
    const embalagem = embalagemSelect.value;
    const valor = parseFloat(valorInput.value);

    if (!nome || !embalagem || isNaN(valor)) {
      Swal.fire('Preencha todos os campos corretamente!');
      return;
    }

    if (indiceEdicao !== null) {
      // Atualiza item existente — aqui fazemos a comparação entre valor antigo e novo
      const valorAntigo = produtos[indiceEdicao].valor;
      let cor = null;

      if (valor < valorAntigo) cor = 'green';   // abaixou
      else if (valor > valorAntigo) cor = 'red'; // aumentou
      else cor = produtos[indiceEdicao].cor || null; // se igual, mantém cor anterior (se houver)

      produtos[indiceEdicao] = { nome, embalagem, valor, cor };
      indiceEdicao = null;
      adicionarBtn.textContent = 'Adicionar';
      adicionarBtn.classList.remove('orange');
      adicionarBtn.classList.add('green');
    } else {
      // Novo item, sem cor inicialmente
      produtos.push({ nome, embalagem, valor, cor: null });
    }

    // Limpa inputs
    produtoInput.value = '';
    embalagemSelect.selectedIndex = 0;
    valorInput.value = '';
    atualizarLista();
    document.querySelectorAll('#lista tr').forEach(tr => tr.classList.remove('editando'));
    atualizarNomeMercado();
  });

apagarTudoBtn.addEventListener('click', () => {
  produtos = [];
  atualizarLista();
  mercadoInput.value = '';
  atualizarNomeMercado();

  // Correção para limpar os inputs (se clicou em um item antes)
  produtoInput.value = '';
  embalagemSelect.selectedIndex = 0;
  valorInput.value = '';
  indiceEdicao = null;
  document.querySelectorAll('#lista tr').forEach(tr => tr.classList.remove('editando'));

  adicionarBtn.textContent = 'Adicionar';
  adicionarBtn.classList.remove('orange');
  adicionarBtn.classList.add('green');

  Swal.fire('Lista limpa!');
});

  // SALVAR LISTA (mantemos cores dos itens porque produtos[] já contém 'cor')
  salvarListaBtn.addEventListener('click', () => {
    const mercado = mercadoInput.value.trim();
    if (produtos.length === 0 || !mercado) {
      Swal.fire('Preencha o nome do mercado e adicione produtos!');
      return;
    }

    const data = new Date();
    const dataStr = data.toLocaleString('pt-BR');

    let listasSalvas = JSON.parse(localStorage.getItem('listasDeCompras') || '[]');

    const indiceExistente = listasSalvas.findIndex(
      l => l.mercado.toLowerCase() === mercado.toLowerCase()
    );

    if (indiceExistente >= 0) {
      // substitui produtos e atualiza data — preservamos cores pois produtos[] já contém 'cor'
      listasSalvas[indiceExistente].produtos = produtos;
      listasSalvas[indiceExistente].data = dataStr;
    } else {
      // novo registro
      listasSalvas.push({ mercado, data: dataStr, produtos });
    }

    localStorage.setItem('listasDeCompras', JSON.stringify(listasSalvas));

    // limpa a lista atual (comportamento anterior)
    produtos = [];
    atualizarLista();
    mercadoInput.value = '';
    atualizarNomeMercado();
    renderizarListasSalvas();
    Swal.fire('Lista salva e atualizada com sucesso!');
  });

  function renderizarListasSalvas() {
    const listasSalvas = JSON.parse(localStorage.getItem('listasDeCompras') || '[]');
    listasContainer.innerHTML = '';

    if (listasSalvas.length === 0) {
      listasContainer.innerHTML = '<p class="grey-text">Nenhuma lista salva.</p>';
      return;
    }

    listasSalvas.forEach((listaObj, i) => {
      const div = document.createElement('div');
      div.classList.add('lista-card');

      // Mantemos estrutura original mas adicionamos botão "EXPORTAR TXT" global separado em header (já existe no HTML)
      div.innerHTML = `
        <span class="lista-info">${listaObj.mercado} | ${listaObj.data}</span>
        <div class="lista-botoes">
          <button class="btn green small" onclick="abrirLista(${i})">ABRIR</button>
        </div>
      `;
      listasContainer.appendChild(div);
    });
  }

  // Abrir lista salva — cada item pode ter .cor сохраненное
  window.abrirLista = (index) => {
    const listasSalvas = JSON.parse(localStorage.getItem('listasDeCompras') || '[]');
    const listaSelecionada = listasSalvas[index];
    if (!listaSelecionada) return;

    // produtos da lista selecionada já vêm com { nome, embalagem, valor, cor } (se previamente salvo)
    produtos = listaSelecionada.produtos.map(p => {
      // compatibilidade: se itens salvos antes não tinham 'cor', manter null
      return {
        nome: p.nome,
        embalagem: p.embalagem,
        valor: parseFloat(p.valor),
        cor: p.cor || null
      };
    });

    mercadoInput.value = listaSelecionada.mercado;
    atualizarLista();
    atualizarNomeMercado();
  };

  // Renderiza ao carregar a página
  renderizarListasSalvas();

  // ============================
  // ⭐ ADIÇÃO: Exportar todas as listas para TXT em colunas (usa a mesma chave 'listasDeCompras')
  // Botão #exportarTXT deve existir no HTML (conforme instrução anterior).
  (function ativarExportarTXT() {
    const btn = document.getElementById('exportarTXT');
    if (!btn) return; // não faz nada se botão não existir

    btn.addEventListener('click', function () {
      const listas = JSON.parse(localStorage.getItem('listasDeCompras') || '[]');

      if (!listas || listas.length === 0) {
        Swal.fire('Nenhuma lista salva!', '', 'warning');
        return;
      }

      let conteudo = '=== RELATÓRIO DE LISTAS SALVAS ===\n\n';

      listas.forEach(listaObj => {
        // Cabeçalho na mesma linha
        conteudo += `MERCADO: ${listaObj.mercado}    DATA: ${listaObj.data}\n`;
        conteudo += '------------------------------------------------------\n';

        // Cabeçalho da "tabela"
        conteudo += 'Produto'.padEnd(20) + 'Embalagem'.padEnd(15) + 'Valor (R$).padEnd(15) + '\n';

        // Itens da lista: atenção aos nomes das propriedades (nome, embalagem, valor)
        (listaObj.produtos || []).forEach(item => {
          const nomeProduto = (item.nome || '').toString();
          const embal = (item.embalagem || '').toString();
          const valorStr = (typeof item.valor !== 'undefined') ? parseFloat(item.valor).toFixed(2) : '';

          conteudo += nomeProduto.padEnd(20) + embal.padEnd(15) + valorStr.padEnd(15) + '\n';
        });

        conteudo += '\n==============================================\n\n';
      });

      // Cria e baixa o arquivo
      const blob = new Blob([conteudo], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'listas_salvas.txt';
      a.click();
      URL.revokeObjectURL(url);
    });
  })();

});


