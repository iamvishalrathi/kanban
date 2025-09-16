import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { templateApi, boardApi } from '../services/api'
import { MainLayout } from '../components/layout/MainLayout'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { toast } from 'react-hot-toast'
import { 
  FileText, 
  Plus, 
  Star, 
  Users, 
  Calendar,
  CheckSquare,
  Search,
  Filter,
  Columns,
  Briefcase,
  Target,
  Zap
} from 'lucide-react'

const getCategoryIcon = (category) => {
  switch (category.toLowerCase()) {
    case 'project management': return Briefcase
    case 'agile': return Zap
    case 'personal': return Users
    case 'team': return Users
    case 'goals': return Target
    default: return FileText
  }
}

export const TemplatesPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const queryClient = useQueryClient()

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery(
    ['templates', selectedCategory, searchTerm],
    () => templateApi.getTemplates({ 
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: searchTerm || undefined 
    })
  )

  // Create board from template mutation
  const createFromTemplateMutation = useMutation(
    ({ templateId, customization }) => 
      boardApi.createFromTemplate(templateId, customization),
    {
      onSuccess: (data) => {
        toast.success('Board created from template successfully!')
        queryClient.invalidateQueries(['boards'])
        // Optionally redirect to the new board
        // navigate(`/board/${data.data.board.id}`)
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create board from template')
      }
    }
  )

  const templates = templatesData?.data?.templates || []
  const categories = templatesData?.data?.categories || [
    'Project Management',
    'Agile',
    'Personal',
    'Team',
    'Goals'
  ]

  const handleCreateFromTemplate = (template) => {
    // You could show a customization modal here
    createFromTemplateMutation.mutate({
      templateId: template.id,
      customization: {
        title: `${template.title} - ${new Date().toLocaleDateString()}`,
        description: template.description
      }
    })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Board Templates</h1>
          <p className="text-secondary-600">
            Get started quickly with pre-built templates for common workflows
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-secondary-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <Template className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              {searchTerm || selectedCategory !== 'all' 
                ? 'No templates found' 
                : 'No templates available'
              }
            </h3>
            <p className="text-secondary-500">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Templates will appear here when available'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const CategoryIcon = getCategoryIcon(template.category)
              
              return (
                <div
                  key={template.id}
                  className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-6 border border-secondary-200"
                >
                  {/* Template Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <CategoryIcon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-secondary-900">
                          {template.title}
                        </h3>
                        <span className="text-sm text-secondary-500">
                          {template.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-yellow-500">
                      <Star className="w-4 h-4 mr-1" />
                      <span className="text-sm">{template.rating || '4.5'}</span>
                    </div>
                  </div>

                  {/* Template Description */}
                  <p className="text-secondary-600 text-sm mb-4 line-clamp-3">
                    {template.description}
                  </p>

                  {/* Template Stats */}
                  <div className="flex items-center justify-between text-sm text-secondary-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Columns className="w-4 h-4 mr-1" />
                        <span>{template.columnsCount || 3} columns</span>
                      </div>
                      <div className="flex items-center">
                        <CheckSquare className="w-4 h-4 mr-1" />
                        <span>{template.cardsCount || 12} cards</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>{template.usageCount || 0} uses</span>
                    </div>
                  </div>

                  {/* Template Preview */}
                  {template.preview && (
                    <div className="mb-4">
                      <img
                        src={template.preview}
                        alt={`${template.title} preview`}
                        className="w-full h-32 object-cover rounded-md bg-secondary-100"
                      />
                    </div>
                  )}

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-secondary-100 text-secondary-600 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="px-2 py-1 bg-secondary-100 text-secondary-600 text-xs rounded-full">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleCreateFromTemplate(template)}
                      disabled={createFromTemplateMutation.isLoading}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createFromTemplateMutation.isLoading ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Use Template
                    </button>
                    
                    <button
                      className="px-3 py-2 border border-secondary-300 text-secondary-600 text-sm font-medium rounded-md hover:bg-secondary-50"
                      title="Preview Template"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Popular Categories */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-secondary-900 mb-6">
            Browse by Category
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => {
              const CategoryIcon = getCategoryIcon(category)
              const categoryCount = templates.filter(t => t.category === category).length
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`p-4 border rounded-lg text-left hover:shadow-md transition-all ${
                    selectedCategory === category
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <CategoryIcon className="w-8 h-8 text-primary-600 mb-2" />
                  <div className="font-medium text-secondary-900">{category}</div>
                  <div className="text-sm text-secondary-500">
                    {categoryCount} template{categoryCount !== 1 ? 's' : ''}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}