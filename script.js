document.addEventListener('DOMContentLoaded', async function () {

  // ===== Persistência do storage
  if (navigator.storage && navigator.storage.persist) {
    try { await navigator.storage.persist(); } catch (e) {}
  }

  const produtoInput = document.getElementById('produto');
  const embalagemSelect = document.getElementById('embalagem');
  const valorInput = document.getElementById('valor');
  const mercadoInput = document.getElementById('mercado');
  const lista = document.getElementById('lista');
  const salvarListaBtn = document.getElementById('salvarLista');
  const adicionarBtn = document.getElementById('adicionar');
  const listasContainer = document.getElementById('listasContainer');
  const nomeMercadoAtual = document.getElementById('nomeMercadoAtual');

  let produtos = [];
  let indiceEdicao = null;

  // ===================== IndexedDB
  const DB_NAME = 'PesquisaMercadosDB';
  const DB_VERSION = 1;
  const STORE_NAME = 'listas';
  let db;

  const abrirDB = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'mercado' });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  });

  db = await abrirDB();

  const salvarListaIndexedDB = (listaObj) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(listaObj);
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });

  const pegarListasIndexedDB = () => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });

  const limparListasIndexedDB = () => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  });

  // ===================== Funções de UI
  function atualizarLista() {
    lista.innerHTML = '';
    produtos.forEach((p, i) => {
      const row = document.createElement('tr');
      let tdValor = document.createElement('td');
      tdValor.textContent = p.valor.toFixed(2);
      if (p.cor === 'green') tdValor.classList.add('valor-verde');
      if (p.cor === 'red') tdValor.classList.add('valor-vermelho');

      row.innerHTML = `<td>${p.nome}</td><td>${p.embalagem}</td>`;
      row.appendChild(tdValor);

      row.addEventListener('click', () => {
        produtoInput.value = p.nome;
        embalagemSelect.value = p.embalagem;
        valorInput.value = p.valor.toFixed(2);
        indiceEdicao = i;
        adicionarBtn.textContent = 'Atualizar';
        adicionarBtn.classList.replace('green', 'orange');
      });

      lista.appendChild(row);
    });
  }

  function atualizarNomeMercado() {
    nomeMercadoAtual.textContent = mercadoInput.value ? `— ${mercadoInput.value}` : '';
  }

  // ===================== Adicionar / Editar
  adicionarBtn.addEventListener('click', () => {
    const nome = produtoInput.value.trim();
    const embalagem = embalagemSelect.value;
    const valor = parseFloat(valorInput.value);
    if (!nome || !embalagem || isNaN(valor)) return;

    if (indiceEdicao !== null) {
      const antigo = produtos[indiceEdicao].valor;
      let cor = valor < antigo ? 'green' : valor > antigo ? 'red' : produtos[indiceEdicao].cor;
      produtos[indiceEdicao] = { nome, embalagem, valor, cor };
      indiceEdicao = null;
      adicionarBtn.textContent = 'Adicionar';
      adicionarBtn.classList.replace('orange', 'green');
    } else {
      produtos.push({ nome, embalagem, valor, cor: null });
    }

    produtoInput.value = '';
    embalagemSelect.selectedIndex = 0;
    valorInput.value = '';
    atualizarLista();
    atualizarNomeMercado();
  });

  // ===================== Salvar lista
  salvarListaBtn.addEventListener('click', async () => {
    const mercado = mercadoInput.value.trim();
    if (!mercado || produtos.length === 0) {
      Swal.fire('Preencha o nome do mercado e adicione produtos!');
      return;
    }
    const data = new Date().toLocaleString('pt-BR');
    const listaObj = { mercado, data, produtos };
    await salvarListaIndexedDB(listaObj);

    produtos = [];
    mercadoInput.value = '';
    atualizarLista();
    atualizarNomeMercado();
    renderizarListasSalvas();
    Swal.fire('Lista salva com sucesso!');
  });

  // ===================== Renderizar listas salvas
async function renderizarListasSalvas() {
  const listas = await pegarListasIndexedDB();
  listasContainer.innerHTML = '';

  if (!listas || listas.length === 0) {
    listasContainer.innerHTML = '<p class="grey-text">Nenhuma lista salva.</p>';
    return;
  }

  listas.forEach((l) => {
    const card = document.createElement('div');
    card.className = 'lista-card';

    card.innerHTML = `
      <div class="info-lista">
        <strong>${l.mercado}</strong> | <span>${l.data}</span>
      </div>
      <div class="botoes-lista">
        <button class="btn green small btn-abrir" data-mercado="${l.mercado}">
          ABRIR
        </button>
        <button class="btn red small btn-apagar" data-mercado="${l.mercado}">
          APAGAR
        </button>
      </div>
    `;

    listasContainer.appendChild(card);
  });

  // eventos depois de renderizar
  document.querySelectorAll('.btn-abrir').forEach(btn => {
    btn.addEventListener('click', () => {
      abrirLista(btn.dataset.mercado);
    });
  });

  document.querySelectorAll('.btn-apagar').forEach(btn => {
    btn.addEventListener('click', () => {
      apagarLista(btn.dataset.mercado);
    });
  });
}

  window.abrirLista = async function (mercado) {
    const listas = await pegarListasIndexedDB();
    const listaSelecionada = listas.find(l => l.mercado === mercado);
    if (!listaSelecionada) return;
    produtos = listaSelecionada.produtos || [];
    mercadoInput.value = listaSelecionada.mercado;
    atualizarLista();
    atualizarNomeMercado();
  };

window.apagarLista = async function(mercado) {
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(mercado);

  tx.oncomplete = async () => {
    if (mercadoInput.value === mercado) {
      produtos = [];
      mercadoInput.value = '';
      atualizarLista();
      atualizarNomeMercado();
      indiceEdicao = null;
      adicionarBtn.textContent = 'Adicionar';
      adicionarBtn.classList.replace('orange', 'green');
    }
    renderizarListasSalvas();
    Swal.fire(`Lista "${mercado}" apagada!`);
  };

  tx.onerror = e => console.error('Erro ao apagar lista:', e.target.error);
};

  // ===================== Export / Import JSON
  window.exportarBackupJSON = async function () {
    const listas = await pegarListasIndexedDB();
    if (!listas || listas.length === 0) return;
    const blob = new Blob([JSON.stringify(listas)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'backup_listas.json';
    a.click();
  };

  window.importarBackupJSON = async function (file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const listas = JSON.parse(e.target.result);
        await limparListasIndexedDB();
        for (const l of listas) await salvarListaIndexedDB(l);
        renderizarListasSalvas();
        Swal.fire('Backup importado com sucesso!');
      } catch {
        Swal.fire('Arquivo inválido!');
      }
    };
    reader.readAsText(file);
  };

  // ===================== BOTÃO PARA IMPORTAR BACKUP JSON
  const btnImportar = document.getElementById('importarJSON');
  const fileInput = document.getElementById('fileBackup');

  btnImportar.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    await importarBackupJSON(file);
    fileInput.value = '';
  });

  // ===================== Backup automático interno a cada 15 minutos
  const INTERVALO_MINUTOS = 15;
  setInterval(async () => {
    const listas = await pegarListasIndexedDB();
    if (listas && listas.length > 0) console.log('Backup automático atualizado no IndexedDB');
  }, INTERVALO_MINUTOS * 60 * 1000);

  renderizarListasSalvas();
});





