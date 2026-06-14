import React, { useEffect, useState } from 'react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/api/supabaseClient';
import { mergeGuestRecentViewedToUser } from '@/shared/lib/recentViewedStorage';

function getAuthErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown Error';
}

export default function ClientLoginPage() {
  const { language } = useLanguageContext();
  const isEnglish = language === 'en';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. 이미 로그인된 유저는 마이페이지로 쫓아내기
  useEffect(() => {
    const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/my', { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  // 2. 이메일 로그인 / 회원가입
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
        if (!email.trim()) {
      setErrorMsg(isEnglish ? 'Please enter your email.' : '이메일을 입력해 주세요.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg(isEnglish ? 'Please enter your password.' : '비밀번호를 입력해 주세요.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg(isEnglish ? 'Password must be at least 6 characters.' : '비밀번호는 6자리 이상 입력해 주세요.');
      return;
    }
    if (!supabase) return;
    
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        const signedUpUserId = data.user?.id ?? data.session?.user?.id ?? "";
        if (signedUpUserId) mergeGuestRecentViewedToUser(signedUpUserId);
        // 이메일 인증이 꺼져있다면 가입 즉시 로그인됨
        navigate('/my', { replace: true });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const signedInUserId = data.user?.id ?? data.session?.user?.id ?? "";
        if (signedInUserId) mergeGuestRecentViewedToUser(signedInUserId);
        navigate('/my', { replace: true });
      }
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setErrorMsg(message === 'Invalid login credentials' 
        ? (isEnglish ? 'Email or password does not match.' : '이메일 또는 비밀번호가 일치하지 않습니다.')
        : message || (isEnglish ? 'An error occurred during authentication.' : '인증 과정에서 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 2-1. 비밀번호 재설정 이메일 발송
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
        setLoading(true);
    setErrorMsg('');

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) throw new Error(isEnglish ? 'Please enter your email.' : '이메일을 입력해주세요.');
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      alert(isEnglish ? 'A password reset link has been sent. Please check your email!' : '비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일함을 확인해주세요!');
      setIsResetMode(false);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setErrorMsg(message || (isEnglish ? 'An error occurred while sending the email.' : '이메일 전송 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 3. 구글 소셜 로그인
  const handleGoogleLogin = async () => {
        setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/my`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) throw error;
    } catch {
      setErrorMsg(isEnglish ? 'An error occurred during Google login.' : '구글 로그인 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 font-sans tracking-tight">
      <div className="absolute left-4 top-4 w-full max-w-md">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-gray-600 transition-colors hover:text-gray-900"
          aria-label={isEnglish ? 'Go back' : '뒤로가기'}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* 상단 듀얼 레이어 원형 이미지 (크기 확대) */}
        <div className="mb-12 flex justify-center">
          <div className="relative">
            {/* 뒤쪽 장식용 베이지색 도형 (우측 상단으로 살짝 어긋나게 배치) */}
            <div className="absolute -top-4 -right-4 h-40 w-40 rounded-full bg-[#F5EBE4] z-0 sm:h-48 sm:w-48" />

            {/* 앞쪽 메인 네일 이미지 */}
            <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-gray-100 shadow-lg z-10 sm:h-48 sm:w-48">
              <img
                src="/quiz/intro-main.jpg"
                alt={isEnglish ? 'Main nail thumbnail' : '네일북 메인 썸네일'}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/200?text=Nailbook";
                }}
              />
            </div>
          </div>
        </div>

        <div className="mb-8 text-center">
          <h2 className="mb-2 text-[24px] font-bold text-gray-900">
            {isResetMode
              ? (isEnglish ? 'Find Password' : '비밀번호 찾기')
              : isSignUp
                ? (isEnglish ? 'Sign up for Gelia ✨' : '네일북 가입하기 ✨')
                : (isEnglish ? 'Welcome!' : '환영합니다!')}
          </h2>
          <p className="text-[14px] text-gray-500">
            {isResetMode
              ? (isEnglish ? 'We will send a reset link to your registered email.' : '가입한 이메일로 재설정 링크를 보내드릴게요.')
              : isSignUp
                ? (isEnglish ? 'Get started easily with your email.' : '간단하게 이메일로 시작해 보세요.')
                : (isEnglish ? 'Find your perfect nail style.' : '나만의 네일 스타일을 찾아보세요.')}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-8 shadow-sm sm:px-8">
            <div className="min-h-[72px] w-full">
              {errorMsg && (
                <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-center text-[13px] font-medium text-red-600">
                  {errorMsg}
                </div>
              )}
            </div>

            <form className="space-y-5" onSubmit={isResetMode ? handleResetPassword : handleEmailAuth}>
                  <div>
                    <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">{isEnglish ? 'Email' : '이메일'}</label>
                    <input
                      type="email"
                      defaultValue={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-[#FF6B00] focus:bg-white focus:ring-1 focus:ring-[#FF6B00] disabled:bg-gray-50"
                      placeholder="you@example.com"
                      disabled={loading}
                    />
                  </div>

                  {!isResetMode && (
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-700">{isEnglish ? 'Password' : '비밀번호'}</label>
                      <input
                        type="password"
                        defaultValue={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-[#FF6B00] focus:bg-white focus:ring-1 focus:ring-[#FF6B00] disabled:bg-gray-50"
                        placeholder={isEnglish ? 'Enter at least 6 characters' : '6자리 이상 입력해주세요'}
                        disabled={loading}
                      />
                      {!isSignUp && !isResetMode && (
                        <div className="mt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setIsResetMode(true);
                              setErrorMsg('');
                            }}
                            className="text-[13px] font-semibold text-gray-600 hover:text-[#FF6B00] transition-colors"
                          >
                            {isEnglish ? 'Forgot Password?' : '비밀번호를 잊으셨나요?'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#FF6B00] px-4 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-[#E66000] disabled:bg-gray-300 shadow-md"
                  >
                    {loading
                      ? (isEnglish ? 'Processing...' : '처리 중...')
                      : isResetMode
                        ? (isEnglish ? 'Send Reset Link' : '재설정 이메일 받기')
                        : isSignUp
                          ? (isEnglish ? 'Sign Up' : '회원가입')
                          : (isEnglish ? 'Log in with Email' : '이메일로 로그인')}
                  </button>

                  {isResetMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false);
                        setErrorMsg('');
                      }}
                      className="w-full text-[13px] font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-900"
                    >
                      {isEnglish ? 'Back' : '뒤로 가기'}
                    </button>
                  )}
            </form>

            {!isResetMode && (
              <>
                <div className="relative my-10">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100" />
                  </div>
                  <div className="relative flex justify-center text-[13px]">
                    <span className="bg-white px-4 font-medium text-gray-400">{isEnglish ? 'OR' : '또는'}</span>
                  </div>
                </div>

                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-[14px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {isEnglish ? 'Continue with Google' : 'Google로 계속하기'}
                </button>

                <div className="mt-8 text-center text-[13px] text-gray-500">
                  {isSignUp
                    ? (isEnglish ? 'Already have an account? ' : '이미 계정이 있으신가요? ')
                    : (isEnglish ? "Don't have an account? " : '아직 계정이 없으신가요? ')}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrorMsg('');
                    }}
                    className="ml-1.5 font-bold text-[#FF6B00] hover:text-[#E66000] transition-colors"
                  >
                    {isSignUp ? (isEnglish ? 'Log In' : '로그인하기') : (isEnglish ? 'Sign Up' : '회원가입하기')}
                  </button>
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );
}
