import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { boardApi } from '../services/api'
import { useAuthStore } from '../stores/authStore'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { CreateBoardModal } from '../components/modals/CreateBoardModal'
import { MainLayout } from '../components/layout/MainLayout'
import { Plus, Calendar, Users, Clock } from 'lucide-react'

export const DashboardPage = () => {
  const { user } = useAuthStore()
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false)

  const { data: boards, isLoading, error } = useQuery('boards', boardApi.getBoards, {
    retry: 1,
  })

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-secondary-900 mb-2">
              Error loading boards
            </h2>
            <p className="text-secondary-600">{error.message}</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Your Boards</h1>
          <p className="text-secondary-600">
            Manage your projects and collaborate with your team
          </p>
        </div>

        {/* Create Board Button */}
        <div className="mb-6">
          <button 
            onClick={() => setIsCreateBoardModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Board
          </button>
        </div>

        {/* Boards Grid */}
        {boards?.data?.boards?.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <Calendar className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-secondary-900 mb-2">
                No boards yet
              </h3>
              <p className="text-secondary-600 mb-6">
                Get started by creating your first board to organize your projects.
              </p>
              <button 
                onClick={() => setIsCreateBoardModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Board
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boards?.data?.boards?.map((board) => (
              <Link
                key={board.id}
                to={`/board/${board.id}`}
                className="block bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-secondary-900 truncate">
                    {board.title}
                  </h3>
                  <div className="flex-shrink-0 ml-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: board.color || '#3B82F6' }}
                    />
                  </div>
                </div>

                {board.description && (
                  <p className="text-secondary-600 text-sm mb-4 line-clamp-2">
                    {board.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-secondary-500">
                  <div className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    <span>{board.memberCount || 0} members</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>
                      {new Date(board.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Board Modal */}
        <CreateBoardModal
          isOpen={isCreateBoardModalOpen}
          onClose={() => setIsCreateBoardModalOpen(false)}
        />
      </div>
    </MainLayout>
  )
}
