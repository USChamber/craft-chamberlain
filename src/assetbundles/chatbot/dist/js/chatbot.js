window.chamberlain = window.chamberlain || {};

chamberlain.init = () => {
    console.log('initializing chamberlain chatbot');
    chamberlain.chatInitiated = false;
    chamberlain.userHasInteracted = false;

    const container = document.querySelector(chamberlain.config.containerElementSelector);
    const template = document.querySelector('#ChamberlainTemplate');
    if (location.href.includes('co.ddev.site')) {
        container.after(template.content.cloneNode(true));
    } else {
        container.appendChild(template.content.cloneNode(true));
    }
    chamberlain.element = document.getElementById('Chamberlain');

    // fix some height issues that might occur
    const articleBodyCenter = document.querySelector('.article-body-center');
    const articleBodyRight = document.querySelector('.article-body-right');
    if (articleBodyCenter && articleBodyRight) {
        const height = articleBodyCenter.offsetHeight;
        articleBodyRight.style.height = `${height}px`;
    }

    // handle opening and closing of the chat window
    chamberlain.element.querySelector('[data-chat-logo-img]').addEventListener('click', (e) => {
        e.preventDefault();
        if (chamberlain.element.classList.contains('closed')) {
            openChatWindow(true);
        } else {
            closeChatWindow();
        }
    });

    window.addEventListener('scroll', () => {
        if (chamberlain.userHasInteracted) {
            console.log('Chat interaction in progress, ignoring scroll event.');
            return;
        }
        const scrollPosition = window.scrollY + window.innerHeight;
        const articleBodyCenterHeight = document.querySelector(chamberlain.config.articleTextSelector).offsetHeight;

        if (scrollPosition > articleBodyCenterHeight / 1.5) {
            openChatWindow(false);
        } else {
            closeChatWindow();
        }
    });

    chamberlain.element.querySelector('[data-chat-logo-close]').addEventListener('click', (e) => {
        e.preventDefault();
        closeChatWindow();
    });

    // Handle chat text input
    chamberlain.element.querySelector('[data-chat-text-input] input').addEventListener('keypress', async (e) => {
        chamberlain.userHasInteracted = true; // Set chat interaction to true when user types
        if (e.key === 'Enter' && e.target.value.trim() !== '') {
            e.preventDefault();
            await addMessage(e.target.value, 'user');
            // Handle the user input here
            // You can call another function to process the input
            console.log('User input:', e.target.value);
            e.target.value = ''; // Clear the input field
        }
    });
};

// base chat initiation logic
const initiateChat = () => {
    if (chamberlain.chatInitiated) {
        return;
    }
    chamberlain.chatInitiated = true;
    handleResponse(50);
};

const openChatWindow = (userInitiated) => {
    chamberlain.element.classList.remove('closed');
    chamberlain.element.querySelector('[data-chat-logo-img]').classList.remove('hidden');
    initiateChat();
    if (userInitiated) {
        chamberlain.userHasInteracted = true;
    }
};

const closeChatWindow = () => {
    chamberlain.element.classList.add('closed');
    chamberlain.element.querySelector('[data-chat-logo-img]').classList.add('hidden');
    chamberlain.userHasInteracted = false; // Reset chat interaction when closed
};

// utility functions for chatting

const addMessage = (message, type = 'user', pauseExecution = false) => {
    return new Promise((resolve) => {
        resetChatHeight();
        console.log('Adding message:', message, 'of type:', type);
        if (type === 'user' && !pauseExecution) {
            handleResponse(1000);
        }
        const messageContainer = chamberlain.element.querySelector('[data-chat-window]');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.setAttribute('data-chat-bubble', '');
        messageElement.setAttribute(`data-chat-${type}`, '');
        messageElement.textContent = '';
        messageContainer.appendChild(messageElement);
        // Imitate typing effect
        if (type === 'user') {
            messageElement.textContent = message; // For user messages, set immediately
            messageContainer.scrollTop = messageContainer.scrollHeight;
            resetChatHeight();
            resolve();
        } else {
            typeTextLikeAI(messageElement, message, {
                speed: 30,
                speedVariation: 10,
                pauseOnPunctuation: 150,
                pauseOnNewline: 300,
                cursor: true,
                cursorChar: '|'
            }).then(() => {
                console.log('Message typing completed:', message);
                messageContainer.scrollTop = messageContainer.scrollHeight;
                resetChatHeight();
                resolve();

            }).catch(error => {
                console.error('Error typing message:', error);
                messageElement.textContent = message; // Fallback to set text directly
                messageContainer.scrollTop = messageContainer.scrollHeight;
                resetChatHeight();
                resolve();
            });
        }
    });

};

const setupResponseType = (type = text, options = []) => {
    if (type === 'redirect') {
        // delay for 3 seconds before redirecting
        addMessage(`You will be redirected in 3 seconds.`, 'bot');
        setTimeout(() => {
            window.location.href = options[0];
        }, 3000);
         // Redirect to the specified URL
    } else if (type === 'text') {
        chamberlain.element.querySelector('[data-chat-response-instruction-text]').innerHTML = 'Type Below'; //Choose a response
        chamberlain.element.querySelector('[data-chat-text-input] input').classList.remove('hidden');
        chamberlain.element.querySelector('[data-chat-text-input] input').disabled = false;
        chamberlain.element.querySelector('[data-chat-text-input] input').focus();
        resetChatHeight();

    }  else if (type === 'dropdowns') {
        chamberlain.element.querySelector('[data-chat-response-instruction-text]').innerHTML = 'Choose a response';
        chamberlain.element.querySelector('[data-chat-text-buttons-container]').classList.remove('hidden');
        const dropdownContainer = chamberlain.element.querySelector('[data-chat-text-buttons]');
        dropdownContainer.innerHTML = ''; // Clear existing buttons

        options.forEach(option => {
            const dropdown = document.createElement('select');
            dropdown.setAttribute('data-chat-text-dropdown', '');
            const label = document.createElement('label');
            label.textContent = option.label;
            label.setAttribute('for', slugify(`dropdown-${option.label}`));
            dropdown.id = slugify(`dropdown-${option.label}`);
            option.options.forEach(opt => {
                const optionElement = document.createElement('option');
                optionElement.value = opt;
                optionElement.textContent = opt;
                dropdown.appendChild(optionElement);
            });
            dropdown.addEventListener('change', async () => {
                const selectedValue = dropdown.value;
                let pauseExecution = true
                if (dropdown.id === 'dropdown-number-of-employees') {
                    pauseExecution = false
                }
                await addMessage(selectedValue, 'user', pauseExecution);
            });
            dropdownContainer.appendChild(label);
            dropdownContainer.appendChild(dropdown);
            resetChatHeight();
        });
    } else {
        chamberlain.element.querySelector('[data-chat-response-instruction-text]').innerHTML = 'Choose a response';
        chamberlain.element.querySelector('[data-chat-text-buttons-container]').classList.remove('hidden');
        // Clear any existing buttons
        options.forEach(option => {
            const button = document.createElement('button');
            button.setAttribute('data-chat-text-button', '');
            button.textContent = option;
            button.addEventListener('click', async () => {
                await addMessage(option, 'user');
                // Handle the response for the selected option
                // You can call another function here to handle the response
            });
            // add them one at at a time, with a little delay
            setTimeout(() => {
                chamberlain.element.querySelector('[data-chat-text-buttons]').appendChild(button);
                resetChatHeight();
            }, variableTime(400, 1500));
        });
    }
};

const handleResponse = (delay = 1000) => {
    lockChatInteraction();
    const url = window.location.protocol + '//' + window.location.host + '/actions/_chamberlain/chat/';
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({state: chamberlain.state, delay}),
    })
        .then(res => res.json())
        .then(async data => {
            if (data.status === 'success') {
                console.log('Response received:', data);
                chamberlain.state = data.currentState; // Update the state
                await addMessage(data.response.message, 'bot');
                setupResponseType(data.response.responseType, data.response.options);
            } else {
                await addMessage('Sorry, I could not process your request.', 'bot');
            }
        })
        .catch(async error => {
            console.error('Error:', error);
            await addMessage('An error occurred while processing your request.', 'bot');
        });
};

const lockChatInteraction = () => {
    chamberlain.element.querySelector('[data-chat-text-input] input').disabled = true; // Disable input field
    chamberlain.element.querySelector('[data-chat-text-buttons]').innerHTML = ''; // Clear buttons
};

const variableTime = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/** AI TYPING STUFF **/

// Enhanced version with token-like chunking (more realistic)
async function typeTextLikeAI(element, text, options = {}) {
    const {
        chunkSize = 3, // Average characters per "token"
        chunkVariation = 2, // Variation in chunk size
        chunkDelay = 50, // Delay between chunks
        chunkDelayVariation = 30, // Variation in chunk delay
        cursor = true,
        cursorChar = '|'
    } = options;

    element.innerHTML = '';

    // Create cursor if needed
    if (cursor) {
        const cursorSpan = document.createElement('span');
        cursorSpan.className = 'typing-cursor';
        cursorSpan.textContent = cursorChar;
        cursorSpan.style.cssText = `
      animation: blink 1s infinite;
      color: #666;
    `;
        element.appendChild(cursorSpan);
    }

    // Create container for typed content
    const contentSpan = document.createElement('span');
    element.insertBefore(contentSpan, element.firstChild);

    // Add CSS for cursor animation
    if (!document.querySelector('#typing-cursor-styles')) {
        const style = document.createElement('style');
        style.id = 'typing-cursor-styles';
        style.textContent = `
      @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
    `;
        document.head.appendChild(style);
    }

    // Parse HTML and extract text nodes with their parent structure
    function parseHTMLStructure(htmlString) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;

        const textSegments = [];

        function traverse(node, parentTags = []) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (text.trim()) { // Only add non-empty text
                    textSegments.push({
                        text: text,
                        tags: [...parentTags]
                    });
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagInfo = {
                    tagName: node.tagName.toLowerCase(),
                    attributes: {}
                };

                // Copy attributes
                for (let attr of node.attributes) {
                    tagInfo.attributes[attr.name] = attr.value;
                }

                const newParentTags = [...parentTags, tagInfo];

                for (let child of node.childNodes) {
                    traverse(child, newParentTags);
                }
            }
        }

        traverse(tempDiv);
        return textSegments;
    }

    // Build HTML structure as we type
    function buildHTMLAtPosition(segments, currentPos) {
        let html = '';
        let charCount = 0;

        for (let segment of segments) {
            const segmentStart = charCount;
            const segmentEnd = charCount + segment.text.length;

            if (currentPos <= segmentStart) {
                break; // Haven't reached this segment yet
            }

            // Open tags
            for (let tag of segment.tags) {
                html += `<${tag.tagName}`;
                for (let [attr, value] of Object.entries(tag.attributes)) {
                    html += ` ${attr}="${value}"`;
                }
                html += '>';
            }

            // Add text (partial if we're in the middle of this segment)
            const textToAdd = currentPos >= segmentEnd
                ? segment.text
                : segment.text.substring(0, currentPos - segmentStart);

            html += textToAdd;

            // Close tags (in reverse order)
            for (let i = segment.tags.length - 1; i >= 0; i--) {
                html += `</${segment.tags[i].tagName}>`;
            }

            charCount = segmentEnd;

            if (currentPos < segmentEnd) {
                break; // We're in the middle of this segment
            }
        }

        return html;
    }

    // Check if input contains HTML
    const hasHTML = /<[^>]+>/.test(text);

    if (!hasHTML) {
        // Simple text content - use original logic
        let currentText = '';
        let i = 0;

        while (i < text.length) {
            // Determine chunk size with variation
            let currentChunkSize = Math.max(1, chunkSize + Math.floor((Math.random() - 0.5) * chunkVariation * 2));

            // Add chunk to text
            let chunk = '';
            for (let j = 0; j < currentChunkSize && i < text.length; j++) {
                chunk += text[i];
                i++;
            }

            currentText += chunk;
            contentSpan.textContent = currentText;
            keepScrolledToBottom(chamberlain.element.querySelector('[data-chat-window]'));
            // Wait before next chunk
            const delay = chunkDelay + (Math.random() - 0.5) * chunkDelayVariation * 2;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    } else {
        // HTML content - parse and type while preserving structure
        const segments = parseHTMLStructure(text);
        const totalText = segments.reduce((sum, seg) => sum + seg.text, '');
        let currentPos = 0;

        while (currentPos < totalText.length) {
            // Determine chunk size with variation
            let currentChunkSize = Math.max(1, chunkSize + Math.floor((Math.random() - 0.5) * chunkVariation * 2));

            // Advance position by chunk size
            currentPos = Math.min(currentPos + currentChunkSize, totalText.length);

            // Build HTML up to current position
            const htmlAtPosition = buildHTMLAtPosition(segments, currentPos);
            contentSpan.innerHTML = htmlAtPosition;

            // Wait before next chunk
            const delay = chunkDelay + (Math.random() - 0.5) * chunkDelayVariation * 2;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    // Remove cursor after completion
    if (cursor) {
        setTimeout(() => {
            const cursorElement = element.querySelector('.typing-cursor');
            if (cursorElement) {
                cursorElement.remove();
            }
        }, 1000);
    }
}

const slugify = (str) => {
    return str
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, ''); // Trim - from end of text
}

const resetChatHeight = () => {
    const chatInteractionHeight = chamberlain.element.querySelector('[data-chat-interaction]').offsetHeight;
    chamberlain.element.querySelector('[data-chat-window]').style.marginBottom = `${chatInteractionHeight}px`;
}

function keepScrolledToBottom(element) {
    // Check if we're already at or near the bottom (within 5px tolerance)
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight <= 5;

    if (isAtBottom) {
        // Scroll to the very bottom
        element.scrollTop = element.scrollHeight;
    }
}