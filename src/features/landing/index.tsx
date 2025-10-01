import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/auth';
import { Button } from '../../components/ui/IntegrationButtons';

export function Landing() {
  const { user } = useAuth();
  const nav = useNavigate();
  const go = () => nav(user ? '/app' : '/login');
  return (
    <div className="bg-white">
      <section className="relative overflow-hidden p-10 md:p-16 min-h-[calc(100vh-56px)] grid grid-cols-1 lg:grid-cols-2 items-center">
        <div className="absolute -right-24 top-10 w-[520px] h-[520px] bg-gradient-to-tr from-indigo-100 to-slate-100 rounded-full blur-2xl" />
        <div className="max-w-3xl relative">
          <h1 className="text-6xl font-extrabold leading-[1.05] tracking-tight mb-4">Weave Your Analytics Strategy</h1>
          <p className="text-slate-700 mb-6 text-lg">Seamlessly integrate your design and analytics platforms to create a robust measurement strategy. Connect your Figma designs with GA4 to track user interactions and optimize your product’s performance.</p>
          <div className="flex gap-3">
            <Button variant="connect" onClick={go}>Crear estrategia de medición →</Button>
          </div>
          <div className="mt-4 text-slate-600 text-sm">
            <a href="#">¿Cómo funciona?</a>
          </div>
        </div>
        <div className="relative hidden lg:block">
          <div className="flex items-center gap-10 justify-center">
            <div className="shadow-xl rounded-full p-6 bg-white">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-10 h-10 text-purple-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.491S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.026-4.49 4.515-4.49c2.489 0 4.515 2.014 4.515 4.49S10.661 24 8.172 24zm.26-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.019 3.019 3.019 3.019-1.355 3.019-3.019-1.354-3.019-3.019-3.019z"/>
                </svg>
              </div>
            </div>
            <div className="shadow-xl rounded-full p-6 bg-white">
              <img src="/landing/logo-steps.svg" alt="Steps" className="w-40 h-40" />
            </div>
            <div className="shadow-xl rounded-full p-6 bg-white">
              <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-10 h-10 text-orange-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
