import {
  type SignTypedDataParams,
  type SmartAccountAuthenticator,
  WalletClientSigner,
} from "@alchemy/aa-core";
import Web3Auth, {
  type SdkLoginParams,
  type OpenloginUserInfo,
  type SdkInitParams,
} from "@web3auth/react-native-sdk";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { Chain, Hash, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
// import type Web3Auth from "@web3auth/react-native-sdk/dist/types/Web3Auth";
export type Web3AuthLoginParams = SdkLoginParams & { chain: Chain };

export class Web3Authenticator
  implements
    SmartAccountAuthenticator<
      Web3AuthLoginParams,
      OpenloginUserInfo | undefined,
      Web3Auth
    >
{
  inner: Web3Auth;
  private signer: WalletClientSigner | undefined;

  constructor(params: SdkInitParams | { inner: Web3Auth }) {
    if ("inner" in params) {
      this.inner = params.inner;
      return;
    }

    this.inner = new Web3Auth(WebBrowser, SecureStore, params);
  }

  readonly signerType = `web3authenticator`;

  getAddress = async () => {
    if (!this.signer) throw new Error("Not authenticated");

    const address = await this.signer.getAddress();
    if (address == null) throw new Error("No address found");

    return address as Hash;
  };

  signMessage = async (msg: Uint8Array | string) => {
    if (!this.signer) throw new Error("Not authenticated");

    return this.signer.signMessage(msg);
  };

  signTypedData = (params: SignTypedDataParams) => {
    if (!this.signer) throw new Error("Not authenticated");

    return this.signer.signTypedData(params);
  };

  authenticate = async (
    params: Web3AuthLoginParams
    // = {
    //   init: async () => {
    //     await this.inner.initModal();
    //   },
    //   connect: async () => {
    //     await this.inner.connect();
    //   },
    // }
  ) => {
    const { chain, ...loginParams } = params;
    await this.inner.init();
    await this.inner.login(loginParams);

    if (!this.inner.ready) throw new Error("Not ready");
    if (this.inner.privKey == null) throw new Error("No signer");

    this.signer = new WalletClientSigner(
      createWalletClient({
        chain,
        account: privateKeyToAccount(`0x${this.inner.privKey}`),
        transport: http(),
      }),
      this.signerType
    );

    return this.inner.userInfo();
  };

  getAuthDetails = async () => {
    if (!this.signer) throw new Error("Not authenticated");

    return this.inner.userInfo();
  };

  logout = async () => {
    if (!this.signer) throw new Error("Not authenticated");

    return this.inner.logout();
  };
}
