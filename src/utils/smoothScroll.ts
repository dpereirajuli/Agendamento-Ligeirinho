// Utilitários globais para scroll suave

/**
 * Função global para scroll suave
 * @param target - Elemento ou seletor para scroll
 * @param offset - Offset do topo (padrão: 80px)
 * @param duration - Duração da animação em ms (padrão: 800ms)
 */
export const smoothScrollTo = (
  target: string | HTMLElement, 
  offset: number = 80, 
  duration: number = 800
) => {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  // Verifica se o navegador suporta scroll-behavior: smooth
  if ('scrollBehavior' in document.documentElement.style) {
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  } else {
    // Fallback para navegadores antigos
    smoothScrollFallback(offsetPosition, duration);
  }
};

/**
 * Fallback para navegadores que não suportam scroll-behavior: smooth
 */
const smoothScrollFallback = (targetPosition: number, duration: number) => {
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let start: number | null = null;

  const animation = (currentTime: number) => {
    if (start === null) start = currentTime;
    const timeElapsed = currentTime - start;
    const run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  };

  requestAnimationFrame(animation);
};

/**
 * Função de easing para animação suave
 */
const easeInOutCubic = (t: number, b: number, c: number, d: number) => {
  t /= d / 2;
  if (t < 1) return c / 2 * t * t * t + b;
  t -= 2;
  return c / 2 * (t * t * t + 2) + b;
};

/**
 * Scroll suave para o topo da página
 */
export const scrollToTop = (duration: number = 800) => {
  if ('scrollBehavior' in document.documentElement.style) {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  } else {
    smoothScrollFallback(0, duration);
  }
};

/**
 * Scroll suave para uma seção específica
 */
export const scrollToSection = (sectionId: string, offset: number = 80) => {
  smoothScrollTo(`#${sectionId}`, offset);
};

/**
 * Scroll suave para o elemento de agendamento
 */
export const scrollToAgendamento = () => {
  scrollToSection('agendamento', 80);
};

/**
 * Scroll suave para serviços
 */
export const scrollToServicos = () => {
  scrollToSection('servicos', 80);
};

/**
 * Scroll suave para sobre nós
 */
export const scrollToSobreNos = () => {
  scrollToSection('sobre-nos', 80);
};

/**
 * Scroll suave para galeria
 */
export const scrollToGaleria = () => {
  scrollToSection('galeria', 80);
};

/**
 * Scroll suave para contato
 */
export const scrollToContato = () => {
  scrollToSection('contato', 80);
};
