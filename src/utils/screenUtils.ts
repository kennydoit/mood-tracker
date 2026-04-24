import { useWindowDimensions } from 'react-native';

/**
 * Responsive layout constants
 */
export const RESPONSIVE_LAYOUT = {
  MOBILE_BREAKPOINT: 480, // Switch to constrained layout below this width
  CONTAINER_MAX_WIDTH: 430, // Maximum width of the app container on large screens
  PADDING_HORIZONTAL: 16, // Horizontal padding for mobile
} as const;

/**
 * Hook to get responsive layout information
 * Returns breakpoint info and dimensions for adaptive layouts
 */
export function useResponsiveLayout() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isMobile = screenWidth <= RESPONSIVE_LAYOUT.MOBILE_BREAKPOINT;
  const isTablet = screenWidth > RESPONSIVE_LAYOUT.MOBILE_BREAKPOINT && screenWidth < 768;
  const isDesktop = screenWidth >= 768;

  return {
    screenWidth,
    screenHeight,
    isMobile,
    isTablet,
    isDesktop,
    shouldConstrainWidth: !isMobile,
    containerMaxWidth: RESPONSIVE_LAYOUT.CONTAINER_MAX_WIDTH,
    paddingHorizontal: RESPONSIVE_LAYOUT.PADDING_HORIZONTAL,
  };
}
