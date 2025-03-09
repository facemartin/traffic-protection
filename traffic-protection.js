(function() {
  // 설정 가져오기
  const script = document.currentScript;
  const config = {
    clickThreshold: parseInt(script.getAttribute('data-threshold') || '3', 10),
    timeWindow: parseInt(script.getAttribute('data-timewindow') || '10000', 10),
    cookieExpiry: parseInt(script.getAttribute('data-expiry') || '86400', 10),
    redirectDelay: parseInt(script.getAttribute('data-delay') || '1500', 10),
    adClickThreshold: parseInt(script.getAttribute('data-ad-threshold') || '2', 10),
    adTimeWindow: parseInt(script.getAttribute('data-ad-timewindow') || '60000', 10),
    redirectUrl: script.getAttribute('data-redirect') || 'https://ecrm.police.go.kr/minwon/main',
    botDetectionEnabled: script.getAttribute('data-bot-detection') !== 'false'
  };
  
  // 트래픽 보호 객체
  const TrafficProtection = {
    // 상태 변수
    state: {
      clickCount: 0,
      lastClickTime: 0,
      redirectBlocked: false,
      visitLogged: false,
      adClickCount: 0,
      lastAdClickTime: 0,
      botScore: 0,
      lastClickX: 0,
      lastClickY: 0,
      lastClickInterval: 0
    },
    
    // 초기화
    init: function() {
      this.checkPreviousVisit();
      document.addEventListener('click', this.handleClick.bind(this));
      window.addEventListener('beforeunload', this.logVisit.bind(this));
      
      if (config.botDetectionEnabled) {
        this.initBotDetection();
      }
      
      this.monitorAdClicks();
      this.setupLinkProtection();
    },
    
    // 이전 방문 확인
    checkPreviousVisit: function() {
      const visitCookie = this.getCookie('lastVisit');
      if (visitCookie) {
        const lastVisit = parseInt(visitCookie, 10);
        const now = Date.now();
        
        if (now - lastVisit < 5000) {
          this.state.redirectBlocked = true;
          console.warn('빠른 재방문 감지: 리다이렉트 제한됨');
          this.state.botScore += 30;
        }
      }
    },
    
    // 클릭 처리
    handleClick: function(e) {
      const now = Date.now();
      
      if (now - this.state.lastClickTime > config.timeWindow) {
        this.state.clickCount = 0;
      }
      
      this.state.clickCount++;
      this.state.lastClickTime = now;
      
      if (this.state.clickCount > config.clickThreshold) {
        this.state.redirectBlocked = true;
        console.warn('과도한 클릭 감지: 리다이렉트 제한됨');
        this.state.botScore += 20;
        this.setCookie('clickLimit', 'true', config.cookieExpiry);
      }
      
      this.analyzeClickPattern(e);
    },
    
    // 방문 기록
    logVisit: function() {
      if (this.state.visitLogged) return;
      
      this.setCookie('lastVisit', Date.now().toString(), config.cookieExpiry);
      this.state.visitLogged = true;
      
      if (this.state.botScore > 50) {
        this.setCookie('botSuspect', 'true', config.cookieExpiry);
      }
    },
    
    // 리다이렉트 처리
    handleRedirect: function(url) {
      if (this.state.redirectBlocked || this.getCookie('clickLimit') === 'true' || this.getCookie('botSuspect') === 'true') {
        console.warn('리다이렉트 차단됨: 무효 트래픽 의심');
        
        setTimeout(() => {
          window.location.href = config.redirectUrl;
        }, 500);
        
        return false;
      }
      
      setTimeout(() => {
        window.location.href = url;
      }, config.redirectDelay);
      
      return true;
    },
    
    // 쿠키 설정
    setCookie: function(name, value, seconds) {
      const date = new Date();
      date.setTime(date.getTime() + (seconds * 1000));
      const expires = "expires=" + date.toUTCString();
      document.cookie = name + "=" + value + ";" + expires + ";path=/";
    },
    
    // 쿠키 가져오기
    getCookie: function(name) {
      const cookieName = name + "=";
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(cookieName) === 0) {
          return cookie.substring(cookieName.length, cookie.length);
        }
      }
      return "";
    },
    
    // 봇 감지 초기화
    initBotDetection: function() {
      let mouseMovements = 0;
      document.addEventListener('mousemove', () => {
        mouseMovements++;
      });
      
      setTimeout(() => {
        if (mouseMovements < 5) {
          this.state.botScore += 15;
        }
      }, 5000);
      
      let scrollEvents = 0;
      document.addEventListener('scroll', () => {
        scrollEvents++;
      }, { passive: true });
      
      setTimeout(() => {
        if (scrollEvents < 2) {
          this.state.botScore += 10;
        }
      }, 8000);
      
      this.checkBrowserFingerprint();
    },
    
    // 브라우저 지문 확인
    checkBrowserFingerprint: function() {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('headless') || ua.includes('phantomjs') || ua.includes('selenium')) {
        this.state.botScore += 50;
      }
      
      if (window.innerWidth < 100 || window.innerHeight < 100) {
        this.state.botScore += 20;
      }
      
      if (navigator.webdriver) {
        this.state.botScore += 50;
      }
    },
    
    // 클릭 패턴 분석
    analyzeClickPattern: function(e) {
      if (this.state.lastClickX === e.clientX && this.state.lastClickY === e.clientY) {
        this.state.botScore += 10;
      }
      
      const clickInterval = Date.now() - this.state.lastClickTime;
      if (this.state.lastClickInterval && Math.abs(this.state.lastClickInterval - clickInterval) < 50) {
        this.state.botScore += 15;
      }
      
      this.state.lastClickX = e.clientX;
      this.state.lastClickY = e.clientY;
      this.state.lastClickInterval = clickInterval;
    },
    
    // 애드센스 광고 클릭 모니터링
    monitorAdClicks: function() {
      window.addEventListener('load', () => {
        const adSelectors = [
          'ins.adsbygoogle',
          '.google-ad',
          '.adsbygoogle',
          '.google-ads',
          '.ad-wrapper',
          '[id*="google_ads"]',
          '[class*="google-ad"]',
          '[id*="googlead"]'
        ];
        
        adSelectors.forEach(selector => {
          const adElements = document.querySelectorAll(selector);
          adElements.forEach(ad => {
            ad.addEventListener('click', this.handleAdClick.bind(this));
          });
        });
        
        this.observeNewAds();
      });
    },
    
    // 광고 클릭 처리
    handleAdClick: function(e) {
      const now = Date.now();
      
      if (now - this.state.lastAdClickTime > config.adTimeWindow) {
        this.state.adClickCount = 0;
      }
      
      this.state.adClickCount++;
      this.state.lastAdClickTime = now;
      
      if (this.state.adClickCount > config.adClickThreshold) {
        console.warn('과도한 광고 클릭 감지');
        this.state.botScore += 40;
        
        this.setCookie('adClickLimit', 'true', config.cookieExpiry);
        
        if (this.getCookie('adClickLimit') === 'true') {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    },
    
    // 새로 추가되는 광고 요소 감시
    observeNewAds: function() {
      if (!window.MutationObserver) return;
      
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              const node = mutation.addedNodes[i];
              if (node.nodeType === 1) {
                if (node.classList && 
                    (node.classList.contains('adsbygoogle') || 
                     node.classList.contains('google-ad') ||
                     node.classList.contains('google-ads'))) {
                  node.addEventListener('click', this.handleAdClick.bind(this));
                }
                
                const adElements = node.querySelectorAll('.adsbygoogle, .google-ad, .google-ads, [id*="google_ads"], [class*="google-ad"], [id*="googlead"]');
                adElements.forEach(ad => {
                  ad.addEventListener('click', this.handleAdClick.bind(this));
                });
              }
            }
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    },
    
    // 링크 보호 설정
    setupLinkProtection: function() {
      window.addEventListener('load', () => {
        // 외부 링크 보호
        const links = document.querySelectorAll('a[href^="http"]');
        links.forEach(link => {
          // 현재 도메인이 아닌 외부 링크만 처리
          if (!link.href.includes(window.location.hostname)) {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              this.handleRedirect(link.href);
            });
          }
        });
      });
    }
  };
  
  // 초기화
  TrafficProtection.init();
  
  // 전역 객체에 노출 (디버깅용, 필요 없으면 제거)
  window.TrafficProtection = TrafficProtection;
})();
