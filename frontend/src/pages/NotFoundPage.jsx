import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-secondary-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-secondary-600">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or doesn't exist.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </Link>

          <div className="text-center">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>

        <div className="mt-12 text-sm text-secondary-500">
          <p>
            Need help? <Link to="/dashboard" className="text-primary-600 hover:text-primary-700">Contact support</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
