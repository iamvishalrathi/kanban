import { useState } from 'react'
import { Plus, MoreHorizontal } from 'lucide-react'

export const Column = ({ column, onCreateCard, onEditColumn, onDeleteColumn }) => {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="p-3 border-b border-secondary-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-secondary-900">{column.title}</h3>
          <span className="bg-secondary-200 text-secondary-600 text-xs px-2 py-1 rounded-full">
            {column.cards?.length || 0}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onCreateCard}
            className="p-1 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded"
            title="Add card"
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-secondary-200 py-1 z-20">
                <button 
                  onClick={() => {
                    setShowMenu(false)
                    onEditColumn(column)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                >
                  Edit Column
                </button>
                <button 
                  onClick={() => {
                    setShowMenu(false)
                    onCreateCard()
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                >
                  Add Card
                </button>
                <hr className="my-1 border-secondary-200" />
                <button 
                  onClick={() => {
                    setShowMenu(false)
                    onDeleteColumn(column)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete Column
                </button>
              </div>
            )}
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
    </div>
  )
}
