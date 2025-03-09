(function() {
  // 설정 가져오기 - 스크립트 태그 찾기 개선
  let scriptTag = document.currentScript;
  
  // document.currentScript가 null인 경우 대체 방법 (async 로드 시)
  if (!scriptTag) {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src.includes('traffic-protection')) {
        scriptTag = scripts[i];
        break;
      }
    }
  }
  
  const config = {
    clickThreshold: parseInt(scriptTag ? scriptTag.getAttribute('data-threshold') : '3', 10) || 3,
    timeWindow: parseInt(scriptTag ? scriptTag.getAttribute('data-timewindow') : '10000', 10) || 10000,
    cookieExpiry: parseInt(scriptTag ? scriptTag.getAttribute('data-expiry') : '86400', 10) || 86400,
    redirectDelay: parseInt(scriptTag ? scriptTag.getAttribute('data-delay') : '1500', 10) || 1500,
    adClickThreshold: parseInt(scriptTag ? scriptTag.getAttribute('data-ad-threshold') : '2', 10) || 2,
    adTimeWindow: parseInt(scriptTag ? scriptTag.getAttribute('data-ad-timewindow') : '60000', 10) || 60000,
    redirectUrl: scriptTag && scriptTag.getAttribute('data-redirect') ? scriptTag.getAttribute('data-redirect') : 'https://ecrm.police.go.kr/minwon/main',
    botDetectionEnabled: scriptTag ? scriptTag.getAttribute('data-bot-detection') !== 'false' : true
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
      // DOM이 준비되었는지 확인
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.initAfterDOMReady();
        });
      } else {
        this.initAfterDOMReady();
      }
    },
    
    // DOM 준비 후 초기화
    initAfterDOMReady: function() {
      this.checkPreviousVisit();
      document.addEventListener('click', this.handleClick.bind(this));
      window.addEventListener('beforeunload', this.logVisit.bind(this));
      
      if (config.botDetectionEnabled) {
        this.initBotDetection();
      }
      
      this.monitorAdClicks();
      this.setupLinkProtection();
      
      // 디버깅 메시지
      console.log('TrafficProtection 초기화 완료. 설정:', config);
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
      
      // 디버깅 메시지
      console.log(`클릭 감지: ${this.state.clickCount}/${config.clickThreshold+1}`);
      
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
      // 디버깅 메시지
      console.log('리다이렉트 처리:', url);
      console.log('차단 상태:', this.state.redirectBlocked);
      console.log('쿠키 clickLimit:', this.getCookie('clickLimit'));
      console.log('쿠키 botSuspect:', this.getCookie('botSuspect'));
      
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
      
      // 디버깅 메시지
      console.log(`쿠키 설정: ${name}=${value}, 만료: ${seconds}초`);
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
          console.log('마우스 움직임 적음: 봇 점수 증가', this.state.botScore);
        }
      }, 5000);
      
      let scrollEvents = 0;
      document.addEventListener('scroll', () => {
        scrollEvents++;
      }, { passive: true });
      
      setTimeout(() => {
        if (scrollEvents < 2) {
          this.state.botScore += 10;
          console.log('스크롤 적음: 봇 점수 증가', this.state.botScore);
        }
      }, 8000);
      
      this.checkBrowserFingerprint();
    },
    
    // 브라우저 지문 확인
    checkBrowserFingerprint: function() {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('headless') || ua.includes('phantomjs') || ua.includes('selenium')) {
        this.state.botScore += 50;
        console.log('자동화 도구 감지: 봇 점수 증가', this.state.botScore);
      }
      
      if (window.innerWidth < 100 || window.innerHeight < 100) {
        this.state.botScore += 20;
        console.log('비정상 화면 크기: 봇 점수 증가', this.state.botScore);
      }
      
      if (navigator.webdriver) {
        this.state.botScore += 50;
        console.log('WebDriver 감지: 봇 점수 증가', this.state.botScore);
      }
    },
    
    // 클릭 패턴 분석
    analyzeClickPattern: function(e) {
      if (this.state.lastClickX === e.clientX && this.state.lastClickY === e.clientY) {
        this.state.botScore += 10;
        console.log('동일 위치 클릭: 봇 점수 증가', this.state.botScore);
      }
      
      const clickInterval = Date.now() - this.state.lastClickTime;
      if (this.state.lastClickInterval && Math.abs(this.state.lastClickInterval - clickInterval) < 50) {
        this.state.botScore += 15;
        console.log('규칙적 클릭 간격: 봇 점수 증가', this.state.botScore);
      }
      
      this.state.lastClickX = e.clientX;
      this.state.lastClickY = e.clientY;
      this.state.lastClickInterval = clickInterval;
    },
    
    // 애드센스 광고 클릭 모니터링
    monitorAdClicks: function() {
      // 페이지 로드 후 애드센스 광고 요소 찾기
      const setupAdMonitoring = () => {
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
            console.log('광고 요소에 클릭 리스너 추가:', selector);
          });
        });
        
        this.observeNewAds();
      };
      
      if (document.readyState === 'loading') {
        window.addEventListener('load', setupAdMonitoring);
      } else {
        setupAdMonitoring();
      }
    },
    
    // 광고 클릭 처리
    handleAdClick: function(e) {
      const now = Date.now();
      
      if (now - this.state.lastAdClickTime > config.adTimeWindow) {
        this.state.adClickCount = 0;
      }
      
      this.state.adClickCount++;
      this.state.lastAdClickTime = now;
      
      console.log(`광고 클릭 감지: ${this.state.adClickCount}/${config.adClickThreshold+1}`);
      
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
                  console.log('동적 광고 요소에 클릭 리스너 추가');
                }
                
                const adElements = node.querySelectorAll('.adsbygoogle, .google-ad, .google-ads, [id*="google_ads"], [class*="google-ad"], [id*="googlead"]');
                adElements.forEach(ad => {
                  ad.addEventListener('click', this.handleAdClick.bind(this));
                  console.log('동적 광고 하위 요소에 클릭 리스너 추가');
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
      
      console.log('동적 광고 요소 감시 시작');
    },
    
    // 링크 보호 설정
    setupLinkProtection: function() {
      const setupLinkMonitoring = () => {
        // 외부 링크 보호
        const links = document.querySelectorAll('a[href^="http"]');
        links.forEach(link => {
          // 현재 도메인이 아닌 외부 링크만 처리
          if (!link.href.includes(window.location.hostname)) {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              console.log('외부 링크 클릭 감지:', link.href);
              this.handleRedirect(link.href);
            });
          }
        });
        
        console.log('외부 링크 보호 설정 완료');
      };
      
      if (document.readyState === 'loading') {
        window.addEventListener('load', setupLinkMonitoring);
      } else {
        setupLinkMonitoring();
      }
    },
    
    // 디버깅 정보 출력
    debug: function() {
      console.log('TrafficProtection 상태:', this.state);
      console.log('설정:', config);
      console.log('쿠키 clickLimit:', this.getCookie('clickLimit'));
      console.log('쿠키 botSuspect:', this.getCookie('botSuspect'));
      console.log('쿠키 lastVisit:', this.getCookie('lastVisit'));
      console.log('쿠키 adClickLimit:', this.getCookie('adClickLimit'));
    }
  };
  
  // 초기화
  TrafficProtection.init();
  
  // 전역 객체에 노출 (디버깅용)
  window.TrafficProtection = TrafficProtection;
})();
