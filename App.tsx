
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
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // 1. Generate Question
      const question = await generateDailyQuestion(today);
      setState(prev => ({ ...prev, question }));

      // 2. Generate Audio
      const buffer = await generateQuestionAudio(question);
      setAudioBuffer(buffer);
      setState(prev => ({ ...prev, loading: false }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: "오늘의 문제를 불러오지 못했습니다. 잠시 후 다시 시도해주세요." 
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
            <p className="text-slate-500 mt-2">AI가 매일 새로운 수능형 듣기 문제를 준비합니다.</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.error || !state.question) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md w-full space-y-4">
          <i className="fa-solid fa-triangle-exclamation text-red-500 text-5xl"></i>
          <h2 className="text-xl font-bold text-slate-800">문제가 발생했습니다</h2>
          <p className="text-slate-600">{state.error}</p>
          <button 
            onClick={fetchDailyContent}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            다시 시도하기
          </button>
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
