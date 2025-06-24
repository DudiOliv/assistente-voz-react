import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [comandoVoz, setComandoVoz] = useState('');
  const [acoesElizabet, setAcoesElizabet] = useState([]);
  const [estaOuvindo, setEstaOuvindo] = useState(false);
  const [modoEspera, setModoEspera] = useState(true);
  const [configAberta, setConfigAberta] = useState(false);
  const [wakeWord, setWakeWord] = useState(() => {
    // Carrega do localStorage ou usa 'elizabet' como padrão
    return localStorage.getItem('wakeWord') || 'elizabet';
  });
  
  const recognitionRef = useRef(null);

  // Configura o reconhecimento de voz
  useEffect(() => {
    const configurarReconhecimento = () => {
      if ('webkitSpeechRecognition' in window) {
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => {
          setEstaOuvindo(true);
          adicionarAcao(`Sistema: Ouvindo... Diga "${wakeWord}" para ativar`);
        };

        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Verifica se a wake word foi dita
          if (modoEspera && finalTranscript.toLowerCase().includes(wakeWord.toLowerCase())) {
            setModoEspera(false);
            setComandoVoz(finalTranscript);
            adicionarAcao(`Sistema: Palavra-chave "${wakeWord}" detectada!`);
            return;
          }

          // Processa comandos quando ativo
          if (!modoEspera) {
            setComandoVoz(finalTranscript || interimTranscript);
            
            if (finalTranscript) {
              processarComando(finalTranscript);
              setModoEspera(true);
            }
          }
        };

        recognition.onerror = (event) => {
          console.error('Erro:', event.error);
          if (event.error === 'not-allowed') {
            adicionarAcao('Erro: Permissão para microfone negada');
          }
          setEstaOuvindo(false);
        };

        recognition.onend = () => {
          setEstaOuvindo(false);
          if (recognitionRef.current === recognition) {
            setTimeout(() => recognition.start(), 1000);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();

        return recognition;
      }
      return null;
    };

    const recognition = configurarReconhecimento();

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [wakeWord, modoEspera]);

  const salvarWakeWord = () => {
    const palavra = wakeWord.trim().toLowerCase();
    if (palavra) {
      localStorage.setItem('wakeWord', palavra);
      setWakeWord(palavra);
      setConfigAberta(false);
      adicionarAcao(`Config: Nova palavra-chave definida: "${palavra}"`);
    }
  };

  const processarComando = (comando) => {
    const comandoLimpo = comando.toLowerCase()
      .replace(wakeWord.toLowerCase(), '')
      .trim();
    
    if (!comandoLimpo) {
      adicionarAcao('Assistente: Comando vazio. O que deseja?');
      return;
    }

    adicionarAcao(`Você: ${comandoLimpo}`);

    // Exemplo de comandos
    if (/horas|hora/.test(comandoLimpo)) {
      const agora = new Date();
      adicionarAcao(`Assistente: Agora são ${agora.getHours()}h${agora.getMinutes()}`);
    }
    else if (/youtube|yt/.test(comandoLimpo)) {
      const pesquisa = comandoLimpo.replace(/.*(pesquisar|procurar|tocar)/, '').trim();
      if (pesquisa) {
        adicionarAcao(`Assistente: Pesquisando no YouTube: "${pesquisa}"`);
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(pesquisa)}`, '_blank');
      } else {
        adicionarAcao('Assistente: O que deseja pesquisar no YouTube?');
      }
    }
    else {
      adicionarAcao('Assistente: Comando não reconhecido. Tente "que horas são" ou "pesquisar no YouTube"');
    }
  };

  const adicionarAcao = (acao) => {
    setAcoesElizabet(prev => [...prev, acao]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-purple-400">
            Assistente por Voz
          </h1>
          <button 
            onClick={() => setConfigAberta(!configAberta)}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
          >
            Config
          </button>
        </div>

        {configAberta && (
          <div className="bg-gray-800 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-2">Configurações</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={wakeWord}
                onChange={(e) => setWakeWord(e.target.value)}
                placeholder="Palavra de ativação"
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2"
              />
              <button
                onClick={salvarWakeWord}
                className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded"
              >
                Salvar
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Ex: "alexa", "ok google", "computador"
            </p>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className={`h-5 w-5 rounded-full ${estaOuvindo ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="font-medium">
              {modoEspera ? `Diga "${wakeWord}" para ativar` : 'Ouvindo comandos...'}
            </span>
          </div>
          
          <div className="h-64 overflow-y-auto mb-4 p-4 bg-gray-900 rounded-lg">
            {acoesElizabet.map((acao, i) => (
              <div key={i} className="mb-3 last:mb-0">
                {acao.startsWith('Você:') ? (
                  <p className="text-blue-300">{acao}</p>
                ) : (
                  <p className={acao.startsWith('Assistente:') ? 'text-purple-300' : 'text-gray-400'}>
                    {acao}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Exemplos de comandos:</p>
          <p>"{wakeWord} que horas são"</p>
          <p>"{wakeWord} pesquisar no YouTube gatos engraçados"</p>
        </div>
      </div>
    </div>
  );
}

export default App;