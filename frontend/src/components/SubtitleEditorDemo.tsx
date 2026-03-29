import React, { useState } from 'react'
import { Button, Card, Space, Typography } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import SubtitleEditor from './SubtitleEditor'
import { SubtitleSegment, VideoEditOperation } from '../types/subtitle'

const { Title, Text } = Typography

const SubtitleEditorDemo: React.FC = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Analog subtitle data
  const mockSubtitles: SubtitleSegment[] = [
    {
      id: '1',
      startTime: 0,
      endTime: 11,
      words: [
        { id: '1-1', text: 'welcome', startTime: 0, endTime: 2 },
        { id: '1-2', text: 'Everyone', startTime: 2, endTime: 4 },
        { id: '1-3', text: 'use', startTime: 4, endTime: 6 },
        { id: '1-4', text: 'word shadow', startTime: 6, endTime: 8 },
        { id: '1-5', text: '.', startTime: 8, endTime: 11 }
      ]
    },
    {
      id: '2',
      startTime: 11,
      endTime: 13,
      words: [
        { id: '2-1', text: 'word shadow', startTime: 11, endTime: 12 },
        { id: '2-2', text: 'yes', startTime: 12, endTime: 12.5 },
        { id: '2-3', text: 'one', startTime: 12.5, endTime: 13 }
      ]
    },
    {
      id: '3',
      startTime: 13,
      endTime: 14,
      words: [
        { id: '3-1', text: 'extreme', startTime: 13, endTime: 13.5 },
        { id: '3-2', text: 'simple', startTime: 13.5, endTime: 14 }
      ]
    },
    {
      id: '4',
      startTime: 14,
      endTime: 17,
      words: [
        { id: '4-1', text: 'video', startTime: 14, endTime: 15 },
        { id: '4-2', text: 'Edit', startTime: 15, endTime: 16 },
        { id: '4-3', text: 'product', startTime: 16, endTime: 17 },
        { id: '4-4', text: '.', startTime: 17, endTime: 17 }
      ]
    },
    {
      id: '5',
      startTime: 17,
      endTime: 18,
      words: [
        { id: '5-1', text: 'word shadow', startTime: 17, endTime: 17.5 },
        { id: '5-2', text: 'most', startTime: 17.5, endTime: 17.8 },
        { id: '5-3', text: 'main', startTime: 17.8, endTime: 18 }
      ]
    },
    {
      id: '6',
      startTime: 18,
      endTime: 23,
      words: [
        { id: '6-1', text: 'of', startTime: 18, endTime: 18.2 },
        { id: '6-2', text: 'innovation', startTime: 18.2, endTime: 19 },
        { id: '6-3', text: 'yes', startTime: 19, endTime: 19.5 },
        { id: '6-4', text: 'pass', startTime: 19.5, endTime: 20 },
        { id: '6-5', text: 'Word', startTime: 20, endTime: 21 },
        { id: '6-6', text: 'Come', startTime: 21, endTime: 21.5 },
        { id: '6-7', text: 'Edit', startTime: 21.5, endTime: 22.5 },
        { id: '6-8', text: 'video', startTime: 22.5, endTime: 23 },
        { id: '6-9', text: ',', startTime: 23, endTime: 23 }
      ]
    }
  ]

  const handleSave = (operations: VideoEditOperation[]) => {
    console.log('Saved edits:', operations)
    setIsEditorOpen(false)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#ffffff', marginBottom: '16px' }}>
          Subtitle Editor Demo
        </Title>
        <Text style={{ color: '#cccccc', fontSize: '16px', display: 'block', marginBottom: '24px' }}>
          This is a redesigned subtitle editor that references the layout and interaction design of modern video editing software.
        </Text>
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text style={{ color: '#ffffff', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
              Main features:
            </Text>
            <ul style={{ color: '#cccccc', fontSize: '14px', lineHeight: '1.6' }}>
              <li>Three-column layout: subtitle list on the left, style selection in the middle, and video player on the right</li>
              <li>Right-click menu: supports operations such as deleting clips, associating materials, resetting, closing subtitles, highlighting, etc.</li>
              <li>Real-time preview: Click on the subtitle segment to jump to the corresponding time point</li>
              <li>Style templates: Provides a variety of subtitle style choices</li>
              <li>Edit history: Support undo/redo operation</li>
              <li>modernizationUI:Dark theme, smooth animation effect</li>
            </ul>
          </div>

          <div>
            <Text style={{ color: '#ffffff', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
              Operating Instructions:
            </Text>
            <ul style={{ color: '#cccccc', fontSize: '14px', lineHeight: '1.6' }}>
              <li>Click on the subtitle segment to jump to the corresponding time point in the video</li>
              <li>Click on the word to select/Deselect (Ctrl/Cmd+Click to select multiple)</li>
              <li>Right-click on a subtitle segment to open the context menu</li>
              <li>Use editing tools to delete, undo, redo, etc.</li>
              <li>Select a style template to preview different effects</li>
            </ul>
          </div>

          <Button 
            type="primary" 
            size="large" 
            icon={<PlayCircleOutlined />}
            onClick={() => setIsEditorOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              height: '48px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Open subtitle editor
          </Button>
        </Space>
      </Card>

      {isEditorOpen && (
        <SubtitleEditor
          videoUrl="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
          subtitles={mockSubtitles}
          onSave={handleSave}
          onClose={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  )
}

export default SubtitleEditorDemo
