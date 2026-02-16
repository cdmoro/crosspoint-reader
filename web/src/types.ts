export type FileEntry = {
    name: string;
    size: number;
    isDirectory: boolean;
    isEpub: boolean;
};

export type FailedFile = {
    name: string;
    error: string;
    file: File;
};

export type StatusResponse = {
  version?: string;
  ip?: string;
  freeHeap?: number;
};

type SettingBase = {
  key: string;
  name: string;
  value: any;
  category: string;
};

export type SettingEnum = SettingBase & {
  type: "enum";
  options: string[];
};

export type SettingToggle = SettingBase & {
  type: "toggle";
};

export type SettingValue = SettingBase & {
  type: "value";
  min: number;
  max: number;
  step: number;
};

export type SettingString = SettingBase & {
  type: "string";
};

export type Setting =
  | SettingToggle
  | SettingEnum
  | SettingValue
  | SettingString;

export type SettingsResponse = {
  settings: Setting[];
};
