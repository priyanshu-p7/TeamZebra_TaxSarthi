  // Theme Management
  const themeToggles = document.querySelectorAll('.theme-toggle');
  const body = document.body;
  const digitalIndiaLogo = document.querySelector('.digital-india-logo');
  const menuBackdrop = document.querySelector('.menu-backdrop');

  const updateTheme = () => {
      const isDark = body.getAttribute('data-theme') === 'dark';
      const logoPath = isDark ? 
          'assets/digital-india-logo-dark.svg' : 
          'assets/digital-india-logo.svg';
      
      // Force refresh logo
      digitalIndiaLogo.src = `${logoPath}?v=${Date.now()}`;
      
      themeToggles.forEach(btn => {
          btn.innerHTML = isDark ? 
              '<i class="fas fa-sun"></i> ' : 
              '<i class="fas fa-moon"></i> ';
      });
  };

  themeToggles.forEach(btn => {
      btn.addEventListener('click', () => {
          body.setAttribute('data-theme', 
              body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
          localStorage.setItem('theme', body.getAttribute('data-theme'));
          updateTheme();
      });
  });

  // Mobile Menu
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      menuBackdrop.classList.toggle('active');
      hamburger.innerHTML = mobileMenu.classList.contains('active') ? 
          '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  });

  menuBackdrop.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
      menuBackdrop.classList.remove('active');
      hamburger.innerHTML = '<i class="fas fa-bars"></i>';
  });

  // Close menu on ESC
  document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') {
          mobileMenu.classList.remove('active');
          menuBackdrop.classList.remove('active');
          hamburger.innerHTML = '<i class="fas fa-bars"></i>';
      }
  });

  // Initialize Theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  body.setAttribute('data-theme', savedTheme);
  updateTheme();