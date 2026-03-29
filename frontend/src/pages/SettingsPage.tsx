import React, { useState, useEffect } from 'react'
import { Layout, Card, Form, Input, Button, Typography, Space, Alert, Divider, Row, Col, Tabs, message, Select, Tag } from 'antd'
import { KeyOutlined, SaveOutlined, ApiOutlined, SettingOutlined, InfoCircleOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons'
import { settingsApi } from '../services/api'
import BilibiliManager from '../components/BilibiliManager'
import './SettingsPage.css'

const { Content } = Layout
const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [showBilibiliManager, setShowBilibiliManager] = useState(false)
  const [availableModels, setAvailableModels] = useState<any>({})
  const [currentProvider, setCurrentProvider] = useState<any>({})
  const [selectedProvider, setSelectedProvider] = useState('dashscope')

  // Provider configuration
  const providerConfig = {
    dashscope: {
      name: 'Alibaba Tongyi Qianwen',
      icon: <RobotOutlined />,
      color: '#1890ff',
      description: 'Alibaba Cloud Tongyi Qianwen LLM Service',
      apiKeyField: 'dashscope_api_key',
      placeholder: 'Enter Tongyi Qianwen API Key'
    },
    openai: {
      name: 'OpenAI',
      icon: <RobotOutlined />,
      color: '#52c41a',
      description: 'OpenAI GPT model series',
      apiKeyField: 'openai_api_key',
      placeholder: 'Enter OpenAI API Key'
    },
    gemini: {
      name: 'Google Gemini',
      icon: <RobotOutlined />,
      color: '#faad14',
      description: 'Google Gemini LLM',
      apiKeyField: 'gemini_api_key',
      placeholder: 'Enter Gemini API Key'
    },
    siliconflow: {
      name: 'SiliconFlow',
      icon: <RobotOutlined />,
      color: '#722ed1',
      description: 'SiliconFlow Model Service',
      apiKeyField: 'siliconflow_api_key',
      placeholder: 'Enter SiliconFlow API Key'
    }
  }

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [settings, models, provider] = await Promise.all([
        settingsApi.getSettings(),
        settingsApi.getAvailableModels(),
        settingsApi.getCurrentProvider()
      ])

      setAvailableModels(models)
      setCurrentProvider(provider)
      setSelectedProvider(settings.llm_provider || 'dashscope')

      // 设置表单初始值
      form.setFieldsValue(settings)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  // 保存配置
  const handleSave = async (values: any) => {
    try {
      setLoading(true)
      await settingsApi.updateSettings(values)
      message.success('Settings saved successfully!')
      await loadData() // 重新加载数据
    } catch (error: any) {
      message.error('Save failed: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  // 测试API密钥
  const handleTestApiKey = async () => {
    const apiKey = form.getFieldValue(providerConfig[selectedProvider as keyof typeof providerConfig].apiKeyField)
    const modelName = form.getFieldValue('model_name')

    if (!apiKey) {
      message.error('Please enter an API key first')
      return
    }

    if (!modelName) {
      message.error('Please select a model first')
      return
    }

    try {
      setLoading(true)
      const result = await settingsApi.testApiKey(selectedProvider, apiKey, modelName)
      if (result.success) {
        message.success('API key test successful!')
      } else {
        message.error('API key test failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error: any) {
      message.error('Test failed: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  // 提供商切换
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider)
    form.setFieldsValue({ llm_provider: provider })
  }

  return (
    <Content className="settings-page">
      <div className="settings-container">
        <Title level={2} className="settings-title">
          <SettingOutlined /> System Settings
        </Title>

        <Tabs defaultActiveKey="api" className="settings-tabs">
          <TabPane tab="AI Model Config" key="api">
            <Card title="AI Model Configuration" className="settings-card">
              <Alert
                message="Multi-Model Provider Support"
                description="The system now supports multiple AI model providers. You can choose different providers and models as needed."
                type="info"
                showIcon
                className="settings-alert"
              />

              <Form
                form={form}
                layout="vertical"
                className="settings-form"
                onFinish={handleSave}
                initialValues={{
                  llm_provider: 'dashscope',
                  model_name: 'qwen-plus',
                  chunk_size: 5000,
                  min_score_threshold: 0.7,
                  max_clips_per_collection: 5
                }}
              >
                {/* 当前提供商状态 */}
                {currentProvider.available && (
                  <Alert
                    message={`Currently using: ${currentProvider.display_name} - ${currentProvider.model}`}
                    type="success"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />
                )}

                {/* 提供商选择 */}
                <Form.Item
                  label="Select AI Model Provider"
                  name="llm_provider"
                  className="form-item"
                  rules={[{ required: true, message: 'Please select an AI model provider' }]}
                >
                  <Select
                    value={selectedProvider}
                    onChange={handleProviderChange}
                    className="settings-input"
                    placeholder="Select AI model provider"
                  >
                    {Object.entries(providerConfig).map(([key, config]) => (
                      <Select.Option key={key} value={key}>
                        <Space>
                          <span style={{ color: config.color }}>{config.icon}</span>
                          <span>{config.name}</span>
                          <Tag color={config.color} size="small">{config.description}</Tag>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Dynamic API key input */}
                <Form.Item
                  label={`${providerConfig[selectedProvider as keyof typeof providerConfig].name} API Key`}
                  name={providerConfig[selectedProvider as keyof typeof providerConfig].apiKeyField}
                  className="form-item"
                  rules={[
                    { required: true, message: 'Please enter an API key' },
                    { min: 10, message: 'API key must be at least 10 characters' }
                  ]}
                >
                  <Input.Password
                    placeholder={providerConfig[selectedProvider as keyof typeof providerConfig].placeholder}
                    prefix={<KeyOutlined />}
                    className="settings-input"
                  />
                </Form.Item>

                {/* Model selection */}
                <Form.Item
                  label="Select Model"
                  name="model_name"
                  className="form-item"
                  rules={[{ required: true, message: 'Please select a model' }]}
                >
                  <Select
                    className="settings-input"
                    placeholder="Select a model"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {availableModels[selectedProvider]?.map((model: any) => (
                      <Select.Option key={model.name} value={model.name}>
                        <Space>
                          <span>{model.display_name}</span>
                          <Tag size="small">Max {model.max_tokens} tokens</Tag>
                        </Space>
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item className="form-item">
                  <Space>
                    <Button
                      type="default"
                      icon={<ApiOutlined />}
                      className="test-button"
                      onClick={handleTestApiKey}
                      loading={loading}
                    >
                      Test Connection
                    </Button>
                  </Space>
                </Form.Item>

                <Divider className="settings-divider" />

                <Title level={4} className="section-title">Model Configuration</Title>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Model Name"
                      name="model_name"
                      className="form-item"
                    >
                      <Input placeholder="qwen-plus" className="settings-input" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Text Chunk Size"
                      name="chunk_size"
                      className="form-item"
                    >
                      <Input
                        type="number"
                        placeholder="5000"
                        addonAfter="chars"
                        className="settings-input"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Minimum Score Threshold"
                      name="min_score_threshold"
                      className="form-item"
                    >
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        placeholder="0.7"
                        className="settings-input"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Max Clips per Collection"
                      name="max_clips_per_collection"
                      className="form-item"
                    >
                      <Input
                        type="number"
                        placeholder="5"
                        addonAfter="clips"
                        className="settings-input"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item className="form-item">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    size="large"
                    className="save-button"
                    loading={loading}
                  >
                    Save Settings
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            <Card title="Usage Guide" className="settings-card">
              <Space direction="vertical" size="large" className="instructions-space">
                <div className="instruction-item">
                  <Title level={5} className="instruction-title">
                    <InfoCircleOutlined /> 1. Select AI Model Provider
                  </Title>
                  <Paragraph className="instruction-text">
                    The system supports multiple AI model providers:
                    <br />• <Text strong>Alibaba Tongyi Qianwen</Text>: Get API key from Alibaba Cloud Console
                    <br />• <Text strong>OpenAI</Text>: Get API key at platform.openai.com
                    <br />• <Text strong>Google Gemini</Text>: Get API key at ai.google.dev
                    <br />• <Text strong>SiliconFlow</Text>: Get API key at docs.siliconflow.cn
                  </Paragraph>
                </div>

                <div className="instruction-item">
                  <Title level={5} className="instruction-title">
                    <InfoCircleOutlined /> 2. Parameter Description
                  </Title>
                  <Paragraph className="instruction-text">
                    • <Text strong>Text Chunk Size</Text>: Affects processing speed and accuracy, recommended 5000 chars<br />
                    • <Text strong>Score Threshold</Text>: Only clips scoring above this threshold are retained<br />
                    • <Text strong>Clips per Collection</Text>: Controls the number of clips in each themed collection
                  </Paragraph>
                </div>

                <div className="instruction-item">
                  <Title level={5} className="instruction-title">
                    <InfoCircleOutlined /> 3. Test Connection
                  </Title>
                  <Paragraph className="instruction-text">
                    It is recommended to test the API key before saving to ensure the service is working properly
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </TabPane>

          <TabPane tab="Bilibili Management" key="bilibili">
            <Card title="Bilibili Account Management" className="settings-card">
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ marginBottom: '24px' }}>
                  <UserOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                  <Title level={3} style={{ color: '#ffffff', margin: '0 0 8px 0' }}>
                    Bilibili Account Management
                  </Title>
                  <Text type="secondary" style={{ color: '#b0b0b0', fontSize: '16px' }}>
                    Manage your Bilibili accounts, supports multi-account switching and quick upload
                  </Text>
                </div>

                <Space size="large">
                  <Button
                    type="primary"
                    size="large"
                    icon={<UserOutlined />}
                    onClick={() => message.info('Under development, coming soon', 3)}
                    style={{
                      borderRadius: '8px',
                      background: 'linear-gradient(45deg, #1890ff, #36cfc9)',
                      border: 'none',
                      fontWeight: 500,
                      height: '48px',
                      padding: '0 32px',
                      fontSize: '16px'
                    }}
                  >
                    Manage Bilibili Accounts
                  </Button>
                </Space>

                <div style={{ marginTop: '32px', textAlign: 'left', maxWidth: '600px', margin: '32px auto 0' }}>
                  <Title level={4} style={{ color: '#ffffff', marginBottom: '16px' }}>
                    Features
                  </Title>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                    <div style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      border: '1px solid #404040'
                    }}>
                      <Text strong style={{ color: '#1890ff' }}>Multi-Account Support</Text>
                      <br />
                      <Text type="secondary" style={{ color: '#b0b0b0' }}>
                        Supports adding multiple Bilibili accounts for easy management and switching
                      </Text>
                    </div>
                    <div style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      border: '1px solid #404040'
                    }}>
                      <Text strong style={{ color: '#52c41a' }}>Secure Login</Text>
                      <br />
                      <Text type="secondary" style={{ color: '#b0b0b0' }}>
                        Uses Cookie import to avoid risk control, safe and reliable
                      </Text>
                    </div>
                    <div style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      border: '1px solid #404040'
                    }}>
                      <Text strong style={{ color: '#faad14' }}>Quick Upload</Text>
                      <br />
                      <Text type="secondary" style={{ color: '#b0b0b0' }}>
                        Directly select an account to upload from the clip detail page, simple to use
                      </Text>
                    </div>
                    <div style={{
                      padding: '16px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      border: '1px solid #404040'
                    }}>
                      <Text strong style={{ color: '#722ed1' }}>Batch Management</Text>
                      <br />
                      <Text type="secondary" style={{ color: '#b0b0b0' }}>
                        Supports batch uploading multiple clips to improve efficiency
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabPane>
        </Tabs>

        {/* B站管理弹窗 */}
        <BilibiliManager
          visible={showBilibiliManager}
          onClose={() => setShowBilibiliManager(false)}
          onUploadSuccess={() => {
            message.success('Operation successful')
          }}
        />
      </div>
    </Content>
  )
}

export default SettingsPage