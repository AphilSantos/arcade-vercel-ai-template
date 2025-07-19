import type { Attachment, UIMessage } from 'ai';

/**
 * Converts blob URLs to base64 data URLs for reliable AI model access
 * This fixes the issue where AI models can't access Vercel blob URLs in production
 */
export async function processAttachmentsForAI(attachments: Attachment[]): Promise<Attachment[]> {
    if (!attachments || attachments.length === 0) {
        return attachments;
    }

    const processedAttachments: Attachment[] = [];

    for (const attachment of attachments) {
        try {
            // Only process image attachments
            if (!attachment.contentType?.startsWith('image/')) {
                processedAttachments.push(attachment);
                continue;
            }

            console.log(`Processing attachment: ${attachment.name} (${attachment.contentType})`);

            // Fetch the blob content
            const response = await fetch(attachment.url);

            if (!response.ok) {
                console.error(`Failed to fetch attachment ${attachment.name}: ${response.status} ${response.statusText}`);
                // Keep original attachment if fetch fails
                processedAttachments.push(attachment);
                continue;
            }

            // Convert to buffer
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');

            // Create data URL
            const dataUrl = `data:${attachment.contentType};base64,${base64}`;

            console.log(`Converted ${attachment.name} to base64 data URL (${buffer.byteLength} bytes)`);

            // Create new attachment with data URL
            processedAttachments.push({
                ...attachment,
                url: dataUrl,
            });

        } catch (error) {
            console.error(`Error processing attachment ${attachment.name}:`, error);
            // Keep original attachment if processing fails
            processedAttachments.push(attachment);
        }
    }

    return processedAttachments;
}

/**
 * Processes messages to convert blob URLs in attachments to base64 data URLs
 */
export async function processMessagesForAI(messages: UIMessage[]): Promise<UIMessage[]> {
    const processedMessages: UIMessage[] = [];

    for (const message of messages) {
        if (message.experimental_attachments && message.experimental_attachments.length > 0) {
            const processedAttachments = await processAttachmentsForAI(message.experimental_attachments);

            processedMessages.push({
                ...message,
                experimental_attachments: processedAttachments,
            });
        } else {
            processedMessages.push(message);
        }
    }

    return processedMessages;
}