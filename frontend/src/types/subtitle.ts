// subtitle word type
export interface SubtitleWord {
  id: string
  text: string
  startTime: number  // Second
  endTime: number    // Second
  confidence?: number // Speech recognition confidence
}

// Subtitle paragraph type
export interface SubtitleSegment {
  id: string
  startTime: number  // Second
  endTime: number    // Second
  words: SubtitleWord[]
  text: string       // full text
  index: number      // originalSRTindex
}

// Video editing operation types
export interface VideoEditOperation {
  type: 'delete' | 'insert' | 'modify'
  segmentIds: string[]
  timestamp: number
  metadata?: {
    originalText?: string
    newText?: string
    timeRange?: {
      start: number
      end: number
    }
  }
}

// Subtitle editor status
export interface SubtitleEditorState {
  currentTime: number
  playing: boolean
  selectedWords: Set<string>
  deletedSegments: Set<string>
  editHistory: VideoEditOperation[]
  historyIndex: number
  showDeleted: boolean
}

// subtitle dataAPIresponse
export interface SubtitleDataResponse {
  segments: SubtitleSegment[]
  total_duration: number
  word_count: number
  segment_count: number
}

// Video editing results
export interface VideoEditResult {
  originalVideoPath: string
  editedVideoPath: string
  operations: VideoEditOperation[]
  totalDeletedDuration: number
  finalDuration: number
}
