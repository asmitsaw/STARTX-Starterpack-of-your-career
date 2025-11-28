// Three.js 3D Scene
let scene, camera, renderer, particles;

function initThreeJS() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;

    // Scene setup
    scene = new THREE.Scene();
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true,
        antialias: true 
    });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setClearColor(0x000000, 0);
    
    // Create particles
    createParticles();
    
    // Animation loop
    animate();
}

function createParticles() {
    const geometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 10;
        positions[i + 1] = (Math.random() - 0.5) * 10;
        positions[i + 2] = (Math.random() - 0.5) * 10;
        
        colors[i] = Math.random() * 0.5 + 0.5;
        colors[i + 1] = Math.random() * 0.5 + 0.5;
        colors[i + 2] = 1;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (particles) {
        particles.rotation.x += 0.001;
        particles.rotation.y += 0.002;
    }
    
    renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Mobile navigation toggle
function initMobileNav() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .pricing-card, .news-card, .pitch-card, .achievement-card, .project-card');
    animateElements.forEach(el => observer.observe(el));
}

// Form handling
function initFormHandling() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Simulate form submission
            showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
            
            // Reset form
            this.reset();
        });
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Parallax effect
function initParallax() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.floating-card');
        
        parallaxElements.forEach((element, index) => {
            const speed = 0.5 + (index * 0.1);
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    });
}

// Typing animation
function initTypingAnimation() {
    const heroTitle = document.querySelector('.hero-title');
    if (!heroTitle) return;
    
    const text = heroTitle.textContent;
    heroTitle.textContent = '';
    
    let i = 0;
    const typeWriter = () => {
        if (i < text.length) {
            heroTitle.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    };
    
    typeWriter();
}

// Counter animation
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number');
    
    const animateCounter = (element) => {
        const target = parseInt(element.textContent.replace(/\D/g, ''));
        const suffix = element.textContent.replace(/\d/g, '');
        let current = 0;
        const increment = target / 100;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current) + suffix;
        }, 20);
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(counter => observer.observe(counter));
}

// 3D card effect
function init3DCards() {
    const cards = document.querySelectorAll('.pitch-card, .news-card, .feature-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
        });
    });
}

// Cursor trail effect
function initCursorTrail() {
    const cursor = document.createElement('div');
    cursor.className = 'cursor-trail';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: var(--primary-color);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        opacity: 0.6;
        transition: transform 0.1s ease;
    `;
    document.body.appendChild(cursor);
    
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    function animateCursor() {
        cursorX += (mouseX - cursorX) * 0.1;
        cursorY += (mouseY - cursorY) * 0.1;
        
        cursor.style.transform = `translate(${cursorX - 10}px, ${cursorY - 10}px)`;
        requestAnimationFrame(animateCursor);
    }
    
    animateCursor();
}

// Innovation Gallery Filtering
function initGalleryFiltering() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const pitchCards = document.querySelectorAll('.pitch-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            
            pitchCards.forEach(card => {
                const category = card.getAttribute('data-category');
                
                if (filter === 'all' || category === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.6s ease-out';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// AI Interview Functionality
function initAIInterview() {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-message');
    const timer = document.getElementById('timer');
    
    let interviewTime = 0;
    let timerInterval;
    
    // Start timer
    function startTimer() {
        timerInterval = setInterval(() => {
            interviewTime++;
            const minutes = Math.floor(interviewTime / 60);
            const seconds = interviewTime % 60;
            timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    // Add message to chat
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        
        if (isUser) {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <p>${content}</p>
                </div>
                <div class="message-avatar">You</div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">AI</div>
                <div class="message-content">
                    <p>${content}</p>
                </div>
            `;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // AI responses
    const aiResponses = [
        "That's a great answer! Can you elaborate on your experience with React hooks?",
        "Interesting approach. How would you handle state management in a large application?",
        "Good thinking! What's your experience with testing frameworks like Jest?",
        "Excellent! How do you approach code optimization and performance?",
        "That's insightful. Can you walk me through your debugging process?"
    ];
    
    let responseIndex = 0;
    
    // Send message function
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Add user message
        addMessage(message, true);
        userInput.value = '';
        
        // Simulate AI response
        setTimeout(() => {
            const aiResponse = aiResponses[responseIndex % aiResponses.length];
            addMessage(aiResponse);
            responseIndex++;
        }, 1000);
    }
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Start timer when interview begins
    startTimer();
}

// Profile Skill Animation
function initProfileAnimations() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const width = entry.target.style.width;
                entry.target.style.width = '0%';
                
                setTimeout(() => {
                    entry.target.style.width = width;
                }, 100);
            }
        });
    });
    
    skillBars.forEach(bar => observer.observe(bar));
}

// News Feed Interactions
function initNewsFeed() {
    const newsCards = document.querySelectorAll('.news-card');
    const loadMoreBtn = document.querySelector('.news-actions .btn-outline');
    const customizeBtn = document.querySelector('.news-actions .btn-primary');
    
    // Add click handlers to news cards
    newsCards.forEach(card => {
        card.addEventListener('click', () => {
            const title = card.querySelector('h3').textContent;
            showNotification(`Opening: ${title}`, 'info');
        });
    });
    
    // Load more news
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            showNotification('Loading more news...', 'info');
            // Simulate loading more news
            setTimeout(() => {
                showNotification('More news loaded successfully!', 'success');
            }, 2000);
        });
    }
    
    // Customize feed
    if (customizeBtn) {
        customizeBtn.addEventListener('click', () => {
            showNotification('Opening feed customization...', 'info');
        });
    }
}

// AI Session Overlay (Fullscreen) behaviors
function initAISessionOverlay() {
    const body = document.body;
    const sessionOverlay = document.getElementById('ai-session');
    const openSessionBtn = document.getElementById('open-session');
    const endSessionBtn = document.getElementById('end-session');
    const toggleMicBtn = document.getElementById('toggle-mic');
    const toggleCamBtn = document.getElementById('toggle-cam');
    const openEditorBtn = document.getElementById('open-editor');
    const closeEditorBtn = document.getElementById('close-editor');
    const editorPanel = document.getElementById('code-editor');
    const userStatus = document.getElementById('user-status');

    // May not exist on non-interview pages
    if (!sessionOverlay || !openSessionBtn) return;

    let editorUnlocked = false; // Unlock when AI asks coding question

    function openSession() {
        sessionOverlay.classList.add('active');
        body.classList.add('session-active');
    }

    function closeSession() {
        sessionOverlay.classList.remove('active');
        body.classList.remove('session-active');
        // Close editor if open
        editorPanel && editorPanel.classList.remove('open');
    }

    function togglePressed(btn, onIcon, offIcon) {
        const pressed = btn.getAttribute('aria-pressed') !== 'false';
        const next = !pressed;
        btn.setAttribute('aria-pressed', String(next));
        const icon = btn.querySelector('i');
        if (icon) {
            icon.classList.remove(onIcon, offIcon);
            icon.classList.add(next ? onIcon : offIcon);
        }
        return next;
    }

    // Open session
    openSessionBtn.addEventListener('click', () => {
        openSession();
    });

    // End session with confirm
    if (endSessionBtn) {
        endSessionBtn.addEventListener('click', () => {
            const ok = confirm('End the interview session?');
            if (ok) closeSession();
        });
    }

    // Toggle mic
    if (toggleMicBtn) {
        toggleMicBtn.addEventListener('click', () => {
            const on = togglePressed(toggleMicBtn, 'fa-microphone', 'fa-microphone-slash');
            if (userStatus) {
                const parts = userStatus.textContent.split('·');
                const camChunk = parts[1] ? parts[1].trim() : 'Cam On';
                userStatus.textContent = `${on ? 'Mic On' : 'Mic Off'} · ${camChunk}`;
            }
        });
    }

    // Toggle cam
    if (toggleCamBtn) {
        toggleCamBtn.addEventListener('click', () => {
            const on = togglePressed(toggleCamBtn, 'fa-video', 'fa-video-slash');
            if (userStatus) {
                const parts = userStatus.textContent.split('·');
                const micChunk = parts[0] ? parts[0].trim() : 'Mic On';
                userStatus.textContent = `${micChunk} · ${on ? 'Cam On' : 'Cam Off'}`;
            }
        });
    }

    // Open editor (gated)
    if (openEditorBtn) {
        openEditorBtn.addEventListener('click', () => {
            if (!editorUnlocked) {
                showNotification('Please wait — the code editor will unlock once the AI interviewer asks a coding question.', 'info');
                return;
            }
            editorPanel.classList.add('open');
        });
    }

    // Close editor
    if (closeEditorBtn) {
        closeEditorBtn.addEventListener('click', () => {
            editorPanel.classList.remove('open');
        });
    }

    // Public hook to unlock editor later (e.g., when AI asks coding)
    window.unlockInterviewEditor = function() {
        editorUnlocked = true;
        showNotification('Code editor unlocked for the coding question.', 'success');
    };

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if (!sessionOverlay.classList.contains('active')) return;
        if (e.key === 'm' || e.key === 'M') {
            e.preventDefault();
            toggleMicBtn && toggleMicBtn.click();
        } else if (e.key === 'c' || e.key === 'C') {
            e.preventDefault();
            toggleCamBtn && toggleCamBtn.click();
        } else if (e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            if (!editorUnlocked) {
                showNotification('Please wait — the code editor will unlock for coding questions.', 'info');
            } else {
                if (editorPanel.classList.contains('open')) {
                    editorPanel.classList.remove('open');
                } else {
                    editorPanel.classList.add('open');
                }
            }
        }
    });
}

// Initialize all functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initThreeJS();
    initSmoothScrolling();
    initMobileNav();
    initNavbarScroll();
    initScrollAnimations();
    initFormHandling();
    initParallax();
    initTypingAnimation();
    initCounterAnimation();
    init3DCards();
    initCursorTrail();
    initGalleryFiltering();
    initAIInterview();
    initProfileAnimations();
    initNewsFeed();
    initAISessionOverlay();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1rem;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .navbar.scrolled {
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .nav-menu.active {
        display: flex;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        flex-direction: column;
        padding: 1rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
`;
document.head.appendChild(style); 