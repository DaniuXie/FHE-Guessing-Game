/**
 * 解密进度展示组件
 * 显示实时的解密进度和状态
 */

import React from 'react';
import { DecryptionStatus } from '../hooks/useDecryption';

interface DecryptionProgressProps {
  status: DecryptionStatus;
  progress: number;
  error: string | null;
}

interface StatusConfig {
  icon: string;
  text: string;
  color: string;
  bgColor: string;
  spinning?: boolean;
}

export function DecryptionProgress({ status, progress, error }: DecryptionProgressProps) {
  
  const statusConfig: Record<DecryptionStatus, StatusConfig> = {
    idle: {
      icon: '⏳',
      text: '准备解密',
      color: 'text-gray-400',
      bgColor: 'bg-gray-900/30'
    },
    requesting: {
      icon: '📝',
      text: '提交解密请求...',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      spinning: true
    },
    polling: {
      icon: '🔐',
      text: 'Gateway 解密中...',
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/30',
      spinning: true
    },
    waiting: {
      icon: '⏰',
      text: '等待链上回调...',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-900/30',
      spinning: true
    },
    success: {
      icon: '✅',
      text: '解密完成！',
      color: 'text-green-400',
      bgColor: 'bg-green-900/30'
    },
    failed: {
      icon: '❌',
      text: '解密失败',
      color: 'text-red-400',
      bgColor: 'bg-red-900/30'
    }
  };
  
  const config = statusConfig[status];
  
  return (
    <div className={`p-6 rounded-lg ${config.bgColor} border-2 border-gray-700`}>
      {/* 状态标题 */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-2xl ${config.spinning ? 'animate-pulse' : ''}`}>
          {config.icon}
        </span>
        <span className={`text-lg font-semibold ${config.color}`}>
          {config.text}
        </span>
      </div>
      
      {/* 进度条 */}
      <div className="mb-3">
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              status === 'success' ? 'bg-green-500' : 
              status === 'failed' ? 'bg-red-500' : 
              'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-400 mt-1 text-center">
          {progress}%
        </p>
      </div>
      
      {/* 阶段说明 */}
      {status === 'requesting' && (
        <div className="text-sm text-gray-300 text-center p-3 bg-gray-800/50 rounded">
          <p>正在提交解密请求到区块链...</p>
          <p className="text-xs text-gray-400 mt-1">预计 10-30 秒</p>
        </div>
      )}
      
      {status === 'polling' && (
        <div className="text-sm text-gray-300 text-center p-3 bg-gray-800/50 rounded">
          <p>正在等待 Zama Gateway 完成 FHE 解密...</p>
          <p className="text-xs text-gray-400 mt-1">这是最耗时的步骤，预计 30-90 秒</p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}
      
      {status === 'waiting' && (
        <div className="text-sm text-gray-300 text-center p-3 bg-gray-800/50 rounded">
          <p>Gateway 已解密，等待智能合约回调...</p>
          <p className="text-xs text-gray-400 mt-1">通常只需 5-15 秒</p>
        </div>
      )}
      
      {/* 错误信息 */}
      {error && (
        <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded text-sm text-red-300">
          <strong className="text-red-400">错误：</strong> {error}
        </div>
      )}
      
      {/* 成功信息 */}
      {status === 'success' && (
        <div className="mt-3 p-3 bg-green-900/30 border border-green-700 rounded text-sm text-green-300">
          <p className="font-semibold">🎉 游戏结果已成功解密并上链！</p>
          <p className="text-xs text-green-400 mt-1">刷新页面查看详细结果</p>
        </div>
      )}
      
      {/* 技术说明（仅在轮询时显示）*/}
      {status === 'polling' && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <details className="text-xs text-gray-400">
            <summary className="cursor-pointer hover:text-gray-300">
              🔍 技术细节
            </summary>
            <div className="mt-2 space-y-1 pl-4">
              <p>• 正在轮询 Zama Gateway API</p>
              <p>• 每 5 秒检查一次解密状态</p>
              <p>• 最多尝试 60 次（5分钟）</p>
              <p>• 使用 FHE 技术保护隐私</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default DecryptionProgress;

