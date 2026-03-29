/**
 * Unified status bar component - Replacing the old complex progression system
 * Supports unified display of downloading, processing, completed and other statuses
 */

import React, { useEffect, useState } from 'react'
import { Progress, Space, Typography, Tag } from 'antd'
import { 
  DownloadOutlined, 
  LoadingOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useSimpleProgressStore, getStageDisplayName, getStageColor, isCompleted, isFailed } from '../stores/useSimpleProgressStore'

const { Text } = Typography

interface UnifiedStatusBarProps {
  projectId: string
  status: string
  downloadProgress?: number
  onStatusChange?: (status: string) => void
  onDownloadProgressUpdate?: (progress: number) => void
}

export const UnifiedStatusBar: React.FC<UnifiedStatusBarProps> = ({
  projectId,
  status,
  downloadProgress = 0,
  onStatusChange,
  onDownloadProgressUpdate
}) => {
  const { getProgress, startPolling, stopPolling } = useSimpleProgressStore()
  const [isPolling, setIsPolling] = useState(false)
  const [currentDownloadProgress, setCurrentDownloadProgress] = useState(downloadProgress)
  
  const progress = getProgress(projectId)

  // Determine whether to poll based on status
  useEffect(() => {
    if ((status === 'processing' || status === 'pending') && !isPolling) {
      console.log(`Start polling for processing progress: ${projectId}`)
      startPolling([projectId], 2000)
      setIsPolling(true)
    } else if (status !== 'processing' && status !== 'pending' && isPolling) {
      console.log(`Stop polling for processing progress: ${projectId}`)
      stopPolling()
      setIsPolling(false)
    }

    return () => {
      if (isPolling) {
        console.log(`Cleanup polling: ${projectId}`)
        stopPolling()
        setIsPolling(false)
      }
    }
  }, [status, projectId, isPolling, startPolling, stopPolling])

  // Download progress polling
  useEffect(() => {
    if (status === 'downloading') {
      const pollDownloadProgress = async () => {
        try {
          console.log(`Polling for download progress: ${projectId}`)
          const response = await fetch(`http://localhost:8000/api/v1/projects/${projectId}`)
          if (response.ok) {
            const projectData = await response.json()
            console.log('project data:', projectData)
            const newProgress = projectData.processing_config?.download_progress || 0
            console.log(`Download progress updates: ${newProgress}%`)
            setCurrentDownloadProgress(newProgress)
            onDownloadProgressUpdate?.(newProgress)
            
            // If the download is completed, check whether it needs to switch to processing state
            if (newProgress >= 100) {
              console.log('Download completed, switch to processing state')
              setTimeout(() => {
                onStatusChange?.('processing')
              }, 1000)
            }
          } else {
            console.error('Failed to obtain project data:', response.status, response.statusText)
          }
        } catch (error) {
          console.error('Failed to get download progress:', error)
        }
      }

      // Get it now
      pollDownloadProgress()
      
      // Every2Poll once per second
      const interval = setInterval(pollDownloadProgress, 2000)
      
      return () => clearInterval(interval)
    }
  }, [status, projectId, onDownloadProgressUpdate, onStatusChange])

  // Handling state changes
  useEffect(() => {
    if (progress && onStatusChange) {
      if (isCompleted(progress.stage)) {
        onStatusChange('completed')
      } else if (isFailed(progress.message)) {
        onStatusChange('failed')
      }
    }
  }, [progress, onStatusChange])

  // Importing status
  if (status === 'importing') {
    return (
      <div style={{
        background: 'rgba(255, 193, 7, 0.1)',
        border: '1px solid rgba(255, 193, 7, 0.3)',
        borderRadius: '3px',
        padding: '3px 6px',
        textAlign: 'center',
        width: '100%'
      }}>
        <div style={{ 
          color: '#ffc107',
          fontSize: '11px', 
          fontWeight: 600, 
          lineHeight: '12px'
        }}>
          {Math.round(downloadProgress)}%
        </div>
        <div style={{ 
          color: '#999999', 
          fontSize: '8px', 
          lineHeight: '9px'
        }}>
          Importing
        </div>
      </div>
    )
  }

  // Downloading status
  if (status === 'downloading') {
    return (
      <div style={{
        background: 'rgba(24, 144, 255, 0.1)',
        border: '1px solid rgba(24, 144, 255, 0.3)',
        borderRadius: '3px',
        padding: '3px 6px',
        textAlign: 'center',
        width: '100%'
      }}>
        <div style={{ 
          color: '#1890ff',
          fontSize: '11px', 
          fontWeight: 600, 
          lineHeight: '12px'
        }}>
          {Math.round(currentDownloadProgress)}%
        </div>
        <div style={{ 
          color: '#999999', 
          fontSize: '8px', 
          lineHeight: '9px'
        }}>
          Downloading
        </div>
      </div>
    )
  }

  // Processing status - Use the new simplified progression system
  if (status === 'processing') {
    if (!progress) {
      // Waiting for progress data
      return (
      <div style={{
        background: 'rgba(82, 196, 26, 0.1)',
        border: '1px solid rgba(82, 196, 26, 0.3)',
        borderRadius: '3px',
        padding: '3px 6px',
        textAlign: 'center',
        width: '100%'
      }}>
        <div style={{ 
          color: '#52c41a',
          fontSize: '11px', 
          fontWeight: 600, 
          lineHeight: '12px'
        }}>
          0%
        </div>
        <div style={{ 
          color: '#999999', 
          fontSize: '8px', 
          lineHeight: '9px'
        }}>
          Initializing...
        </div>
      </div>
      )
    }

    const { stage, percent, message } = progress
    const stageDisplayName = getStageDisplayName(stage)
    const stageColor = getStageColor(stage)
    const failed = isFailed(message)

    return (
      <div style={{
        background: failed 
          ? 'rgba(255, 77, 79, 0.1)'
          : 'rgba(82, 196, 26, 0.1)',
        border: failed 
          ? '1px solid rgba(255, 77, 79, 0.3)'
          : '1px solid rgba(82, 196, 26, 0.3)',
        borderRadius: '3px',
        padding: '3px 6px',
        textAlign: 'center',
        width: '100%'
      }}>
        <div style={{ 
          color: failed ? '#ff4d4f' : '#52c41a',
          fontSize: '11px', 
          fontWeight: 600, 
          lineHeight: '12px'
        }}>
          {failed ? '✗ Failed' : `${percent}%`}
        </div>
        <div style={{ 
          color: '#999999', 
          fontSize: '8px', 
          lineHeight: '9px',
          minHeight: '9px' // Make sure the failed state also has a fixed height
        }}>
          {failed ? '' : stageDisplayName}
        </div>
      </div>
    )
  }

  // Completed status
  if (status === 'completed') {
    return (
      <div style={{
        background: 'rgba(82, 196, 26, 0.1)',
        border: '1px solid rgba(82, 196, 26, 0.3)',
        borderRadius: '3px',
        padding: '3px 6px',
        textAlign: 'center',
        width: '100%'
      }}>
        <div style={{ 
          color: '#52c41a',
          fontSize: '11px', 
          fontWeight: 600, 
          lineHeight: '12px'
        }}>
          ✓
        </div>
        <div style={{ 
          color: '#999999', 
          fontSize: '8px', 
          lineHeight: '9px'
        }}>
          Completed
        </div>
      </div>
    )
  }

  // failure status
  if (status === 'failed') {
    return (
      <div style={{
        background: 'rgba(255, 77, 79, 0.1)',
        border: '1px solid rgba(255, 77, 79, 0.3)',
        borderRadius: '3px',
        padding: '3px 6px',
        textAlign: 'center',
        width: '100%'
      }}>
        <div style={{ 
          color: '#ff4d4f',
          fontSize: '11px', 
          fontWeight: 600, 
          lineHeight: '12px'
        }}>
          ✗ Failed
        </div>
        <div style={{ 
          color: '#999999', 
          fontSize: '8px', 
          lineHeight: '9px',
          minHeight: '9px' // Make sure the failed state also has a fixed height
        }}>
          Processing failed
        </div>
      </div>
    )
  }

  // waiting state
  return (
    <div style={{
      background: 'rgba(217, 217, 217, 0.1)',
      border: '1px solid rgba(217, 217, 217, 0.3)',
      borderRadius: '3px',
      padding: '3px 6px',
      textAlign: 'center',
      width: '100%'
    }}>
      <div style={{ 
        color: '#d9d9d9',
        fontSize: '11px', 
        fontWeight: 600, 
        lineHeight: '12px'
      }}>
        ○ Pending
      </div>
      <div style={{ 
        color: '#999999', 
        fontSize: '8px', 
        lineHeight: '9px',
        minHeight: '9px' // Make sure the wait state also has a fixed height
      }}>
        Waiting for processing
      </div>
    </div>
  )
}

// Simplified progress bar component - Used for detailed progress display
interface SimpleProgressDisplayProps {
  projectId: string
  status: string
  showDetails?: boolean
}

export const SimpleProgressDisplay: React.FC<SimpleProgressDisplayProps> = ({
  projectId,
  status,
  showDetails = false
}) => {
  const { getProgress } = useSimpleProgressStore()
  const progress = getProgress(projectId)

  if (status !== 'processing' || !progress || !showDetails) {
    return null
  }

  const { stage, percent, message } = progress
  const stageDisplayName = getStageDisplayName(stage)
  const stageColor = getStageColor(stage)

  return (
    <div style={{ marginTop: '8px' }}>
      <Progress
        percent={percent}
        strokeColor={stageColor}
        showInfo={true}
        size="small"
        format={(percent) => `${percent}%`}
      />
      {message && (
        <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '4px' }}>
          {message}
        </Text>
      )}
    </div>
  )
}
