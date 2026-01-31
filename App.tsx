
import React, { useState, useEffect, useCallback } from 'react';
import { EnglishQuestion, AppState } from './types.ts';
import { generateDailyQuestion, generateQuestionAudio } from './services/geminiService.ts';
import AudioPlayer from './components/AudioPlayer.tsx';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    loading: true,
    question: null,
    selectedChoice: null,
    isSubmitted: false,
    audioUrl: null,
    error: null,
  });

  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const fetchDailyContent = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const today = new Date().toLocaleDateString('ko-KR');
    
    try {
      const question = await generateDailyQuestion(today);
      setState(prev => ({ ...prev, question }));

      const buffer = await generateQuestionAudio(question);
      setAudioBuffer(buffer);
      setState(prev => ({ ...prev, loading: false }));
    } catch (err: any) {
      console.error("Fetch error details:", err);
      const errorMessage = err.message || "알 수 없는 오류가 발생했습니다.";
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage
      }));
    }
  }, []);

  useEffect(() => {
    fetchDailyContent();
  }, [fetchDailyContent]);

  const handleSelectChoice = (id: number) => {
    if (state.isSubmitted) return;
    setState(prev => ({ ...prev, selectedChoice: id }));
  };

  const handleSubmit = () => {
    if (state.selectedChoice === null) return;
    setState(prev => ({ ...prev, isSubmitted: true }));
  };

  if (state.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative inline-block">
            <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <i className="fa-solid fa-headphones text-blue-600 text-2xl"></i>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">오늘의 문제 생성 중...</h1>
            <p className="text-slate-500 mt-2">AI가 수능형 문제를 만들고 목소리를 입히고 있습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.error || !state.question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-xl w-full space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
              <i className="fa-solid fa-key"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">API 키 설정이 필요합니다</h2>
            <p className="text-slate-600">Vercel 환경 변수에 API 키가 등록되지 않았습니다.</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 space-y-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
              <i className="fa-solid fa-circle-info text-blue-500"></i>
              Vercel에서 해결하는 방법
            </h3>
            
            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-bold">1</span>
                <p>Vercel 프로젝트 페이지에서 <strong>Settings</strong> → <strong>Environment Variables</strong>로 이동하세요.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-bold">2</span>
                <p>Key에 <code className="bg-slate-100 px-1 rounded text-red-600 font-bold">API_KEY</code>를 입력하세요.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 font-bold">3</span>
                <p>Value에 본인의 Gemini API 키를 넣고 <strong>Add</strong>를 누르세요.</p>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0 font-bold">!</span>
                <p className="font-semibold text-amber-700">마지막으로 Deployments 메뉴에서 'Redeploy'를 해야 적용됩니다.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold text-center hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-external-link text-xs"></i>
                Gemini API 키 발급받기
              </a>
              <button 
                onClick={fetchDailyContent}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform active:scale-[0.98]"
              >
                설정 완료 후 다시 시도하기
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-slate-400 font-mono">Error Log: {state.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { question, selectedChoice, isSubmitted } = state;
  const isCorrect = selectedChoice === question.correctAnswer;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800 leading-none">Daily G3 Listening</h1>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{question.date}</p>
            </div>
          </div>
          <div className="text-sm font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
            고3 수능 대비
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-700 font-semibold mb-2">
              <i className="fa-solid fa-volume-high text-blue-500"></i>
              <span>지문을 잘 듣고 정답을 고르세요</span>
            </div>
            <AudioPlayer audioBuffer={audioBuffer} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 leading-snug">
                <span className="text-blue-600 mr-2">Q.</span>
                {question.question}
              </h2>

              <div className="space-y-3">
                {question.choices.map((choice) => (
                  <button
                    key={choice.id}
                    disabled={isSubmitted}
                    onClick={() => handleSelectChoice(choice.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                      isSubmitted 
                        ? choice.id === question.correctAnswer
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : choice.id === selectedChoice
                            ? 'bg-red-50 border-red-500 text-red-700'
                            : 'bg-white border-slate-100 text-slate-400'
                        : selectedChoice === choice.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-md'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      isSubmitted && choice.id === question.correctAnswer
                        ? 'bg-green-500 text-white'
                        : isSubmitted && choice.id === selectedChoice
                          ? 'bg-red-500 text-white'
                          : selectedChoice === choice.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                    }`}>
                      {choice.id}
                    </span>
                    <span className="flex-grow font-medium">{choice.text}</span>
                    {isSubmitted && choice.id === question.correctAnswer && (
                      <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
                    )}
                    {isSubmitted && choice.id === selectedChoice && choice.id !== question.correctAnswer && (
                      <i className="fa-solid fa-circle-xmark text-red-500 text-xl"></i>
                    )}
                  </button>
                ))}
              </div>

              {!isSubmitted && (
                <button
                  onClick={handleSubmit}
                  disabled={selectedChoice === null}
                  className="w-full mt-8 py-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                >
                  정답 제출하기
                </button>
              )}
            </div>
          </div>

          {isSubmitted && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-12">
              <div className={`p-6 rounded-2xl border-l-8 ${isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <i className={`fa-solid ${isCorrect ? 'fa-face-laugh-beam text-green-600' : 'fa-face-sad-tear text-red-600'} text-3xl`}></i>
                  <h3 className={`text-xl font-bold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {isCorrect ? '정답입니다!' : '아쉽네요, 다시 한 번 확인해 보세요.'}
                  </h3>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {question.explanation}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-file-lines text-blue-500"></i>
                    English Transcript
                  </h4>
                  <div className="space-y-3 text-slate-600 leading-relaxed text-sm h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {question.dialogue.map((turn, i) => (
                      <p key={i}>
                        <strong className="text-slate-800">{turn.speaker}:</strong> {turn.text}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <i className="fa-solid fa-language text-blue-500"></i>
                    Full Script
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-sm italic h-64 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap">
                    {question.transcript}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-arrow-rotate-right"></i>
                내일 다시 도전하기
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="py-8 border-t border-slate-200 text-center text-slate-400 text-xs">
        <p>© 2024 Daily G3 English Listening Challenge. Powered by Gemini AI.</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;
