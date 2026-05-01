document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================================================
       1. JĘZYKI (i18n)
       ========================================================================== */
    const langSelect = document.getElementById('langSelect');
    
    function changeLanguage(lang) {
        document.querySelectorAll('.tr').forEach(el => { if (el.dataset[lang]) el.innerHTML = el.dataset[lang]; });
        document.querySelectorAll('.tr-ph').forEach(el => { if (el.dataset[lang]) el.placeholder = el.dataset[lang]; });
        document.documentElement.lang = lang;
        langSelect.value = lang; 
        localStorage.setItem('preferredLang', lang); 
    }

    changeLanguage(document.documentElement.lang || "en");
    langSelect.addEventListener('change', e => changeLanguage(e.target.value));

    document.getElementById('current-year').textContent = new Date().getFullYear();

    /* ==========================================================================
       2. NAWIGACJA SCROLL (Zoptymalizowana przez IntersectionObserver)
       ========================================================================== */
    const navbar = document.getElementById('navbar');
    const sentinel = document.getElementById('nav-sentinel');

    if (sentinel && navbar) {
        const navObserver = new IntersectionObserver((entries) => {
            navbar.classList.toggle('scrolled', !entries[0].isIntersecting);
        }, { threshold: 0 });
        
        navObserver.observe(sentinel);
    }

    /* ==========================================================================
       3. SCROLL REVEAL
       ========================================================================== */
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                observer.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.reveal-up').forEach(el => {
        if(el.closest('.grid') || el.closest('.collage-grid') || el.closest('.gallery-grid') || el.closest('.certificate-images-container') || el.closest('.social-links') || ['INPUT','TEXTAREA','BUTTON'].includes(el.tagName)) {
            let index = 0;
            let sibling = el.previousElementSibling;
            while (sibling) {
                index++;
                sibling = sibling.previousElementSibling;
            }
            el.style.transitionDelay = `${index * 0.12}s`; 
        }
        revealObserver.observe(el);
    });

    /* ==========================================================================
       4. WIDEO KARUZELA I ZOPTYMALIZOWANY SWIPE
       ========================================================================== */
    let videoIdx = 0;
    const videoTrack = document.getElementById('video-track');
    
    function moveVideoCarousel(dir) {
        if (!videoTrack) return;
        const count = videoTrack.children.length;
        videoIdx = (videoIdx + dir + count) % count;
        videoTrack.style.transform = `translateX(-${videoIdx * 100}%)`;
    }

    document.getElementById('btn-prev-vid')?.addEventListener('click', () => moveVideoCarousel(-1));
    document.getElementById('btn-next-vid')?.addEventListener('click', () => moveVideoCarousel(1));

    let touchstartX = 0;
    let touchstartY = 0;
    let touchstartTime = 0; 
    const videoWrapper = document.getElementById('video-wrapper');

    videoWrapper?.addEventListener('touchstart', e => {
        touchstartX = e.changedTouches[0].screenX;
        touchstartY = e.changedTouches[0].screenY;
        touchstartTime = Date.now();
    }, {passive: true});

    videoWrapper?.addEventListener('touchend', e => {
        const touchendX = e.changedTouches[0].screenX;
        const touchendY = e.changedTouches[0].screenY;
        const diffX = touchstartX - touchendX;
        const diffY = touchstartY - touchendY;
        const swipeDuration = Date.now() - touchstartTime;

        if (swipeDuration < 300 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 50) moveVideoCarousel(1);
            if (diffX < -50) moveVideoCarousel(-1);
        }
    }, {passive: true});

    /* ==========================================================================
       5. LIGHTBOX - OPTYMALIZACJA PAMIĘCI I UX
       ========================================================================== */
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    let currentLightboxIndex = 0;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const lightboxTriggers = document.querySelectorAll('.lightbox-trigger');
    
    lightboxTriggers.forEach((img, index) => {
        img.addEventListener('click', () => openLightbox(index));
    });

    function openLightbox(index) {
        currentLightboxIndex = index;
        lightboxImg.src = lightboxTriggers[currentLightboxIndex].src;
        lightbox.classList.add('active');
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        document.body.style.overflow = 'hidden'; 
    }

    function navigateLightbox(dir) {
        currentLightboxIndex = (currentLightboxIndex + dir + lightboxTriggers.length) % lightboxTriggers.length;
        lightboxImg.style.opacity = '0.5';
        setTimeout(() => { 
            lightboxImg.src = lightboxTriggers[currentLightboxIndex].src; 
            lightboxImg.style.opacity = '1'; 
        }, 150);
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.paddingRight = ''; 
        document.body.style.overflow = ''; 
        setTimeout(() => lightboxImg.removeAttribute('src'), 400);
    }

    document.getElementById('btn-close-lightbox')?.addEventListener('click', closeLightbox);
    document.getElementById('btn-prev-lightbox')?.addEventListener('click', () => navigateLightbox(-1));
    document.getElementById('btn-next-lightbox')?.addEventListener('click', () => navigateLightbox(1));

    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowRight") navigateLightbox(1);
        if (e.key === "ArrowLeft") navigateLightbox(-1);
    });

    /* ==========================================================================
       6. FORMULARZ (FORMSPREE AJAX + UX)
       ========================================================================== */
    document.getElementById('contactForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const statusEl = document.getElementById('formStatus');
        const submitBtn = this.querySelector('button[type="submit"]');
        
        if (document.getElementById('honeypot').value) return false;
        
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        
        const lang = document.documentElement.lang;
        submitBtn.textContent = lang === 'pl' ? 'Wysyłanie...' : (lang === 'ru' ? 'Отправка...' : 'Sending...');
        
        try {
            const response = await fetch(this.action, { method: this.method, body: new FormData(this), headers: { 'Accept': 'application/json' } });
            statusEl.style.display = 'block';
            statusEl.style.color = response.ok ? 'var(--bord)' : 'red';
            statusEl.textContent = response.ok ? 
                (lang === 'pl' ? "Wiadomość została wysłana!" : (lang === 'ru' ? "Сообщение успешно отправлено!" : "Message sent successfully!")) 
                : "Oops! Problem with sending the message.";
                
            if (response.ok) { 
                this.reset(); 
                setTimeout(() => statusEl.style.display = 'none', 5000); 
            }
        } catch {
            statusEl.style.display = 'block'; 
            statusEl.style.color = 'red'; 
            statusEl.textContent = "Network error. Try again.";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

    /* ==========================================================================
       7. AKORDEON POLITYKI PRYWATNOŚCI
       ========================================================================== */
    document.getElementById('btn-toggle-privacy')?.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
        document.getElementById('privacy-content').classList.toggle('open', !isExpanded);
    });

    /* ==========================================================================
       8. ANIMACJA GWIAZDEK (SESSIONS RATING)
       ========================================================================== */
    const starContainer = document.querySelector('.sessions-rating .stars');
    if (starContainer) {
        // Tniemy gwiazdki na pojedyncze znaki
        const stars = starContainer.textContent.trim().split('');
        starContainer.textContent = '';
        
        const starSpans = stars.map((char, i) => {
            const span = document.createElement('span');
            span.textContent = char;
            // Styl początkowy wstrzyknięty prosto w JS
            Object.assign(span.style, {
                display: 'inline-block',
                opacity: '0',
                transform: 'scale(0) translateY(15px)',
                transition: `all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.27) ${i * 0.1}s`
            });
            starContainer.appendChild(span);
            return span;
        });

        // Używamy osobnego obserwatora, żeby odpalić animację dokładnie dla gwiazdek
        const starObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    starSpans.forEach(span => {
                        span.style.opacity = '1';
                        span.style.transform = 'scale(1) translateY(0)';
                    });
                    starObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        starObserver.observe(starContainer);
    }
});