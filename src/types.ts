import type { Ref } from "vue";
import type {
  DappConnectionManager,
  SessionStorage,
} from "@wizardconnect/dapp";

export interface AlphanumericQRCodeProps {
  value: string;
  size?: number;
  foreground?: string;
  background?: string;
  quietZone?: number;
}

export interface WizardConnectQRTheme {
  backdropColor?: string;
  dialogBackground?: string;
  headerBackground?: string;
  titleColor?: string;
  subtitleColor?: string;
  qrForeground?: string;
  qrBackground?: string;
  uriRowBackground?: string;
  uriTextColor?: string;
  borderColor?: string;
  closeButtonColor?: string;
  copyButtonColor?: string;
  qrSize?: number;
}

export interface WizardConnectQRDialogProps {
  show: boolean;
  onClose: () => void;
  uri: string;
  qrUri: string;
  onCopy?: (uri: string) => void;
  theme?: WizardConnectQRTheme;
  class?: string;
  subtitle?: string;
  title?: string;
}

export type WizardConnectState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface UseWizardConnectOptions {
  dappName?: string;
  dappIcon?: string;
  relayUrls?: string[];
  sessionKey?: string;
  persistSession?: boolean;
  storage?: SessionStorage;
}

export interface UseWizardConnectResult {
  state: Ref<WizardConnectState>;
  manager: Ref<DappConnectionManager | null>;
  uri: Ref<string | null>;
  qrUri: Ref<string | null>;
  walletName: Ref<string | null>;
  walletIcon: Ref<string | null>;
  connect: () => boolean;
  disconnect: () => Promise<void>;
  error: Ref<string | null>;
}
