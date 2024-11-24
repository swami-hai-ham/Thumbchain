"use client"
import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';

const CustomConnectButton: React.FC = () => {
  const { wallet, connect, disconnect, connecting, connected, publicKey, signMessage } = useWallet();
  const { setVisible } = useWalletModal();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const BACKEND_LINK = process.env.NEXT_PUBLIC_BACKEND_LINK;

  const handleClick = () => {
    if (connected) {
      disconnect().catch((error) => {
        console.error('Failed to disconnect:', error);
      });
      setIsSignedIn(false);
      localStorage.removeItem("token")
    } else if (!wallet) {
      setVisible(true);
      setIsSignedIn(false);
    } else if (!connected) {
      connect().catch((error) => {
        console.error('Failed to connect:', error);
      });
    }
  };

  const handleSignIn = async () => {
    if (!publicKey || !signMessage) {
      console.error('Wallet not connected');
      return;
    }
    setIsSigningIn(true);
    try {
        const nonce = Math.floor(Math.random() * 1000000); 
        const timestamp = new Date().toISOString(); 
        const customMessage = `Thumbchain - Sign into mechanical turks\nTimestamp: ${timestamp}\nNonce: ${nonce}`;
        
        const message = new TextEncoder().encode(customMessage);
        const signature = await signMessage(message);
        console.log(signature);
        console.log(publicKey);
        const response = await axios.post(`${BACKEND_LINK}/v1/worker/signin`, {
            signature,
            publicKey: publicKey.toString(),
            message: customMessage
        });
        localStorage.setItem("token", response.data.token);
        console.log('Signed in successfully');
        setIsSignedIn(true)
    } catch (error) {
        console.error('Failed to sign in:', error);
    } finally {
        setIsSigningIn(false);
    }
  };

  return (
    <div className='connect'>
      <button 
        className='font-bungee text-xl p-3 border-border border-2 rounded-xl hover:bg-popover'
        onClick={handleClick}
        disabled={connecting}
      >
        {connecting ? 'Connecting...' : connected ? 'Disconnect' : 'Connect Wallet'}
      </button>
      <button 
          className='font-bungee text-xl p-3 border-border border-2 rounded-xl hover:bg-popover ml-2 sign'
          onClick={handleSignIn}
          disabled={isSigningIn}
          hidden={!(connected && !isSignedIn) || localStorage.getItem('token')? true: false}
        >
          {isSigningIn ? 'Signing In...' : 'Sign In'}
      </button>
    </div>
  );
};

export default CustomConnectButton;