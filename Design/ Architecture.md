Meaningfully 框架架构总结
定位: AI 驱动的沟通技能学习平台（B2C SaaS）

技术栈:

前端: React 18 + TypeScript + Vite + Tailwind CSS + shadcn-ui
后端: Supabase (PostgreSQL + Edge Functions)
AI: OpenAI Whisper / analyze-voice（结束后完整转录）+ GPT-4o（教练分析）+ Google Gemini（音频优先实时反馈）
核心功能模块:

课程系统 - 6 大沟通类别，多种练习形式
语音录制与分析 - 客户端音频处理 + 服务端 AI 分析（语速/音调/停顿/填充词）
实时反馈 - 字幕由浏览器 SpeechRecognition 即时显示；Gemini 直接分析滚动音频片段，输出内容相关反应、卡壳追问、词汇高亮和高光判断
进度追踪 - XP 系统、连续学习、雷达图可视化
当前状态: Mock 数据演示阶段，无真实用户数据库连接
