"use client"

import { useState, useCallback, useRef } from "react"
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import type { TweetImage } from "@/types/tweet"

interface ImageUploadProps {
  images: TweetImage[]
  onImagesChange: (images: TweetImage[]) => void
  maxImages?: number
  disabled?: boolean
}

export function ImageUpload({ images, onImagesChange, maxImages = 4, disabled = false }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    
    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, GIF, and WebP images are allowed'
    }
    
    return null
  }

  const uploadToS3 = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to upload image')
    }
    
    const data = await response.json()
    return data.url
  }

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    setError(null)
    setUploading(true)
    
    try {
      const newImages: TweetImage[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Check if we've reached the max images limit
        if (images.length + newImages.length >= maxImages) {
          setError(`Maximum ${maxImages} images allowed`)
          break
        }
        
        const validationError = validateFile(file)
        if (validationError) {
          setError(validationError)
          continue
        }
        
        try {
          const url = await uploadToS3(file)
          newImages.push({
            id: `temp-${Date.now()}-${i}`,
            url,
            altText: '',
            order: images.length + newImages.length,
          })
        } catch (uploadError) {
          setError(`Failed to upload ${file.name}: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`)
        }
      }
      
      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages])
      }
    } finally {
      setUploading(false)
    }
  }, [images, maxImages, onImagesChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [disabled, handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFileSelect])

  const removeImage = useCallback((imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId)
    // Reorder remaining images
    const reorderedImages = updatedImages.map((img, index) => ({
      ...img,
      order: index,
    }))
    onImagesChange(reorderedImages)
  }, [images, onImagesChange])

  const updateAltText = useCallback((imageId: string, altText: string) => {
    const updatedImages = images.map(img => 
      img.id === imageId ? { ...img, altText } : img
    )
    onImagesChange(updatedImages)
  }, [images, onImagesChange])

  const canAddMore = images.length < maxImages && !disabled

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <Card 
          className={`border-2 border-dashed transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="p-6">
            <div className="text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop images here, or click to select
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Choose Images'}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Max {maxImages} images, 5MB each. Supports JPEG, PNG, GIF, WebP
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Images ({images.length}/{maxImages})</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {images.map((image) => (
              <Card key={image.id} className="relative group">
                <CardContent className="p-2">
                  <div className="relative aspect-square">
                    <img
                      src={image.url}
                      alt={image.altText || 'Tweet image'}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(image.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <Label htmlFor={`alt-${image.id}`} className="text-xs">
                      Alt text (optional)
                    </Label>
                    <Input
                      id={`alt-${image.id}`}
                      value={image.altText || ''}
                      onChange={(e) => updateAltText(image.id, e.target.value)}
                      placeholder="Describe the image..."
                      className="text-xs h-7"
                      maxLength={1000}
                    />
                    <div className="text-xs text-muted-foreground">
                      {(image.altText || '').length}/1000
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

