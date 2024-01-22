/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  LOGIN_PROVIDER,
  LOGIN_PROVIDER_TYPE,
  OPENLOGIN_NETWORK,
  OpenloginUserInfo,
} from "@web3auth/react-native-sdk";
import Constants, { AppOwnership } from "expo-constants";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  Button,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
} from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";

import {
  LightSmartContractAccount,
  getDefaultLightAccountFactoryAddress,
} from "@alchemy/aa-accounts";
import { AlchemyProvider } from "@alchemy/aa-alchemy";
import { optimismSepolia } from "viem/chains";
import axios from "axios";
import { Web3Authenticator } from "./web3auth_signer";
import { formatEther } from "viem";

const scheme = "web3authexpoexample";
const resolvedRedirectUrl =
  Constants.appOwnership === AppOwnership.Expo ||
  Constants.appOwnership === AppOwnership.Guest
    ? Linking.createURL("auth", {})
    : Linking.createURL("auth", { scheme });
const clientId =
  "BKyDxmRYHjW5p6jrSGK__GrkIKE3juvEit02lPNbhHa_FITde7PNYjoaL5hXLxRKu4tp44k2h8zi1AX7fnm97G0";
const GAS_MANAGER_POLICY_ID = "28ef7a28-0e13-476f-a228-3cc7cd75e5d0";

const provider = new AlchemyProvider({
  // get your Alchemy API key at https://dashboard.alchemy.com
  apiKey: "BzhMoamU9dd6WXB02Trm55_fbXWkKNn5",
  chain: optimismSepolia,
});

const web3auth = new Web3Authenticator({
  clientId,
  network: OPENLOGIN_NETWORK.SAPPHIRE_DEVNET, // or other networks
  useCoreKitKey: false,
  loginConfig: {
    jwt: {
      verifier: "jwt-oauth", // get it from web3auth dashboard
      typeOfLogin: "jwt",
      clientId, // web3auth's client id
    },
  },
});

export default function App() {
  const [signer, setSigner] = useState("");
  const [userInfo, setUserInfo] = useState<OpenloginUserInfo>();
  const [ui_console, setConsole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    const init = async () => {
      await web3auth.inner.init();
      if (provider.isConnected()) {
        uiConsole("Re logged in");
        setUserInfo(await web3auth.getAuthDetails());
        setSigner(await web3auth.getAddress());
        uiConsole(await provider.getAddress());
      }
    };
    init();
  }, [provider, web3auth]);

  const login = async (loginProvider: LOGIN_PROVIDER_TYPE) => {
    try {
      const info = await web3auth.authenticate({
        loginProvider,
        redirectUrl: resolvedRedirectUrl,
        mfaLevel: "default",
        curve: "secp256k1",
        chain: optimismSepolia,
      });

      setUserInfo(info);
      setSigner(await web3auth.getAddress());

      // connect with smart account
      provider.connect(
        (rpcClient) =>
          new LightSmartContractAccount({
            rpcClient,
            owner: web3auth,
            chain: optimismSepolia,
            factoryAddress:
              getDefaultLightAccountFactoryAddress(optimismSepolia),
          })
      );
      const swa = await provider.getAddress();
      console.log("Smart Wallet Address:", swa);
      uiConsole("Logged in as ", swa);
    } catch (e: any) {
      uiConsole(e.message);
    }
  };

  const loginWithJWT = async () => {
    try {
      if (!email || !password) {
        setConsole("credential is required!");
        return;
      }

      let accessToken: string;
      try {
        setConsole("Logging in");
        const { data } = await axios.post(
          "https://api.charii.org/api/auth/login",
          {
            email,
            password,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        uiConsole(data.data.accessToken);
        accessToken = data.data.accessToken;
      } catch (e: any) {
        setConsole(e.msg);
        return;
      }

      const info = await web3auth.authenticate({
        loginProvider: LOGIN_PROVIDER.JWT,
        redirectUrl: resolvedRedirectUrl,
        // mfaLevel: "default",
        // curve: "secp256k1",
        chain: optimismSepolia,
        extraLoginOptions: {
          id_token: accessToken,
          verifierIdField: "email", // auth0 generally uses sub as unique identifier
        },
      });

      setUserInfo(info);
      setSigner(await web3auth.getAddress());

      // connect with smart account
      provider.connect(
        (rpcClient) =>
          new LightSmartContractAccount({
            rpcClient,
            owner: web3auth,
            chain: optimismSepolia,
            factoryAddress:
              getDefaultLightAccountFactoryAddress(optimismSepolia),
          })
      );
      const swa = await provider.getAddress();
      console.log("Smart Wallet Address:", swa);
      uiConsole("Logged in as ", swa);
    } catch (e: any) {
      uiConsole(e.message);
    }
  };

  const getChainId = async () => {
    setConsole("Getting chain id");
    const networkDetails = optimismSepolia;
    uiConsole(networkDetails);
  };

  const getAccounts = async () => {
    setConsole("Getting account");
    const address = await provider.getAddress();
    uiConsole(address);
  };
  const getBalance = async () => {
    setConsole("Fetching balance");
    const balance = await provider.rpcClient.getBalance({
      address: await provider.getAddress(),
    });
    uiConsole(`${formatEther(balance)} ETH`);
  };
  const sendTransaction = async () => {
    setConsole("Sending transaction");

    provider.withAlchemyGasManager({
      policyId: GAS_MANAGER_POLICY_ID,
    });

    const { hash: uoHash } = await provider.sendUserOperation({
      target: "0x51F9CC45F0A006CA1E0ee90b1C7B663703E0C05c", // The desired target contract address
      data: "0x", // The desired call data
      value: 0n, // (Optional) value to send the target contract address
    });

    uiConsole("UserOperation Hash: ", uoHash); // Log the user operation hash

    // Wait for the user operation to be mined
    const txHash = await provider.waitForUserOperationTransaction(uoHash);

    uiConsole("Transaction Hash: ", txHash);
  };
  const signMessage = async () => {
    setConsole("Signing message");
    const message = await provider.signMessage("hello, world!");
    uiConsole(message);
  };

  const uiConsole = (...args: any[]) => {
    setConsole(`${JSON.stringify(args || {}, null, 2)}\n\n\n\n${console}`);
  };

  const logout = async () => {
    if (!web3auth) {
      setConsole("Web3auth not initialized");
      return;
    }

    setConsole("Logging out");
    provider.disconnect();
    await web3auth.logout();

    if (!web3auth.inner.privKey) {
      setUserInfo(undefined);
      setSigner("");
      uiConsole("Logged out");
    }
  };

  const loggedInView = (
    <View style={styles.buttonArea}>
      <Button title="Get User Info" onPress={() => uiConsole(userInfo)} />
      <Button title="Get Chain ID" onPress={() => getChainId()} />
      <Button title="Get Signer" onPress={() => uiConsole(signer)} />
      <Button title="Get Accounts" onPress={() => getAccounts()} />
      <Button title="Get Balance" onPress={() => getBalance()} />
      <Button title="Send Transaction" onPress={() => sendTransaction()} />
      <Button title="Sign Message" onPress={() => signMessage()} />
      <Button title="Log Out" onPress={() => logout()} />
    </View>
  );

  const unloggedInView = (
    <View style={styles.container}>
      <TextInput
        editable
        onChangeText={setEmail}
        placeholder="Email"
        value={email}
        style={{ padding: 10 }}
      />
      <TextInput
        editable
        secureTextEntry={!showPass}
        onChangeText={setPassword}
        placeholder="Password"
        value={password}
        style={{ padding: 10 }}
      />
      <BouncyCheckbox text="Show password" onPress={setShowPass} />
      <Button title="Login" onPress={loginWithJWT} />
      <Button
        title="Login with Google"
        onPress={() => login(LOGIN_PROVIDER.GOOGLE)}
      />
      <Button
        title="Login with Facebook"
        onPress={() => login(LOGIN_PROVIDER.FACEBOOK)}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {provider.isConnected() ? loggedInView : unloggedInView}
      <View style={styles.consoleArea}>
        <Text style={styles.consoleText}>Console:</Text>
        <ScrollView style={styles.console}>
          <Text>{ui_console}</Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 50,
    paddingBottom: 30,
  },
  consoleArea: {
    margin: 20,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  console: {
    flex: 1,
    backgroundColor: "#CCCCCC",
    color: "#ffffff",
    padding: 10,
    width: Dimensions.get("window").width - 60,
  },
  consoleText: {
    padding: 10,
  },
  buttonArea: {
    flex: 2,
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 30,
  },
});
