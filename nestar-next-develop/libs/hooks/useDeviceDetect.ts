/**
 * The redesigned UI is fully responsive (CSS media queries in scss/pc/ma),
 * so every device renders the same components. The hook is kept so existing
 * `device === 'mobile'` branches compile; it always reports 'desktop'.
 */
const useDeviceDetect = (): string => 'desktop';

export default useDeviceDetect;
