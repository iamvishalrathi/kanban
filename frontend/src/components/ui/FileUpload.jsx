import { useState, useRef } from 'react'
import { useMutation } from 'react-query'
import { toast } from 'react-hot-toast'
import { 
  Upload, 
  Image, 
  File, 
  X, 
  Check, 
  AlertCircle,
  Camera,
  Paperclip
} from 'lucide-react'
import { LoadingSpinner } from '../ui/LoadingSpinner'

// Generic File Upload Component
export const FileUpload = ({
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  onUpload,
  onRemove,
  currentFile,
  className = '',
  children,
  multiple = false,
  disabled = false
}) => {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFiles = (files) => {
    const fileList = Array.from(files)
    
    // Validate files
    for (const file of fileList) {
      if (file.size > maxSize) {
        toast.error(`File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB`)
        return
      }

      if (accept && !file.type.match(accept.replace('*', '.*'))) {
        toast.error(`File "${file.name}" is not a supported format`)
        return
      }
    }

    setUploading(true)
    onUpload(multiple ? fileList : fileList[0])
      .finally(() => setUploading(false))
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled || uploading) return
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (disabled || uploading) return
    
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleClick = () => {
    if (disabled || uploading) return
    fileInputRef.current?.click()
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg transition-colors cursor-pointer
          ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-secondary-300'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary-400 hover:bg-primary-50'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        {children || (
          <div className="p-6 text-center">
            {uploading ? (
              <div className="flex flex-col items-center">
                <LoadingSpinner className="mb-2" />
                <p className="text-sm text-secondary-600">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-secondary-400 mb-2" />
                <p className="text-sm text-secondary-600 mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-secondary-500">
                  Max size: {Math.round(maxSize / (1024 * 1024))}MB
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Current File Preview */}
      {currentFile && onRemove && (
        <div className="mt-3 flex items-center justify-between p-2 bg-secondary-50 rounded-md">
          <div className="flex items-center space-x-2">
            <File className="w-4 h-4 text-secondary-400" />
            <span className="text-sm text-secondary-700">
              {typeof currentFile === 'string' ? 'Current file' : currentFile.name}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// Avatar Upload Component
export const AvatarUpload = ({ 
  currentAvatar, 
  onUpload, 
  onRemove, 
  size = 'lg',
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false)
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  }

  const handleUpload = async (file) => {
    setUploading(true)
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full bg-secondary-200 flex items-center justify-center overflow-hidden`}>
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="w-6 h-6 text-secondary-400" />
          )}
        </div>
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <FileUpload
          accept="image/*"
          maxSize={5 * 1024 * 1024} // 5MB
          onUpload={handleUpload}
          disabled={disabled || uploading}
          className="w-32"
        >
          <div className="p-2 text-center">
            <Camera className="w-4 h-4 text-secondary-400 mx-auto mb-1" />
            <p className="text-xs text-secondary-600">
              {uploading ? 'Uploading...' : 'Change Avatar'}
            </p>
          </div>
        </FileUpload>

        {currentAvatar && onRemove && !uploading && (
          <button
            onClick={onRemove}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Remove Avatar
          </button>
        )}
      </div>
    </div>
  )
}

// Board Background Upload Component
export const BoardBackgroundUpload = ({ 
  currentBackground, 
  onUpload, 
  onRemove, 
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (file) => {
    setUploading(true)
    try {
      await onUpload(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Background Preview */}
      {currentBackground && (
        <div className="relative rounded-lg overflow-hidden h-32 bg-secondary-100">
          <img
            src={currentBackground}
            alt="Board background"
            className="w-full h-full object-cover"
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload Area */}
      <FileUpload
        accept="image/*"
        maxSize={10 * 1024 * 1024} // 10MB
        onUpload={handleUpload}
        disabled={disabled || uploading}
        currentFile={currentBackground}
        onRemove={onRemove}
      >
        <div className="p-6 text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <LoadingSpinner className="mb-2" />
              <p className="text-sm text-secondary-600">Uploading background...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Image className="w-8 h-8 text-secondary-400 mb-2" />
              <p className="text-sm text-secondary-600 mb-1">
                Upload board background
              </p>
              <p className="text-xs text-secondary-500">
                Recommended: 1920x1080px, max 10MB
              </p>
            </div>
          )}
        </div>
      </FileUpload>
    </div>
  )
}

// Card Attachment Upload Component
export const AttachmentUpload = ({ 
  onUpload, 
  existingAttachments = [], 
  onRemoveAttachment,
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (files) => {
    setUploading(true)
    try {
      await onUpload(files)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Existing Attachments */}
      {existingAttachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-secondary-900">Attachments</h4>
          {existingAttachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-secondary-50 rounded-md"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <File className="w-4 h-4 text-secondary-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-secondary-900 truncate">
                    {attachment.filename}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <a
                  href={attachment.url}
                  download={attachment.filename}
                  className="p-1 text-secondary-600 hover:text-secondary-900"
                  title="Download"
                >
                  <Upload className="w-4 h-4" />
                </a>
                {onRemoveAttachment && (
                  <button
                    onClick={() => onRemoveAttachment(attachment.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <FileUpload
        accept="*/*"
        maxSize={25 * 1024 * 1024} // 25MB
        onUpload={handleUpload}
        multiple={true}
        disabled={disabled || uploading}
      >
        <div className="p-4 text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <LoadingSpinner className="mb-2" />
              <p className="text-sm text-secondary-600">Uploading attachments...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Paperclip className="w-6 h-6 text-secondary-400 mb-2" />
              <p className="text-sm text-secondary-600 mb-1">
                Add attachments
              </p>
              <p className="text-xs text-secondary-500">
                Any file type, max 25MB each
              </p>
            </div>
          )}
        </div>
      </FileUpload>
    </div>
  )
}

// Upload Progress Component
export const UploadProgress = ({ progress, filename, onCancel }) => {
  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <File className="w-4 h-4 text-secondary-400" />
          <span className="text-sm font-medium text-secondary-900">{filename}</span>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="w-full bg-secondary-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-secondary-500 mt-1">
        <span>Uploading...</span>
        <span>{progress}%</span>
      </div>
    </div>
  )
}