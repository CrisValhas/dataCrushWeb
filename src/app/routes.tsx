import { RouteObject } from 'react-router-dom';
import { Providers } from './providers';
// import { Home } from '../features/home';
import { Connect } from '../features/connect';
// import { Mapping } from '../features/mapping';
// Nueva página de Events
import { EventsPage } from '../features/events';
import { DataLayer } from '../features/datalayer';
import { Integrations } from '../features/integrations';
import { Verification } from '../features/verification';
import { FunnelsPage } from '../features/funnels';
import { Dashboard } from '../features/dashboard';
import { ForgotPassword } from '../auth/ForgotPassword';
import { Settings } from '../features/settings';
import { Team } from '../features/team';
import { Projects } from '../features/projects';
import { Login } from '../auth/Login';
import { Register } from '../auth/Register';
import { CallbackGoogle } from '../auth/CallbackGoogle';
import { CallbackFigma } from '../auth/CallbackFigma';
import { Layout } from '../components/layout/Layout';
import { AppShell } from '../components/layout/AppShell';
import { Protected } from './Protected';
import { Landing } from '../features/landing';
import { NotFound } from '../features/notfound';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <Providers>
        <Layout />
      </Providers>
    ),
    children: [
      { index: true, element: <Landing /> },
      // Public pages
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'auth/google/callback', element: <CallbackGoogle /> },
  { path: 'auth/figma/callback', element: <CallbackFigma /> },
  { path: '*', element: <NotFound /> },

      // Protected app
      {
        path: 'app',
        element: <Protected />,
        children: [
          {
            element: <AppShell />,
            children: [
              { index: true, element: <Projects /> },
              // Rutas globales (mantenidas por compatibilidad)
              { path: 'conectar', element: <Connect /> },
              { path: 'datalayer', element: <DataLayer /> },
              { path: 'validacion', element: <Verification /> },
              { path: 'dashboard', element: <Dashboard /> },
              { path: 'settings', element: <Settings /> },
              { path: 'team', element: <Team /> },
              { path: 'projects', element: <Projects /> },
              
              // Rutas específicas por proyecto
              { path: 'project/:projectId/integrations', element: <Integrations /> },
              { path: 'project/:projectId/events', element: <EventsPage /> },
              { path: 'project/:projectId/funnels', element: <FunnelsPage /> },
              
              // Rutas legacy (para compatibilidad)
              { path: 'events', element: <EventsPage /> },
              { path: 'integrations', element: <Integrations /> },
              { path: 'integraciones', element: <Integrations /> },
              { path: 'funnels', element: <FunnelsPage /> },
              
              { path: '*', element: <NotFound /> },
            ],
          },
        ],
      },
    ],
  },
];
