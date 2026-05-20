import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Check, Mail, Lock, User, ArrowRight, ShieldCheck, Zap, Globe, Download, Smartphone, X } from 'lucide-react-native';
import { useUser } from '@/context/UserContext';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}
import { CARTOON_AVATARS, WALLEX_BRAND } from '@/constants/brand';
import { createRippleWalletAddress } from '@/lib/wallet';
import { signInWithGoogle, signUpWithEmailPassword, signInWithEmailPassword } from '@/lib/auth';
import { LOGO_BASE64 } from '@/constants/logo';

let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (e) {
    console.warn('WebView could not be loaded dynamically on native');
  }
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LANDING_HTML = `
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Wallex — Secure Crypto Wallet</title>
    <meta name="description" content="Wallex is a secure, non-custodial crypto wallet built for Americans. Buy, sell, send and store Bitcoin, Ethereum, USDT and more with instant USD transfers.">
    <meta name="keywords" content="crypto wallet, bitcoin wallet, ethereum wallet, secure crypto, non-custodial wallet, USDT, BTC, ETH, US crypto">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <meta name="googlebot" content="index, follow">
    <meta name="bingbot" content="index, follow">
    <meta name="GPTBot" content="index, follow">
    <meta name="CCBot" content="index, follow">
    <meta name="anthropic-ai" content="index, follow">
    <meta property="og:title" content="Wallex — Secure Crypto Wallet">
    <meta property="og:description" content="Secure, non-custodial crypto wallet built for Americans.">
    <meta property="og:type" content="website">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
    <style>
      *,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }/*! tailwindcss v3.4.19 | MIT License | https://tailwindcss.com*/*,:after,:before{box-sizing:border-box;border:0 solid #e5e7eb}:after,:before{--tw-content:""}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}body{margin:0;line-height:inherit}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-variation-settings:normal;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{opacity:1;color:#9ca3af}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]:where(:not([hidden=until-found])){display:none}.container{width:100%}@media (min-width:640px){.container{max-width:640px}}@media (min-width:768px){.container{max-width:768px}}@media (min-width:1024px){.container{max-width:1024px}}@media (min-width:1280px){.container{max-width:1280px}}@media (min-width:1536px){.container{max-width:1536px}}.visible{visibility:visible}.fixed{position:fixed}.absolute{position:absolute}.relative{position:relative}.left-1{left:.25rem}.left-1\/3{left:33.333333%}.left-10{left:2.5rem}.right-20{right:5rem}.top-20{top:5rem}.top-28{top:7rem}.top-52{top:13rem}.z-50{z-index:50}.mx-auto{margin-left:auto;margin-right:auto}.mb-16{margin-bottom:4rem}.mb-3{margin-bottom:.75rem}.mb-4{margin-bottom:1rem}.mb-6{margin-bottom:1.5rem}.mb-8{margin-bottom:2rem}.mt-10{margin-top:2.5rem}.mt-12{margin-top:3rem}.mt-3{margin-top:.75rem}.mt-4{margin-top:1rem}.mt-6{margin-top:1.5rem}.mt-8{margin-top:2rem}.inline{display:inline}.flex{display:flex}.inline-flex{display:inline-flex}.table{display:table}.grid{display:grid}.hidden{display:none}.h-12{height:3rem}.h-14{height:3.5rem}.h-16{height:4rem}.h-2{height:.5rem}.h-24{height:6rem}.h-28{height:7rem}.h-32{height:8rem}.h-8{height:2rem}.h-9{height:2.25rem}.h-\[340px\]{height:340px}.min-h-screen{min-height:100vh}.w-12{width:3rem}.w-14{width:3.5rem}.w-16{width:4rem}.w-2{width:.5rem}.w-24{width:6rem}.w-3{width:.75rem}.w-3\/4{width:75%}.w-72{width:18rem}.w-8{width:2rem}.w-80{width:20rem}.w-9{width:2.25rem}.w-\[170px\]{width:170px}.w-\[420px\]{width:420px}.w-full{width:100%}.max-w-7xl{max-width:80rem}.max-w-md{max-width:28rem}.transform{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}@keyframes pulse{50%{opacity:.5}}.animate-pulse{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.flex-col{flex-direction:column}.flex-wrap{flex-wrap:wrap}.items-center{align-items:center}.justify-center{justify-content:center}.justify-between{justify-content:space-between}.gap-10{gap:2.5rem}.gap-16{gap:4rem}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-4{gap:1rem}.gap-6{gap:1.5rem}.gap-8{gap:2rem}.space-y-7>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(1.75rem*(1 - var(--tw-space-y-reverse)));margin-bottom:calc(1.75rem*var(--tw-space-y-reverse))}.space-y-8>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(2rem*(1 - var(--tw-space-y-reverse)));margin-bottom:calc(2rem*var(--tw-space-y-reverse))}.overflow-hidden{overflow:hidden}.scroll-smooth{scroll-behavior:smooth}.rounded-2xl{border-radius:1rem}.rounded-3xl{border-radius:1.5rem}.rounded-\[3rem\]{border-radius:3rem}.rounded-full{border-radius:9999px}.rounded-xl{border-radius:.75rem}.border{border-width:1px}.border-2{border-width:2px}.border-b{border-bottom-width:1px}.border-t{border-top-width:1px}.border-white{--tw-border-opacity:1;border-color:rgb(255 255 255/var(--tw-border-opacity,1))}.border-zinc-100{--tw-border-opacity:1;border-color:rgb(244 244 245/var(--tw-border-opacity,1))}.border-zinc-300{--tw-border-opacity:1;border-color:rgb(212 212 216/var(--tw-border-opacity,1))}.border-zinc-700{--tw-border-opacity:1;border-color:rgb(63 63 70/var(--tw-border-opacity,1))}.bg-black{--tw-bg-opacity:1;background-color:rgb(0 0 0/var(--tw-bg-opacity,1))}.bg-emerald-100{--tw-bg-opacity:1;background-color:rgb(209 250 229/var(--tw-bg-opacity,1))}.bg-emerald-500{--tw-bg-opacity:1;background-color:rgb(16 185 129/var(--tw-bg-opacity,1))}.bg-sky-500{--tw-bg-opacity:1;background-color:rgb(14 165 233/var(--tw-bg-opacity,1))}.bg-white{--tw-bg-opacity:1;background-color:rgb(255 255 255/var(--tw-bg-opacity,1))}.bg-white\/70{background-color:hsla(0,0%,100%,.7)}.bg-zinc-100{--tw-bg-opacity:1;background-color:rgb(244 244 245/var(--tw-bg-opacity,1))}.bg-zinc-50{--tw-bg-opacity:1;background-color:rgb(250 250 250/var(--tw-bg-opacity,1))}.bg-zinc-700{--tw-bg-opacity:1;background-color:rgb(63 63 70/var(--tw-bg-opacity,1))}.bg-zinc-800{--tw-bg-opacity:1;background-color:rgb(39 39 42/var(--tw-bg-opacity,1))}.bg-zinc-900{--tw-bg-opacity:1;background-color:rgb(24 24 27/var(--tw-bg-opacity,1))}.bg-gradient-to-r{background-image:linear-gradient(to right,var(--tw-gradient-stops))}.from-amber-400{--tw-gradient-from:#fbbf24 var(--tw-gradient-from-position);--tw-gradient-to:rgba(251,191,36,0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}.to-yellow-400{--tw-gradient-to:#facc15 var(--tw-gradient-to-position)}.object-cover{-o-object-fit:cover;object-fit:cover}.p-10{padding:2.5rem}.p-4{padding:1rem}.p-5{padding:1.25rem}.p-8{padding:2rem}.px-10{padding-left:2.5rem;padding-right:2.5rem}.px-4{padding-left:1rem;padding-right:1rem}.px-5{padding-left:1.25rem;padding-right:1.25rem}.px-6{padding-left:1.5rem;padding-right:1.5rem}.px-7{padding-left:1.75rem;padding-right:1.75rem}.px-8{padding-left:2rem;padding-right:2rem}.py-1{padding-top:.25rem;padding-bottom:.25rem}.py-1\.5{padding-top:.375rem;padding-bottom:.375rem}.py-12{padding-top:3rem;padding-bottom:3rem}.py-16{padding-top:4rem;padding-bottom:4rem}.py-2{padding-top:.5rem;padding-bottom:.5rem}.py-28{padding-top:7rem;padding-bottom:7rem}.py-3{padding-top:.75rem;padding-bottom:.75rem}.py-4{padding-top:1rem;padding-bottom:1rem}.py-5{padding-top:1.25rem;padding-bottom:1.25rem}.py-6{padding-top:1.5rem;padding-bottom:1.5rem}.py-8{padding-top:2rem;padding-bottom:2rem}.pt-20{padding-top:5rem}.pt-6{padding-top:1.5rem}.text-center{text-align:center}.text-right{text-align:right}.font-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace}.text-2xl{font-size:1.5rem;line-height:2rem}.text-3xl{font-size:1.875rem;line-height:2.25rem}.text-4xl{font-size:2.25rem;line-height:2.5rem}.text-5xl{font-size:3rem;line-height:1}.text-6xl{font-size:3.75rem;line-height:1}.text-base{font-size:1rem;line-height:1.5rem}.text-lg{font-size:1.125rem;line-height:1.75rem}.text-sm{font-size:.875rem;line-height:1.25rem}.text-xl{font-size:1.25rem;line-height:1.75rem}.text-xs{font-size:.75rem;line-height:1rem}.font-bold{font-weight:700}.font-light{font-weight:300}.font-medium{font-weight:500}.font-semibold{font-weight:600}.leading-none{line-height:1}.tracking-tighter{letter-spacing:-.05em}.tracking-widest{letter-spacing:.1em}.text-black{--tw-text-opacity:1;color:rgb(0 0 0/var(--tw-text-opacity,1))}.text-emerald-400{--tw-text-opacity:1;color:rgb(52 211 153/var(--tw-text-opacity,1))}.text-emerald-500{--tw-text-opacity:1;color:rgb(16 185 129/var(--tw-text-opacity,1))}.text-emerald-700{--tw-text-opacity:1;color:rgb(4 120 87/var(--tw-text-opacity,1))}.text-red-500{--tw-text-opacity:1;color:rgb(239 68 68/var(--tw-text-opacity,1))}.text-sky-400{--tw-text-opacity:1;color:rgb(56 189 248/var(--tw-text-opacity,1))}.text-sky-600{--tw-text-opacity:1;color:rgb(2 132 199/var(--tw-text-opacity,1))}.text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity,1))}.text-white\/90{color:hsla(0,0%,100%,.9)}.text-zinc-400{--tw-text-opacity:1;color:rgb(161 161 170/var(--tw-text-opacity,1))}.text-zinc-500{--tw-text-opacity:1;color:rgb(113 113 122/var(--tw-text-opacity,1))}.text-zinc-600{--tw-text-opacity:1;color:rgb(82 82 91/var(--tw-text-opacity,1))}.text-zinc-800{--tw-text-opacity:1;color:rgb(39 39 42/var(--tw-text-opacity,1))}.shadow{--tw-shadow:0 1px 3px 0 rgba(0,0,0,.1),0 1px 2px -1px rgba(0,0,0,.1);--tw-shadow-colored:0 1px 3px 0 var(--tw-shadow-color),0 1px 2px -1px var(--tw-shadow-color)}.shadow,.shadow-2xl{box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.shadow-2xl{--tw-shadow:0 25px 50px -12px rgba(0,0,0,.25);--tw-shadow-colored:0 25px 50px -12px var(--tw-shadow-color)}.ring{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.blur{--tw-blur:blur(8px)}.blur,.filter{filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.backdrop-blur-md{--tw-backdrop-blur:blur(12px);backdrop-filter:var(--tw-backdrop-blur) var(--tw-backdrop-brightness) var(--tw-backdrop-contrast) var(--tw-backdrop-grayscale) var(--tw-backdrop-hue-rotate) var(--tw-backdrop-invert) var(--tw-backdrop-opacity) var(--tw-backdrop-saturate) var(--tw-backdrop-sepia)}.transition{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-all{transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-colors{transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.transition-transform{transition-property:transform;transition-timing-function:cubic-bezier(.4,0,.2,1);transition-duration:.15s}.hover\:scale-105:hover{--tw-scale-x:1.05;--tw-scale-y:1.05;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.hover\:border-zinc-400:hover{--tw-border-opacity:1;border-color:rgb(161 161 170/var(--tw-border-opacity,1))}.hover\:bg-sky-100:hover{--tw-bg-opacity:1;background-color:rgb(224 242 254/var(--tw-bg-opacity,1))}.hover\:bg-white\/10:hover{background-color:hsla(0,0%,100%,.1)}.hover\:bg-zinc-800:hover{--tw-bg-opacity:1;background-color:rgb(39 39 42/var(--tw-bg-opacity,1))}.hover\:text-black:hover{--tw-text-opacity:1;color:rgb(0 0 0/var(--tw-text-opacity,1))}.hover\:underline:hover{text-decoration-line:underline}.hover\:shadow-2xl:hover{--tw-shadow:0 25px 50px -12px rgba(0,0,0,.25);--tw-shadow-colored:0 25px 50px -12px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}@media (min-width:640px){.sm\:flex{display:flex}.sm\:hidden{display:none}.sm\:flex-row{flex-direction:row}}@media (min-width:768px){.md\:col-span-5{grid-column:span 5/span 5}.md\:col-span-7{grid-column:span 7/span 7}.md\:grid-cols-12{grid-template-columns:repeat(12,minmax(0,1fr))}.md\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.md\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.md\:flex-row{flex-direction:row}.md\:text-left{text-align:left}.md\:text-6xl{font-size:3.75rem;line-height:1}}@media (min-width:1024px){.lg\:text-7xl{font-size:4.5rem;line-height:1}}
    </style>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        body { font-family: 'Inter', system-ui, sans-serif; }
        .thin-font { font-weight: 300; }

        .hero-bg {
            background: linear-gradient(135deg, #0ea5e9 0%, #bae6fd 100%);
            position: relative;
            overflow: hidden;
        }
        .cloud {
            position: absolute;
            background: rgba(255,255,255,0.85);
            border-radius: 50%;
            filter: blur(10px);
            animation: drift 35s linear infinite;
        }
        @keyframes drift {
            0% { transform: translateX(-200px); }
            100% { transform: translateX(2500px); }
        }

        .crypto-icon {
            transition: transform 0.3s ease;
        }
        .crypto-icon:hover {
            transform: scale(1.2) translateY(-8px) rotate(12deg);
        }
        .crypto-icon svg {
            filter: none;
        }

        .scroll-reveal {
            opacity: 0;
            transform: translateY(60px);
            transition: all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .scroll-reveal.active {
            opacity: 1;
            transform: translateY(0);
        }

        .avatar-ring {
            border: 3px solid #e4e4e7;
        }
    </style>
</head>
<body class="bg-zinc-50 text-zinc-800">

    <!-- Navbar -->
    <nav class="bg-white border-b border-zinc-100 fixed w-full z-50">
        <div class="max-w-7xl mx-auto px-4 py-4">
            <div class="flex justify-between items-center">
                <!-- Logo -->
                <div class="flex items-center gap-2">
                    <img src="${LOGO_BASE64}" class="w-8 h-8 rounded-xl object-cover" alt="logo" />
                    <span class="text-2xl tracking-tighter thin-font">wallex</span>
                </div>

                <!-- Desktop CTAs -->
                <div class="hidden sm:flex items-center gap-3">
                    <button onclick="fakeLogin()" class="px-5 py-2 text-sm font-medium border border-zinc-300 hover:border-zinc-400 rounded-xl transition-colors">Log in</button>
                    <button onclick="fakeOpenWallet()" class="px-5 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-all">Open Wallet</button>
                </div>

                <!-- Mobile CTAs (always visible, compact) -->
                <div class="flex sm:hidden items-center gap-2">
                    <button onclick="fakeLogin()" class="px-4 py-2 text-xs font-medium border border-zinc-300 rounded-xl">Log in</button>
                    <button onclick="fakeOpenWallet()" class="px-4 py-2 bg-black text-white text-xs font-medium rounded-xl">Wallet</button>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero -->
    <section class="hero-bg min-h-screen flex items-center pt-20 relative">
        <div class="cloud w-80 h-28 top-20 left-10" style="animation-delay: 0s;"></div>
        <div class="cloud w-[420px] h-32 top-52 left-1/3" style="animation-delay: 8s;"></div>
        <div class="cloud w-72 h-24 top-28 right-20" style="animation-delay: 16s;"></div>

        <div class="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
            <div class="space-y-8 scroll-reveal">
                <div class="inline-flex items-center gap-2 bg-white/70 backdrop-blur-md px-6 py-3 rounded-3xl text-sm font-medium">
                    <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    Trusted by 250,000+ Americans
                </div>
                <h1 class="text-5xl md:text-6xl lg:text-7xl leading-none tracking-tighter thin-font text-white">
                    Secure crypto.<br>Built for the US.
                </h1>
                <p class="text-xl text-white/90 max-w-md">
                    Buy, sell, send, and store Bitcoin, Ethereum, USDT and more with instant USD transfers.
                </p>
                <div class="flex flex-col sm:flex-row gap-4">
                    <button onclick="fakeOpenWallet()" class="px-10 py-6 bg-black text-white text-lg rounded-3xl hover:scale-105 transition-transform">Open your wallet</button>
                    <button onclick="fakeLogin()" class="px-8 py-6 border-2 border-white text-white hover:bg-white/10 transition-colors rounded-3xl text-lg font-medium">Log in</button>
                </div>
            </div>

            <div id="rates-panel" class="bg-white rounded-3xl shadow-2xl p-8 max-w-md mx-auto scroll-reveal">
                <div class="flex justify-between items-center mb-8">
                    <div class="font-semibold text-xl">Live USD Rates</div>
                    <div class="text-xs bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-3xl">
                        <span id="last-updated">Loading...</span>
                    </div>
                </div>
                <div class="space-y-7" id="rates-container"></div>
            </div>
        </div>
    </section>

    <!-- Crypto Icons Strip — proper B&W SVG logos -->
    <div class="bg-white py-12 border-b">
        <div class="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-10">

            <!-- Bitcoin -->
            <div class="crypto-icon bg-white p-5 rounded-3xl shadow flex items-center justify-center w-24 h-24">
                <svg viewBox="0 0 32 32" width="52" height="52" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <circle cx="16" cy="16" r="16" fill="#000"/>
                    <path d="M22.2 13.8c.3-2-1.2-3-3.3-3.7l.7-2.7-1.6-.4-.6 2.6-1.3-.3.6-2.6-1.6-.4-.7 2.7-1-.3v-.1l-2.2-.5-.4 1.7s1.2.3 1.1.3c.6.1.7.5.7.8l-1.7 6.8c-.1.3-.4.7-1 .5 0 .1-1.2-.3-1.2-.3l-.8 1.8 2.1.5 1.1.3-.7 2.7 1.6.4.7-2.7 1.3.3-.7 2.7 1.6.4.7-2.7c2.8.5 4.8.3 5.7-2.2.7-2-.03-3.1-1.5-3.8.97-.22 1.7-.9 1.9-2.1zm-3.4 4.8c-.5 2-3.9.9-5 .7l.9-3.5c1.1.3 4.6.8 4.1 2.8zm.5-4.8c-.5 1.8-3.3.9-4.2.7l.8-3.1c.9.2 3.8.7 3.4 2.4z" fill="#fff"/>
                </svg>
            </div>

            <!-- Ethereum -->
            <div class="crypto-icon bg-white p-5 rounded-3xl shadow flex items-center justify-center w-24 h-24">
                <svg viewBox="0 0 32 32" width="52" height="52" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <circle cx="16" cy="16" r="16" fill="#000"/>
                    <path d="M16 4.5L9 16.2l7 4 7-4L16 4.5z" fill="#fff" opacity="0.9"/>
                    <path d="M9 16.2L16 20.2l7-4-7-11.7-7 11.7z" fill="#fff" opacity="0.45"/>
                    <path d="M16 21.7L9 17.7l7 9.8 7-9.8-7 4z" fill="#fff" opacity="0.9"/>
                    <path d="M9 17.7L16 27.5l7-9.8-7 4-7-4z" fill="#fff" opacity="0.45"/>
                    <path d="M16 20.2l7-4-7-3.1-7 3.1 7 4z" fill="#fff" opacity="0.2"/>
                </svg>
            </div>

            <!-- Tether USDT -->
            <div class="crypto-icon bg-white p-5 rounded-3xl shadow flex items-center justify-center w-24 h-24">
                <svg viewBox="0 0 32 32" width="52" height="52" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <circle cx="16" cy="16" r="16" fill="#000"/>
                    <path d="M18 8H14v3H8v3h16v-3h-6V8z" fill="#fff"/>
                    <path d="M16 14.5c-4 0-7.5.6-7.5 1.5S12 17.5 16 17.5s7.5-.6 7.5-1.5-3.5-1.5-7.5-1.5z" fill="#fff"/>
                    <rect x="14.5" y="17" width="3" height="7" rx="1" fill="#fff"/>
                </svg>
            </div>

            <!-- Solana -->
            <div class="crypto-icon bg-white p-5 rounded-3xl shadow flex items-center justify-center w-24 h-24">
                <svg viewBox="0 0 32 32" width="52" height="52" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <circle cx="16" cy="16" r="16" fill="#000"/>
                    <g fill="#fff">
                        <path d="M8 20.5h12.5l-1.5 2H8l1.5-2z" opacity="0.6"/>
                        <path d="M8 15h14l-1.5 2H8l1.5-2z" opacity="0.8"/>
                        <path d="M8 9.5h12.5l-1.5 2H8l1.5-2z"/>
                    </g>
                </svg>
            </div>

            <!-- BNB -->
            <div class="crypto-icon bg-white p-5 rounded-3xl shadow flex items-center justify-center w-24 h-24">
                <svg viewBox="0 0 32 32" width="52" height="52" xmlns="http://www.w3.org/2000/svg" fill="none">
                    <circle cx="16" cy="16" r="16" fill="#000"/>
                    <g fill="#fff">
                        <polygon points="16,6 19.5,9.5 16,13 12.5,9.5" opacity="0.9"/>
                        <polygon points="9.5,12.5 13,9 16,12 13,15" opacity="0.9"/>
                        <polygon points="22.5,12.5 19,9 16,12 19,15" opacity="0.9"/>
                        <polygon points="16,19 19,16 22.5,19.5 19,23" opacity="0.9"/>
                        <polygon points="16,19 13,16 9.5,19.5 13,23" opacity="0.9"/>
                        <polygon points="16,14.5 19,17.5 16,20.5 13,17.5" opacity="0.9"/>
                        <polygon points="16,26 12.5,22.5 16,19 19.5,22.5" opacity="0.9"/>
                    </g>
                </svg>
            </div>

        </div>
    </div>

    <!-- Features -->
    <section class="py-28 bg-white">
        <div class="max-w-7xl mx-auto px-6">
            <div class="text-center mb-16 scroll-reveal">
                <div class="text-sky-600 text-sm font-medium tracking-widest">SECURE • SIMPLE • FAST</div>
                <h2 class="text-5xl tracking-tighter thin-font mt-3">Crypto made for Americans</h2>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="scroll-reveal bg-zinc-50 p-10 rounded-3xl hover:shadow-2xl transition-all">
                    <div class="mb-6 w-16 h-16">
                        <svg viewBox="0 0 32 32" width="64" height="64" xmlns="http://www.w3.org/2000/svg" fill="none">
                            <circle cx="16" cy="16" r="16" fill="#000"/>
                            <path d="M22.2 13.8c.3-2-1.2-3-3.3-3.7l.7-2.7-1.6-.4-.6 2.6-1.3-.3.6-2.6-1.6-.4-.7 2.7-1-.3v-.1l-2.2-.5-.4 1.7s1.2.3 1.1.3c.6.1.7.5.7.8l-1.7 6.8c-.1.3-.4.7-1 .5 0 .1-1.2-.3-1.2-.3l-.8 1.8 2.1.5 1.1.3-.7 2.7 1.6.4.7-2.7 1.3.3-.7 2.7 1.6.4.7-2.7c2.8.5 4.8.3 5.7-2.2.7-2-.03-3.1-1.5-3.8.97-.22 1.7-.9 1.9-2.1zm-3.4 4.8c-.5 2-3.9.9-5 .7l.9-3.5c1.1.3 4.6.8 4.1 2.8zm.5-4.8c-.5 1.8-3.3.9-4.2.7l.8-3.1c.9.2 3.8.7 3.4 2.4z" fill="#fff"/>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-medium mb-3">Instant USD Conversions</h3>
                    <p class="text-zinc-600">Seamless buying & selling with direct bank transfers.</p>
                </div>
                <div class="scroll-reveal bg-zinc-50 p-10 rounded-3xl hover:shadow-2xl transition-all">
                    <div class="text-6xl mb-6">🔐</div>
                    <h3 class="text-2xl font-medium mb-3">Non-Custodial Security</h3>
                    <p class="text-zinc-600">You control your private keys. Multi-signature protection.</p>
                </div>
                <div class="scroll-reveal bg-zinc-50 p-10 rounded-3xl hover:shadow-2xl transition-all">
                    <div class="text-6xl mb-6">🌐</div>
                    <h3 class="text-2xl font-medium mb-3">Global Transfers</h3>
                    <p class="text-zinc-600">Send crypto instantly to anyone, anywhere.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Phone Mockups -->
    <section class="bg-zinc-100 py-28">
        <div class="max-w-7xl mx-auto px-6">
            <div class="grid md:grid-cols-2 gap-16 items-center">
                <div class="scroll-reveal">
                    <h2 class="text-5xl tracking-tighter thin-font">Your wallet.<br>Always with you.</h2>
                    <p class="mt-6 text-zinc-600 text-lg">Clean, fast, and secure on mobile.</p>
                </div>
                <div class="flex justify-center gap-8">
                    <div class="bg-white p-4 rounded-[3rem] shadow-2xl">
                        <img 
                            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=340&h=680&fit=crop&q=80" 
                            alt="Crypto Portfolio" 
                            class="rounded-3xl w-[170px] h-[340px] object-cover"
                        >
                    </div>
                    <div class="bg-white p-4 rounded-[3rem] shadow-2xl mt-12">
                        <img 
                            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=340&h=680&fit=crop&q=80" 
                            alt="Bitcoin Trading" 
                            class="rounded-3xl w-[170px] h-[340px] object-cover"
                        >
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Testimonials -->
    <section class="py-28 bg-white">
        <div class="max-w-7xl mx-auto px-6">
            <div class="text-center mb-16 scroll-reveal">
                <h2 class="text-4xl tracking-tighter thin-font">What our team says</h2>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="scroll-reveal bg-zinc-50 p-8 rounded-3xl">
                    <p class="text-lg">"Wallex was built to give Americans real ownership and peace of mind with their crypto."</p>
                    <div class="mt-10 flex items-center gap-4">
                        <img 
                            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=face&q=80" 
                            alt="Michael Torres" 
                            class="w-14 h-14 rounded-2xl object-cover avatar-ring"
                        >
                        <div>
                            <div class="font-medium">Michael Torres</div>
                            <div class="text-sm text-zinc-500">CEO & Founder</div>
                        </div>
                    </div>
                </div>
                <div class="scroll-reveal bg-zinc-50 p-8 rounded-3xl">
                    <p class="text-lg">"Fast, secure, and truly non-custodial. This is how crypto should be done in America."</p>
                    <div class="mt-10 flex items-center gap-4">
                        <img 
                            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=160&h=160&fit=crop&crop=face&q=80" 
                            alt="Sarah Chen" 
                            class="w-14 h-14 rounded-2xl object-cover avatar-ring"
                        >
                        <div>
                            <div class="font-medium">Sarah Chen</div>
                            <div class="text-sm text-zinc-500">Head of Product</div>
                        </div>
                    </div>
                </div>
                <div class="scroll-reveal bg-zinc-50 p-8 rounded-3xl">
                    <p class="text-lg">"Security is non-negotiable. Your keys never leave your device."</p>
                    <div class="mt-10 flex items-center gap-4">
                        <img 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face&q=80" 
                            alt="David Ramirez" 
                            class="w-14 h-14 rounded-2xl object-cover avatar-ring"
                        >
                        <div>
                            <div class="font-medium">David Ramirez</div>
                            <div class="text-sm text-zinc-500">Chief Security Officer</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Secure Wallets Section -->
    <section class="bg-zinc-900 text-white py-28">
        <div class="max-w-7xl mx-auto px-6">
            <div class="grid md:grid-cols-12 gap-16 items-center">
                <div class="md:col-span-5 scroll-reveal">
                    <div class="inline text-emerald-400 text-sm font-medium tracking-widest">YOUR ASSETS. YOUR CONTROL.</div>
                    <h2 class="text-6xl tracking-tighter thin-font leading-none mt-4">Your keys.<br>Your crypto.</h2>
                    <p class="mt-8 text-zinc-400 text-lg max-w-md">
                        We never hold your private keys. You have full ownership and complete control of your funds at all times.
                    </p>
                    <button onclick="fakeOpenWallet()" class="mt-12 bg-white text-black px-10 py-5 rounded-3xl font-medium hover:bg-sky-100 transition-colors text-lg">
                        Create secure wallet
                    </button>
                </div>
                <div class="md:col-span-7 scroll-reveal">
                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-zinc-800 p-8 rounded-3xl border border-zinc-700">
                            <div class="flex items-center gap-3 mb-4">
                                <svg viewBox="0 0 32 32" width="28" height="28" xmlns="http://www.w3.org/2000/svg" fill="none">
                                    <circle cx="16" cy="16" r="16" fill="#fff" fill-opacity="0.12"/>
                                    <path d="M22.2 13.8c.3-2-1.2-3-3.3-3.7l.7-2.7-1.6-.4-.6 2.6-1.3-.3.6-2.6-1.6-.4-.7 2.7-1-.3v-.1l-2.2-.5-.4 1.7s1.2.3 1.1.3c.6.1.7.5.7.8l-1.7 6.8c-.1.3-.4.7-1 .5 0 .1-1.2-.3-1.2-.3l-.8 1.8 2.1.5 1.1.3-.7 2.7 1.6.4.7-2.7 1.3.3-.7 2.7 1.6.4.7-2.7c2.8.5 4.8.3 5.7-2.2.7-2-.03-3.1-1.5-3.8.97-.22 1.7-.9 1.9-2.1zm-3.4 4.8c-.5 2-3.9.9-5 .7l.9-3.5c1.1.3 4.6.8 4.1 2.8zm.5-4.8c-.5 1.8-3.3.9-4.2.7l.8-3.1c.9.2 3.8.7 3.4 2.4z" fill="#f59e0b"/>
                                </svg>
                                <div class="text-emerald-400 text-sm">Bitcoin</div>
                            </div>
                            <div class="text-5xl font-light">0.842 BTC</div>
                            <div class="mt-8 h-2 bg-zinc-700 rounded-full overflow-hidden">
                                <div class="h-2 w-3/4 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"></div>
                            </div>
                        </div>
                        <div class="bg-zinc-800 p-8 rounded-3xl border border-zinc-700">
                            <div class="flex items-center gap-3 mb-4">
                                <svg viewBox="0 0 32 32" width="28" height="28" xmlns="http://www.w3.org/2000/svg" fill="none">
                                    <circle cx="16" cy="16" r="16" fill="#fff" fill-opacity="0.12"/>
                                    <path d="M18 8H14v3H8v3h16v-3h-6V8z" fill="#34d399"/>
                                    <path d="M16 14.5c-4 0-7.5.6-7.5 1.5S12 17.5 16 17.5s7.5-.6 7.5-1.5-3.5-1.5-7.5-1.5z" fill="#34d399"/>
                                    <rect x="14.5" y="17" width="3" height="7" rx="1" fill="#34d399"/>
                                </svg>
                                <div class="text-sky-400 text-sm">USDT</div>
                            </div>
                            <div class="text-5xl font-light">18,740.00</div>
                            <div class="mt-6 text-zinc-600 text-sm">Tether USD • Stable</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white py-16 border-t">
        <div class="max-w-7xl mx-auto px-6">
            <div class="flex flex-col md:flex-row justify-between items-center gap-8">
                <div class="flex items-center gap-3">
                    <img src="${LOGO_BASE64}" class="w-9 h-9 rounded-xl object-cover" alt="logo" />
                    <span class="text-3xl tracking-tighter thin-font">wallex</span>
                </div>
                
                <div class="text-center md:text-left">
                    <div class="text-sm text-zinc-600">Support</div>
                    <a href="mailto:wallexsupport@proton.me?subject=Wallex%20Support%20Request" 
                       class="text-sky-600 hover:underline"
                       title="Send us an email">wallexsupport@proton.me</a>
                </div>

                <div class="text-zinc-500 text-sm">© 2026 Wallex Inc. All rights reserved. United States.</div>
                
                <div class="flex gap-8 text-sm">
                    <a href="#" class="hover:text-black">Privacy</a>
                    <a href="#" class="hover:text-black">Terms</a>
                    <a href="#" class="hover:text-black">Security</a>
                </div>
            </div>
        </div>
    </footer>

    <script>
        function handleScroll() {
            document.querySelectorAll('.scroll-reveal').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight * 0.85) {
                    el.classList.add('active');
                }
            });
        }

        const coinIcons = {
            BTC: \`<svg viewBox="0 0 32 32" width="36" height="36" xmlns="http://www.w3.org/2000/svg" fill="none"><circle cx="16" cy="16" r="16" fill="#000"/><path d="M22.2 13.8c.3-2-1.2-3-3.3-3.7l.7-2.7-1.6-.4-.6 2.6-1.3-.3.6-2.6-1.6-.4-.7 2.7-1-.3v-.1l-2.2-.5-.4 1.7s1.2.3 1.1.3c.6.1.7.5.7.8l-1.7 6.8c-.1.3-.4.7-1 .5 0 .1-1.2-.3-1.2-.3l-.8 1.8 2.1.5 1.1.3-.7 2.7 1.6.4.7-2.7 1.3.3-.7 2.7 1.6.4.7-2.7c2.8.5 4.8.3 5.7-2.2.7-2-.03-3.1-1.5-3.8.97-.22 1.7-.9 1.9-2.1zm-3.4 4.8c-.5 2-3.9.9-5 .7l.9-3.5c1.1.3 4.6.8 4.1 2.8zm.5-4.8c-.5 1.8-3.3.9-4.2.7l.8-3.1c.9.2 3.8.7 3.4 2.4z" fill="#fff"/></svg>\`,
            ETH: \`<svg viewBox="0 0 32 32" width="36" height="36" xmlns="http://www.w3.org/2000/svg" fill="none"><circle cx="16" cy="16" r="16" fill="#000"/><path d="M16 4.5L9 16.2l7 4 7-4L16 4.5z" fill="#fff" opacity="0.9"/><path d="M9 16.2L16 20.2l7-4-7-11.7-7 11.7z" fill="#fff" opacity="0.45"/><path d="M16 21.7L9 17.7l7 9.8 7-9.8-7 4z" fill="#fff" opacity="0.9"/><path d="M9 17.7L16 27.5l7-9.8-7 4-7-4z" fill="#fff" opacity="0.45"/></svg>\`,
            USDT: \`<svg viewBox="0 0 32 32" width="36" height="36" xmlns="http://www.w3.org/2000/svg" fill="none"><circle cx="16" cy="16" r="16" fill="#000"/><path d="M18 8H14v3H8v3h16v-3h-6V8z" fill="#fff"/><path d="M16 14.5c-4 0-7.5.6-7.5 1.5S12 17.5 16 17.5s7.5-.6 7.5-1.5-3.5-1.5-7.5-1.5z" fill="#fff"/><rect x="14.5" y="17" width="3" height="7" rx="1" fill="#fff"/></svg>\`,
            SOL: \`<svg viewBox="0 0 32 32" width="36" height="36" xmlns="http://www.w3.org/2000/svg" fill="none"><circle cx="16" cy="16" r="16" fill="#000"/><path d="M8 20.5h12.5l-1.5 2H8l1.5-2z" fill="#fff" opacity="0.6"/><path d="M8 15h14l-1.5 2H8l1.5-2z" fill="#fff" opacity="0.8"/><path d="M8 9.5h12.5l-1.5 2H8l1.5-2z" fill="#fff"/></svg>\`
        };

        const PAIRS = [
            { symbol: 'BTCUSDT',  label: 'Bitcoin',  ticker: 'BTC' },
            { symbol: 'ETHUSDT',  label: 'Ethereum', ticker: 'ETH' },
            { symbol: 'SOLUSDT',  label: 'Solana',   ticker: 'SOL' },
        ];

        async function fetchLiveRates() {
            const container = document.getElementById('rates-container');
            const updateEl  = document.getElementById('last-updated');
            if (!container || !updateEl) return;

            try {
                const results = await Promise.all(
                    PAIRS.map(p =>
                        fetch(\`https://api.binance.com/api/v3/ticker/24hr?symbol=\${p.symbol}\`)
                            .then(r => r.json())
                    )
                );

                const usdtRow = {
                    label: 'Tether', ticker: 'USDT',
                    price: 1.00, change: 0.00
                };

                const rows = PAIRS.map((p, i) => ({
                    label:  p.label,
                    ticker: p.ticker,
                    price:  parseFloat(results[i].lastPrice),
                    change: parseFloat(results[i].priceChangePercent),
                })).concat([usdtRow]);

                container.innerHTML = rows.map(r => \`
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:.75rem 1rem;border-radius:.75rem;cursor:default;" 
                         onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
                        <div style="display:flex;align-items:center;gap:.75rem;">
                            <div style="width:2.5rem;height:2.5rem;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12);border-radius:.5rem;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                                \${coinIcons[r.ticker]}
                            </div>
                            <div>
                                <div style="font-weight:500;font-size:.9rem;">\${r.label}</div>
                                <div style="font-size:.7rem;color:#71717a;">\${r.ticker}</div>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-family:ui-monospace,monospace;font-size:.95rem;font-weight:500;">
                                \$\${r.price >= 1 ? r.price.toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2}) : r.price.toFixed(6)}
                            </div>
                            <div style="font-size:.75rem;color:\${r.change >= 0 ? '#10b981' : '#ef4444'};">
                                \${r.change >= 0 ? '▲' : '▼'} \${Math.abs(r.change).toFixed(2)}%
                            </div>
                        </div>
                    </div>
                \`).join('');

                const now = new Date();
                updateEl.textContent = \`Live · \${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}\`;

            } catch (err) {
                console.warn('Binance API error:', err);
                container.innerHTML = \`<div style="text-align:center;padding:2rem;color:#71717a;font-size:.9rem;">
                    Rates temporarily unavailable. <br>
                    <a href="https://www.binance.com/en/markets/overview" target="_blank" rel="noopener" 
                       style="color:#0ea5e9;text-decoration:underline;">View on Binance</a>
                </div>\`;
                updateEl.textContent = 'Offline';
            }
        }

        function fakeOpenWallet() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_WALLET' }));
            } else {
                window.parent.postMessage({ type: 'OPEN_WALLET' }, '*');
            }
        }
        function fakeLogin() {
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOGIN' }));
            } else {
                window.parent.postMessage({ type: 'LOGIN' }, '*');
            }
        }

        window.onload = () => {
            fetchLiveRates();
            setInterval(fetchLiveRates, 30000);
            window.addEventListener('scroll', handleScroll);
            handleScroll();
        };
    </script>
</body>
</html>
`;

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useUser();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(CARTOON_AVATARS[0].uri);
  const [focused, setFocused] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showVerificationPending, setShowVerificationPending] = useState(false);

  // Trigger app install suggestion 3 seconds into use
  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => {
        setShowInstallPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Window postMessage event listener for Web Platform
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'OPEN_WALLET') {
          setIsLoggingIn(false);
          setStep(1);
        } else if (event.data?.type === 'LOGIN') {
          setIsLoggingIn(true);
          setStep(1);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  const canProceed = step === 0
    ? true
    : step === 1
    ? isLoggingIn
      ? email.trim().length > 0 && email.includes('@') && password.length > 0
      : name.trim().length > 0 && email.trim().length > 0 && email.includes('@') && password.length >= 8 && password === confirmPassword
    : step === 2
    ? selectedAvatar !== null
    : true;

  const handleNext = async () => {
    setAuthNotice('');

    if (step === 1) {
      if (isLoggingIn) {
        if (!email.trim() || !password) {
          setAuthNotice('Please enter your email and password.');
          return;
        }
        setAuthBusy(true);
        const result = await signInWithEmailPassword(email.trim(), password);
        setAuthBusy(false);
        if (!result.ok) {
          setAuthNotice(result.message ?? 'Login failed. Check credentials.');
          return;
        }
        const meta = result.user?.user_metadata ?? {};
        const userName = meta.full_name ?? email.split('@')[0];
        const avatarUri = meta.avatar_url ?? CARTOON_AVATARS[0].uri;
        completeOnboarding(userName, email.trim(), avatarUri, password, 'email');
      } else {
        if (!name.trim() || !email.includes('@') || password.length < 8 || password !== confirmPassword) {
          setAuthNotice('Enter valid name, email, and matching password (min 8 chars).');
          return;
        }
        setStep(2); // Go to avatar selection
      }
    } else if (step === 2 && selectedAvatar) {
      setAuthBusy(true);
      const wallet = createRippleWalletAddress(email.trim(), name.trim());
      const result = await signUpWithEmailPassword({
        name: name.trim(),
        email: email.trim(),
        password,
        wallet,
        avatarUri: selectedAvatar,
      });
      setAuthBusy(false);
      
      if (!result.ok) {
        alert(result.message);
        return;
      }
      
      if (result.session) {
        completeOnboarding(name.trim(), email.trim(), selectedAvatar, password, 'email');
      } else {
        setShowVerificationPending(true);
      }
    }
  };

  const handleGoogleAuth = async () => {
    setAuthBusy(true);
    setAuthNotice('Redirecting to Google secure login...');
    const result = await signInWithGoogle();
    
    if (!result.ok) {
      setAuthBusy(false);
      setAuthNotice(result.message ?? 'Google login failed. Please try again.');
      return;
    }

    setAuthNotice('Connecting to Google... please wait.');
    // Keep loading spinner active during live redirect transition
    // The browser will redirect to Google OAuth — no further action needed here
  };

  // Render full screen Iframe on Web and WebView on native for Step 0
  const renderLandingPage = () => {
    if (Platform.OS === 'web') {
      return (
        <iframe
          srcDoc={LANDING_HTML}
          style={{
            width: '100vw',
            height: '100vh',
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1,
          }}
          title="Wallex Landing Page"
        />
      );
    }

    if (WebView) {
      return (
        <WebView
          originWhitelist={['*']}
          source={{ html: LANDING_HTML }}
          style={{ flex: 1 }}
          onMessage={(event: any) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'OPEN_WALLET') {
                setIsLoggingIn(false);
                setStep(1);
              } else if (data.type === 'LOGIN') {
                setIsLoggingIn(true);
                setStep(1);
              }
            } catch (e) {
              console.warn(e);
            }
          }}
        />
      );
    }

    // Default fallback
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>Loading premium dashboard experience...</Text>
      </View>
    );
  };

  if (step === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right', 'bottom']}>
        {renderLandingPage()}

        {/* App Install Prompt Modal (after 3 seconds) */}
        <Modal visible={showInstallPrompt} transparent animationType="slide" onRequestClose={() => setShowInstallPrompt(false)}>
          <View style={styles.modalBgBottom}>
            <Animated.View entering={FadeInUp.duration(500)} style={styles.installPanel}>
              <View style={styles.installHeader}>
                <View style={styles.installLogoBox}>
                  <Image source={{ uri: LOGO_BASE64 }} style={styles.installLogo} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.installTitle}>Install Wallex Mobile</Text>
                  <Text style={styles.installDomain}>wallex.online</Text>
                </View>
                <TouchableOpacity onPress={() => setShowInstallPrompt(false)} style={styles.installClose}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
              <Text style={styles.installBody}>
                Download the secure Wallex app onto your device home screen for lightning-fast biometrics, offline portfolio updates, and secure one-click XRP payments.
              </Text>
              <View style={styles.installButtons}>
                <TouchableOpacity style={styles.installPrimaryBtn} onPress={() => {
                  setShowInstallPrompt(false);
                  alert("To install, open your browser options and select 'Add to Home Screen'.");
                }}>
                  <Download size={16} color="#050508" />
                  <Text style={styles.installPrimaryText}>Install App</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.installSecondaryBtn} onPress={() => setShowInstallPrompt(false)}>
                  <Text style={styles.installSecondaryText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(400)} style={styles.formContainer}>
            <TouchableOpacity onPress={() => {
              setStep(0);
            }} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Return to Home</Text>
            </TouchableOpacity>

            {/* Premium Centered Brand Header */}
            <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 10 }}>
              <Image source={{ uri: LOGO_BASE64 }} style={{ width: 56, height: 56, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
              <Text style={{ fontSize: 26, fontFamily: 'Inter-Bold', color: '#ffffff', marginTop: 12, letterSpacing: -0.5 }}>
                wallex
              </Text>
            </View>

            <View style={styles.authCard}>
              {showVerificationPending ? (
                <View style={styles.stepBlock}>
                  <Text style={styles.stepTitle}>Verify Your Email</Text>
                  <Text style={styles.stepSub}>
                    We have sent a verification link to{"\n"}
                    <Text style={{ color: '#0ea5e9', fontFamily: 'Inter-SemiBold' }}>{email}</Text>.
                  </Text>
                  
                  <View style={{ alignItems: 'center', marginVertical: 20 }}>
                    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(14, 165, 233, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                      <Mail size={40} color="#0ea5e9" />
                    </View>
                  </View>

                  <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20, marginBottom: 10 }}>
                    Please check your inbox or spam folder. You must click the confirmation link in the email before logging in.
                  </Text>

                  <TouchableOpacity 
                    style={styles.primaryBtn} 
                    onPress={() => {
                      setShowVerificationPending(false);
                      setIsLoggingIn(true);
                      setStep(1);
                      setAuthNotice('Check your email, verify it, then enter your details to log in.');
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Proceed to Login</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {step === 1 && (
                    <View style={styles.stepBlock}>
                      <Text style={styles.stepTitle}>
                        {isLoggingIn ? 'Sign In to Wallex' : 'Create Account'}
                      </Text>
                      <Text style={styles.stepSub}>
                        {isLoggingIn ? 'Securely access your smart XRP portfolio.' : 'Start your secure non-custodial crypto journey.'}
                      </Text>

                      {/* Highly prominent Google Sign-up option */}
                      <TouchableOpacity style={styles.googleSignupBtn} onPress={handleGoogleAuth} disabled={authBusy}>
                        <GoogleIcon size={18} />
                        <Text style={styles.googleSignupText}>
                          {isLoggingIn ? 'Sign in with Google' : 'Continue with Google'}
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.googleInfoNote}>
                         💡 **Google Secure Sign-in**: No password needed. You can set or change your account password later at any time in your profile settings.
                      </Text>

                      <View style={styles.divider}>
                        <View style={styles.divLine} />
                        <Text style={styles.divText}>or use email</Text>
                        <View style={styles.divLine} />
                      </View>

                      {!isLoggingIn && (
                        <View style={[styles.inputWrapper, focused === 'name' && styles.inputWrapperFocused]}>
                          <User size={18} color="#64748b" />
                          <TextInput 
                            style={styles.inputLight} 
                            placeholder="Full Name" 
                            placeholderTextColor="#64748b" 
                            value={name} 
                            onChangeText={setName} 
                            onFocus={() => setFocused('name')} 
                            onBlur={() => setFocused(null)} 
                            autoCapitalize="words" 
                          />
                        </View>
                      )}

                      <View style={[styles.inputWrapper, focused === 'email' && styles.inputWrapperFocused]}>
                        <Mail size={18} color="#64748b" />
                        <TextInput 
                          style={styles.inputLight} 
                          placeholder="Email Address" 
                          placeholderTextColor="#64748b" 
                          value={email} 
                          onChangeText={setEmail} 
                          onFocus={() => setFocused('email')} 
                          onBlur={() => setFocused(null)} 
                          keyboardType="email-address" 
                          autoCapitalize="none" 
                        />
                      </View>

                      <View style={[styles.inputWrapper, focused === 'pass' && styles.inputWrapperFocused]}>
                        <Lock size={18} color="#64748b" />
                        <TextInput 
                          style={styles.inputLight} 
                          placeholder="Password" 
                          placeholderTextColor="#64748b" 
                          value={password} 
                          onChangeText={setPassword} 
                          onFocus={() => setFocused('pass')} 
                          onBlur={() => setFocused(null)} 
                          secureTextEntry 
                        />
                      </View>

                      {!isLoggingIn && (
                        <View style={[styles.inputWrapper, focused === 'conf' && styles.inputWrapperFocused]}>
                          <Lock size={18} color="#64748b" />
                          <TextInput 
                            style={styles.inputLight} 
                            placeholder="Confirm Password" 
                            placeholderTextColor="#64748b" 
                            value={confirmPassword} 
                            onChangeText={setConfirmPassword} 
                            onFocus={() => setFocused('conf')} 
                            onBlur={() => setFocused(null)} 
                            secureTextEntry 
                          />
                        </View>
                      )}

                      {authNotice ? <Text style={styles.noticeText}>{authNotice}</Text> : null}

                      <TouchableOpacity 
                        style={[styles.primaryBtn, !canProceed && { opacity: 0.5 }, { marginTop: 12 }]} 
                        onPress={handleNext} 
                        disabled={!canProceed || authBusy}
                      >
                        <Text style={styles.primaryBtnText}>
                          {authBusy ? 'Please wait...' : isLoggingIn ? 'Log In' : 'Sign Up'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        onPress={() => {
                          setIsLoggingIn(!isLoggingIn);
                          setAuthNotice('');
                        }} 
                        style={styles.toggleLink}
                      >
                        <Text style={styles.toggleText}>
                          {isLoggingIn ? "Don't have an account? " : "Already have an account? "}
                          <Text style={styles.toggleHighlight}>
                            {isLoggingIn ? 'Sign Up' : 'Log In'}
                          </Text>
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {step === 2 && (
                    <View style={styles.stepBlock}>
                      <Text style={styles.stepTitle}>Select Avatar</Text>
                      <Text style={styles.stepSub}>Personalize your dashboard profile.</Text>
                      
                      <View style={styles.avatarGrid}>
                        {CARTOON_AVATARS.map((avatar) => {
                          const isSelected = selectedAvatar === avatar.uri;
                          return (
                            <TouchableOpacity 
                              key={avatar.id} 
                              style={[styles.avatarBox, isSelected && styles.avatarBoxActive]} 
                              onPress={() => setSelectedAvatar(avatar.uri)}
                            >
                              <Image source={{ uri: avatar.uri }} style={styles.avatarImg} />
                              {isSelected && (
                                <View style={styles.avatarCheck}>
                                  <Check size={14} color="#fff" strokeWidth={3} />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <TouchableOpacity 
                        style={[styles.primaryBtn, !canProceed && { opacity: 0.5 }, { marginTop: 40 }]} 
                        onPress={handleNext} 
                        disabled={!canProceed || authBusy}
                      >
                        <Text style={styles.primaryBtnText}>
                          {authBusy ? 'Processing...' : 'Complete Setup'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#090a0f' },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 60 },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#090a0f', padding: 24 },
  fallbackText: { fontSize: 16, fontFamily: 'Inter-Medium', color: '#94a3b8' },
  
  formContainer: { padding: 20, maxWidth: 460, alignSelf: 'center', width: '100%', marginTop: 12 },
  backBtn: { marginBottom: 12, paddingVertical: 8, alignSelf: 'flex-start' },
  backBtnText: { color: 'rgba(255, 255, 255, 0.45)', fontSize: 14, fontFamily: 'Inter-Medium' },
  
  authCard: { 
    backgroundColor: '#161920', 
    borderRadius: 28, 
    padding: 28, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 16 }, 
    shadowOpacity: 0.35, 
    shadowRadius: 30, 
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  stepBlock: { gap: 16 },
  stepTitle: { fontSize: 26, fontFamily: 'Inter-Bold', color: '#ffffff', letterSpacing: -0.5, textAlign: 'center' },
  stepSub: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#94a3b8', marginBottom: 4, lineHeight: 20, textAlign: 'center' },
  
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0d0f14', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)', 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 52, 
    gap: 12 
  },
  inputWrapperFocused: { borderColor: '#0ea5e9', backgroundColor: '#111318' },
  inputLight: { flex: 1, color: '#ffffff', fontSize: 14, fontFamily: 'Inter-SemiBold', height: '100%' },

  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  avatarBox: { borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.08)', borderRadius: 20, padding: 4, backgroundColor: '#0d0f14' },
  avatarBoxActive: { borderColor: '#0ea5e9', backgroundColor: '#161920' },
  avatarImg: { width: 68, height: 68, borderRadius: 14 },
  avatarCheck: { position: 'absolute', bottom: -6, right: -6, backgroundColor: '#0ea5e9', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  divText: { fontSize: 13, fontFamily: 'Inter-Medium', color: 'rgba(255, 255, 255, 0.4)' },
  
  primaryBtn: { 
    backgroundColor: '#0ea5e9', 
    borderRadius: 16, 
    height: 52, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'Inter-Bold', color: '#ffffff' },
  
  googleSignupBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12, 
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    paddingVertical: 14, 
    borderWidth: 1, 
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  googleSignupText: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: '#1f2937' },
  googleInfoNote: { fontSize: 12, fontFamily: 'Inter-Medium', color: 'rgba(255, 255, 255, 0.45)', lineHeight: 18, textAlign: 'center', marginTop: 4 },
  
  toggleLink: { alignItems: 'center', marginTop: 12, paddingVertical: 6 },
  toggleText: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#64748b' },
  toggleHighlight: { color: '#0ea5e9', fontFamily: 'Inter-SemiBold', textDecorationLine: 'underline' },
  
  noticeText: { color: '#ef4444', fontSize: 13, fontFamily: 'Inter-Bold', textAlign: 'center', marginTop: 4 },

  modalBgBottom: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end', padding: 16 },
  installPanel: { backgroundColor: '#ffffff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#eaecef', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 12 },
  installHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  installLogoBox: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eaecef' },
  installLogo: { width: '100%', height: '100%' },
  installTitle: { fontSize: 17, fontFamily: 'Inter-Bold', color: '#1c1e21' },
  installDomain: { fontSize: 12, fontFamily: 'Inter-Medium', color: '#64748b', marginTop: 1 },
  installClose: { padding: 6, backgroundColor: '#f4f5f7', borderRadius: 20 },
  installBody: { fontSize: 14, fontFamily: 'Inter-Medium', color: '#64748b', lineHeight: 20, marginBottom: 20 },
  installButtons: { flexDirection: 'row', gap: 12 },
  installPrimaryBtn: { flex: 1, backgroundColor: '#000000', borderRadius: 14, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  installPrimaryText: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#ffffff' },
  installSecondaryBtn: { flex: 1, backgroundColor: '#f4f5f7', borderRadius: 14, height: 48, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eaecef' },
  installSecondaryText: { fontSize: 14, fontFamily: 'Inter-Bold', color: '#1c1e21' },
});
