// Debug script for player interface
console.log('🔍 Debug script loaded');

// Check localStorage for device code
const savedCode = localStorage.getItem('deviceCode');
console.log('🔍 Saved device code in localStorage:', savedCode);

// Set the device code if it's missing (for testing)
if (!savedCode) {
    localStorage.setItem('deviceCode', '9J4C4FWQ');
    console.log('🔍 Set device code to 9J4C4FWQ for testing');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DOM loaded, checking elements...');
    
    // Wait a bit for the player.js to initialize
    setTimeout(() => {
        const input = document.getElementById('deviceCodeInput');
        const button = document.getElementById('connectButton');
        const content = document.getElementById('content');
        
        console.log('🔍 Input element:', input);
        console.log('🔍 Button element:', button);
        console.log('🔍 Content element:', content);
        console.log('🔍 Content HTML:', content ? content.innerHTML.substring(0, 300) + '...' : 'null');
        
        if (input && button) {
            console.log('✅ Elements found successfully');
            
            // Add test functionality
            button.addEventListener('click', function() {
                const code = input.value.trim().toUpperCase();
                console.log('🔍 Device code entered:', code);
                alert('Device code entered: ' + code);
            });
            
            // Make sure elements are visible
            input.style.display = 'block';
            button.style.display = 'block';
            
            console.log('🔍 Input visibility:', window.getComputedStyle(input).display);
            console.log('🔍 Button visibility:', window.getComputedStyle(button).display);
            
        } else {
            console.error('❌ Elements not found!');
            console.log('🔍 Available elements with IDs:');
            const elementsWithIds = document.querySelectorAll('[id]');
            elementsWithIds.forEach(el => {
                console.log(`  - ${el.id}: ${el.tagName}`);
            });
        }
    }, 1000); // Wait 1 second for player.js to initialize
    
    // Check if content is being replaced
    const content = document.getElementById('content');
    if (content) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    console.log('🔍 Content changed:', mutation.target);
                    console.log('🔍 New content preview:', mutation.target.innerHTML.substring(0, 200) + '...');
                    
                    // Check if input elements are still there after content change
                    setTimeout(() => {
                        const newInput = document.getElementById('deviceCodeInput');
                        const newButton = document.getElementById('connectButton');
                        console.log('🔍 After content change - Input:', !!newInput, 'Button:', !!newButton);
                    }, 100);
                }
            });
        });
        
        observer.observe(content, { childList: true, subtree: true });
    }
});

// Check every 3 seconds if elements are still there
setInterval(() => {
    const input = document.getElementById('deviceCodeInput');
    const button = document.getElementById('connectButton');
    
    if (!input || !button) {
        console.warn('⚠️ Elements disappeared! Input:', !!input, 'Button:', !!button);
        
        // Try to find what's in the content now
        const content = document.getElementById('content');
        if (content) {
            console.log('🔍 Current content:', content.innerHTML.substring(0, 300) + '...');
        }
    } else {
        console.log('✅ Elements still present');
    }
}, 3000);