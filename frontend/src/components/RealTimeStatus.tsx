import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Statistic, Space, Tag, Button, Typography } from 'antd';
import { 
  WifiOutlined, 
  WifiOutlined as WifiDisconnectedOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { TaskProgress } from './TaskProgress';
import { NotificationList } from './NotificationList';
// import { useWebSocket, WebSocketEventMessage } from '../hooks/useWebSocket'  // DisabledWebSocketsystem;
import { useNotifications } from '../hooks/useNotifications';
import { useProjectStore } from '../store/useProjectStore';
import { projectApi } from '../api/projectApi';

const { Text } = Typography;

interface RealTimeStatusProps {
  userId: string;
}

export const RealTimeStatus: React.FC<RealTimeStatusProps> = ({ userId }) => {
  console.log('🎬 RealTimeStatusComponent loaded');
  const { setProjects } = useProjectStore();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Use simple state management directly instead of complexHook
  const loadProjectTasks = useCallback(async (projectId: string) => {
    console.log('📤 Start loading project tasks:', projectId);
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/tasks/project/${projectId}`);
      console.log('📡 APIresponse status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const projectTasks = data.items || []; // Use correct field names
        console.log('📋 Get the number of tasks:', projectTasks.length);
        
        // Convert toTaskProgressThe format expected by the component
        const formattedTasks = projectTasks.map((task: any) => ({
          id: task.id,
          status: task.status,
          progress: task.progress || 0,
          message: task.name || `Task ${task.id}`, // usenamefield or default value
          updatedAt: task.created_at || task.updated_at || new Date().toISOString(),
          project_id: task.project_id // Add itemIDField
        }));
        
        setTasks(formattedTasks);
      } else {
        console.error('❌ APIcall failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Failed to load project task:', error);
    } finally {
      setLoading(false);
      console.log('✅ Task loading completed');
    }
  }, []);

  const {
    notifications,
    unreadCount,
    markAsRead,
    removeNotification,
    markAllAsRead,
    clearAll: clearAllNotifications,
    handleSystemNotification,
    handleErrorNotification
  } = useNotifications();

  // WebSocketFeature disabled, use new simplified progression system
  // const handleWebSocketMessage = async (message: WebSocketEventMessage) => {
  //   console.log('receiveWebSocketinformation:', message);
  //   
  //   switch (message.type) {
  //     case 'task_update':
  //       console.log('📈 Receive task updates:', message);
  //       // Process task updates and update project status
  //       if (message.task_id && message.status) {
  //         console.log('Task status update:', message.task_id, message.status);
  //         // Refresh the project list to get the latest status
  //         try {
  //           const projects = await projectApi.getProjects();
  //           setProjects(projects);
  //           console.log('Project list has been refreshed');
  //         } catch (error) {
  //           console.error('Failed to refresh project list:', error);
  //         }
  //       }
  //       break;
  //       
  //     case 'project_update':
  //       console.log('📊 Receive project updates:', message);
  //       // Handle project updates
  //       if (message.project_id && message.status) {
  //         console.log('Project status update:', message.project_id, message.status);
  //         // Refresh the project list to get the latest status
  //         try {
  //           const projects = await projectApi.getProjects();
  //           setProjects(projects);
  //           console.log('Project list has been refreshed');
  //         } catch (error) {
  //           console.error('Failed to refresh project list:', error);
  //         }
  //       }
  //       break;
  //       
  //     case 'system_notification':
  //       // Only handle important system notifications
  //       if (message.level === 'success' || message.level === 'error') {
  //         handleSystemNotification(message);
  //       }
  //       break;
  //       
  //     case 'error_notification':
  //       handleErrorNotification(message);
  //       break;
  //       
  //     case 'task_progress_update':
  //       console.log('📊 Receive task progress updates:', message);
  //       // Processing task progress updates
  //       if (message.project_id && message.progress !== undefined) {
  //         console.log('Task progress updates:', message.project_id, message.progress + '%', message.step_name);
  //         // Here you can update the project status or trigger otherUIrenew
  //       }
  //       break;
  //       
  //     default:
  //       console.log('Ignore unknown typesWebSocketinformation:', (message as any).type);
  //   }
  // };

  // const {
  //   isConnected,
  //   connectionStatus,
  //   connect,
  //   disconnect,
  //   subscribeToTopic,
  //   unsubscribeFromTopic,
  //   sendMessage
  // } = useWebSocket({
  //   userId,
  //   onMessage: handleWebSocketMessage
  // });

  // Load project tasks
  useEffect(() => {
    // Specific projects can be passed in hereID, or frompropsGet
    const projectId = '64d5768e-7b6b-40d0-9aed-f216768a6526'; // Sample projectID
    console.log('🔄 Start loading project tasks:', projectId);
    loadProjectTasks(projectId);
  }, []); // RemoveloadProjectTasksDependencies to avoid infinite loops

  // WebSocketStatus related functions are disabled
  // const getConnectionStatusColor = () => {
  //   switch (connectionStatus) {
  //     case 'connected': return 'success';
  //     case 'connecting': return 'processing';
  //     case 'disconnected': return 'default';
  //     case 'error': return 'error';
  //     default: return 'default';
  //   }
  // };

  // const getConnectionStatusText = () => {
  //   switch (connectionStatus) {
  //     case 'connected': return 'Connected';
  //     case 'connecting': return 'Connecting';
  //     case 'disconnected': return 'Not connected';
  //     case 'error': return 'Connection error';
  //     default: return 'unknown status';
  //   }
  // };

  // const getConnectionIcon = () => {
  //   switch (connectionStatus) {
  //     case 'connected': return <WifiOutlined />;
  //     case 'connecting': return <SyncOutlined spin />;
  //     case 'disconnected': return <WifiDisconnectedOutlined />;
  //     case 'error': return <ExclamationCircleOutlined />;
  //     default: return <WifiDisconnectedOutlined />;
  //   }
  // };

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={[16, 16]}>
        {/* WebSocketConnection status is disabled */}
        {/* <Col span={24}>
          <Card size="small">
            <Space>
              {getConnectionIcon()}
              <Text>WebSocketStatus: </Text>
              <Tag color={getConnectionStatusColor()}>
                {getConnectionStatusText()}
              </Tag>
              <Button 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={isConnected ? disconnect : connect}
              >
                {isConnected ? 'disconnect' : 'connect'}
              </Button>
            </Space>
          </Card>
        </Col> */}

        {/* Statistics */}
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="total number of tasks"
              value={tasks.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Loading status"
              value={loading ? 'loading' : 'Completed'}
              valueStyle={{ color: loading ? '#52c41a' : '#999' }}
            />
          </Card>
        </Col>
        {/* WebSocketConnection status is disabled */}
        {/* <Col span={6}>
          <Card size="small">
            <Statistic
              title="connection status"
              value={isConnected ? 'Connected' : 'Not connected'}
              valueStyle={{ color: isConnected ? '#722ed1' : '#ff4d4f' }}
            />
          </Card>
        </Col> */}
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="unread notifications"
              value={unreadCount}
              valueStyle={{ color: unreadCount > 0 ? '#ff4d4f' : '#999' }}
            />
          </Card>
        </Col>

        {/* Task progress */}
        <Col span={12}>
          <Card 
            title="Task progress" 
            size="small"
            extra={
              <Button size="small" onClick={() => setTasks([])}>
                Clear
              </Button>
            }
          >
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  No tasks yet
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskProgress 
                    key={task.id} 
                    task={task} 
                    projectId={task.project_id || userId} // Projects using tasksID, if not available then useuserIdasfallback
                  />
                ))
              )}
            </div>
          </Card>
        </Col>

        {/* Notification list */}
        <Col span={12}>
          <NotificationList
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onRemove={removeNotification}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAllNotifications}
            maxHeight={300}
          />
        </Col>
      </Row>
    </div>
  );
}; 