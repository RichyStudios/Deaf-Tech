document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');

    menuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
            navLinks.classList.remove('active');
        }
    });
});

// Add form submission handling
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Show loading state
    const btn = this.querySelector('.send-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    // Submit the form
    fetch('send_email.php', {
        method: 'POST',
        body: new FormData(this)
    })
    .then(response => {
        btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
        this.reset();
        
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 3000);
    })
    .catch(error => {
        btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 3000);
    });
});
