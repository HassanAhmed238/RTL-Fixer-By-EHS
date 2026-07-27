/**
 * @fileoverview UI Indicator component for RTL Fixer
 * Manages the visual indicator showing RTL Fixer's active status
 */
import { debugLog, debounce } from "../utils/utils.js";
import {
  saveCustomPosition,
  getCustomPosition,
  clearCustomPosition,
  getTransparency,
  getCustomName,
  getIndicatorSize,
} from "../extension/storage.js";
import { BRAND, ENV } from "../config/constants.js";
import { getCurrentDomainConfig } from "../config/domains.js";
import { addStyles } from "../core/style-manager.js";
import { getConfigFromBackground } from "../utils/config-utils.js";

// Cache for UI configuration
let cachedUiConfig = null;

/**
 * @typedef {Object} IndicatorState
 * @property {HTMLElement|null} element - The indicator DOM element
 * @property {HTMLStyleElement|null} styles - The indicator's style element
 */

/**
 * Tracks the current state of the indicator
 * @type {IndicatorState}
 */
const indicatorState = {
  element: null,
  styles: null,
};

/**
 * State for tracking dragging
 */
const dragState = {
  isDragging: false,
  hasMoved: false,
  initialX: 0,
  initialY: 0,
  initialLeft: 0,
  initialTop: 0,
};

/**
 * Gets size styling parameters
 * @param {string} size - 'small', 'medium', 'large'
 * @returns {Object} { fontSize, padding }
 */
export function getSizeStyles(size) {
  switch (size) {
    case "small":
      return { fontSize: "9px", padding: "2px 5px" };
    case "large":
      return { fontSize: "13px", padding: "5px 10px" };
    case "medium":
    default:
      return { fontSize: "11px", padding: "3px 7px" };
  }
}

/**
 * Gets the UI theme configuration, ensuring fresh data
 * @param {boolean} forceRefresh - Whether to force a refresh from background
 * @returns {Promise<Object>} The UI theme configuration
 */
async function getUiConfig(forceRefresh = false) {
  if (!cachedUiConfig || forceRefresh) {
    try {
      cachedUiConfig = await getConfigFromBackground("ui");
    } catch (error) {
      debugLog("Error loading UI config:", error);
      cachedUiConfig = {
        theme: {
          light: {
            background: "rgba(255, 255, 255, .9)",
            text: "#000",
            border: "rgba(0, 0, 0, .1)",
            link: "#0071E3",
          },
          dark: {
            background: "rgba(0, 0, 0, .8)",
            text: "#fff",
            border: "rgba(255, 255, 255, .1)",
            link: "#66b3ff",
          },
        },
      };
    }
  }
  return cachedUiConfig;
}

/**
 * Gets position configuration for the current domain
 * @returns {Promise<Object>} Position configuration for the current domain
 * @private
 */
async function getDomainPosition() {
  const domainConfig = await getCurrentDomainConfig();
  return domainConfig.position;
}

/**
 * Generates CSS styles for the indicator based on position, theme, and size
 * @param {Object} position - Position configuration object
 * @param {boolean} forceRefresh - Whether to force a UI config refresh
 * @returns {Promise<string>} CSS rules for the indicator
 * @private
 */
async function generateIndicatorStyles(position, forceRefresh = false) {
  const uiConfig = await getUiConfig(forceRefresh);
  const theme = uiConfig.theme;
  const transparency = await getTransparency();
  const size = await getIndicatorSize();
  const { fontSize, padding } = getSizeStyles(size);
  const opacity = Math.max(0.05, Math.min(1.0, (100 - transparency) / 100));

  const convertedPosition = { ...position };

  if (typeof convertedPosition.top === "string" && convertedPosition.top.endsWith("px")) {
    convertedPosition.top = `${(parseInt(convertedPosition.top) / window.innerHeight) * 100}%`;
  }
  if (typeof convertedPosition.right === "string" && convertedPosition.right.endsWith("px")) {
    convertedPosition.right = `${(parseInt(convertedPosition.right) / window.innerWidth) * 100}%`;
  }
  if (typeof convertedPosition.bottom === "string" && convertedPosition.bottom.endsWith("px")) {
    convertedPosition.bottom = `${(parseInt(convertedPosition.bottom) / window.innerHeight) * 100}%`;
  }
  if (typeof convertedPosition.left === "string" && convertedPosition.left.endsWith("px")) {
    convertedPosition.left = `${(parseInt(convertedPosition.left) / window.innerWidth) * 100}%`;
  }

  const positionStyles = [
    "top:auto",
    "bottom:auto",
    "left:auto",
    "right:auto",
    convertedPosition.top && `top:${convertedPosition.top}`,
    convertedPosition.bottom && `bottom:${convertedPosition.bottom}`,
    convertedPosition.left && `left:${convertedPosition.left}`,
    convertedPosition.right && `right:${convertedPosition.right}`,
    `padding:${padding}`,
  ]
    .filter(Boolean)
    .join(";");

  return `
    #${BRAND}-indicator {
      position: fixed;
      ${positionStyles};
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: ${fontSize};
      line-height: 1.3;
      z-index: 999999;
      border-radius: 4px;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 6px rgba(0,0,0,.15);
      opacity: ${opacity};
      background: ${theme.light.background};
      color: ${theme.light.text};
      border: 1px solid ${theme.light.border};
      transition: opacity 0.2s ease, font-size 0.2s ease, padding 0.2s ease;
      cursor: grab;
      user-select: none;
    }

    #${BRAND}-indicator.dragging {
      cursor: grabbing !important;
      opacity: 0.95 !important;
      box-shadow: 0 4px 12px rgba(0,0,0,.3);
    }

    #${BRAND}-indicator:hover {
      opacity: 1;
    }

    #${BRAND}-indicator a {
      color: ${theme.light.link};
      text-decoration: none;
      font-weight: 500;
      font-size: inherit;
    }

    @media (prefers-color-scheme: dark) {
      #${BRAND}-indicator {
        background: ${theme.dark.background};
        color: ${theme.dark.text};
        border-color: ${theme.dark.border};
      }
      #${BRAND}-indicator a {
        color: ${theme.dark.link};
      }
    }
  `;
}

/**
 * Helper to get a nicely formatted site name
 * @returns {string} Formatted site name
 */
export function getFormattedSiteName() {
  const host = window.location.hostname;
  if (host.includes("chatgpt")) return "ChatGPT";
  if (host.includes("notebooklm")) return "NotebookLM";
  if (host.includes("claude")) return "Claude";
  if (host.includes("gemini")) return "Gemini";
  if (host.includes("perplexity")) return "Perplexity";
  const name = host.replace(/^www\./, "").split(".")[0];
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "AI";
}

/**
 * Creates the indicator DOM element
 * @returns {Promise<HTMLElement>} The created indicator element
 * @private
 */
async function createIndicatorElement() {
  const indicator = document.createElement("div");
  const content = document.createElement("div");
  const link = document.createElement("a");

  const customName = await getCustomName();
  const siteName = getFormattedSiteName();

  indicator.id = `${BRAND}-indicator`;
  indicator.setAttribute("title", "Drag to reposition indicator");
  link.href = "https://www.linkedin.com/in/civilhassanofficial/";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.id = `${BRAND}-indicator-link`;
  link.textContent = `${siteName} - ${customName}` + (ENV === "development" ? " (Dev)" : "");

  content.appendChild(link);
  indicator.appendChild(content);

  return indicator;
}

/**
 * Shows the RTL Fixer indicator
 * @param {boolean} forceRefresh - Whether to force a UI config refresh
 * @returns {Promise<HTMLElement>} The indicator element
 */
export async function showIndicator(forceRefresh = false) {
  try {
    if (indicatorState.element && !forceRefresh) {
      return indicatorState.element;
    }

    if (forceRefresh && indicatorState.element) {
      hideIndicator();
    }

    const indicator = await createIndicatorElement();
    document.body.appendChild(indicator);

    const position = await getDomainPosition();
    const styles = await generateIndicatorStyles(position, forceRefresh);
    const styleElement = addStyles(styles);

    indicatorState.element = indicator;
    indicatorState.styles = styleElement;

    makeDraggable(indicator);
    await applyCustomPosition(indicator);

    return indicator;
  } catch (error) {
    debugLog("Failed to show indicator:", error);
    throw error;
  }
}

/**
 * Hides the RTL Fixer indicator
 * @returns {boolean} True if the indicator was hidden
 */
export function hideIndicator() {
  try {
    if (indicatorState.element) {
      indicatorState.element.remove();
      indicatorState.element = null;
    }
    if (indicatorState.styles) {
      indicatorState.styles.remove();
      indicatorState.styles = null;
    }
    cachedUiConfig = null;
    return true;
  } catch (error) {
    debugLog("Failed to hide indicator:", error);
    throw error;
  }
}

/**
 * Checks if the indicator is currently visible
 * @returns {boolean} True if the indicator is showing
 */
export function isIndicatorVisible() {
  return indicatorState.element !== null;
}

/**
 * Updates the indicator's position for the current domain
 * @param {boolean} forceRefresh - Whether to force a UI config refresh
 * @returns {Promise<boolean>} True if the update was successful
 */
export async function updateIndicatorPosition(forceRefresh = false) {
  try {
    if (!indicatorState.element) {
      return false;
    }

    const position = await getDomainPosition();
    const styles = await generateIndicatorStyles(position, forceRefresh);

    if (indicatorState.styles) {
      indicatorState.styles.remove();
    }

    indicatorState.styles = addStyles(styles);
    return true;
  } catch (error) {
    debugLog("Failed to update indicator position:", error);
    throw error;
  }
}

/**
 * Makes the entire indicator element smoothly draggable anywhere on screen
 * @param {HTMLElement} indicator - The indicator element to make draggable
 */
export function makeDraggable(indicator) {
  if (!indicator) return;

  indicator.style.cursor = "grab";
  indicator.addEventListener("mousedown", handleMouseDown);
  indicator.setAttribute("data-draggable", "true");
}

/**
 * Handles the start of dragging anywhere on indicator
 * @param {MouseEvent} e - The mousedown event
 */
function handleMouseDown(e) {
  const indicator = e.currentTarget;
  if (!indicator) return;

  const rect = indicator.getBoundingClientRect();

  dragState.isDragging = true;
  dragState.hasMoved = false;
  dragState.initialX = e.clientX;
  dragState.initialY = e.clientY;
  dragState.initialTop = rect.top;
  dragState.initialLeft = rect.left;

  const handleMouseMove = (event) => {
    if (!dragState.isDragging) return;

    const deltaX = event.clientX - dragState.initialX;
    const deltaY = event.clientY - dragState.initialY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragState.hasMoved = true;
      indicator.classList.add("dragging");
    }

    if (dragState.hasMoved) {
      const newLeft = dragState.initialLeft + deltaX;
      const newTop = dragState.initialTop + deltaY;
      const maxLeft = window.innerWidth - rect.width;
      const maxTop = window.innerHeight - rect.height;

      indicator.style.position = "fixed";
      indicator.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
      indicator.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
      indicator.style.right = "auto";
      indicator.style.bottom = "auto";
    }
  };

  const handleMouseUp = async (event) => {
    if (!dragState.isDragging) return;
    dragState.isDragging = false;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    setTimeout(() => {
      indicator.classList.remove("dragging");
    }, 50);

    if (dragState.hasMoved) {
      // Prevent link navigation if dragged
      const preventClickOnce = (clickEvt) => {
        clickEvt.preventDefault();
        clickEvt.stopPropagation();
        indicator.removeEventListener("click", preventClickOnce, true);
      };
      indicator.addEventListener("click", preventClickOnce, true);

      const currentRect = indicator.getBoundingClientRect();
      const pixelPosition = {
        top: `${Math.round(currentRect.top)}px`,
        left: `${Math.round(currentRect.left)}px`,
        right: "auto",
        bottom: "auto",
      };

      const domain = window.location.hostname;
      await saveCustomPosition(domain, pixelPosition);
      debugLog(`Saved indicator position for ${domain}:`, pixelPosition);
    }
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

/**
 * Gets custom position for the current domain
 * @param {Object} defaultPosition - Default position
 * @returns {Promise<Object>} Position object
 */
export async function getIndicatorPosition(defaultPosition) {
  const domain = window.location.hostname;
  const customPosition = await getCustomPosition(domain);
  return customPosition || defaultPosition;
}

/**
 * Applies custom position to indicator
 * @param {HTMLElement} indicator - Indicator element
 */
export async function applyCustomPosition(indicator) {
  if (!indicator) return;

  const domain = window.location.hostname;
  const positionData = await getCustomPosition(domain);

  if (positionData) {
    const customPosition = positionData.percentage || positionData;
    Object.entries(customPosition).forEach(([prop, value]) => {
      indicator.style[prop] = value;
    });
  }
}

/**
 * Resets the indicator to its default position
 * @param {HTMLElement} indicator - The indicator element
 * @returns {Promise<boolean>} Whether reset was successful
 */
export async function resetIndicatorPosition(indicator = null) {
  try {
    const domain = window.location.hostname;
    await clearCustomPosition(domain);

    indicator = indicator || document.getElementById(`${BRAND}-indicator`);
    if (!indicator) return false;

    indicator.style.top = "";
    indicator.style.left = "";
    indicator.style.right = "";
    indicator.style.bottom = "";

    const position = await getDomainPosition();
    Object.entries(position).forEach(([prop, value]) => {
      if (value) {
        indicator.style[prop] = value;
      }
    });

    return true;
  } catch (error) {
    debugLog("Error resetting indicator position:", error);
    return false;
  }
}

/**
 * Updates the transparency of the indicator dynamically
 * @param {number} transparencyPercent - Transparency percentage (0 to 100)
 */
export function setLiveIndicatorTransparency(transparencyPercent) {
  const indicator = indicatorState.element || document.getElementById(`${BRAND}-indicator`);
  if (indicator) {
    const opacity = Math.max(0.05, Math.min(1.0, (100 - Number(transparencyPercent)) / 100));
    indicator.style.opacity = opacity;
  }
}

/**
 * Updates the size of the indicator dynamically ('small', 'medium', 'large')
 * @param {string} size - Size string
 */
export function setLiveIndicatorSize(size) {
  const indicator = indicatorState.element || document.getElementById(`${BRAND}-indicator`);
  if (indicator) {
    const { fontSize, padding } = getSizeStyles(size);
    indicator.style.fontSize = fontSize;
    indicator.style.padding = padding;
  }
}

/**
 * Updates the custom name of the indicator dynamically
 * @param {string} newCustomName - The new custom name
 */
export function setLiveIndicatorCustomName(newCustomName) {
  const link =
    document.getElementById(`${BRAND}-indicator-link`) ||
    document.getElementById("now2ai-indicator-link") ||
    document.querySelector('div[id*="indicator"] a') ||
    document.querySelector('a[href*="linkedin"]');
  if (link) {
    const name = String(newCustomName).trim() || "EHS";
    const siteName = getFormattedSiteName();
    link.textContent = `${siteName} - ${name}` + (ENV === "development" ? " (Dev)" : "");
  }
}
