import React from 'react';
import RagResponseCard from './RagResponseCard';

const MessageBubble = ({ message, onFollowUpClick, isLatest }) => {
    const isBot = message.type === 'bot';

    return (
        <div className="flex flex-col w-full items-start">
            {/* Content */}
            {isBot ? (
                <RagResponseCard
                    data={message.content}
                    onFollowUpClick={onFollowUpClick}
                    isLatest={isLatest}
                />
            ) : (
                // Modern User Message: Consistent text-xs size to match followups
                <div className="bg-purple-50 text-purple-900 px-4 py-2.5 rounded-2xl shadow-sm border border-purple-100 max-w-2xl font-medium tracking-wide text-xs">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
