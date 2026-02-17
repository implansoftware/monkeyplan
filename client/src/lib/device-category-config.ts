export interface CategorySpecsConfig {
  storage: boolean;
  grade: boolean;
  batteryHealth: boolean;
  networkLock: boolean;
  imei: boolean;
  serialNumber: boolean;
  originalBox: boolean;
  accessories: boolean;
  description: boolean;
}

export const DEVICE_CATEGORY_LABEL_KEYS: Record<string, string> = {
  smartphone: "products.categorySmartphone",
  tablet: "products.categoryTablet",
  portatile: "products.categoryLaptop",
  pc_fisso: "products.categoryDesktop",
  smartwatch: "products.categorySmartwatch",
  console: "products.categoryConsole",
  altro: "products.categoryOther",
};

export const DEVICE_CATEGORY_LABELS: Record<string, string> = {
  smartphone: "Smartphone",
  tablet: "Tablet",
  portatile: "PC Portatile",
  pc_fisso: "PC Fisso",
  smartwatch: "Smartwatch",
  console: "Console",
  altro: "Altro",
};

export const PRODUCT_TYPE_LABEL_KEYS: Record<string, string> = {
  dispositivo: "products.typeDevice",
  ricambio: "products.typeSparePart",
  accessorio: "products.typeAccessory",
};

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  dispositivo: "Dispositivo",
  ricambio: "Ricambio",
  accessorio: "Accessorio",
};

export const CATEGORY_SPECS_CONFIG: Record<string, CategorySpecsConfig> = {
  smartphone: {
    storage: true,
    grade: true,
    batteryHealth: true,
    networkLock: true,
    imei: true,
    serialNumber: true,
    originalBox: true,
    accessories: true,
    description: true,
  },
  tablet: {
    storage: true,
    grade: true,
    batteryHealth: true,
    networkLock: true,
    imei: true,
    serialNumber: true,
    originalBox: true,
    accessories: true,
    description: true,
  },
  portatile: {
    storage: true,
    grade: true,
    batteryHealth: true,
    networkLock: false,
    imei: false,
    serialNumber: true,
    originalBox: true,
    accessories: true,
    description: true,
  },
  pc_fisso: {
    storage: true,
    grade: true,
    batteryHealth: false,
    networkLock: false,
    imei: false,
    serialNumber: true,
    originalBox: true,
    accessories: true,
    description: true,
  },
  smartwatch: {
    storage: false,
    grade: true,
    batteryHealth: true,
    networkLock: false,
    imei: false,
    serialNumber: true,
    originalBox: true,
    accessories: true,
    description: true,
  },
  console: {
    storage: true,
    grade: true,
    batteryHealth: false,
    networkLock: false,
    imei: false,
    serialNumber: true,
    originalBox: true,
    accessories: true,
    description: true,
  },
  altro: {
    storage: false,
    grade: true,
    batteryHealth: false,
    networkLock: false,
    imei: false,
    serialNumber: true,
    originalBox: true,
    accessories: false,
    description: true,
  },
};

export function getSpecsConfig(category: string | null | undefined): CategorySpecsConfig {
  return CATEGORY_SPECS_CONFIG[category || 'altro'] || CATEGORY_SPECS_CONFIG.altro;
}
