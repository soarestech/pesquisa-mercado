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

  let produtos = [];
  let indiceEdicao = null; // 🔹 guarda o índice do item que está sendo editado

  function atualizarLista() {
  lista.innerHTML = '';
  produtos.forEach((p, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.nome}</td>
      <td>${p.embalagem}</td>
      <td>${p.valor.toFixed(2)}</td>
    `;

    // 🔹 Ao clicar, carrega os dados para edição
    row.addEventListener('click', () => {
      produtoInput.value = p.nome;
      embalagemSelect.value = p.embalagem;
      valorInput.value = p.valor.toFixed(2);
      indiceEdicao = i;

      adicionarBtn.textContent = 'Atualizar';
      adicionarBtn.classList.remove('green');
      adicionarBtn.classList.add('orange');

      // 🔸 remove destaque de outras linhas
      document.querySelectorAll('#lista tr').forEach(tr => tr.classList.remove('editando'));
      // 🔸 adiciona destaque à linha atual
      row.classList.add('editando');
    });

    lista.appendChild(row);
  });
}

  function atualizarNomeMercado() {
    const nome = mercadoInput.value.trim();
    nomeMercadoAtual.textContent = nome ? `— ${nome}` : '';
  }

  adicionarBtn.addEventListener('click', () => {
    const nome = produtoInput.value.trim();
    const embalagem = embalagemSelect.value;
    const valor = parseFloat(valorInput.value);

    if (!nome || !embalagem || isNaN(valor)) {
      Swal.fire('Preencha todos os campos corretamente!');
      return;
    }

    if (indiceEdicao !== null) {
      // 🔹 Atualiza item existente
      produtos[indiceEdicao] = { nome, embalagem, valor };
      indiceEdicao = null;
      adicionarBtn.textContent = 'Adicionar';
      adicionarBtn.classList.remove('orange');
      adicionarBtn.classList.add('green');
    } else {
      // 🔹 Adiciona novo item
      produtos.push({ nome, embalagem, valor });
    }

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
    indiceEdicao = null;
    adicionarBtn.textContent = 'Adicionar';
    adicionarBtn.classList.remove('orange');
    adicionarBtn.classList.add('green');
    Swal.fire('Lista limpa!');
  });

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
      listasSalvas[indiceExistente].produtos = produtos;
      listasSalvas[indiceExistente].data = dataStr;
    } else {
      listasSalvas.push({ mercado, data: dataStr, produtos });
    }

    localStorage.setItem('listasDeCompras', JSON.stringify(listasSalvas));

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

    listasSalvas.forEach((lista, i) => {
      const div = document.createElement('div');
      div.classList.add('lista-card');
      div.innerHTML = `
        <span class="lista-info">${lista.mercado} | ${lista.data}</span>
        <div class="lista-botoes">
          <button class="btn green small" onclick="abrirLista(${i})">ABRIR</button>
        </div>
      `;
      listasContainer.appendChild(div);
    });
  }

  window.abrirLista = (index) => {
    const listasSalvas = JSON.parse(localStorage.getItem('listasDeCompras') || '[]');
    const listaSelecionada = listasSalvas[index];
    if (!listaSelecionada) return;

    produtos = listaSelecionada.produtos;
    mercadoInput.value = listaSelecionada.mercado;
    atualizarLista();
    atualizarNomeMercado();
  };

  renderizarListasSalvas();
});
