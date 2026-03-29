import React, { useState } from 'react'
import { Modal, Steps, Card, Typography, Alert, Button, Space, Divider, Image } from 'antd'
import { QuestionCircleOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { Step } = Steps

interface CookieHelperProps {
  visible: boolean
  onClose: () => void
}

const CookieHelper: React.FC<CookieHelperProps> = ({ visible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [copied, setCopied] = useState(false)

  const steps = [
    {
      title: 'Log in to Bilibili',
      description: 'Log in to your Bilibili account in the browser',
      content: (
        <div>
          <Alert
            message="Step 1: Log in to Bilibili"
            description="Please make sure you have successfully logged in to your Bilibili account in the browser"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Card size="small">
            <Paragraph>
              1. Open your browser and visit <Text code>https://www.bilibili.com</Text>
            </Paragraph>
            <Paragraph>
              2. Click the "Login" button in the top right corner
            </Paragraph>
            <Paragraph>
              3. Log in with your Bilibili account
            </Paragraph>
            <Paragraph>
              4. After successful login, you should see your username displayed in the top right corner
            </Paragraph>
          </Card>
        </div>
      )
    },
    {
      title: 'Open Developer Tools',
      description: 'Press F12 to open browser developer tools',
      content: (
        <div>
          <Alert
            message="Step 2: Open Developer Tools"
            description="Use the keyboard shortcut to open browser developer tools"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Card size="small">
            <Paragraph>
              <Text strong>Windows/Linux:</Text> Press <Text code>F12</Text>
            </Paragraph>
            <Paragraph>
              <Text strong>Mac:</Text> Press <Text code>Command + Option + I</Text>
            </Paragraph>
            <Paragraph>
              Or right-click on a blank area of the page and select "Inspect"
            </Paragraph>
            <Divider />
            <Paragraph type="secondary">
              Developer tools will open at the bottom or side of the page, with multiple tabs
            </Paragraph>
          </Card>
        </div>
      )
    },
    {
      title: 'Switch to Network Tab',
      description: 'Find the Network tab in Developer Tools',
      content: (
        <div>
          <Alert
            message="Step 3: Switch to Network Tab"
            description="Find the Network tab in Developer Tools"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Card size="small">
            <Paragraph>
              1. Find the tab bar at the top of developer tools
            </Paragraph>
            <Paragraph>
              2. Click the <Text code>Network</Text> tab
            </Paragraph>
            <Paragraph>
              3. Make sure the Network panel is empty (if there is content, click the clear button)
            </Paragraph>
            <Divider />
            <Paragraph type="secondary">
              The Network tab monitors all network requests made by the page, including Cookie information
            </Paragraph>
          </Card>
        </div>
      )
    },
    {
      title: 'Refresh the Page',
      description: 'Refresh the Bilibili page to capture requests',
      content: (
        <div>
          <Alert
            message="Step 4: Refresh the Page"
            description="Refresh the Bilibili page to capture network requests"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Card size="small">
            <Paragraph>
              1. Make sure the Network tab is open
            </Paragraph>
            <Paragraph>
              2. Press <Text code>F5</Text> or click the browser's refresh button
            </Paragraph>
            <Paragraph>
              3. Watch the list of requests appearing in the Network panel
            </Paragraph>
            <Divider />
            <Paragraph type="secondary">
              After refreshing, the Network panel will show all network requests made during page load
            </Paragraph>
          </Card>
        </div>
      )
    },
    {
      title: 'Find Cookie',
      description: 'Find the Cookie field in request headers',
      content: (
        <div>
          <Alert
            message="Step 5: Find Cookie Info"
            description="Find the Cookie field in any request"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Card size="small">
            <Paragraph>
              1. In the Network panel, click any request (usually the first one)
            </Paragraph>
            <Paragraph>
              2. Click that request and find the <Text code>Headers</Text> tab in the right panel
            </Paragraph>
            <Paragraph>
              3. In <Text code>Request Headers</Text>, find the <Text code>Cookie</Text> field
            </Paragraph>
            <Paragraph>
              4. The value of the Cookie field is the complete Cookie string you need
            </Paragraph>
            <Divider />
            <Paragraph type="secondary">
              The Cookie string is usually very long, containing multiple key-value pairs separated by semicolons
            </Paragraph>
          </Card>
        </div>
      )
    },
    {
      title: 'Copy Cookie',
      description: 'Copy the complete Cookie string',
      content: (
        <div>
          <Alert
            message="Step 6: Copy Cookie"
            description="Copy the complete Cookie string to clipboard"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Card size="small">
            <Paragraph>
              1. Right-click on the Cookie field value
            </Paragraph>
            <Paragraph>
              2. Select "Copy value"
            </Paragraph>
            <Paragraph>
              3. Or double-click to select the entire Cookie value, then press <Text code>Ctrl+C</Text> to copy
            </Paragraph>
            <Divider />
            <Paragraph type="secondary">
              The copied Cookie string can be pasted directly into AutoClip's Cookie input field
            </Paragraph>
            <Alert
              message="Important"
              description="Cookie contains your login information. Keep it safe and do not share it with others"
              type="warning"
              showIcon
            />
          </Card>
        </div>
      )
    }
  ]

  const handleCopy = () => {
    const cookieExample = "SESSDATA=your_sessdata_here; bili_jct=your_bili_jct_here; DedeUserID=your_dedeuserid_here"
    navigator.clipboard.writeText(cookieExample).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Modal
      title={
        <Space>
          <QuestionCircleOutlined />
          <span>Cookie Guide</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="copy"
          icon={copied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={handleCopy}
        >
          {copied ? 'Copied!' : 'Copy Example'}
        </Button>
      ]}
      width={700}
    >
      <div style={{ marginBottom: 16 }}>
        <Alert
          message="Cookie import is the safest login method"
          description="Compared to QR code login, Cookie import does not trigger Bilibili's risk controls and is the most recommended login method."
          type="success"
          showIcon
        />
      </div>

      <Steps current={currentStep} onChange={setCurrentStep} direction="vertical" size="small">
        {steps.map((step, index) => (
          <Step key={index} title={step.title} description={step.description} />
        ))}
      </Steps>

      <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
        {steps[currentStep].content}
      </div>

      <Divider />

      <Card size="small" title="Cookie Format Example">
        <Paragraph code style={{ fontSize: '12px', wordBreak: 'break-all' }}>
          SESSDATA=your_sessdata_here; bili_jct=your_bili_jct_here; DedeUserID=your_dedeuserid_here; buvid3=your_buvid3_here
        </Paragraph>
        <Paragraph type="secondary" style={{ fontSize: '12px' }}>
          Note: The actual Cookie value will be much longer than this example and contains more fields
        </Paragraph>
      </Card>
    </Modal>
  )
}

export default CookieHelper

