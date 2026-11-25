import { RouterProvider } from 'react-router-dom';
import { TextSizeProvider } from './providers/TextSizeProvider';
import { ToastProvider } from './providers/ToastProvider';
import { appRouter } from './router';
import { UpdatePrompt } from './UpdatePrompt';

export function App() {
  return (
    <TextSizeProvider role="student">
      <ToastProvider>
        <RouterProvider router={appRouter} />
        <UpdatePrompt />
      </ToastProvider>
    </TextSizeProvider>
  );
}
