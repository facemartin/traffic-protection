/**
 * 무효 트래픽 방지 스크립트
 * 
 * 이 스크립트는 블로그나 웹사이트에서 무효 트래픽을 방지하기 위한 기능을 제공합니다.
 * 워드프레스나 블로그스팟에 아래 코드를 복사하여 붙여넣으세요.
 */

/**
 * 아래 코드를 복사하여 워드프레스나 블로그스팟의 테마 파일에 붙여넣으세요.
 * 
 * 워드프레스: 관리자 > 외모 > 테마 편집기 > footer.php (</body> 태그 앞)
 * 블로그스팟: 대시보드 > 테마 > HTML 편집 (</body> 태그 앞)
 */

/*
<script>
(function() {
  // 설정
  const config = {
    clickThreshold: 3,         // 단위 시간당 최대 클릭 수
    timeWindow: 10000,         // 시간 창 (밀리초) - 10초
    cookieExpiry: 86400,       // 쿠키 만료 시간 (초) - 24시간
    redirectDelay: 1500,       // 리다이렉트 지연 시간 (밀리초)
    redirectUrl: 'https://ecrm.police.go.kr/minwon/main'  // 차단 시 리다이렉트할 URL
  };
  
  // 상태 변수
  let clickCount = 0;
  let lastClickTime = 0;
  let redirectBlocked = false;
  
  // 클릭 이벤트 처리
  function handleGlobalClick(e) {
    const now = Date.now();
    
    // 시간 창 초기화
    if (now - lastClickTime > config.timeWindow) {
      clickCount = 0;
    }
    
    clickCount++;
    lastClickTime = now;
    
    console.log(`클릭 감지: ${clickCount}/${config.clickThreshold + 1}`);
    
    // 과도한 클릭 감지
    if (clickCount > config.clickThreshold) {
      redirectBlocked = true;
      console.warn('과도한 클릭 감지: 리다이렉트 제한됨');
      setCookie('clickLimit', 'true', config.cookieExpiry);
    }
  }
  
  // 리다이렉트 처리
  function handleRedirect(url) {
    // 리다이렉트 차단 상태 확인 (초기에는 false)
    if (redirectBlocked) {
      console.warn('리다이렉트 차단됨: 무효 트래픽 의심');
      setTimeout(() => {
        window.location.href = config.redirectUrl;
      }, 500);
      return false;
    }
    
    // 쿠키 확인은 별도로 처리
    const clickLimitCookie = getCookie('clickLimit');
    if (clickLimitCookie === 'true') {
      console.warn('리다이렉트 차단됨: 쿠키에 의한 제한');
      setTimeout(() => {
        window.location.href = config.redirectUrl;
      }, 500);
      return false;
    }
    
    // 정상적인 리다이렉트
    setTimeout(() => {
      window.location.href = url;
    }, config.redirectDelay);
    
    return true;
  }
  
  // 이벤트 핸들러 설정
  function setupEventHandlers() {
    // 외부 링크 처리
    const externalLinks = document.querySelectorAll('a[href^="http"]');
    externalLinks.forEach(link => {
      // 같은 도메인은 제외
      if (!link.href.includes(window.location.hostname)) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          handleRedirect(link.href);
        });
      }
    });
    
    // 포스트 내용 처리
    const postContent = document.querySelector('.post-content') || document.body;
    if (postContent) {
      // h2, h4 태그 클릭 처리
      const headings = postContent.querySelectorAll('h2, h4');
      const targetUrl = (document.querySelector('#floating-link') || {}).href || 
                        'https://investory.store/2025-%eb%af%bc%ec%83%9d%ed%9a%8c%eb%b3%b5%ec%a7%80%ec%9b%90%ea%b8%88-25%eb%a7%8c%ec%9b%90-%ec%a7%80%ea%b8%88-%ec%8b%a0%ec%b2%ad%ed%95%98%ec%84%b8%ec%9a%94/';
      
      headings.forEach(heading => {
        heading.style.cursor = 'pointer';
        heading.addEventListener('click', (e) => {
          e.preventDefault();
          handleRedirect(targetUrl);
        });
      });
      
      // 이미지 클릭 처리
      postContent.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
          e.preventDefault();
          handleRedirect(targetUrl);
        }
      });
      
      // 플로팅 버튼 클릭 처리
      const floatingLink = document.getElementById('floating-link');
      if (floatingLink) {
        floatingLink.addEventListener('click', (e) => {
          e.preventDefault();
          handleRedirect(floatingLink.href);
        });
      }
    }
  }
  
  // 초기화 함수
  function init() {
    // 이전 차단 기록 확인
    const clickLimitCookie = getCookie('clickLimit');
    if (clickLimitCookie === 'true') {
      redirectBlocked = true;
      console.log('이전 차단 기록 발견');
    }
    
    // 전역 클릭 이벤트 리스너 등록
    document.addEventListener('click', handleGlobalClick);
    
    // DOM 로딩 상태에 따라 이벤트 핸들러 설정
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupEventHandlers);
    } else {
      setupEventHandlers();
    }
  }
  
  // 쿠키 설정 함수
  function setCookie(name, value, seconds) {
    const date = new Date();
    date.setTime(date.getTime() + (seconds * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
  }
  
  // 쿠키 가져오기 함수
  function getCookie(name) {
    const cookieName = name + "=";
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(cookieName) === 0) {
        return cookie.substring(cookieName.length, cookie.length);
      }
    }
    return "";
  }
  
  // 디버깅 함수
  window.debugTraffic = function() {
    console.log('클릭 카운트:', clickCount);
    console.log('차단 상태:', redirectBlocked);
    console.log('쿠키 clickLimit:', getCookie('clickLimit'));
  };
  
  // 초기화 실행
  init();
})();
</script>
*/
