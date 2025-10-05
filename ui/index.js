// Dark mode toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const sunIcon = themeToggle.querySelector('.sun-icon');
const moonIcon = themeToggle.querySelector('.moon-icon');

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    
    sunIcon.style.display = isDark ? 'none' : 'block';
    moonIcon.style.display = isDark ? 'block' : 'none';
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Smooth scrolling for navigation dots
const navDots = document.querySelectorAll('.nav-dot');
const sections = document.querySelectorAll('section');

navDots.forEach(dot => {
    dot.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = dot.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Update active nav dot on scroll
const observerOptions = {
    root: null,
    rootMargin: '-50% 0px',
    threshold: 0
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('id');
            navDots.forEach(dot => {
                dot.classList.remove('active');
                if (dot.getAttribute('data-section') === sectionId) {
                    dot.classList.add('active');
                }
            });
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

// Animated counter for stats
const animateCounter = (element, target) => {
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const updateCounter = () => {
        current += step;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };
    
    updateCounter();
};

// Trigger counter animation when stats are visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const targetValue = stat.getAttribute('data-target');
                if (targetValue !== null) {
                    const target = parseFloat(targetValue);
                    animateCounter(stat, target);
                }
            });
            entry.target.classList.add('animated');
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// Scroll to top button
const scrollToTopBtn = document.getElementById('scrollToTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('visible');
    } else {
        scrollToTopBtn.classList.remove('visible');
    }
});

scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 3D perspective tilt effect for cards - enhanced with button 3D
const cards = document.querySelectorAll('[data-tilt]');
console.log('Found cards:', cards.length);

cards.forEach((card, index) => {
    console.log(`Setting up card ${index + 1}`);
    
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Reduced intensity for more subtle effect
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;
        
        // Apply the 3D transform to the card
        card.style.setProperty('transform', `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`, 'important');
        card.style.setProperty('box-shadow', `${rotateY}px ${rotateX}px 15px rgba(0, 0, 0, 0.2)`, 'important');
        
        // Enhanced 3D effect for the button
        const button = card.querySelector('.card-link');
        if (button) {
            // Make button float even more and respond to tilt
            const buttonRotateX = -rotateX * 0.5; // Counter-rotate slightly
            const buttonRotateY = -rotateY * 0.5;
            const buttonTranslateZ = 15 + Math.abs(rotateX) + Math.abs(rotateY);
            
            button.style.setProperty('transform', `translateZ(${buttonTranslateZ}px) rotateX(${buttonRotateX}deg) rotateY(${buttonRotateY}deg) scale(1.05)`, 'important');
            button.style.setProperty('box-shadow', `0 ${10 + Math.abs(rotateY)}px ${25 + Math.abs(rotateX)}px rgba(0, 0, 0, 0.4), 0 0 ${20 + Math.abs(rotateX) + Math.abs(rotateY)}px var(--glow-color)`, 'important');
        }
    });
    
    card.addEventListener('mouseleave', () => {
        // Reset card transform
        card.style.removeProperty('transform');
        card.style.removeProperty('box-shadow');
        
        // Reset button to floating state
        const button = card.querySelector('.card-link');
        if (button) {
            button.style.setProperty('transform', 'translateZ(10px)', 'important');
            button.style.setProperty('box-shadow', '0 8px 25px rgba(0, 0, 0, 0.3), 0 0 20px var(--glow-color)', 'important');
        }
    });
});

// Add loading animation
window.addEventListener('load', () => {
    body.classList.add('loaded');
});