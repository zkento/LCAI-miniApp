// pages/profile/profile.js
const EnvAdapter = require('../../utils/env-adapter');

Page({
    /**
     * 页面的初始数据
     */
    data: {
        userInfo: null,
        chatVisible: false,
        messageInput: '',
        messages: [
            {
                role: 'assistant',
                content: '我是良策AI助手，有什么可以帮到您的吗？'
            }
        ],
        thinking: false,
        hasError: false,
        confirmReset: false,
        canSend: false  // 添加canSend状态
    },

    onLoad: function() {
        this.getUserInfo();
        
        // 监听键盘高度变化
        wx.onKeyboardHeightChange(res => {
            this.setData({
                keyboardHeight: res.height
            });
            
            if (res.height > 0) {
                // 键盘弹起
                this.adjustInputPosition(res.height);
            } else {
                // 键盘收起
                this.resetInputPosition();
            }
        });
    },
    
    // 调整输入框位置
    adjustInputPosition(keyboardHeight) {
        const query = wx.createSelectorQuery();
        query.select('.chat-input-area').boundingClientRect();
        query.exec(res => {
            if (res && res[0]) {
                const inputAreaHeight = res[0].height;
                // 设置输入框的底部位置为键盘高度
                const inputBottom = keyboardHeight;
                
                wx.createSelectorQuery().select('.chat-input-area').fields({
                    computedStyle: ['bottom']
                }, function(res) {
                    if (res) {
                        const chatInputArea = wx.createSelectorQuery().select('.chat-input-area');
                        chatInputArea.setStyle({
                            bottom: inputBottom + 'px'
                        });
                    }
                }).exec();
                
                // 滚动到底部
                this.scrollToBottom();
            }
        });
    },
    
    // 重置输入框位置
    resetInputPosition() {
        const chatInputArea = wx.createSelectorQuery().select('.chat-input-area');
        chatInputArea.setStyle({
            bottom: '0px'
        });
    },

    getUserInfo: function() {
        // 从本地存储获取用户信息
        const userInfo = EnvAdapter.storage.getItem('userInfo');
        if (userInfo) {
            this.setData({
                userInfo: typeof userInfo === 'string' ? JSON.parse(userInfo) : userInfo
            });
        } else {
            // 如果没有用户信息，可以跳转到登录页面或使用默认信息
            this.setData({
                userInfo: {
                    avatar: '/assets/images/profile.png',
                    username: '游客',
                    userId: 'visitor'
                }
            });
        }
    },

    /**
     * 切换聊天面板
     */
    toggleChatPanel() {
        this.setData({
            chatVisible: !this.data.chatVisible
        });
        
        // 如果打开聊天面板，滚动到底部
        if (this.data.chatVisible) {
            setTimeout(() => {
                this.scrollToBottom();
            }, 300);
        }
    },
    
    /**
     * 导航到关于我们页面
     */
    navigateToAbout() {
        // 由于暂时没有关于我们页面，显示提示
        wx.showToast({
            title: '关于我们页面开发中',
            icon: 'none',
            duration: 2000
        });
    },

    /**
     * 处理退出登录
     */
    handleLogout() {
        wx.showModal({
            title: '提示',
            content: '确定要退出登录吗？',
            success: (res) => {
                if (res.confirm) {
                    // 清除用户信息
                    EnvAdapter.storage.removeItem('userInfo');
                    EnvAdapter.storage.removeItem('token');
                    
                    // 更新状态
                    this.setData({
                        userInfo: {
                            avatar: '/assets/images/profile.png',
                            username: '游客',
                            userId: 'visitor'
                        }
                    });
                    
                    // 提示用户
                    wx.showToast({
                        title: '已退出登录',
                        icon: 'success'
                    });
                }
            }
        });
    },

    /**
     * 处理消息输入变化
     */
    onMessageInputChange(e) {
        // 确保获取正确的输入值
        const value = e.detail.value || e.detail || '';
        
        // 判断是否可以发送消息
        const canSend = value.trim().length > 0 && !this.data.thinking;
        
        this.setData({
            messageInput: value,
            canSend: canSend
        });
    },

    /**
     * 显示重置确认UI
     */
    resetChat() {
        // 如果只有初始欢迎消息，无需确认直接重置
        if (this.data.messages.length > 1) {
            this.setData({
                confirmReset: true
            });
        } else {
            // 没有对话内容，直接重置
            this.performReset();
        }
    },

    /**
     * 取消重置
     */
    cancelReset() {
        this.setData({
            confirmReset: false
        });
    },

    /**
     * 执行重置
     */
    performReset() {
        // 重置状态
        this.setData({
            thinking: false,
            confirmReset: false,
            hasError: false,
            messages: [
                {
                    role: 'assistant',
                    content: '我是良策AI助手，有什么可以帮到您的吗？'
                }
            ]
        });
        
        // 提示用户
        wx.showToast({
            title: '已重置为新的聊天',
            icon: 'none'
        });
        
        // 滚动到底部
        setTimeout(() => {
            this.scrollToBottom();
        }, 100);
    },

    /**
     * 滚动到底部
     */
    scrollToBottom() {
        const query = wx.createSelectorQuery().in(this);
        query.select('.chat-messages').boundingClientRect();
        query.exec((res) => {
            if (res && res[0]) {
                wx.pageScrollTo({
                    scrollTop: res[0].height,
                    duration: 300
                });
            }
        });
    },

    /**
     * 发送消息
     */
    sendMessage() {
        const { messageInput, thinking } = this.data;
        
        // 如果正在思考中或消息为空，不发送
        if (thinking || !messageInput.trim()) {
            return;
        }
        
        // 添加用户消息到消息列表
        const updatedMessages = [...this.data.messages, {
            role: 'user',
            content: messageInput
        }];
        
        this.setData({
            messages: updatedMessages,
            messageInput: '',
            thinking: true,
            hasError: false,
            canSend: false  // 发送后禁用按钮
        });
        
        // 滚动到底部
        setTimeout(() => {
            this.scrollToBottom();
        }, 100);
        
        // 调用API发送消息
        this.callChatAPI(messageInput, updatedMessages);
    },

    /**
     * 调用聊天API
     */
    callChatAPI(message, updatedMessages) {
        // 构建请求参数
        const requestData = {
            message,
            sessionId: EnvAdapter.storage.getItem('sessionId') || this.generateSessionId()
        };
        
        // 模拟API响应（实际项目中应替换为真实API调用）
        setTimeout(() => {
            // 模拟成功响应
            const aiResponse = {
                role: 'assistant',
                content: `您发送的消息是: "${message}"\n\n这是一个模拟的AI回复，实际项目中应该连接到真实的API。`
            };
            
            this.setData({
                messages: [...updatedMessages, aiResponse],
                thinking: false,
                canSend: this.data.messageInput.trim().length > 0 // 更新发送按钮状态
            });
            
            // 滚动到底部
            setTimeout(() => {
                this.scrollToBottom();
            }, 100);
        }, 1500);
        
        // 实际API调用代码（暂时注释掉，避免报错）
        /*
        wx.request({
            url: 'https://api.example.com/chat', // 替换为实际的API地址
            method: 'POST',
            data: requestData,
            header: {
                'content-type': 'application/json',
                'Authorization': `Bearer ${EnvAdapter.storage.getItem('token') || ''}`
            },
            success: (res) => {
                if (res.statusCode === 200 && res.data) {
                    // 添加AI回复到消息列表
                    const aiResponse = {
                        role: 'assistant',
                        content: res.data.response || '抱歉，我无法回答这个问题。'
                    };
                    
                    this.setData({
                        messages: [...updatedMessages, aiResponse],
                        thinking: false,
                        canSend: this.data.messageInput.trim().length > 0 // 更新发送按钮状态
                    });
                    
                    // 保存会话ID
                    if (res.data.sessionId) {
                        EnvAdapter.storage.setItem('sessionId', res.data.sessionId);
                    }
                } else {
                    // 处理错误
                    this.handleApiError('请求失败，请稍后重试', updatedMessages);
                }
            },
            fail: (err) => {
                // 处理网络错误
                this.handleApiError('网络错误，请稍后重试', updatedMessages);
            },
            complete: () => {
                // 滚动到底部
                setTimeout(() => {
                    this.scrollToBottom();
                }, 100);
            }
        });
        */
    },

    /**
     * 处理API错误
     */
    handleApiError(errorMessage, messages) {
        // 设置错误状态
        this.setData({
            thinking: false,
            hasError: true,
            messages: [...messages, {
                role: 'assistant',
                content: `抱歉，我遇到了一些问题：${errorMessage}`
            }],
            canSend: this.data.messageInput.trim().length > 0 // 更新发送按钮状态
        });
        
        // 显示错误提示
        wx.showToast({
            title: errorMessage,
            icon: 'none'
        });
    },

    /**
     * 生成会话ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
})