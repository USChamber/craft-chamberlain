window.chamberlain = window.chamberlain || {};

chamberlain.init = () => {
    console.log('initializing chamberlain chatbot');
    chamberlain.chatInitiated = false;
    chamberlain.userHasInteracted = false;

    const container = document.querySelector(chamberlain.config.containerElementSelector);
    const template = document.querySelector('#ChamberlainTemplate');
    container.appendChild(template.content.cloneNode(true));
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
        const articleBodyCenterHeight = articleBodyCenter.offsetHeight;

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

    handleResponse('initiation', true);
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

const addMessage = (message, type = 'user') => {
    return new Promise((resolve) => {
        console.log('Adding message:', message, 'of type:', type);
        if (type === 'user') {
            handleResponse(message);
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
                resolve();

            }).catch(error => {
                console.error('Error typing message:', error);
                messageElement.textContent = message; // Fallback to set text directly
                messageContainer.scrollTop = messageContainer.scrollHeight;
                resolve();
            });
        }
    });

};

const setupResponseType = (type = text, options = []) => {
    console.log('setting up response type:', type, options);
    if (type === 'redirect') {
        window.location.href = options[0]; // Redirect to the specified URL
    } else if (type === 'text') {
        chamberlain.element.querySelector('[data-chat-text-input] input').classList.remove('hidden');
        chamberlain.element.querySelector('[data-chat-text-input] input').focus();
    } else {
        chamberlain.element.querySelector('[data-chat-text-buttons-container]').classList.remove('hidden');
        // Clear any existing buttons
        options.forEach(option => {
            console.log('adding option button:', option);
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
                const chatInteractionHeight = chamberlain.element.querySelector('[data-chat-interaction]').offsetHeight;
                console.log('Chat interaction height:', chatInteractionHeight);
                chamberlain.element.querySelector('[data-chat-window]').style.marginBottom = `${chatInteractionHeight}px`;
            }, variableTime(400, 1500));
        });
    }
};

const handleResponse = (message = '', skipDelay = false) => {
    lockChatInteraction();
    fetch('https://uschamber.ddev.site/actions/_chamberlain/chat/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({message, skipDelay}),
    })
        .then(res => res.json())
        .then(async data => {
            if (data.status === 'success') {
                await addMessage(data.message, 'bot');
                setupResponseType(data.responseType, data.options);
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
        chunkSize = 3,        // Average characters per "token"
        chunkVariation = 2,   // Variation in chunk size
        chunkDelay = 50,      // Delay between chunks
        chunkDelayVariation = 30, // Variation in chunk delay
        cursor = true,
        cursorChar = '|'
    } = options;

    element.textContent = '';

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

    const textSpan = document.createElement('span');
    element.insertBefore(textSpan, element.firstChild);

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
        textSpan.textContent = currentText;

        // Wait before next chunk
        const delay = chunkDelay + (Math.random() - 0.5) * chunkDelayVariation * 2;
        await new Promise(resolve => setTimeout(resolve, delay));
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