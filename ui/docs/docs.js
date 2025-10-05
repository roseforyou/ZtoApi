// Tab functionality for documentation page
function openTab(evt, tabName) {
    // Hide all tab content
    const tabContents = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
    }
    
    // Remove active class from all tab buttons
    const tabLinks = document.getElementsByClassName("tablinks");
    for (let i = 0; i < tabLinks.length; i++) {
        tabLinks[i].classList.remove("active");
    }
    
    // Show the specific tab content
    document.getElementById(tabName).style.display = "block";
    
    // Add active class to the button that opened the tab
    evt.currentTarget.classList.add("active");
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add copy functionality to code examples and response blocks
    const codeBlocks = document.querySelectorAll('.example, .response');
    codeBlocks.forEach(block => {
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.innerHTML = '📋 Copy';
        copyButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            z-index: 10;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        `;
        
        // Add hover effect
        copyButton.addEventListener('mouseenter', () => {
            copyButton.style.transform = 'translateY(-2px)';
            copyButton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
        });
        
        copyButton.addEventListener('mouseleave', () => {
            copyButton.style.transform = 'translateY(0)';
            copyButton.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
        });
        
        // Make the block container relative positioned
        block.style.position = 'relative';
        
        // Add copy button to block
        block.appendChild(copyButton);
        
        // Add click handler
        copyButton.addEventListener('click', function() {
            const text = block.textContent.trim();
            navigator.clipboard.writeText(text).then(() => {
                copyButton.innerHTML = '✅ Copied!';
                copyButton.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                setTimeout(() => {
                    copyButton.innerHTML = '📋 Copy';
                    copyButton.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                copyButton.innerHTML = '❌ Error';
                copyButton.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
                setTimeout(() => {
                    copyButton.innerHTML = '📋 Copy';
                    copyButton.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
                }, 2000);
            });
        });
    });
    
    // Add syntax highlighting simulation
    const codeElements = document.querySelectorAll('code');
    codeElements.forEach(code => {
        if (!code.closest('.copy-button')) {
            code.style.fontFamily = "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace";
            code.style.background = 'rgba(102, 126, 234, 0.1)';
            code.style.padding = '2px 6px';
            code.style.borderRadius = '4px';
            code.style.fontSize = '0.9em';
        }
    });
});