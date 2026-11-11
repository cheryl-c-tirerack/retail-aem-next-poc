// width-ratio-diameter, each part optionally decimal, e.g. 225-45-17 or 255-35-19.5
const TIRE_SIZE_PATTERN = /^(\d{2,3}(?:\.\d+)?)-(\d{2}(?:\.\d+)?)-(\d{2}(?:\.\d+)?)$/;

export type TireSize = {
  width: string;
  ratio: string;
  diameter: string;
};

/**
 * Parses a route segment such as '225-45-17'. Returns null when the shape is not a tire size.
 */
export function parseTireSize(segment: string): TireSize | null {
  const match = TIRE_SIZE_PATTERN.exec(segment);

  if (!match) {
    return null;
  }

  const [, width, ratio, diameter] = match;
  return { width, ratio, diameter };
}

// Same rules as SEOTireContent.java: dots become underscores, slashes are removed, empty becomes 0.
function toSelectorValue(value: string): string {
  const cleaned = value.replace(/\./g, '_').replace(/\//g, '');
  return cleaned === '' ? '0' : cleaned;
}

/**
 * Builds the AEM fragment path for a tire size, e.g. 'en.seocontent.225.45.17.html'.
 */
export function seoContentPath({ width, ratio, diameter }: TireSize): string {
  return `en.seocontent.${toSelectorValue(width)}.${toSelectorValue(ratio)}.${toSelectorValue(diameter)}.html`;
}

/**
 * Formats a tire size the way the site writes it, e.g. '225/45R17'.
 */
export function formatTireSize({ width, ratio, diameter }: TireSize): string {
  return `${width}/${ratio}R${diameter}`;
}
