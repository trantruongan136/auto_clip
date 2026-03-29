import React, { useEffect, useState } from 'react';
import { Card, Typography } from 'antd';

const { Text } = Typography;

export const SimpleTest: React.FC = () => {
  const [count, setCount] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    console.log('🎯 SimpleTestComponent loaded');
    setCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    console.log('📤 startAPICall test');
    fetch('http://localhost:8000/api/v1/tasks/project/64d5768e-7b6b-40d0-9aed-f216768a6526')
      .then(response => response.json())
      .then(data => {
        console.log('📋 APIresponse:', data);
        setTasks(data.data.tasks || []);
      })
      .catch(error => {
        console.error('❌ APIcall failed:', error);
      });
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <Card title="Simple test component">
        <Text>Component loading times: {count}</Text>
        <br />
        <Text>Number of tasks: {tasks.length}</Text>
        <br />
        <Text>Task List:</Text>
        <ul>
          {tasks.map((task, index) => (
            <li key={index}>
              {task.task_id} - {task.status} - {task.progress}%
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}; 