// ErrorPage.tsx
import { Link } from 'react-router-dom';

const ErrorPage = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-4xl font-bold mb-4">404: Page Not Found</h1>
      <h1 className="text-6xl mb-8"> ¯\_(ツ)_/¯</h1>
      <Link 
        to="/" 
        className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
      >
        Go Back Home
      </Link>
    </section>
  );
};

export default ErrorPage;