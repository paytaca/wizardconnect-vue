## Sample Usage Using Quasar Template

```vue
<template>
  <q-page class="row items-center justify-evenly">
    <div v-if="!walletInstance" class="column items-center q-gutter-md">
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
      <div v-if="walletName" class="text-subtitle2">
        Wallet: {{ walletName }}
      </div>
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
import { useWizardConnect, WizardConnectQRDialog } from '@wizardconnect/vue'
import type { WalletReadyMessage, ProtocolMessage, DisconnectReason } from '@wizardconnect/core'

const { state, manager, uri, qrUri, walletName, connect, disconnect, error } = useWizardConnect({
  dappIcon: 'https://<the url of your dapp icon>',
  dappName: 'My Example Dapp',
})

const walletInstance = ref<WizardConnectExternalWallet | null>(null)
const balance = ref<bigint | undefined>()
const utxos = ref()

watch([state, manager], async ([newState, newManager], [oldState, oldManager]) => {
  if (newManager && oldState === 'idle') {
    // Add listeners only when dapp manager starts from is instantiated and starts from idle
    newManager.addListener('disconnect', (reason: DisconnectReason, message: string | undefined) => {
      console.log('Handle disconnect', reason, message)
    })

    newManager.addListener('walletready', (message: WalletReadyMessage) => {
      console.log('Handle wallet ready', message)
    })

    newManager.addListener('messagereceived', (message: ProtocolMessage) => {
      console.log('Handle message received', message)
    })

    newManager.addListener('messagesent', (message: ProtocolMessage) => {
      console.log('Handle message sent', message)
    })
  }

  if (newState === 'connected' && newManager) {
    // Do something when relay has successfully connected
  }
  
})
</script>
```
