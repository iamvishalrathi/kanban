import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, Settings, Star, MoreHorizontal } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export const BoardHeader = ({ board }) => {
  const { user } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)

  if (!board) return null

  const isOwner = board.ownerId === user?.id
  const isFavorite = board.isFavorite || false

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-secondary-200 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="flex items-center text-secondary-600 hover:text-secondary-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center space-x-3">
              <div
                className="w-6 h-6 rounded-md flex-shrink-0"
                style={{ backgroundColor: board.color || '#3B82F6' }}
              />
              <h1 className="text-xl font-semibold text-secondary-900 truncate">
                {board.title}
              </h1>
              <button className="text-secondary-400 hover:text-yellow-500">
                <Star className={`w-5 h-5 ${isFavorite ? 'fill-current text-yellow-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Members */}
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-secondary-600" />
              <div className="flex -space-x-2">
                {board.members?.slice(0, 3).map((member) => (
                  <div
                    key={member.id}
                    className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium border-2 border-white"
                    title={`${member.firstName} ${member.lastName}`}
                  >
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                ))}
                {board.members?.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-secondary-300 flex items-center justify-center text-secondary-600 text-sm font-medium border-2 border-white">
                    +{board.members.length - 3}
                  </div>
                )}
              </div>
              <button className="w-8 h-8 rounded-full bg-secondary-100 hover:bg-secondary-200 flex items-center justify-center text-secondary-600">
                +
              </button>
            </div>

            {/* Actions */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-md"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-secondary-200 py-1 z-20">
                  <button className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">
                    Board Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">
                    Add Members
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">
                    Export Board
                  </button>
                  {isOwner && (
                    <>
                      <hr className="my-1 border-secondary-200" />
                      <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        Delete Board
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}
    </header>
  )
}
