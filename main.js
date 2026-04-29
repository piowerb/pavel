document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================================================
       1. JĘZYKI (i18n)
       ========================================================================== */
    const langSelect = document.getElementById('langSelect');
    
    function changeLanguage(lang) {
        // Użycie textContent zamiast innerText (Optymalizacja: unikanie reflow)
        document.querySelectorAll('.tr').forEach(el => { if (el.dataset[lang]) el.textContent = el.dataset[lang]; });
        document.querySelectorAll('.tr-ph').forEach(el => { if (el.dataset[lang]) el.placeholder = el.dataset[lang]; });
        document.documentElement.lang = lang;
        langSelect.value = lang; 
        localStorage.setItem('preferredLang', lang); 
    }

    changeLanguage(document.documentElement.lang || "en");
    langSelect.addEventListener('change', e => changeLanguage(e.target.value));

    document.getElementById('current-year').textContent = new Date().getFullYear();

    /* ==========================================================================
       2. NAWIGACJA SCROLL (Zoptymalizowana przez Throttle)
       ========================================================================== */
    const navbar = document.getElementById('navbar');
    
    // Funkcja Throttle zapobiegająca przeciążeniu przeglądarki przy scrollowaniu
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    window.addEventListener('scroll', throttle(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }, 100)); // Wywołuje się max co 100ms

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
    let touchstartTime = 0; // Rejestrowanie czasu startu dotyku
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

        // Ograniczenie czasowe (300ms) i priorytet osi X
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

    // Obliczanie szerokości paska przewijania, aby strona nie skakała
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    const lightboxTriggers = document.querySelectorAll('.lightbox-trigger');
    
    lightboxTriggers.forEach((img, index) => {
        img.addEventListener('click', () => openLightbox(index));
    });

    function openLightbox(index) {
        currentLightboxIndex = index;
        lightboxImg.src = lightboxTriggers[currentLightboxIndex].src;
        lightbox.classList.add('active');
        document.body.style.paddingRight = `${scrollbarWidth}px`; // Dodajemy prawy margines
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
        document.body.style.paddingRight = ''; // Resetujemy margines
        document.body.style.overflow = ''; // Pusty ciąg znaków przywraca styl ze stylesheet
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
        
        // Zabezpieczenie przycisku na czas wysyłania
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        
        // Tymczasowa zmiana tekstu przycisku zależnie od języka
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
            // Przywrócenie przycisku do pierwotnego stanu
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
});