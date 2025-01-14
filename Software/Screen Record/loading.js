
document.onreadystatechange = function() {
    if (document.readyState !== "complete") {
        document.querySelector("body").style.visibility = "hidden";
        document.querySelector("#loader").style.visibility = "visible";
    } else {
        const loader = document.querySelector("#loader");
        fadeOut(loader);
        document.querySelector("body").style.visibility = "visible";
        
        // Add entrance animations to elements
        animateElements();
    }
};

function fadeOut(element) {
    let opacity = 1;
    const timer = setInterval(function() {
        if (opacity <= 0.1) {
            clearInterval(timer);
            element.style.display = 'none';
        }
        element.style.opacity = opacity;
        opacity -= opacity * 0.1;
    }, 50);
}

function animateElements() {
    // Animate navigation
    gsap.from('.nav-container', {
        duration: 1,
        y: -100,
        opacity: 0,
        ease: 'power4.out'
    });

    // Animate hero section
    gsap.from('.hero-section', {
        duration: 1.2,
        y: 100,
        opacity: 0,
        delay: 0.5,
        ease: 'power4.out'
    });

    // Animate service cards
    gsap.from('.service-card', {
        duration: 0.8,
        y: 50,
        opacity: 0,
        stagger: 0.2,
        delay: 1,
        ease: 'power3.out'
    });
}
