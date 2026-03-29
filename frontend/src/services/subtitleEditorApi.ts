import { SubtitleSegment } from '../types/subtitle'

export interface SubtitleDataResponse {
  segments: SubtitleSegment[]
  total_duration: number
  word_count: number
  segment_count: number
}

export interface SubtitleEditRequest {
  project_id: string
  clip_id: string
  deleted_segments: string[]
}

export interface SubtitleEditResponse {
  success: boolean
  message: string
  edited_video_path?: string
  deleted_duration?: number
  final_duration?: number
}

export interface EditPreviewRequest {
  project_id: string
  clip_id: string
  deleted_segments: string[]
}

export interface EditPreviewResponse {
  success: boolean
  preview_files: string[]
  count: number
}

class SubtitleEditorApi {
  private baseUrl = '/api/v1/subtitle-editor'

  /**
   * Get word-level subtitle data for the clip
   */
  async getClipSubtitles(projectId: string, clipId: string): Promise<SubtitleDataResponse> {
    const response = await fetch(`${this.baseUrl}/${projectId}/clips/${clipId}/subtitles`)
    
    if (!response.ok) {
      throw new Error(`Failed to get subtitle data: ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Edit video clip based on subtitle deletion
   */
  async editClipBySubtitles(
    projectId: string, 
    clipId: string, 
    deletedSegments: string[]
  ): Promise<SubtitleEditResponse> {
    const request: SubtitleEditRequest = {
      project_id: projectId,
      clip_id: clipId,
      deleted_segments: deletedSegments
    }

    const response = await fetch(`${this.baseUrl}/${projectId}/clips/${clipId}/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to edit video: ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get edited video file URL
   */
  getEditedVideoUrl(projectId: string, clipId: string): string {
    return `${this.baseUrl}/${projectId}/clips/${clipId}/edited-video`
  }

  /**
   * Create edit preview segments
   */
  async createEditPreview(
    projectId: string, 
    clipId: string, 
    deletedSegments: string[]
  ): Promise<EditPreviewResponse> {
    const request: EditPreviewRequest = {
      project_id: projectId,
      clip_id: clipId,
      deleted_segments: deletedSegments
    }

    const response = await fetch(`${this.baseUrl}/${projectId}/clips/${clipId}/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to create preview: ${errorText}`)
    }

    return response.json()
  }

  /**
   * Get preview segment file URL
   */
  getPreviewSegmentUrl(projectId: string, clipId: string, segmentId: string): string {
    return `${this.baseUrl}/${projectId}/clips/${clipId}/preview/${segmentId}`
  }

  /**
   * Download edited video
   */
  async downloadEditedVideo(projectId: string, clipId: string, filename?: string): Promise<void> {
    const url = this.getEditedVideoUrl(projectId, clipId)
    
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || `${clipId}_edited.mp4`
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Failed to download edited video:', error)
      throw error
    }
  }

  /**
   * Validate edit operations
   */
  async validateEditOperations(
    projectId: string, 
    clipId: string, 
    deletedSegments: string[]
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // 先获取字幕数据来验证
      const subtitleData = await this.getClipSubtitles(projectId, clipId)
      
      // 检查删除的字幕段是否存在
      const existingIds = new Set(subtitleData.segments.map(seg => seg.id))
      const invalidIds = deletedSegments.filter(id => !existingIds.has(id))
      
      if (invalidIds.length > 0) {
        return {
          valid: false,
          error: `Invalid subtitle segment IDs: ${invalidIds.join(', ')}`
        }
      }

      // 检查删除后是否还有剩余内容
      const remainingSegments = subtitleData.segments.filter(
        seg => !deletedSegments.includes(seg.id)
      )

      if (remainingSegments.length === 0) {
        return {
          valid: false,
          error: 'No content remains after deleting all subtitle segments'
        }
      }

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

export const subtitleEditorApi = new SubtitleEditorApi()
