# @paytaca/wizardconnect-vue

Vue 3 components and composables for integrating [WizardConnect](https://gitlab.com/riftenlabs/lib/wizardconnect) into your decentralized application.

## What is WizardConnect?

WizardConnect is a wallet connection protocol that enables a browser-based dapp to establish a secure, end-to-end encrypted connection with a mobile crypto wallet — without any centralized coordination. The dapp generates a QR code URI; the wallet scans it and both sides communicate through a relay server using encrypted messaging.

This package (`@paytaca/wizardconnect-vue`) is the official Vue 3 adapter. It wraps the `@wizardconnect/core` and `@wizardconnect/dapp` packages into Vue-native composables and render-function components, so you can integrate wallet connectivity with minimal boilerplate.

**Key features:**

- `useWizardConnect` composable — manages the full connection lifecycle (`idle → connecting → connected → disconnected`)
- Automatic session persistence and reconnection on page reload
- `WizardConnectQRDialog` — a ready-to-use QR code modal component with no UI framework dependency
- Exposes the underlying `DappConnectionManager` for low-level event handling
- Written in TypeScript with full type exports
- No `.vue` SFC files — pure ESM, tree-shakeable

For protocol-level documentation, see the [WizardConnect monorepo](https://gitlab.com/riftenlabs/lib/wizardconnect).

## Installation

```sh
npm install @paytaca/wizardconnect-vue
```

```sh
yarn add @paytaca/wizardconnect-vue
```

```sh
pnpm add @paytaca/wizardconnect-vue
```

## API

### `useWizardConnect(options)`

The core composable. Handles relay initiation, QR code generation, session storage, and auto-reconnect.

```ts
const {
  state,      // Ref<WizardConnectState> — 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected'
  manager,    // Ref<DappConnectionManager | undefined> — underlying manager for event listeners
  uri,        // Ref<string | undefined> — raw WizardConnect URI
  qrUri,      // Ref<string | undefined> — alphanumeric QR-encoded URI
  walletName, // Ref<string | undefined> — name reported by the connected wallet
  error,      // Ref<string | undefined> — last error message
  connect,    // () => void — initiate connection (shows QR)
  disconnect, // () => void — disconnect and clear session
} = useWizardConnect({
  dappName: 'My Dapp',
  dappIcon: 'https://example.com/icon.png',
  // relayUrls?: string[]       — custom relay server URLs
  // sessionKey?: string        — localStorage key (default: 'wizardconnect-session')
  // persistSession?: boolean   — whether to save session (default: true)
  // storage?: SessionStorage   — custom storage implementation
})
```

### `WizardConnectQRDialog`

A modal dialog that renders the QR code for the wallet to scan. Teleports to `<body>`.

```ts
import { WizardConnectQRDialog } from '@paytaca/wizardconnect-vue'
```

| Prop | Type | Description |
|---|---|---|
| `show` | `boolean` | Whether the dialog is visible |
| `uri` | `string` | Raw WizardConnect URI |
| `qrUri` | `string` | Alphanumeric QR-encoded URI |
| `onClose` | `() => void` | Called when the user closes the dialog |
| `title` | `string?` | Dialog title (default: `'WizardConnect'`) |
| `subtitle` | `string?` | Dialog subtitle |
| `theme` | `WizardConnectQRTheme?` | Color/size overrides |
| `onCopy` | `() => void?` | Called when the URI copy button is clicked |

### `AlphanumericQRCode`

Low-level canvas QR code component.

```ts
import { AlphanumericQRCode } from '@paytaca/wizardconnect-vue'
```

| Prop | Type | Description |
|---|---|---|
| `value` | `string` | The value to encode |
| `size` | `number?` | Canvas size in pixels |
| `foreground` | `string?` | QR foreground color |
| `background` | `string?` | QR background color |
| `quietZone` | `number?` | Quiet zone size |

## Usage Example (Plain Vue 3)

```vue
<template>
  <div class="wallet">
    <div v-if="!walletReady">
      <h2>WizardConnect</h2>
      <button
        @click="connect()"
        :disabled="state === 'connected' || state === 'reconnecting'"
      >
        {{ state === 'connecting' ? 'Connecting...' : 'Connect Wallet' }}
      </button>
      <p v-if="state === 'connecting'">Waiting for wallet to connect...</p>
      <p v-if="error" style="color: red">{{ error }}</p>
      <p v-if="walletName">{{ walletName }}</p>
    </div>

    <div v-else>
      <h2>Connected</h2>
      <p v-if="walletName">Wallet: {{ walletName }}</p>
      <button @click="disconnect">Disconnect</button>
    </div>

    <WizardConnectQRDialog
      :show="state === 'connecting'"
      :uri="uri ?? ''"
      :qrUri="qrUri ?? ''"
      :onClose="disconnect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useWizardConnect, WizardConnectQRDialog } from '@paytaca/wizardconnect-vue'
import type { WalletReadyMessage, ProtocolMessage, DisconnectReason } from '@wizardconnect/core'

const { state, manager, uri, qrUri, walletName, connect, disconnect, error } = useWizardConnect({
  dappIcon: 'https://<the url of your dapp icon>',
  dappName: 'My Example Dapp',
})

const walletReady = ref<boolean>(false)

watch([state, manager], async ([newState, newManager], [oldState]) => {
  if (newManager && oldState === 'idle') {
    newManager.addListener('disconnect', (reason: DisconnectReason, message: string | undefined) => {
      console.log('Disconnected', reason, message)
    })
    newManager.addListener('walletready', (message: WalletReadyMessage) => {
      walletReady.value = true
    })
    newManager.addListener('messagereceived', (message: ProtocolMessage) => {
      console.log('Message received', message)
    })
    newManager.addListener('messagesent', (message: ProtocolMessage) => {
      console.log('Message sent', message)
    })
  }

  if (newState === 'connected' && newManager) {
    // Do something when relay has successfully connected
  }
})
</script>
```

## Usage Example (Quasar)

```vue
<template>
  <q-page class="row items-center justify-evenly">
    <div v-if="!walletReady" class="column items-center q-gutter-md">
      <div class="text-h4">WizardConnect</div>
      <q-btn
        color="primary"
        label="Connect Wallet"
        @click="connect()"
        :loading="state === 'connecting'"
        :disable="state === 'connected' || state === 'reconnecting'"
      />
      <div v-if="state === 'connecting'" class="text-body2 text-grey">
        Waiting for wallet to connect...
      </div>
      <div v-if="error" class="text-negative">{{ error }}</div>
      <div v-if="walletName" class="text-caption">{{ walletName }}</div>
    </div>

    <div v-else class="column items-center q-gutter-md">
      <div class="text-h5">Connected</div>
      <div v-if="walletName" class="text-subtitle2">Wallet: {{ walletName }}</div>
      <q-btn color="negative" outline label="Disconnect" @click="disconnect" />
    </div>

    <WizardConnectQRDialog
      :show="state === 'connecting'"
      :uri="uri ?? ''"
      :qrUri="qrUri ?? ''"
      :onClose="disconnect"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useWizardConnect, WizardConnectQRDialog } from '@paytaca/wizardconnect-vue'
import type { WalletReadyMessage, ProtocolMessage, DisconnectReason } from '@wizardconnect/core'

const { state, manager, uri, qrUri, walletName, connect, disconnect, error } = useWizardConnect({
  dappIcon: 'https://<the url of your dapp icon>',
  dappName: 'My Example Dapp',
})

const walletReady = ref<boolean>(false)

watch([state, manager], async ([newState, newManager], [oldState]) => {
  if (newManager && oldState === 'idle') {
    newManager.addListener('disconnect', (reason: DisconnectReason, message: string | undefined) => {
      console.log('Disconnected', reason, message)
    })
    newManager.addListener('walletready', (message: WalletReadyMessage) => {
      walletReady.value = true
    })
    newManager.addListener('messagereceived', (message: ProtocolMessage) => {
      console.log('Message received', message)
    })
    newManager.addListener('messagesent', (message: ProtocolMessage) => {
      console.log('Message sent', message)
    })
  }

  if (newState === 'connected' && newManager) {
    // Do something when relay has successfully connected
  }
})
</script>
```

## License

See [LICENSE](./LICENSE).
