/**
 * Simplified progress status management - Based on fixed phases and polling
 */

import { create } from 'zustand'

export interface SimpleProgress {
  project_id: string
  stage: string
  percent: number
  message: string
  ts: number
}

interface SimpleProgressState {
  // status data
  byId: Record<string, SimpleProgress>
  
  // Polling control
  pollingInterval: number | null
  isPolling: boolean
  
  // How to operate
  upsert: (progress: SimpleProgress) => void
  startPolling: (projectIds: string[], intervalMs?: number) => void
  stopPolling: () => void
  clearProgress: (projectId: string) => void
  clearAllProgress: () => void
  
  // Get method
  getProgress: (projectId: string) => SimpleProgress | null
  getAllProgress: () => Record<string, SimpleProgress>
}

export const useSimpleProgressStore = create<SimpleProgressState>((set, get) => {
  let timer: NodeJS.Timeout | null = null

  return {
    // initial state
    byId: {},
    pollingInterval: null,
    isPolling: false,

    // Update or insert progress data
    upsert: (progress: SimpleProgress) => {
      set((state) => ({
        byId: {
          ...state.byId,
          [progress.project_id]: progress
        }
      }))
    },

    // Start polling
    startPolling: (projectIds: string[], intervalMs: number = 2000) => {
      const { stopPolling, isPolling } = get()
      
      // If it is already polling, stop it first
      if (isPolling) {
        stopPolling()
      }

      if (projectIds.length === 0) {
        console.warn('no itemsID, skip polling')
        return
      }

      console.log(`Start polling progress: ${projectIds.join(', ')}`)

      // Get it now
      const fetchSnapshots = async () => {
        try {
          const queryString = projectIds.map(id => `project_ids=${id}`).join('&')
          const response = await fetch(`http://localhost:8000/api/v1/simple-progress/snapshot?${queryString}`)
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const snapshots: SimpleProgress[] = await response.json()
          
          // update status
          snapshots.forEach(snapshot => {
            console.log(`update progress: ${snapshot.project_id} - ${snapshot.stage} (${snapshot.percent}%)`)
            get().upsert(snapshot)
          })
          
          console.log(`Poll for updates: ${snapshots.length} items`)
          
        } catch (error) {
          console.error('Polling progress failed:', error)
        }
      }

      // Execute once immediately
      fetchSnapshots()

      // Set timer
      timer = setInterval(fetchSnapshots, intervalMs)

      set({
        isPolling: true,
        pollingInterval: intervalMs
      })
    },

    // Stop polling
    stopPolling: () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      
      set({
        isPolling: false,
        pollingInterval: null
      })
      
      console.log('Stop polling progress')
    },

    // Clear individual project progress
    clearProgress: (projectId: string) => {
      set((state) => {
        const newById = { ...state.byId }
        delete newById[projectId]
        return { byId: newById }
      })
    },

    // Clear all progress
    clearAllProgress: () => {
      set({ byId: {} })
    },

    // Get the progress of a single project
    getProgress: (projectId: string) => {
      return get().byId[projectId] || null
    },

    // Get all progress
    getAllProgress: () => {
      return get().byId
    }
  }
})

// Stage display name mapping
export const STAGE_DISPLAY_NAMES: Record<string, string> = {
  'INGEST': 'Preparing Media',
  'SUBTITLE': 'Processing Subtitles',
  'ANALYZE': 'Analyzing Content', 
  'HIGHLIGHT': 'Identifying Highlights',
  'EXPORT': 'Exporting Video',
  'DONE': 'Completed'
}

// Stage color mapping
export const STAGE_COLORS: Record<string, string> = {
  'INGEST': '#1890ff',      // blue
  'SUBTITLE': '#52c41a',    // green
  'ANALYZE': '#fa8c16',     // orange color
  'HIGHLIGHT': '#722ed1',   // Purple
  'EXPORT': '#eb2f96',      // pink
  'DONE': '#13c2c2'         // blue
}

// Get stage display name
export const getStageDisplayName = (stage: string): string => {
  return STAGE_DISPLAY_NAMES[stage] || stage
}

// Get stage color
export const getStageColor = (stage: string): string => {
  return STAGE_COLORS[stage] || '#666666'
}

// Determine whether it is completed
export const isCompleted = (stage: string): boolean => {
  return stage === 'DONE'
}

// Determine whether it is a failure state
export const isFailed = (message: string): boolean => {
  return message.includes('Failed') || message.includes('Error') || message.includes('Failed')
}
